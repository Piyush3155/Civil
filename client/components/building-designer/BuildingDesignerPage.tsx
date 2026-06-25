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

import { Box, Pencil, Save, Settings, Move, ZoomIn, PanelLeftClose, PanelLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import {
  uploadDrawingAttachment,
  createDrawing,
  fetchDrawingById,
  updateDrawing,
} from "@/app/actions/drawings/main";
import { fetchProjects, fetchMyProjects } from "@/app/actions/projects/main";
import { getSession } from "@/lib/sessionAction";
import Loader from "@/components/ui/loader";
import Editor2D from "./Editor2D";
import Viewer3D from "./Viewer3D";
import { useSidebar } from "@/components/ui/sidebar";
import { generateFloorPlan } from "@/app/actions/ai/main";

interface BuildingDesignerPageProps {
  initialData?: any;
  projectId?: string;
}

export default function BuildingDesignerPage({ initialData, projectId }: BuildingDesignerPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const drawingId = searchParams.get("drawingId");

  const [activeTab, setActiveTab] = useState("2d");
  const [data, setData] = useState<FloorPlanData>({
    nodes: [],
    walls: [],
    openings: [],
    siteElements: [],
    roomLabels: [],
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

  const [editingDrawingId, setEditingDrawingId] = useState<string | null>(null);
  const [originalDrawing, setOriginalDrawing] = useState<any | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAesthetics, setShowAesthetics] = useState(false);

  // Collapse the global app sidebar when in the designer
  const { setOpen } = useSidebar();
  useEffect(() => {
    setOpen(false);
  }, [setOpen]);

  // Load drawing from drawingId if present in search parameters
  useEffect(() => {
    if (drawingId) {
      setEditingDrawingId(drawingId);
      const loadDrawing = async () => {
        try {
          const drawing = await fetchDrawingById(drawingId);
          setOriginalDrawing(drawing);
          setSaveForm({
            title: drawing.title || "New Building Plan",
            projectId: drawing.project?.id || drawing.projectId || "",
            description: drawing.description?.split("\n\n<!--PLAN_CONFIG:")[0] || "",
          });
          
          const match = drawing.description?.match(/<!--PLAN_CONFIG:(.*?):PLAN_CONFIG-->/);
          if (match && match[1]) {
            const parsed = JSON.parse(match[1]);
            if (parsed.data) {
              setData({ siteElements: [], roomLabels: [], ...parsed.data });
            }
            if (parsed.aesthetics) {
              setAesthetics(parsed.aesthetics);
            }
          }
        } catch (error) {
          console.error("Error loading drawing for editing:", error);
          toast.error("Failed to load drawing data.");
        }
      };
      loadDrawing();
    }
  }, [drawingId]);

  // Load initial data
  useEffect(() => {
    if (initialData) {
      if (initialData.title) {
        setSaveForm(prev => ({ ...prev, title: initialData.title }));
      }
      try {
        const parsed = JSON.parse(initialData.description || "{}");
        if (parsed.data) setData({ siteElements: [], roomLabels: [], ...parsed.data });
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

  const handleSaveToDrawings = async (e: React.FormEvent, saveAsCopy = false) => {
    if (e) e.preventDefault();

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

      if (editingDrawingId && !saveAsCopy) {
        // Step 4: Update drawing record
        const nextVersion = originalDrawing ? parseFloat((originalDrawing.version + 0.1).toFixed(1)) : 1.1;
        await updateDrawing(editingDrawingId, {
          title: saveForm.title,
          description: fullDescription,
          fileUrl,
          version: nextVersion,
        });

        toast.success(`Building plan updated to version ${nextVersion.toFixed(1)}!`, {
          id: "save-plan",
        });
        
        // Update original drawing ref
        setOriginalDrawing((prev: any) => prev ? { ...prev, title: saveForm.title, description: fullDescription, fileUrl, version: nextVersion } : null);
      } else {
        // Step 4: Create new drawing record
        await createDrawing({
          projectId: saveForm.projectId,
          title: saveForm.title,
          description: fullDescription,
          fileUrl,
          fileType: "PLAN",
          version: 1.0,
        });

        toast.success("Building plan saved to Drawings!", {
          id: "save-plan",
          description: "You can find it in the Drawings section.",
        });
      }

      setSaveDialogOpen(false);
      setTimeout(() => {
        router.push("/drawings");
      }, 1000);
    } catch (error) {
      console.error("Error saving building plan:", error);
      toast.error("Failed to save plan. Please try again.", { id: "save-plan" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateAI = async () => {
    // Guard: prevent duplicate requests
    if (isGenerating) return;

    if (!aiPrompt.trim()) {
      toast.error("Please enter a description of the floor plan you want.");
      return;
    }

    // Confirm if there's existing data
    if (data.walls.length > 0) {
      const confirmed = window.confirm(
        "This will replace your current design with an AI-generated plan. Continue?"
      );
      if (!confirmed) return;
    }

    setIsGenerating(true);
    toast.loading("AI is generating your floor plan...", { id: "ai-generate" });

    try {
      const result = await generateFloorPlan(aiPrompt);

      if (!result.success || !result.data) {
        toast.error(result.error || "Failed to generate floor plan.", {
          id: "ai-generate",
        });
        return;
      }

      // Merge with defaults for backward compatibility
      setData({
        nodes: result.data.nodes || [],
        walls: result.data.walls || [],
        openings: result.data.openings || [],
        siteElements: result.data.siteElements || [],
        roomLabels: result.data.roomLabels || [],
      });

      toast.success("Floor plan generated successfully!", {
        id: "ai-generate",
        description: "You can now edit the plan in 2D or view it in 3D.",
      });
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error("Something went wrong. Please try again.", {
        id: "ai-generate",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background relative overflow-hidden">
      {/* Top Bar — minimal, full width */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3 py-2 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
        {/* Left: Title + Tab Switch */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Box className="h-4 w-4 text-violet-500" />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 hidden sm:block truncate max-w-[160px]">{saveForm.title || "Building Designer"}</span>
          </div>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => setActiveTab("2d")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === "2d" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}`}
            >
              <Pencil className="h-3 w-3" /> 2D Plan
            </button>
            <button
              onClick={() => setActiveTab("3d")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === "3d" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}`}
            >
              <Box className="h-3 w-3" /> 3D View
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAesthetics(!showAesthetics)}
            className={`h-8 w-8 flex items-center justify-center rounded-lg transition-all ${showAesthetics ? "bg-violet-100 dark:bg-violet-900/50 text-violet-600" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
            title="Aesthetics & Environment"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`h-8 w-8 flex items-center justify-center rounded-lg transition-all ${sidebarOpen ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
            title="AI Plan Generator"
          >
            <Sparkles className="h-4 w-4" />
          </button>
          <Button onClick={handleOpenSaveDialog} size="sm" className="h-8 text-xs px-3 rounded-lg shadow-sm">
            <Save className="h-3.5 w-3.5 mr-1.5" /> Save
          </Button>
        </div>
      </div>

      {/* AI Plan Generator — floating panel (right) */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="absolute top-12 right-3 z-40 w-[300px] max-h-[calc(100vh-8rem)] overflow-y-auto bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-2xl shadow-slate-200/30 dark:shadow-none p-4 space-y-3 animate-in slide-in-from-top-2 fade-in duration-200">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-violet-700 dark:text-violet-300">
              <Sparkles className="h-4 w-4" /> AI Plan Generator
            </h3>
            <Textarea
              placeholder='e.g. "Create a 2 BHK house plan, plot size 49x41 feet..."'
              className="bg-white/80 dark:bg-slate-900/50 border-violet-200 dark:border-violet-800/50 text-sm min-h-[70px] resize-none placeholder:text-slate-400 focus-visible:ring-violet-500/30 rounded-xl"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              disabled={isGenerating}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerateAI();
                }
              }}
            />
            <Button
              onClick={handleGenerateAI}
              disabled={isGenerating || !aiPrompt.trim()}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 transition-all rounded-xl h-9 text-xs"
              size="sm"
            >
              {isGenerating ? (
                <><Loader /> Generating...</>
              ) : (
                <><Sparkles className="h-3.5 w-3.5 mr-1.5" /> Generate Plan</>
              )}
            </Button>
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Label className="text-xs">Project Title</Label>
              <Input value={saveForm.title} onChange={(e) => setSaveForm({ ...saveForm, title: e.target.value })} className="h-8 text-xs rounded-lg" />
            </div>
          </div>
        </>
      )}

      {/* Aesthetics panel — floating (right, below settings icon) */}
      {showAesthetics && (
        <div className="absolute top-12 right-14 z-40 w-[260px] max-h-[calc(100vh-8rem)] overflow-y-auto bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-2xl shadow-slate-200/30 dark:shadow-none p-4 space-y-3 animate-in slide-in-from-top-2 fade-in duration-200">
          <h3 className="font-semibold text-xs flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Settings className="h-3.5 w-3.5" /> Aesthetics & Environment
          </h3>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Wall Color</Label>
              <div className="flex gap-2 mt-1">
                <Input type="color" className="w-10 h-8 p-0.5 rounded-lg" value={aesthetics.wallColor} onChange={(e) => setAesthetics({ ...aesthetics, wallColor: e.target.value })} />
                <Input className="h-8 text-xs rounded-lg" value={aesthetics.wallColor} onChange={(e) => setAesthetics({ ...aesthetics, wallColor: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Floor Color</Label>
              <div className="flex gap-2 mt-1">
                <Input type="color" className="w-10 h-8 p-0.5 rounded-lg" value={aesthetics.floorColor} onChange={(e) => setAesthetics({ ...aesthetics, floorColor: e.target.value })} />
                <Input className="h-8 text-xs rounded-lg" value={aesthetics.floorColor} onChange={(e) => setAesthetics({ ...aesthetics, floorColor: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Ground</Label>
              <div className="flex gap-2 mt-1">
                <Input type="color" className="w-10 h-8 p-0.5 rounded-lg" value={aesthetics.groundColor} onChange={(e) => setAesthetics({ ...aesthetics, groundColor: e.target.value })} />
                <Input className="h-8 text-xs rounded-lg" value={aesthetics.groundColor} onChange={(e) => setAesthetics({ ...aesthetics, groundColor: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <Label htmlFor="show-roof-panel" className="text-xs cursor-pointer">Enable Roof</Label>
              <input id="show-roof-panel" type="checkbox" className="h-4 w-4 rounded cursor-pointer" checked={aesthetics.showRoof} onChange={(e) => setAesthetics({ ...aesthetics, showRoof: e.target.checked })} />
            </div>
            {aesthetics.showRoof && (
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Roof Style</Label>
                  <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs mt-1" value={aesthetics.roofType} onChange={(e) => setAesthetics({ ...aesthetics, roofType: e.target.value as any })}>
                    <option value="flat">Flat Slab</option>
                    <option value="pitched">Pitched Gable</option>
                    <option value="hip">Hip Roof</option>
                    <option value="shed">Shed Roof</option>
                  </select>
                </div>
                {aesthetics.roofType !== "flat" && (
                  <div>
                    <Label className="text-xs">Ridge Height (m)</Label>
                    <Input type="number" step="0.5" className="h-8 text-xs rounded-lg mt-1" value={aesthetics.roofHeight} onChange={(e) => setAesthetics({ ...aesthetics, roofHeight: parseFloat(e.target.value) || 2 })} />
                  </div>
                )}
                <div>
                  <Label className="text-xs">Roof Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input type="color" className="w-10 h-8 p-0.5 rounded-lg" value={aesthetics.roofColor} onChange={(e) => setAesthetics({ ...aesthetics, roofColor: e.target.value })} />
                    <Input className="h-8 text-xs rounded-lg" value={aesthetics.roofColor} onChange={(e) => setAesthetics({ ...aesthetics, roofColor: e.target.value })} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Canvas Area — full width */}
      <div className="flex-1 relative bg-slate-950 overflow-hidden pt-11">
        {activeTab === "3d" && (
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/70 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Move className="h-3 w-3" /> Drag to rotate
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/70 backdrop-blur-sm rounded-full px-3 py-1.5">
              <ZoomIn className="h-3 w-3" /> Scroll to zoom
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
          <form onSubmit={(e) => handleSaveToDrawings(e, false)}>
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
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSaveDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              {editingDrawingId && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={(e) => handleSaveToDrawings(e, true)}
                  disabled={isSaving}
                >
                  Save as Copy
                </Button>
              )}
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? "Saving..." : editingDrawingId ? "Update Original" : "Save Drawing"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
