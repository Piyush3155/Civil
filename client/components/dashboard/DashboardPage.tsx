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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Building2, 
  Users, 
  HardHat, 
  FileText, 
  Activity, 
  AlertCircle, 
  Loader2, 
  Plus, 
  ArrowUpRight,
  CheckCircle2
} from "lucide-react"
import { useEffect, useState } from "react"
// Assuming these are implemented and working
import { fetchProjects } from "@/app/actions/projects/main"
import { fetchContractors } from "@/app/actions/contractors/main"
import { fetchLabours } from "@/app/actions/labours/main"
import { fetchDrawings } from "@/app/actions/drawings/main"
import { Badge } from "@/components/ui/badge"
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Project } from "@/types/project";
import { MetricCardProps } from "@/types/dashboard";

// --- Types ---
interface ProjectStats {
  total: number;
  active: number;
  paused: number;
  completed: number;
}

interface DashboardStats {
  projects: ProjectStats;
  contractors: number;
  labours: number;
  drawings: number;
  loading: boolean;
  recentProjects?: Project[]; // For the list view
}

// --- Helper Components ---

const StatCardSkeleton = () => (
  <Card className="border-border/50 shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
      <div className="h-8 w-8 bg-muted animate-pulse rounded-full"></div>
    </CardHeader>
    <CardContent>
      <div className="h-8 w-16 bg-muted animate-pulse rounded-lg mb-1"></div>
      <div className="h-3 w-32 bg-muted animate-pulse rounded"></div>
    </CardContent>
  </Card>
);

