"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Plus, 
  FileText, 
  Download, 
  Edit, 
  Trash2,
  Calendar,
  Building2,
  File,
  Eye,
  // IMPROVEMENT: Added more icons for better file type representation
  FileArchive, 
  Image as ImageIcon,
  BookOpenText,
  Box,
} from "lucide-react"
import { useEffect, useState } from "react"
import { 
  fetchDrawings, 
  createDrawing,
  updateDrawing,
  deleteDrawing,
  uploadDrawingAttachment
} from "@/app/actions/drawings/main"
import { fetchProjects, fetchMyProjects } from "@/app/actions/projects/main"
import { getSession } from "@/lib/sessionAction"
import Loader from "@/components/ui/loader";
import dynamic from "next/dynamic";
// IMPROVEMENT: Import toast for better error/success feedback
import { toast } from 'sonner';

// Roles that can create/edit/delete drawings
const EDIT_ALLOWED_ROLES = ['ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER'];

// Dynamic import for DrawingViewer to avoid SSR issues
const DrawingViewer = dynamic(() => import("./DrawingViewer"), {
  ssr: false,
  loading: () => (
    // IMPROVEMENT: Slightly larger loader for a better viewing experience start
    <div className="flex items-center justify-center h-full min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-primary"></div>
    </div>
  ),
});

interface Drawing {
  id: string
  title: string
  description?: string
  fileType: string
  version: number
  filePath?: string
  fileUrl?: string
  createdAt: string
  project?: {
    id: string
    name: string
    code: string
  }
}

interface Project {
  id: string
  name: string
  code: string
}

