"use client"
import type React from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { MapPin, Calendar, Edit, Trash2, UserPlus, FileText, TrendingUp, ChevronRight, ReceiptText } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import {
  fetchProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  fetchUsers,
  fetchRoles,
  updateProjectProgress,
} from "@/app/actions/projects/main"
import { fetchLabours } from "@/app/actions/labours/main"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { getCurrentUser, isOwner } from "@/lib/auth"
import { ClientDashboard } from "@/components/client-dashboard"
import { Building2 } from "lucide-react" // Import Building2 component
import { MaterialManagement } from "@/components/materials/material-management"
import SiteDiaryManagement from "@/components/site-diary-management"
import { TaskManagement } from "@/components/tasks/task-management"
import { QCManagement } from "@/components/quality-control/qc-management";
import { ProcurementDashboard } from "@/components/procurement/procurement-dashboard";
import { FinanceManagement } from "@/components/finance/finance-management";
import { Project } from "@/types/project"
import { SidebarTrigger } from "../ui/sidebar"

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const projectId = params.id as string

  // Get active tab from URL query parameter, default to "overview"
  const activeTab = searchParams.get('tab') || 'overview'

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

  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false)
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string; username: string }>>([])
  const [roles, setRoles] = useState<Array<{ id: string; name: string; description: string }>>([])
  const [addingMember, setAddingMember] = useState(false)
  const [memberFormData, setMemberFormData] = useState({
    userId: "",
    roleId: "",
  })

  const [labours, setLabours] = useState<Array<{ id: string; name: string; contractorId: string }>>([])
  const [isUserOwner, setIsUserOwner] = useState(false)
  const [progressDialogOpen, setProgressDialogOpen] = useState(false)
  const [updatingProgress, setUpdatingProgress] = useState(false)
  const [progressFormData, setProgressFormData] = useState({
    progress: 0,
    milestone: "",
    notes: "",
  })

  useEffect(() => {
    const user = getCurrentUser()
    setIsUserOwner(isOwner(user))
  }, [])

  const loadProject = useCallback(async () => {
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
  }, [projectId])

  useEffect(() => {
    loadProject()
  }, [loadProject])

  useEffect(() => {
    loadUsersAndRoles()
    loadLabours()
  }, [])

  async function loadUsersAndRoles() {
    try {
      const [usersData, rolesData] = await Promise.all([fetchUsers(), fetchRoles()])
      setUsers(Array.isArray(usersData) ? usersData : [])
      setRoles(Array.isArray(rolesData) ? rolesData : [])
    } catch (error) {
      console.error("Error loading users and roles:", error)
      setUsers([])
      setRoles([])
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

  const handleTabChange = (value: string) => {
    // Update URL with the new tab parameter
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set('tab', value)
    router.push(newUrl.pathname + newUrl.search, { scroll: false })
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

  async function handleUpdateProgress(e: React.FormEvent) {
    e.preventDefault()
    setUpdatingProgress(true)

    try {
      await updateProjectProgress(projectId, progressFormData.progress, progressFormData.milestone)
      setProgressDialogOpen(false)
      setProgressFormData({ progress: 0, milestone: "", notes: "" })
      await loadProject()
    } catch (error) {
      console.error("Error updating progress:", error)
      alert("Failed to update progress")
    } finally {
      setUpdatingProgress(false)
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
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Building2 className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Loading project...</h3>

      </div>
    )}
  

  if (!project) {
    return (
      
          <div className="flex flex-col items-center justify-center h-screen gap-4">
            <Building2 className="h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Project not found</h3>
            <Button onClick={() => router.push("/projects")} variant="outline">
              <ChevronRight className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </div>
        
    )
  }

  if (isUserOwner) {
    return (
     
          <><header className="hidden md:flex sticky top-0 z-40 h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur-sm px-4 md:px-6">
      <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="hidden md:flex">
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
      </header><div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <ClientDashboard projectId={projectId} />
        </div></>
   
    )
  }

  return (
    
        <><><header className="hidden md:flex sticky top-0 z-40 h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur-sm px-4 md:px-6">

      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-semibold">{project.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header><div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 border-b -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList className="inline-flex h-auto w-full items-center justify-start gap-1 rounded-lg bg-muted/50 p-1.5 overflow-x-auto scrollbar-hide">
              <TabsTrigger
                value="overview"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
                  Overview
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="tasks"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12h.01" /><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><path d="M22 13a18.15 18.15 0 0 1-20 0" /><rect width="20" height="14" x="2" y="6" rx="2" /></svg>
                  Tasks
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="team"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  Team
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="drawings"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                  Drawings
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="materials"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" x2="12" y1="22" y2="12" /></svg>
                  Materials
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="procurement"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <ReceiptText />
                  Procurement
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="diaries"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
                  Diaries
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="quality"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>
                  Quality
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="finance"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                  Finance
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-lg md:text-xl font-bold">{project.name}</h1>
                  <Badge
                    variant={getStatusBadge(project.status) as "default" | "secondary" | "destructive" | "outline"}
                    className="text-xs md:text-sm"
                  >
                    {project.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs">{project.code}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProgressDialogOpen(true)}
                  className="text-xs md:text-sm"
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Update Progress</span>
                  <span className="sm:hidden">Progress</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditDialogOpen(true)}
                  className="text-xs md:text-sm"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteProject}
                  disabled={deleting}
                  className="text-xs md:text-sm"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              </div>
            </div>

            <div className="grid gap-4  md:grid-cols-2">
              <Card>
                <CardHeader className="">
                  <CardTitle className="text-lg">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                  {project.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Location</p>
                        <p className="text-sm text-muted-foreground break-words">{project.location}</p>
                      </div>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {project.startDate && (
                    <>
                      <Separator className="my-2" />
                      <div className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Start Date</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(project.startDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Current Progress</span>
                    <span className="text-xl md:text-2xl font-bold">{project.progress || 0}%</span>
                  </div>
                  <Progress value={project.progress || 0} className="h-3" />
                  <div className="space-y-2 pt-2">
                    <div className="text-sm">
                      <p className="font-medium">Next Milestone</p>
                      <p className="text-muted-foreground text-xs md:text-sm">{project.nextMilestone || "Not set"}</p>
                    </div>
                    {project.progressLastUpdated && (
                      <div className="text-xs text-muted-foreground">
                        Last updated: {new Date(project.progressLastUpdated).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            <TaskManagement projectId={projectId} />
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <Card>
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>People working on this project</CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => setAddMemberDialogOpen(true)}
                  className="mt-3 md:mt-0 text-xs md:text-sm"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </CardHeader>
              <CardContent>
                {project.members && project.members.length > 0 ? (
                  <div className="space-y-2">
                    {project.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{member.user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                          {member.role.name}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-6 text-sm">No team members yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drawings" className="mt-6">
            {project.drawings && project.drawings.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Drawings</CardTitle>
                  <CardDescription>Technical drawings for this project</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {project.drawings.map((drawing) => (
                      <div
                        key={drawing.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="rounded bg-muted p-2 shrink-0">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{drawing.title}</p>
                            <p className="text-xs text-muted-foreground">
                              v{drawing.version} • {drawing.type}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground">No drawings uploaded yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="materials" className="mt-6">
            <MaterialManagement
              projectId={projectId}
              contractors={project.contractors?.map((pc) => pc.contractor) || []}
              labours={labours} />
          </TabsContent>

          <TabsContent value="procurement" className="mt-6">
            <ProcurementDashboard projectId={projectId} />
          </TabsContent>

          <TabsContent value="diaries" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Site Diaries</CardTitle>
                <CardDescription>Daily work logs, labour attendance, and progress tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <SiteDiaryManagement projectId={projectId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quality" className="mt-6">
            <QCManagement projectId={projectId} />
          </TabsContent>

          <TabsContent value="finance" className="mt-6">
            <FinanceManagement projectId={projectId} />
          </TabsContent>
        </Tabs>
      </div></>
      <><Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleUpdateProgress}>
            <DialogHeader>
              <DialogTitle>Update Project Progress</DialogTitle>
              <DialogDescription>Update the current progress percentage and milestone</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="progress">Progress (%) *</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={progressFormData.progress}
                  onChange={(e) => setProgressFormData({ ...progressFormData, progress: Number(e.target.value) })}
                  required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="milestone">Next Milestone</Label>
                <Input
                  id="milestone"
                  placeholder="Foundation completed"
                  value={progressFormData.milestone}
                  onChange={(e) => setProgressFormData({ ...progressFormData, milestone: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  placeholder="Additional notes about progress"
                  value={progressFormData.notes}
                  onChange={(e) => setProgressFormData({ ...progressFormData, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setProgressDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updatingProgress}>
                {updatingProgress ? "Updating..." : "Update Progress"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog><Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleUpdateProject}>
              <DialogHeader>
                <DialogTitle>Edit Project</DialogTitle>
                <DialogDescription>Update the project details</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Project Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-code">Project Code *</Label>
                  <Input
                    id="edit-code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
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
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updating}>
                  {updating ? "Updating..." : "Update Project"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog><Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleAddMember}>
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
                <DialogDescription>Add a new member to the project team</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="user">User *</Label>
                  <Select
                    value={memberFormData.userId}
                    onValueChange={(value) => setMemberFormData({ ...memberFormData, userId: value })}
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
                    onValueChange={(value) => setMemberFormData({ ...memberFormData, roleId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddMemberDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addingMember}>
                  {addingMember ? "Adding..." : "Add Member"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog></></>

  )
}