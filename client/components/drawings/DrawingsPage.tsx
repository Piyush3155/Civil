"use client";

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
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
} from "lucide-react"
import { useEffect, useState } from "react"
import { 
  fetchDrawings, 
  createDrawing,
  updateDrawing,
  deleteDrawing,
  uploadDrawingAttachment
} from "@/app/actions/drawings/main"
import { fetchProjects } from "@/app/actions/projects/main"
import Loader from "@/components/ui/loader";
import dynamic from "next/dynamic";

// Dynamic import for DrawingViewer to avoid SSR issues
const DrawingViewer = dynamic(() => import("./DrawingViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [drawingsData, projectsData] = await Promise.all([
        fetchDrawings(),
        fetchProjects()
      ])
      setDrawings(drawingsData)
      setProjects(projectsData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateDrawing(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile) {
      alert("Please select a file")
      return
    }
    try {
      console.log("Starting upload to CDN...")
      // Upload file to CDN
      const uploadFormData = new FormData()
      uploadFormData.append('files', selectedFile)
      const uploadResult = await uploadDrawingAttachment(uploadFormData)
      console.log("Upload result:", uploadResult)
      
      if (!uploadResult.success || !uploadResult.data) {
        alert(uploadResult.error || "Failed to upload file")
        return
      }
      const fileUrl = uploadResult.data.attachmentUrls[0]
      console.log("File URL:", fileUrl)

      console.log("Creating drawing in server...")
      const createData = {
        projectId: formData.projectId,
        title: formData.title,
        description: formData.description,
        fileUrl,
        fileType: formData.type,
        version: formData.version,
      }
      console.log("Create data:", createData)
      
      await createDrawing(createData)
      console.log("Drawing created successfully")
      
      setCreateDialogOpen(false)
      resetForm()
      await loadData()
    } catch (error) {
      console.error("Error creating drawing:", error)
      alert("Failed to create drawing")
    }
  }

  async function handleUpdateDrawing(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDrawing) return

    try {
      await updateDrawing(selectedDrawing.id, formData)
      setEditDialogOpen(false)
      setSelectedDrawing(null)
      resetForm()
      await loadData()
    } catch (error) {
      console.error("Error updating drawing:", error)
      alert("Failed to update drawing")
    }
  }

  async function handleDeleteDrawing(id: string) {
    if (!confirm("Are you sure you want to delete this drawing?")) {
      return
    }

    try {
      await deleteDrawing(id)
      await loadData()
    } catch (error) {
      console.error("Error deleting drawing:", error)
      alert("Failed to delete drawing")
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
    const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || "https://localhost:3000"
    return `${cdnUrl}${drawing.fileUrl}`
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
    const iconMap: { [key: string]: typeof FileText } = {
      PDF: FileText,
      DWG: File,
      DXF: File,
      IFC: File,
      RVT: File,
      IMAGE: File,
    }
    const Icon = iconMap[type] || FileText
    return <Icon className="h-5 w-5" />
  }

  function getTypeBadge(type: string) {
    const colorMap: { [key: string]: string } = {
      PDF: "default",
      DWG: "secondary",
      DXF: "outline",
      IFC: "default",
      RVT: "secondary",
      IMAGE: "outline",
    }
    return colorMap[type] || "default"
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Drawings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto">
            <Dialog open={createDialogOpen} onOpenChange={(open) => {
              setCreateDialogOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Drawing
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Upload New Drawing</DialogTitle>
                  <DialogDescription>
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
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="create-project">Project *</Label>
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
                        <Label htmlFor="create-type">File Type</Label>
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
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Upload Drawing</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader />
            </div>
          ) : drawings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No drawings yet</h3>
                <p className="text-muted-foreground mb-4">
                  Upload your first technical drawing to get started
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Drawing
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {drawings.map((drawing) => (
                <Card key={drawing.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {getFileIcon(drawing.fileType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{drawing.title}</h3>
                        <p className="text-sm text-muted-foreground">v{drawing.version}</p>
                      </div>
                      <Badge variant={getTypeBadge(drawing.fileType) as "default" | "secondary" | "outline"}>
                        {drawing.fileType}
                      </Badge>
                    </div>
                    
                    {drawing.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {drawing.description}
                      </p>
                    )}

                    <div className="space-y-2 mb-4">
                      {drawing.project && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Building2 className="mr-2 h-4 w-4" />
                          <span className="truncate">{drawing.project.name}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        {new Date(drawing.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={() => openViewDialog(drawing)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(drawing)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const url = getDrawingFileUrl(drawing)
                          window.open(url, '_blank')
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteDrawing(drawing.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Drawing</DialogTitle>
                <DialogDescription>
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
                      <Label htmlFor="edit-type">File Type</Label>
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
                      <Label htmlFor="edit-version">Version</Label>
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
            <DialogContent className="max-w-[90vw] max-h-[90vh] w-full h-full">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {viewingDrawing && getFileIcon(viewingDrawing.fileType)}
                  {viewingDrawing?.title}
                </DialogTitle>
                <DialogDescription>
                  {viewingDrawing?.project?.name} • v{viewingDrawing?.version}
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-auto min-h-[60vh]">
                {viewingDrawing && (
                  <DrawingViewer
                    fileUrl={getDrawingFileUrl(viewingDrawing)}
                    fileType={viewingDrawing.fileType}
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}