const MetricCard = ({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend, 
  colorClass 
}: MetricCardProps) => (
  <Card className="overflow-hidden border-l-4 border-l-transparent hover:border-l-primary transition-all duration-300 hover:shadow-md">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
      <div className={`p-2 rounded-full ${colorClass} bg-opacity-10`}>
        <Icon className={`h-4 w-4 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold tracking-tight">{value}</div>
      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
        {trend && <span className="text-green-600 font-medium flex items-center">{trend} <ArrowUpRight className="h-3 w-3" /></span>}
        {description}
      </p>
    </CardContent>
  </Card>
);

const Greeting = () => {
  const hour = new Date().getHours();
  let greeting = "Good Evening";
  if (hour < 12) greeting = "Good Morning";
  else if (hour < 18) greeting = "Good Afternoon";

  return (
    <div className="mb-2">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {greeting}, Admin 👋
      </h1>
      <p className="text-muted-foreground text-lg mt-2 max-w-2xl">
        Here is what&apos;s happening with your construction sites today.
      </p>
    </div>
  );
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    projects: { total: 0, active: 0, paused: 0, completed: 0 },
    contractors: 0,
    labours: 0,
    drawings: 0,
    loading: true,
    recentProjects: []
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
          { total: 0, active: 0, paused: 0, completed: 0 } as ProjectStats
        )

        setStats({
          projects: projectStats,
          contractors: contractors.length,
          labours: labours.length,
          drawings: drawings.length,
          loading: false,
          recentProjects: projects.slice(0, 5) // Take first 5 for the list
        })
      } catch (error) {
        console.error("Error loading dashboard data:", error)
        setStats((prev) => ({ ...prev, loading: false }))
      }
    }

    loadDashboardData()
  }, [])

  const isLoading = stats.loading;
  const completionPercentage = stats.projects.total > 0 
    ? Math.round((stats.projects.completed / stats.projects.total) * 100) 
    : 0;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-muted/10"> {/* Subtle background color */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur px-4 sticky top-0 z-10">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          {isLoading && <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />}
        </header>

        <main className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-[1600px] mx-auto w-full">
          
          <Greeting />

          {/* --- TOP STATS ROW --- */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => <StatCardSkeleton key={i} />)
            ) : (
              <>
                <MetricCard 
                  title="Total Projects"
                  value={stats.projects.total}
                  icon={Building2}
                  colorClass="bg-blue-500 text-blue-500"
                  description={`${stats.projects.active} currently active`}
                  trend="+2" // Example trend
                />
                <MetricCard 
                  title="Contractors"
                  value={stats.contractors}
                  icon={Users}
                  colorClass="bg-violet-500 text-violet-500"
                  description="Registered companies"
                />
                <MetricCard 
                  title="Workforce"
                  value={stats.labours}
                  icon={HardHat}
                  colorClass="bg-orange-500 text-orange-500"
                  description="Total labourers"
                />
                <MetricCard 
                  title="Documents"
                  value={stats.drawings}
                  icon={FileText}
                  colorClass="bg-emerald-500 text-emerald-500"
                  description="Drawings & specs"
                />
              </>
            )}
          </section>

          {/* --- MAIN DASHBOARD CONTENT GRID --- */}
          <div className="grid gap-6 lg:grid-cols-7 xl:grid-cols-6">
            
            {/* LEFT COLUMN (Active Projects & Quick Actions) - Spans 4/7 or 4/6 */}
            <div className="flex flex-col gap-6 lg:col-span-4">
              
              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link href="/projects/new" className="group">
                  <Card className="h-full hover:border-primary/50 hover:bg-accent/40 transition-all cursor-pointer">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                        <Plus className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">New Project</h3>
                        <p className="text-xs text-muted-foreground mt-1">Initialize site setup</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/drawings/upload" className="group">
                  <Card className="h-full hover:border-blue-500/50 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-all cursor-pointer">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center gap-3">
                      <div className="p-3 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20 transition-colors">
                        <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Upload Plans</h3>
                        <p className="text-xs text-muted-foreground mt-1">Add drawings</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/labours" className="group">
                  <Card className="h-full hover:border-orange-500/50 hover:bg-orange-50/40 dark:hover:bg-orange-900/10 transition-all cursor-pointer">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center gap-3">
                      <div className="p-3 bg-orange-500/10 rounded-full group-hover:bg-orange-500/20 transition-colors">
                        <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Add Labour</h3>
                        <p className="text-xs text-muted-foreground mt-1">Update workforce</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* Recent Activity List */}
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-muted-foreground" />
                    Recent Projects
                  </CardTitle>
                  <CardDescription>Latest construction sites added to the platform.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
                          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Check if we actually have projects, else show empty state */}
                      {stats.recentProjects && stats.recentProjects.length > 0 ? (
                        stats.recentProjects.map((project: Project, i: number) => (
                          <div key={i} className="flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted border border-border group-hover:border-primary transition-colors">
                                <Building2 className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">{project.name || "Untitled Project"}</p>
                                <p className="text-xs text-muted-foreground">{project.location || "Location N/A"}</p>
                              </div>
                            </div>
                            <Badge variant={project.status === "ACTIVE" ? "default" : "secondary"}>
                              {project.status}
                            </Badge>
                          </div>
                        ))
                      ) : (
                         <div className="text-center py-8 text-muted-foreground">
                            <p>No projects found. Start by creating one.</p>
                            <Button variant="outline" size="sm" className="mt-4" asChild>
                                <Link href="/projects">Create Project</Link>
                            </Button>
                         </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

            {/* RIGHT COLUMN (Detailed Stats & Status) - Spans 3/7 or 2/6 */}
            <div className="flex flex-col gap-6 lg:col-span-3 xl:col-span-2">
              
              {/* Project Status Breakdown */}
              <Card className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Project Status</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-6">
                  <div className="text-2xl font-bold mb-4">
                    {completionPercentage}% <span className="text-sm font-normal text-muted-foreground">Completion Rate</span>
                  </div>
                  <Progress value={completionPercentage} className="h-2 mb-6" />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span className="text-muted-foreground">Active</span>
                      </div>
                      <span className="font-medium">{stats.projects.active}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                        <span className="text-muted-foreground">Paused</span>
                      </div>
                      <span className="font-medium">{stats.projects.paused}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <span className="text-muted-foreground">Completed</span>
                      </div>
                      <span className="font-medium">{stats.projects.completed}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Health / Status */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-green-500" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: "API Status", status: "Operational" },
                      { label: "Database", status: "Connected" },
                      { label: "Storage", status: "Available" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{item.label}</span>
                        <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span className="font-medium text-xs">{item.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}