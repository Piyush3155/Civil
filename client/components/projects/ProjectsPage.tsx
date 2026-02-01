"use client"

import type React from "react"
import Link from "next/link"

import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Plus, MapPin, Calendar, UsersIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { fetchProjects, fetchMyProjects } from "@/app/actions/projects/main"
import { getSession } from "@/lib/sessionAction"
import { useRouter } from "next/navigation"
import Loader from "@/components/ui/loader"

// Roles that can create/edit/delete projects
const EDIT_ALLOWED_ROLES = ['ADMIN', 'PROJECT_MANAGER'];

interface Project {
  id: string
  name: string
  code: string
  location?: string
  status: string
  startDate?: string
  endDate?: string
  createdAt: string
  _count?: {
    members: number
    contractors: number
    drawings: number
  }
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  
  // User role state for permission control
  const [userRoles, setUserRoles] = useState<string[]>([])
  const canEdit = userRoles.some(role => EDIT_ALLOWED_ROLES.includes(role))

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    try {
      // First fetch user session to get roles
      const session = await getSession()
      const roles = session.roles || []
      setUserRoles(roles)
      
      // Determine if user can see all projects or just their assigned ones
      const canSeeAllProjects = roles.includes('ADMIN') || roles.includes('PROJECT_MANAGER') || roles.includes('SITE_ENGINEER')
      
      const data = canSeeAllProjects ? await fetchProjects() : await fetchMyProjects()
      setProjects(data)
    } catch (error) {
      console.error("Error loading projects:", error)
    } finally {
      setLoading(false)
    }
  }


  function getStatusBadge(status: string): "default" | "secondary" | "destructive" | "outline" {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ACTIVE: "default",
      PAUSED: "secondary",
      COMPLETED: "outline",
      CANCELLED: "destructive",
    }
    return variants[status] || "default"
  }


  return (
    <div className="bg-background min-h-screen">
      <header className="hidden md:flex sticky top-0 z-40 h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur-sm px-4 md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold">
                  {canEdit ? "All Projects" : "My Projects"}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto">
            {/* Only show New Project button for users with edit permissions */}
            {canEdit && (
              <Button className="gap-2" asChild>
                <Link href="/projects/new">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Project</span>
                  <span className="sm:hidden">New</span>
                </Link>
              </Button>
            )}
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader />
            </div>
          ) : projects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center h-72">
                <div className="rounded-lg bg-muted/50 p-3 mb-4">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-center">
                  {canEdit ? "No projects yet" : "No projects assigned"}
                </h3>
                <p className="text-muted-foreground mb-6 text-center max-w-xs text-sm">
                  {canEdit 
                    ? "Get started by creating your first project to track all your construction work"
                    : "You have not been assigned to any projects yet. Contact your project manager for access."}
                </p>
                {canEdit && (
                  <Button asChild className="gap-2">
                    <Link href="/projects/new">
                      <Plus className="h-4 w-4" />
                      Create Project
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">
                    {canEdit ? "Projects" : "My Projects"}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {projects.length} {projects.length === 1 ? "project" : "projects"}
                    {!canEdit && " assigned to you"}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <Card
                    key={project.id}
                    className="hover:shadow-md hover:border-primary/50 transition-all duration-200 cursor-pointer group overflow-hidden"
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base md:text-lg truncate group-hover:text-primary transition-colors">
                            {project.name}
                          </CardTitle>
                          <CardDescription className="text-xs md:text-sm mt-1 truncate">{project.code}</CardDescription>
                        </div>
                        <Badge variant={getStatusBadge(project.status)} className="shrink-0 text-xs">
                          {project.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {project.location && (
                        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground overflow-hidden">
                          <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                          <span className="truncate">{project.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                        <span className="text-xs">{new Date(project.createdAt).toLocaleDateString()}</span>
                      </div>
                      {project._count && (
                        <div className="flex gap-3 pt-2 border-t">
                          <div className="flex items-center gap-1 text-xs">
                            <UsersIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{project._count.members}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>📋 {project._count.drawings}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    
  )
}