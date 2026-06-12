"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Save, Box, Move, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import PebControlPanel, { DEFAULT_PARAMS } from "./PebControlPanel";
import type { PebParams, PebCanvas3DHandle } from "./PebCanvas3D";
import {
  uploadDrawingAttachment,
  createDrawing,
} from "@/app/actions/drawings/main";
import { fetchProjects, fetchMyProjects } from "@/app/actions/projects/main";
import { getSession } from "@/lib/sessionAction";
import Loader from "@/components/ui/loader";

// Dynamic import to avoid SSR issues with canvas
const PebCanvas3D = dynamic(() => import("./PebCanvas3D"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[400px] bg-slate-900 rounded-xl">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="text-sm text-slate-400">Loading 3D Engine...</p>
      </div>
    </div>
  ),
});

interface Project {
  id: string;
  name: string;
  code: string;
}

const EDIT_ALLOWED_ROLES = ["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER"];

export default function PebDesignerPage() {
  const [params, setParams] = useState<PebParams>({ ...DEFAULT_PARAMS });
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [saveForm, setSaveForm] = useState({
    title: "",
    projectId: "",
    description: "",
  });
  const canvasRef = useRef<PebCanvas3DHandle>(null);

  // Load projects when save dialog opens
  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const session = await getSession();
      const roles = session.roles || [];
      const canSeeAll = roles.some((role: string) =>
        EDIT_ALLOWED_ROLES.includes(role)
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

  useEffect(() => {
    if (saveDialogOpen) {
      loadProjects();
      // Auto-generate title from params
      setSaveForm((prev) => ({
        ...prev,
        title: `PEB Structure ${params.width}×${params.length}m — H${params.eaveHeight}m`,
      }));
    }
  }, [saveDialogOpen, params, loadProjects]);

  const handleOpenSaveDialog = () => {
    setSaveDialogOpen(true);
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

    try {
      // Step 1: Capture canvas as PNG
      const canvas = canvasRef.current?.getCanvas();
      if (!canvas) {
        toast.error("Canvas not ready. Please try again.");
        setIsSaving(false);
        return;
      }

      const dataUrl = canvas.toDataURL("image/png");
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File(
        [blob],
        `peb-${params.width}x${params.length}-${Date.now()}.png`,
        { type: "image/png" }
      );

      // Step 2: Upload to CDN
      const formData = new FormData();
      formData.append("files", file);
      const uploadResult = await uploadDrawingAttachment(formData);

      if (!uploadResult.success || !uploadResult.data) {
        toast.error(uploadResult.error || "Failed to upload image.");
        setIsSaving(false);
        return;
      }

      const fileUrl = uploadResult.data.attachmentUrls[0];

      // Step 3: Build description with PEB config
      const configJson = JSON.stringify(params);
      const fullDescription = saveForm.description
        ? `${saveForm.description}\n\n<!--PEB_CONFIG:${configJson}:PEB_CONFIG-->`
        : `PEB Structure Design\n\n<!--PEB_CONFIG:${configJson}:PEB_CONFIG-->`;

      // Step 4: Create drawing record with PEB type
      await createDrawing({
        projectId: saveForm.projectId,
        title: saveForm.title,
        description: fullDescription,
        fileUrl,
        fileType: "PEB",
        version: 1,
      });

      toast.success("PEB design saved to Drawings!", {
        description: "You can find it in the Drawings section.",
        action: {
          label: "View Drawings",
          onClick: () => (window.location.href = "/drawings"),
        },
      });

      setSaveDialogOpen(false);
      setSaveForm({ title: "", projectId: "", description: "" });
    } catch (error) {
      console.error("Error saving PEB design:", error);
      toast.error("Failed to save design. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-background min-h-screen flex flex-col">
      {/* Header */}
      <header className="hidden md:flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 hidden sm:block" />
        <Breadcrumb className="hidden sm:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-2">
                <Box className="h-4 w-4" />
                PEB Designer
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-3 text-xs text-muted-foreground mr-4">
            <span className="flex items-center gap-1.5">
              <Move className="h-3.5 w-3.5" />
              Drag to rotate
            </span>
            <span className="flex items-center gap-1.5">
              <ZoomIn className="h-3.5 w-3.5" />
              Scroll to zoom
            </span>
          </div>
          <Button size="sm" onClick={handleOpenSaveDialog}>
            <Save className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Save to Drawings</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 md:p-6 min-h-0">
        {/* Control Panel — Sidebar on desktop, top on mobile */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0 lg:max-h-[calc(100vh-8rem)] lg:overflow-hidden">
          <PebControlPanel
            params={params}
            onChange={setParams}
            onSave={handleOpenSaveDialog}
            isSaving={isSaving}
          />
        </div>

        {/* 3D Canvas */}
        <div className="flex-1 min-h-[400px] lg:min-h-0 relative rounded-xl overflow-hidden border border-border/30 shadow-2xl">
          {/* Mobile interaction hint */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 lg:hidden pointer-events-none">
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/70 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Move className="h-3 w-3" />
              Drag to rotate
            </div>
          </div>
          <PebCanvas3D ref={canvasRef} params={params} />
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog
        open={saveDialogOpen}
        onOpenChange={(open) => {
          setSaveDialogOpen(open);
          if (!open) {
            setSaveForm({ title: "", projectId: "", description: "" });
          }
        }}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Save className="h-5 w-5 text-primary" />
              Save PEB Design
            </DialogTitle>
            <DialogDescription>
              Save the current 3D design to the Drawings section. The interactive 3D view will be preserved.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveToDrawings}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="save-title">Title *</Label>
                <Input
                  id="save-title"
                  placeholder="PEB Warehouse 20×40m"
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
                  placeholder="Brief description of this PEB design..."
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
              {/* Config Preview */}
              <div className="bg-muted/50 rounded-lg px-3 py-2 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground text-xs mb-1">
                  Configuration Summary
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                  <span>Width: {params.width}m</span>
                  <span>Length: {params.length}m</span>
                  <span>Eave Height: {params.eaveHeight}m</span>
                  <span>Roof Slope: {params.roofSlope}°</span>
                  <span>Bays: {params.bays}</span>
                  <span>
                    Bay Spacing: {(params.length / params.bays).toFixed(1)}m
                  </span>
                </div>
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
                {isSaving ? (
                  <Loader />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isSaving ? "Saving..." : "Save Drawing"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
