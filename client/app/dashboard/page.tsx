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
import { Building2, Users, HardHat, FileText, Activity, AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { fetchProjects } from "@/app/actions/projects/main"
import { fetchContractors } from "@/app/actions/contractors/main"
import { fetchLabours } from "@/app/actions/labours/main"
import { fetchDrawings } from "@/app/actions/drawings/main"
import { Badge } from "@/components/ui/badge"

export default function DashboardPage() {
  const [stats, setStats] = useState({
    projects: { total: 0, active: 0, paused: 0, completed: 0 },
    contractors: 0,
    labours: 0,
    drawings: 0,
    loading: true,
  })

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [projects, contractors, labours, drawings] = await Promise.all([
          fetchProjects(),
          fetchContractors(),
          fetchLabours(),
          fetchDrawings(),
        ])

        const projectStats = projects.reduce(
          (acc: any, project: any) => {
            acc.total++
            if (project.status === "ACTIVE") acc.active++
            else if (project.status === "PAUSED") acc.paused++
            else if (project.status === "COMPLETED") acc.completed++
            return acc
          },
          { total: 0, active: 0, paused: 0, completed: 0 }
        )

        setStats({
          projects: projectStats,
          contractors: contractors.length,
          labours: labours.length,
          drawings: drawings.length,
          loading: false,
        })
      } catch (error) {
        console.error("Error loading dashboard data:", error)
        setStats((prev) => ({ ...prev, loading: false }))
      }
    }

    loadDashboardData()
  }, [])

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
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Welcome Section */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome to Civil Desk</h1>
            <p className="text-muted-foreground mt-1">
              Manage your construction projects, teams, and resources
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.projects.total}</div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="default" className="text-xs">
                    {stats.projects.active} Active
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {stats.projects.completed} Done
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contractors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.contractors}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Registered contractor companies
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Workers</CardTitle>
                <HardHat className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.labours}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total labour workforce
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Drawings</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.drawings}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Project documents & plans
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Recent Activity */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Commonly used operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <a
                  href="/projects"
                  className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="font-medium">Create New Project</div>
                  <div className="text-sm text-muted-foreground">
                    Start a new construction project
                  </div>
                </a>
                <a
                  href="/drawings"
                  className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="font-medium">Upload Drawings</div>
                  <div className="text-sm text-muted-foreground">
                    Add plans, CAD files, or documents
                  </div>
                </a>
                <a
                  href="/contractors"
                  className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="font-medium">Manage Contractors</div>
                  <div className="text-sm text-muted-foreground">
                    Add or update contractor info
                  </div>
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  System Status
                </CardTitle>
                <CardDescription>Platform health overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Backend API</span>
                  <Badge variant="default">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <Badge variant="default">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Notifications</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">File Storage</span>
                  <Badge variant="default">Ready</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
