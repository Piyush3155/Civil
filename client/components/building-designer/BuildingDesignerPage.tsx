"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FloorPlanData, Aesthetics, DEFAULT_AESTHETICS } from "./types";
import Editor2D from "./Editor2D";
import Viewer3D from "./Viewer3D";
import { Box, Pencil, Save, Settings, Move, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import {
  uploadDrawingAttachment,
  createDrawing,
} from "@/app/actions/drawings/main";
import { fetchProjects, fetchMyProjects } from "@/app/actions/projects/main";
import { getSession } from "@/lib/sessionAction";
import Loader from "@/components/ui/loader";

interface BuildingDesignerPageProps {
  initialData?: any;
  projectId?: string;
}

export default function BuildingDesignerPage({ initialData, projectId }: BuildingDesignerPageProps) {
  const [activeTab, setActiveTab] = useState("2d");
  const [data, setData] = useState<FloorPlanData>({
    nodes: [],
    walls: [],
    openings: [],
  });

  const [aesthetics, setAesthetics] = useState<Aesthetics>(DEFAULT_AESTHETICS);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [saveForm, setSaveForm] = useState({
    title: "New Building Plan",
    projectId: projectId || "",
    description: "",
  });

  // Load initial data
  useEffect(() => {
    if (initialData) {
      if (initialData.title) {
        setSaveForm(prev => ({ ...prev, title: initialData.title }));
      }
      try {
        const parsed = JSON.parse(initialData.description || "{}");
        if (parsed.data) setData(parsed.data);
        if (parsed.aesthetics) setAesthetics(parsed.aesthetics);
      } catch (e) {
        console.error("Failed to parse initial plan data");
      }
    }
  }, [initialData]);

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const session = await getSession();
      const roles = session.roles || [];
      const canSeeAll = roles.some((role: string) =>
        ["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER"].includes(role)
      );
      const data = canSeeAll ? await fetchProjects() : await fetchMyProjects();
      setProjects(data);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const handleOpenSaveDialog = () => {
    setSaveDialogOpen(true);
    loadProjects();
  };

  const generateThumbnail = (data: FloorPlanData): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(new Blob([""], { type: "image/png" }));
        return;
      }

      ctx.fillStyle = "#0f172a"; // slate-900
      ctx.fillRect(0, 0, 300, 300);

      if (data.walls.length === 0 || data.nodes.length === 0) {
        canvas.toBlob((blob) => resolve(blob || new Blob([""], { type: "image/png" })), "image/png");
        return;
      }

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      data.nodes.forEach(n => {
        if (n.x < minX) minX = n.x;
        if (n.x > maxX) maxX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.y > maxY) maxY = n.y;
      });

      const w = maxX - minX;
      const h = maxY - minY;
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;

      const scale = Math.min(220 / (w || 1), 220 / (h || 1), 5);

      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";

      data.walls.forEach(wall => {
        const start = data.nodes.find(n => n.id === wall.startNodeId);
        const end = data.nodes.find(n => n.id === wall.endNodeId);
        if (start && end) {
          ctx.beginPath();
          ctx.moveTo(150 + (start.x - cx) * scale, 150 + (start.y - cy) * scale);
          ctx.lineTo(150 + (end.x - cx) * scale, 150 + (end.y - cy) * scale);
          ctx.stroke();
        }
      });

      canvas.toBlob((blob) => resolve(blob || new Blob([""], { type: "image/png" })), "image/png");
    });
  };

  const handleSaveToDrawings = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!saveForm.projectId) {
      toast.error("Please select a project.");
      return;
    }

    if (!saveForm.title.trim()) {
      toast.error("Please enter a title.");
      return;
    }

    setIsSaving(true);
    toast.loading("Saving building plan...", { id: "save-plan" });

    try {
      // Step 1: Generate thumbnail
      const thumbnailBlob = await generateThumbnail(data);
      const file = new File(
        [thumbnailBlob],
        `plan-${Date.now()}.png`,
        { type: "image/png" }
      );

      // Step 2: Upload thumbnail to CDN
      const formData = new FormData();
      formData.append("files", file);
      const uploadResult = await uploadDrawingAttachment(formData);

      if (!uploadResult.success || !uploadResult.data) {
        toast.error(uploadResult.error || "Failed to upload thumbnail.", { id: "save-plan" });
        setIsSaving(false);
        return;
      }

      const fileUrl = uploadResult.data.attachmentUrls[0];

      // Step 3: Build description with configuration
      const configJson = JSON.stringify({ data, aesthetics });
      const fullDescription = saveForm.description
        ? `${saveForm.description}\n\n<!--PLAN_CONFIG:${configJson}:PLAN_CONFIG-->`
        : `Building Plan Design\n\n<!--PLAN_CONFIG:${configJson}:PLAN_CONFIG-->`;

      // Step 4: Create drawing record
      await createDrawing({
        projectId: saveForm.projectId,
        title: saveForm.title,
        description: fullDescription,
        fileUrl,
        fileType: "PLAN",
        version: 1,
      });

      toast.success("Building plan saved to Drawings!", {
        id: "save-plan",
        description: "You can find it in the Drawings section.",
      });

      setSaveDialogOpen(false);
    } catch (error) {
      console.error("Error saving building plan:", error);
      toast.error("Failed to save plan. Please try again.", { id: "save-plan" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Sidebar / Properties Panel */}
      <div className="w-80 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Box className="h-5 w-5" />
            Building Designer
          </h2>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-6">
          <div className="space-y-3">
            <Label>Project Title</Label>
            <Input value={saveForm.title} onChange={(e) => setSaveForm({ ...saveForm, title: e.target.value })} />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="2d"><Pencil className="h-4 w-4 mr-2" /> 2D Plan</TabsTrigger>
              <TabsTrigger value="3d"><Box className="h-4 w-4 mr-2" /> 3D View</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4" /> Aesthetics
            </h3>
            <div className="space-y-3">
              <div>
                <Label>Wall Color</Label>
                <div className="flex gap-2 mt-1">
                  <Input type="color" className="w-12 h-10 p-1" value={aesthetics.wallColor} onChange={(e) => setAesthetics({ ...aesthetics, wallColor: e.target.value })} />
                  <Input value={aesthetics.wallColor} onChange={(e) => setAesthetics({ ...aesthetics, wallColor: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Floor Color</Label>
                <div className="flex gap-2 mt-1">
                  <Input type="color" className="w-12 h-10 p-1" value={aesthetics.floorColor} onChange={(e) => setAesthetics({ ...aesthetics, floorColor: e.target.value })} />
                  <Input value={aesthetics.floorColor} onChange={(e) => setAesthetics({ ...aesthetics, floorColor: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Environment (Ground)</Label>
                <div className="flex gap-2 mt-1">
                  <Input type="color" className="w-12 h-10 p-1" value={aesthetics.groundColor} onChange={(e) => setAesthetics({ ...aesthetics, groundColor: e.target.value })} />
                  <Input value={aesthetics.groundColor} onChange={(e) => setAesthetics({ ...aesthetics, groundColor: e.target.value })} />
                </div>
              </div>

              {/* Roof Settings */}
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-roof" className="cursor-pointer">Enable Roof</Label>
                  <input
                    id="show-roof"
                    type="checkbox"
                    className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-primary focus:ring-primary cursor-pointer"
                    checked={aesthetics.showRoof}
                    onChange={(e) => setAesthetics({ ...aesthetics, showRoof: e.target.checked })}
                  />
                </div>
              </div>

              {aesthetics.showRoof && (
                <div className="space-y-3 pt-2">
                  <div>
                    <Label>Roof Style</Label>
                    <select
                      className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-sm text-slate-200 mt-1"
                      value={aesthetics.roofType}
                      onChange={(e) => setAesthetics({ ...aesthetics, roofType: e.target.value as "flat" | "pitched" })}
                    >
                      <option value="flat">Flat Slab</option>
                      <option value="pitched">Pitched Gable</option>
                    </select>
                  </div>

                  {aesthetics.roofType === "pitched" && (
                    <div>
                      <Label>Pitch Height (meters)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="6"
                        className="mt-1"
                        value={aesthetics.roofHeight}
                        onChange={(e) => setAesthetics({ ...aesthetics, roofHeight: parseFloat(e.target.value) || 2.0 })}
                      />
                    </div>
                  )}

                  <div>
                    <Label>Roof Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input type="color" className="w-12 h-10 p-1" value={aesthetics.roofColor} onChange={(e) => setAesthetics({ ...aesthetics, roofColor: e.target.value })} />
                      <Input value={aesthetics.roofColor} onChange={(e) => setAesthetics({ ...aesthetics, roofColor: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-muted/20">
          <Button onClick={handleOpenSaveDialog} className="w-full">
            <Save className="mr-2 h-4 w-4" /> Save Design
          </Button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative bg-slate-950 overflow-hidden">
        {activeTab === "3d" && (
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/70 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Move className="h-3 w-3" />
              Drag to rotate
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/70 backdrop-blur-sm rounded-full px-3 py-1.5">
              <ZoomIn className="h-3 w-3" />
              Scroll to zoom
            </div>
          </div>
        )}
        {activeTab === "2d" ? (
          <Editor2D data={data} onChange={setData} title={saveForm.title} />
        ) : (
          <Viewer3D data={data} aesthetics={aesthetics} />
        )}
      </div>

      {/* Save Dialog */}
      <Dialog
        open={saveDialogOpen}
        onOpenChange={(open) => {
          setSaveDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Save className="h-5 w-5 text-primary" />
              Save Building Plan
            </DialogTitle>
            <DialogDescription>
              Save the current building plan to the Drawings section of a project.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveToDrawings}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="save-title">Title *</Label>
                <Input
                  id="save-title"
                  placeholder="New Building Plan"
                  value={saveForm.title}
                  onChange={(e) =>
                    setSaveForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                  disabled={isSaving}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="save-project">Project *</Label>
                {loadingProjects ? (
                  <div className="flex items-center gap-2 h-9 px-3 text-sm text-muted-foreground">
                    <Loader /> Loading projects...
                  </div>
                ) : (
                  <Select
                    value={saveForm.projectId}
                    onValueChange={(value) =>
                      setSaveForm((prev) => ({ ...prev, projectId: value }))
                    }
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name} ({project.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="save-description">Description</Label>
                <Textarea
                  id="save-description"
                  placeholder="Brief description of this building plan..."
                  value={saveForm.description}
                  onChange={(e) =>
                    setSaveForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  disabled={isSaving}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSaveDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? "Saving..." : "Save Drawing"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