export default function DrawingsPage() {
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false); // IMPROVEMENT: Upload state for better feedback
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewingDrawing, setViewingDrawing] = useState<Drawing | null>(null)
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "PDF",
    version: 1,
    projectId: "",
  })
  
  // User role state for permission control
  const [userRoles, setUserRoles] = useState<string[]>([])
  const canEdit = userRoles.some(role => EDIT_ALLOWED_ROLES.includes(role))

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true);
    try {
      // First fetch user session to get roles
      const session = await getSession()
      const roles = session.roles || []
      setUserRoles(roles)
      
      // Determine if user can see all projects or just their assigned ones
      const canSeeAllProjects = roles.some(role => EDIT_ALLOWED_ROLES.includes(role))
      
      const [drawingsData, projectsData] = await Promise.all([
        fetchDrawings(),
        canSeeAllProjects ? fetchProjects() : fetchMyProjects()
      ])
      setDrawings(drawingsData)
      setProjects(projectsData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Failed to load data. Please try again.") // IMPROVEMENT: Use toast for error
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateDrawing(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile) {
      toast.error("Please select a file to upload.") // IMPROVEMENT: Use toast
      return
    }
    
    if (!formData.projectId) {
        toast.error("Please select a project.")
        return
    }

    setIsUploading(true);
    try {
      
      // Upload file to CDN
      const uploadFormData = new FormData()
      uploadFormData.append('files', selectedFile)
      const uploadResult = await uploadDrawingAttachment(uploadFormData)
      
      if (!uploadResult.success || !uploadResult.data) {
        toast.error(uploadResult.error || "Failed to upload file.")
        return
      }
      const fileUrl = uploadResult.data.attachmentUrls[0]

      
      const createData = {
        projectId: formData.projectId,
        title: formData.title,
        description: formData.description,
        fileUrl,
        fileType: formData.type,
        version: formData.version,
      }
      
      await createDrawing(createData)
      toast.success("Drawing uploaded successfully!") // IMPROVEMENT: Use toast for success
      
      setCreateDialogOpen(false)
      resetForm()
      await loadData()
    } catch (error) {
      console.error("Error creating drawing:", error)
      toast.error("Failed to create drawing.")
    } finally {
        setIsUploading(false);
    }
  }

  async function handleUpdateDrawing(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDrawing) return

    try {
      await updateDrawing(selectedDrawing.id, formData)
      toast.success("Drawing updated successfully!")
      setEditDialogOpen(false)
      setSelectedDrawing(null)
      resetForm()
      await loadData()
    } catch (error) {
      console.error("Error updating drawing:", error)
      toast.error("Failed to update drawing.")
    }
  }

  async function handleDeleteDrawing(id: string) {
    // IMPROVEMENT: Use a more modern confirmation dialog (or a dedicated component, but for this context, keep simple)
    if (!confirm("Are you sure you want to delete this drawing? This action cannot be undone.")) {
      return
    }

    try {
      await deleteDrawing(id)
      toast.success("Drawing deleted successfully.")
      await loadData()
    } catch (error) {
      console.error("Error deleting drawing:", error)
      toast.error("Failed to delete drawing.")
    }
  }

  function openEditDialog(drawing: Drawing) {
    setSelectedDrawing(drawing)
    setFormData({
      title: drawing.title,
      description: drawing.description || "",
      type: drawing.fileType,
      version: drawing.version,
      projectId: drawing.project?.id || "",
    })
    setEditDialogOpen(true)
  }

  function openViewDialog(drawing: Drawing) {
    setViewingDrawing(drawing)
    setViewDialogOpen(true)
  }

  function getDrawingFileUrl(drawing: Drawing): string {
    // IMPROVEMENT: Added safer check for fileUrl
    if (!drawing.fileUrl) return '#'; 
    const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || "" // Assuming CDN is required to serve the file
    // Handle local paths vs absolute URLs
    if (drawing.fileUrl.startsWith('http')) {
        return drawing.fileUrl;
    }
    return `${cdnUrl}${drawing.fileUrl}`.replace('//', '/').replace('https:/', 'https://').replace('http:/', 'http://');
  }

  function resetForm() {
    setFormData({
      title: "",
      description: "",
      type: "PDF",
      version: 1,
      projectId: "",
    })
    setSelectedFile(null)
  }

  function getFileIcon(type: string) {
    // IMPROVEMENT: More detailed icon mapping
    const iconMap: { [key: string]: typeof FileText } = {
      PDF: BookOpenText,
      DWG: File,
      DXF: File,
      IFC: FileArchive,
      RVT: FileArchive,
      IMAGE: ImageIcon,
      PEB: Box,
    }
    const Icon = iconMap[type] || FileText
    return <Icon className="h-5 w-5" />
  }

  function getTypeBadge(type: string): "default" | "secondary" | "outline" | "destructive" {
    // IMPROVEMENT: Added more color distinction
    const colorMap: { [key: string]: "default" | "secondary" | "outline" | "destructive" } = {
      PDF: "default",
      DWG: "secondary",
      DXF: "outline",
      IFC: "destructive", // IFC/RVT are typically BIM models, making them stand out
      RVT: "destructive", 
      IMAGE: "default",
      PEB: "secondary",
    }
    return colorMap[type] || "default"
  }

  return (
    <div className="bg-background min-h-screen">
      <header className="hidden md:flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 hidden sm:block" />
        <Breadcrumb className="hidden sm:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Drawings</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-lg font-semibold sm:hidden">Drawings</h1> {/* IMPROVEMENT: Mobile title */}
        <div className="ml-auto">
          {/* Only show Upload button for users with edit permissions */}
          {canEdit && (
            <Dialog open={createDialogOpen} onOpenChange={(open) => {
              setCreateDialogOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                  <Button 
                      size="sm" 
                      className="sm:size-default"
                      // IMPROVEMENT: Use the `Plus` icon only on mobile for space saving
                      >
                    <Plus className="h-4 w-4 sm:mr-2 flex-shrink-0" /> 
                    <span className="hidden sm:inline">Upload Drawing</span>
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-[550px] max-h-[95vh] overflow-y-auto"> {/* IMPROVEMENT: Slightly wider dialog */}
                <DialogHeader>
                  <DialogTitle className="text-lg">Upload New Drawing</DialogTitle>
                  <DialogDescription className="text-sm">
                    Add a new technical drawing or document
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateDrawing}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="create-title">Drawing Title *</Label>
                      <Input
                        id="create-title"
                        placeholder="Site Plan - Ground Floor"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, title: e.target.value }))
                        }
                        required
                        disabled={isUploading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="create-project">Project *</Label>
                      <Select
                        value={formData.projectId}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, projectId: value }))
                        }
                        disabled={isUploading}
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
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="create-type" className="text-sm">File Type</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, type: value }))
                          }
                          disabled={isUploading}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PDF">PDF</SelectItem>
                            <SelectItem value="DWG">DWG (AutoCAD)</SelectItem>
                            <SelectItem value="DXF">DXF</SelectItem>
                            <SelectItem value="IFC">IFC (BIM)</SelectItem>
                            <SelectItem value="RVT">RVT (Revit)</SelectItem>
                            <SelectItem value="IMAGE">Image</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="create-version">Version</Label>
                        <Input
                          id="create-version"
                          type="number"
                          step="0.1"
                          placeholder="1.0"
                          value={formData.version}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, version: parseFloat(e.target.value) || 1 }))
                          }
                          disabled={isUploading}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="create-description">Description</Label>
                      <Textarea
                        id="create-description"
                        placeholder="Brief description of the drawing..."
                        value={formData.description}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, description: e.target.value }))
                        }
                        rows={3}
                        disabled={isUploading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="create-file">File *</Label>
                      <Input
                        id="create-file"
                        type="file"
                        accept=".pdf,.dwg,.dxf,.ifc,.rvt,image/*"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        required
                        disabled={isUploading}
                      />
                      {selectedFile && (
                          <p className="text-xs text-muted-foreground mt-1">
                              Selected: **{selectedFile.name}**
                          </p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isUploading}>
                        {isUploading ? (
                            <Loader /> // IMPROVEMENT: Inline loader for button
                        ) : (
                            <Plus className="mr-2 h-4 w-4" />
                        )}
                        {isUploading ? "Uploading..." : "Upload Drawing"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6"> {/* IMPROVEMENT: Uniform padding and slightly larger gap */}
          {loading ? (
            <div className="flex items-center justify-center h-48 sm:h-56 md:h-64">
              <Loader />
            </div>
          ) : drawings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64 p-6"> {/* IMPROVEMENT: Taller placeholder */}
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-center">
                  {canEdit ? "No drawings yet" : "No drawings available"}
                </h3>
                <p className="text-base text-muted-foreground mb-6 text-center px-4">
                  {canEdit 
                    ? "Upload your first technical drawing to get started"
                    : "There are no drawings available for your projects yet"}
                </p>
                {canEdit && (
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Drawing
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            // IMPROVEMENT: Optimized grid for different screen sizes (up to 4 columns on 2XL)
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"> 
              {drawings.map((drawing) => (
                // IMPROVEMENT: Added focus ring for accessibility
                <Card 
                    key={drawing.id} 
                    className="hover:shadow-xl transition-all duration-300 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
                >
                  <CardContent className="p-4 flex flex-col h-full"> {/* IMPROVEMENT: Added flex column for consistent height */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-primary/10 rounded-xl flex-shrink-0"> {/* IMPROVEMENT: Rounded icon background */}
                        {getFileIcon(drawing.fileType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold truncate text-base" title={drawing.title}>
                            {drawing.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Version **{drawing.version.toFixed(1)}**
                        </p>
                      </div>
                      <Badge 
                        variant={getTypeBadge(drawing.fileType)} 
                        className="text-xs self-start"
                      >
                        {drawing.fileType}
                      </Badge>
                    </div>
                    
                    {drawing.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2 italic">
                        {drawing.description}
                      </p>
                    )}
                    
                    {/* IMPROVEMENT: Separated metadata for better visual hierarchy */}
                    <Separator className="my-2" /> 

                    <div className="space-y-2 mt-auto"> {/* Pushed to the bottom */}
                      {drawing.project && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Building2 className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span className="truncate" title={drawing.project.name}>{drawing.project.name}</span>
                        </div>
                      )}
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
                        Uploaded: {new Date(drawing.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* IMPROVEMENT: Action buttons take full width and use distinct icons */}
                    <div className="flex gap-2 mt-4 pt-2 border-t">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1 h-9 text-sm"
                        onClick={() => openViewDialog(drawing)}
                        aria-label={`View ${drawing.title}`}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      {/* Edit button - only for users with edit permissions */}
                      {canEdit && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 w-9 p-0"
                          onClick={() => openEditDialog(drawing)}
                          aria-label={`Edit ${drawing.title}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 w-9 p-0"
                        onClick={() => {
                          const url = getDrawingFileUrl(drawing)
                          window.open(url, '_blank')
                        }}
                        aria-label={`Download ${drawing.title}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {/* Delete button - only for users with edit permissions */}
                      {canEdit && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-9 w-9 p-0"
                          onClick={() => handleDeleteDrawing(drawing.id)}
                          aria-label={`Delete ${drawing.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Edit Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={(open) => {
            setEditDialogOpen(open)
            if (!open) {
              setSelectedDrawing(null)
              resetForm()
            }
          }}>
            <DialogContent className="max-w-[95vw] sm:max-w-[550px] max-h-[95vh] overflow-y-auto"> {/* IMPROVEMENT: Consistent dialog size */}
              <DialogHeader>
                <DialogTitle className="text-lg">Edit Drawing</DialogTitle>
                <DialogDescription className="text-sm">
                  Update drawing information
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateDrawing}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-title">Drawing Title *</Label>
                    <Input
                      id="edit-title"
                      placeholder="Site Plan - Ground Floor"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, title: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-project">Project *</Label>
                    <Select
                      value={formData.projectId}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, projectId: value }))
                      }
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
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-type" className="text-sm">File Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PDF">PDF</SelectItem>
                          <SelectItem value="DWG">DWG (AutoCAD)</SelectItem>
                          <SelectItem value="DXF">DXF</SelectItem>
                          <SelectItem value="IFC">IFC (BIM)</SelectItem>
                          <SelectItem value="RVT">RVT (Revit)</SelectItem>
                          <SelectItem value="IMAGE">Image</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-version" className="text-sm">Version</Label>
                      <Input
                        id="edit-version"
                        type="number"
                        step="0.1"
                        placeholder="1.0"
                        value={formData.version}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, version: parseFloat(e.target.value) || 1 }))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      placeholder="Brief description of the drawing..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* View Dialog */}
          <Dialog open={viewDialogOpen} onOpenChange={(open) => {
            setViewDialogOpen(open)
            if (!open) {
              setViewingDrawing(null)
            }
          }}>
            {/* IMPROVEMENT: Made the dialog full-screen on mobile and nearly full-screen on larger devices */}
            <DialogContent className="max-w-full max-h-full w-screen h-screen sm:max-w-[98vw] sm:max-h-[98vh] sm:w-[98vw] sm:h-[98vh] p-0 flex flex-col">
              <DialogHeader className="p-4 sm:p-6 border-b flex-shrink-0">
                <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl">
                  {viewingDrawing && getFileIcon(viewingDrawing.fileType)}
                  <span className="truncate">{viewingDrawing?.title}</span>
                </DialogTitle>
                <DialogDescription className="text-sm sm:text-base">
                  <Badge variant="outline" className="mr-2">{viewingDrawing?.project?.name} ({viewingDrawing?.project?.code})</Badge>
                   • Version **{viewingDrawing?.version.toFixed(1)}**
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-hidden"> {/* IMPROVEMENT: Ensure viewer takes all remaining space */}
                {viewingDrawing && (
                  <DrawingViewer
                    fileUrl={getDrawingFileUrl(viewingDrawing)}
                    fileType={viewingDrawing.fileType}
                    description={viewingDrawing.description}
                    id={viewingDrawing.id}
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
        </div>

  )
}