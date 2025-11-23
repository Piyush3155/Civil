"use client";

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Edit, 
  Trash2, 
  UserPlus,
  FileText,
  Users as UsersIcon
} from "lucide-react"
import { useEffect, useState } from "react"
import { 
  fetchProjectById, 
  updateProject, 
  deleteProject,
  addProjectMember,
  fetchUsers,
  fetchRoles
} from "@/app/actions/projects/main"
import { fetchLabours } from "@/app/actions/labours/main"
import { MaterialManagement } from "@/components/materials/material-management"
import { useRouter, useParams } from "next/navigation"

interface Project {
  id: string
  name: string
  code: string
  location?: string
  status: string
  startDate?: string
  endDate?: string
  createdAt: string
  members?: Array<{
    id: string
    user: {
      id: string
      name: string
      email: string
    }
    role: {
      id: string
      name: string
    }
  }>
  contractors?: Array<{
    contractor: {
      id: string
      name: string
      type: string
    }
  }>
  drawings?: Array<{
    id: string
    title: string
    version: string
    type: string
  }>
  labours?: Array<{
    id: string
    name: string
    contractorId: string
  }>
}

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    location: "",
    status: "ACTIVE",
  })

  // Add member dialog state
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false)
  const [users, setUsers] = useState<Array<{id: string, name: string, email: string, username: string}>>([])
  const [roles, setRoles] = useState<Array<{id: string, name: string, description: string}>>([])
  const [addingMember, setAddingMember] = useState(false)
  const [memberFormData, setMemberFormData] = useState({
    userId: "",
    roleId: "",
  })

  // Labours state
  const [labours, setLabours] = useState<Array<{id: string, name: string, contractorId: string}>>([])

  useEffect(() => {
    loadProject()
  }, [projectId])

  useEffect(() => {
    loadUsersAndRoles()
    loadLabours()
  }, [])

  async function loadUsersAndRoles() {
    try {
      const [usersData, rolesData] = await Promise.all([
        fetchUsers(),
        fetchRoles()
      ])
      setUsers(usersData)
      setRoles(rolesData)
    } catch (error) {
      console.error("Error loading users and roles:", error)
    }
  }

  async function loadLabours() {
    try {
      const laboursData = await fetchLabours()
      setLabours(laboursData)
    } catch (error) {
      console.error("Error loading labours:", error)
    }
  }

  async function loadProject() {
    try {
      const data = await fetchProjectById(projectId)
      setProject(data)
      setFormData({
        name: data.name,
        code: data.code,
        location: data.location || "",
        status: data.status,
      })
    } catch (error) {
      console.error("Error loading project:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateProject(e: React.FormEvent) {
    e.preventDefault()
    setUpdating(true)

    try {
      await updateProject(projectId, formData)
      setEditDialogOpen(false)
      await loadProject()
    } catch (error) {
      console.error("Error updating project:", error)
      alert("Failed to update project")
    } finally {
      setUpdating(false)
    }
  }

  async function handleDeleteProject() {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return
    }

    setDeleting(true)
    try {
      await deleteProject(projectId)
      router.push("/projects")
    } catch (error) {
      console.error("Error deleting project:", error)
      alert("Failed to delete project")
      setDeleting(false)
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    setAddingMember(true)

    try {
      await addProjectMember(projectId, memberFormData.userId, memberFormData.roleId)
      setAddMemberDialogOpen(false)
      setMemberFormData({ userId: "", roleId: "" })
      await loadProject()
    } catch (error) {
      console.error("Error adding member:", error)
      alert("Failed to add member")
    } finally {
      setAddingMember(false)
    }
  }

  function getStatusBadge(status: string) {
    const variants: { [key: string]: string } = {
      ACTIVE: "default",
      PAUSED: "secondary",
      COMPLETED: "outline",
      CANCELLED: "destructive",
    }
    return variants[status] || "default"
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <p className="text-muted-foreground">Loading project...</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (!project) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-col items-center justify-center h-screen">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Project not found</h3>
            <Button onClick={() => router.push("/projects")}>
              Back to Projects
            </Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
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
                <BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{project.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex gap-2">
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleUpdateProject}>
                  <DialogHeader>
                    <DialogTitle>Edit Project</DialogTitle>
                    <DialogDescription>
                      Update project details below
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-name">Project Name *</Label>
                      <Input
                        id="edit-name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-code">Project Code *</Label>
                      <Input
                        id="edit-code"
                        value={formData.code}
                        onChange={(e) =>
                          setFormData({ ...formData, code: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-location">Location</Label>
                      <Input
                        id="edit-location"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="PAUSED">Paused</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updating}>
                      {updating ? "Saving..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleAddMember}>
                  <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                    <DialogDescription>
                      Add a new member to this project. Select a user and assign a role.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="user">User *</Label>
                      <Select
                        value={memberFormData.userId}
                        onValueChange={(value) =>
                          setMemberFormData({ ...memberFormData, userId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role">Role *</Label>
                      <Select
                        value={memberFormData.roleId}
                        onValueChange={(value) =>
                          setMemberFormData({ ...memberFormData, roleId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name} - {role.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAddMemberDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={addingMember}>
                      {addingMember ? "Adding..." : "Add Member"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
              disabled={deleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Project Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{project.name}</h1>
                <Badge variant={getStatusBadge(project.status) as "default" | "secondary" | "destructive" | "outline"}>
                  {project.status}
                </Badge>
              </div>
              <p className="text-muted-foreground">{project.code}</p>
            </div>
          </div>

          {/* Project Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">{project.location}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {project.startDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Start Date</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(project.startDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <UsersIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Team Members</p>
                    <p className="text-sm text-muted-foreground">
                      {project.members?.length || 0} members
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Contractors</p>
                    <p className="text-sm text-muted-foreground">
                      {project.contractors?.length || 0} contractors
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Drawings</p>
                    <p className="text-sm text-muted-foreground">
                      {project.drawings?.length || 0} drawings
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team Members */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>People working on this project</CardDescription>
                </div>
                <Button size="sm" onClick={() => setAddMemberDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {project.members && project.members.length > 0 ? (
                <div className="space-y-3">
                  {project.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{member.user.name}</p>
                        <p className="text-sm text-muted-foreground">{member.user.email}</p>
                      </div>
                      <Badge variant="secondary">{member.role.name}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No team members yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Drawings */}
          {project.drawings && project.drawings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Drawings</CardTitle>
                <CardDescription>Technical drawings for this project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {project.drawings.map((drawing) => (
                    <div key={drawing.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{drawing.title}</p>
                          <p className="text-sm text-muted-foreground">
                            v{drawing.version} • {drawing.type}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Material Management */}
          <MaterialManagement
            projectId={projectId}
            contractors={project.contractors?.map(pc => pc.contractor) || []}
            labours={labours}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
