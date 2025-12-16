"use client"

import type React from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Building2,
  Users,
  HardHat,
  FileText,
  Activity,
  Loader2,
  Plus,
  TrendingUp,
  Calendar,
} from "lucide-react"
import { useEffect, useState } from "react"
import { fetchProjects } from "@/app/actions/projects/main"
import { fetchContractors } from "@/app/actions/contractors/main"
import { fetchLabours } from "@/app/actions/labours/main"
import { fetchDrawings } from "@/app/actions/drawings/main"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

import {MetricCardProps , Project , ProjectStats , DashboardStats} from "@/types/dashboard"

// --- Helper Components ---
const StatCardSkeleton = () => (
  <Card className="border-border/50 shadow-sm overflow-hidden">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
      <div className="h-10 w-10 bg-muted animate-pulse rounded-lg"></div>
    </CardHeader>
    <CardContent>
      <div className="h-8 w-20 bg-muted animate-pulse rounded-lg mb-2"></div>
      <div className="h-3 w-36 bg-muted animate-pulse rounded"></div>
    </CardContent>
  </Card>
)

const MetricCard = ({ title, value, icon: Icon, description, trend, colorClass, href }: MetricCardProps) => {
  const content = (
    <Card
      className={`group relative overflow-hidden border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${href ? "cursor-pointer" : ""}`}
    >
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 ${colorClass}`}
      ></div>

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</CardTitle>
        <div
          className={`p-2.5 rounded-lg ${colorClass} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className={`h-5 w-5 ${colorClass.replace("bg-", "text-")}`} />
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {(description || trend) && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            {trend && (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" />
                {trend}
              </span>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    )
  }

  return <div className="">{content}</div>
}

const Greeting = () => {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const hour = currentTime.getHours()
  let greeting = "Good Evening"
  let emoji = "🌙"

  if (hour >= 3 && hour < 12) {
    greeting = "Good Morning";
    emoji = "☀️";
  } else if (hour >= 12 && hour < 17) {
    greeting = "Good Afternoon";
    emoji = "🌤️";
  } else if (hour >= 17 && hour < 21) {
    greeting = "Good Evening";
    emoji = "🌙";
  } else {
    greeting = "Good Night";
    emoji = "🌙";
  }



  const formattedDate = currentTime.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-balance">
          {greeting}, Admin <span className="inline-block animate-wave">{emoji}</span>
        </h1>
      </div>
      <p className="text-muted-foreground text-base md:text-lg max-w-2xl text-balance">
        Here&apos;s what&apos;s happening with your construction sites today.
      </p>
      <p className="text-sm text-muted-foreground/80 flex items-center gap-2 mt-2">
        <Calendar className="h-4 w-4" />
        {formattedDate}
      </p>
    </div>
  )
}

const QuickActionCard = ({
  href,
  icon: Icon,
  title,
  description,
  colorClass,
}: {
  href: string
  icon: React.ElementType
  title: string
  description: string
  colorClass: string
}) => (
  <Link href={href} className="group">
    <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20">
      <CardContent className="flex flex-col items-center justify-center p-6 text-center gap-3">
        <div
          className={`p-3 ${colorClass} bg-opacity-10 rounded-xl group-hover:scale-110 group-hover:bg-opacity-20 transition-all duration-300`}
        >
          <Icon className={`h-6 w-6 ${colorClass.replace("bg-", "text-")}`} />
        </div>
        <div>
          <h3 className="font-semibold text-base">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1.5">{description}</p>
        </div>
      </CardContent>
    </Card>
  </Link>
)

const ProjectListItem = ({ project }: { project: Project }) => {
  const statusColors = {
    ACTIVE: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    PAUSED: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
    COMPLETED: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    PLANNING: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  }

  return (
    <Link href={`/projects/${project.id}`} className="block group">
      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-border group-hover:border-primary/30 transition-colors shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-sm font-medium leading-none truncate">{project.name || "Untitled Project"}</p>
            <p className="text-xs text-muted-foreground truncate">{project.location || "Location N/A"}</p>
          </div>
        </div>
        <Badge variant="outline" className={`ml-2 ${statusColors[project.status || "PLANNING"]} shrink-0`}>
          {project.status}
        </Badge>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    projects: { total: 0, active: 0, paused: 0, completed: 0 },
    contractors: 0,
    labours: 0,
    drawings: 0,
    loading: true,
    recentProjects: [],
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

        const projectStats = (projects as Project[]).reduce(
          (acc: ProjectStats, project: Project) => {
            acc.total++
            if (project.status === "ACTIVE") acc.active++
            else if (project.status === "PAUSED") acc.paused++
            else if (project.status === "COMPLETED") acc.completed++
            return acc
          },
          { total: 0, active: 0, paused: 0, completed: 0 } as ProjectStats,
        )

        setStats({
          projects: projectStats,
          contractors: contractors.length,
          labours: labours.length,
          drawings: drawings.length,
          loading: false,
          recentProjects: projects.slice(0, 5),
        })
      } catch (error) {
        console.error("Error loading dashboard data:", error)
        setStats((prev) => ({ ...prev, loading: false }))
      }
    }

    loadDashboardData()
  }, [])

  const isLoading = stats.loading
  const completionPercentage =
    stats.projects.total > 0 ? Math.round((stats.projects.completed / stats.projects.total) * 100) : 0

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-gradient-to-br from-background via-background to-muted/20">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 px-4 sticky top-0 z-10 shadow-sm">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          {isLoading && (
            <div className="ml-auto flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading data...</span>
            </div>
          )}
        </header>

        <main className="flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8 max-w-[1800px] mx-auto w-full">
          <Greeting />

          {/* --- TOP STATS ROW --- */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading ? (
              Array(4)
                .fill(0)
                .map((_, i) => <StatCardSkeleton key={i} />)
            ) : (
              <>
                <MetricCard
                  title="Total Projects"
                  value={stats.projects.total}
                  icon={Building2}
                  colorClass="bg-blue-500 text-blue-500"
                  description={`${stats.projects.active} currently active`}
                  trend="+12%"
                  href="/projects"
                />
                <MetricCard
                  title="Contractors"
                  value={stats.contractors}
                  icon={Users}
                  colorClass="bg-violet-500 text-violet-500"
                  description="Registered companies"
                  trend="+3%"
                  href="/contractors"
                />
                <MetricCard
                  title="Workforce"
                  value={stats.labours}
                  icon={HardHat}
                  colorClass="bg-orange-500 text-orange-500"
                  description="Total labourers"
                  trend="+8%"
                  href="/labours"
                />
                <MetricCard
                  title="Documents"
                  value={stats.drawings}
                  icon={FileText}
                  colorClass="bg-emerald-500 text-emerald-500"
                  description="Drawings & specs"
                  trend="+15%"
                  href="/drawings"
                />
              </>
            )}
          </section>

          {/* --- QUICK ACTIONS --- */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Quick Actions</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Common tasks and shortcuts</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickActionCard
                href="/projects/new"
                icon={Plus}
                title="New Project"
                description="Initialize site setup"
                colorClass="bg-primary text-primary"
              />
              <QuickActionCard
                href="/drawings/upload"
                icon={FileText}
                title="Upload Plans"
                description="Add project drawings"
                colorClass="bg-blue-500 text-blue-500"
              />
              <QuickActionCard
                href="/labours"
                icon={Users}
                title="Manage Labour"
                description="Update workforce"
                colorClass="bg-orange-500 text-orange-500"
              />
              <QuickActionCard
                href="/contractors"
                icon={Building2}
                title="Add Contractor"
                description="Register new company"
                colorClass="bg-violet-500 text-violet-500"
              />
            </div>
          </section>

          {/* --- MAIN DASHBOARD CONTENT GRID --- */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* LEFT COLUMN - Recent Projects */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Activity className="h-5 w-5 text-primary" />
                        Recent Projects
                      </CardTitle>
                      <CardDescription className="mt-1.5">
                        Latest construction sites added to the platform
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/projects">View All</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-4 p-3">
                          <div className="h-10 w-10 bg-muted rounded-lg animate-pulse" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
                            <div className="h-3 w-1/4 bg-muted rounded animate-pulse" />
                          </div>
                          <div className="h-6 w-20 bg-muted rounded animate-pulse" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {stats.recentProjects && stats.recentProjects.length > 0 ? (
                        stats.recentProjects.map((project: Project) => (
                          <ProjectListItem key={project.id} project={project} />
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                            <Building2 className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                          <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                            Start by creating your first construction project to get started.
                          </p>
                          <Button asChild>
                            <Link href="/projects/new">
                              <Plus className="h-4 w-4 mr-2" />
                              Create Project
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN - Stats & Status */}
            <div className="space-y-6">
              {/* Project Status Breakdown */}
              <Card className="shadow-md">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Project Overview</CardTitle>
                  <CardDescription>Current status breakdown</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-3xl font-bold">{completionPercentage}%</span>
                      <span className="text-sm text-muted-foreground">completion rate</span>
                    </div>
                    <Progress value={completionPercentage} className="h-2.5" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-sm font-medium">Active</span>
                      </div>
                      <span className="text-lg font-bold">{stats.projects.active}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500"></div>
                        <span className="text-sm font-medium">Paused</span>
                      </div>
                      <span className="text-lg font-bold">{stats.projects.paused}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 rounded-full bg-blue-500"></div>
                        <span className="text-sm font-medium">Completed</span>
                      </div>
                      <span className="text-lg font-bold">{stats.projects.completed}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Health */}
              
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
