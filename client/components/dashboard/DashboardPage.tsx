"use client"

import type React from "react"
import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import {
  Building2,
  Users,
  HardHat,
  FileText,
  Plus,
  ArrowUpRight,
  Search,
  LucideIcon,
  MoreHorizontal,
  Calendar,
  Hammer,
  FileUp
} from "lucide-react"

// UI Imports
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"


// Custom Components
import { ProjectStatusChart } from "@/components/project-status-chart"

// Actions & Types
import { fetchProjects } from "@/app/actions/projects/main"
import { fetchContractors } from "@/app/actions/contractors/main"
import { fetchLabours } from "@/app/actions/labours/main"
import { fetchDrawings } from "@/app/actions/drawings/main"
import { Project, ProjectStats, DashboardStats } from "@/types/dashboard"
import { ChartConfig } from "../ui/chart"

// --- Configuration ---

const chartConfig = {
  active: { label: "Active", color: "var(--chart-2)" },
  paused: { label: "Paused", color: "var(--chart-4)" },
  completed: { label: "Completed", color: "var(--chart-1)" },
  planning: { label: "Planning", color: "var(--chart-3)" },
} satisfies ChartConfig

// --- Helper Components ---

const Greeting = () => {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
  return (
    <div className="flex flex-col space-y-1">
      <h2 className="text-2xl font-bold tracking-tight">{greeting}, Engineer</h2>
      <p className="text-muted-foreground">Here is what&apos;s happening on your sites today.</p>
    </div>
  )
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  loading,
  className,
  iconColor
}: {
  title: string
  value: number
  icon: LucideIcon
  trend: string
  trendUp?: boolean
  loading?: boolean
  className?: string
  iconColor?: string
}) => {
  return (
    <Card className={`overflow-hidden transition-all duration-200 hover:shadow-md ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center transition-colors duration-300 ${iconColor || "bg-primary/10 text-primary"}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-500">
                {value.toLocaleString()}
            </div>
            <p className={`text-xs flex items-center gap-1 font-medium ${trendUp ? 'text-emerald-600' : 'text-muted-foreground'}`}>
              {trendUp ? <ArrowUpRight className="h-3 w-3" /> : null}
              {trend}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, string> = {
    ACTIVE: "bg-emerald-500/15 text-emerald-700 border-emerald-200 hover:bg-emerald-500/25 dark:text-emerald-400 dark:border-emerald-800",
    PAUSED: "bg-amber-500/15 text-amber-700 border-amber-200 hover:bg-amber-500/25 dark:text-amber-400 dark:border-amber-800",
    COMPLETED: "bg-blue-500/15 text-blue-700 border-blue-200 hover:bg-blue-500/25 dark:text-blue-400 dark:border-blue-800",
    PLANNING: "bg-violet-500/15 text-violet-700 border-violet-200 hover:bg-violet-500/25 dark:text-violet-400 dark:border-violet-800",
  }

  const defaultStyle = "bg-slate-100 text-slate-700 border-slate-200"
  
  return (
    <Badge variant="outline" className={`font-medium border ${variants[status] || defaultStyle}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  )
}

// --- Main Page ---

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
    async function loadData() {
      try {
        const [projects, contractors, labours, drawings] = await Promise.all([
          fetchProjects(),
          fetchContractors(),
          fetchLabours(),
          fetchDrawings(),
        ])

        const projectStats = (projects as Project[]).reduce(
          (acc, project) => {
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
        console.error("Dashboard Error:", error)
        setStats((prev) => ({ ...prev, loading: false }))
      }
    }
    loadData()
  }, [])

  const chartData = useMemo(() => [
    { status: "active", visitors: stats.projects.active, fill: "oklch(0.55 0.15 250)" },
    { status: "paused", visitors: stats.projects.paused, fill: "oklch(0.70 0.15 40)" },
    { status: "completed", visitors: stats.projects.completed, fill: "oklch(0.90 0.18 95)" },
    { status: "planning", visitors: stats.projects.total - stats.projects.active - stats.projects.paused - stats.projects.completed, fill: "oklch(0.65 0 0)" },
  ], [stats])

  const totalProjects = stats.projects.total

  return (
    <div className="bg-muted/30">
      
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-6 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="-ml-2" />
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center text-sm font-medium text-muted-foreground">
              <Building2 className="mr-2 h-4 w-4" />
              <span>Civil Desk</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-64 pl-9 h-9 bg-muted/40 border-none shadow-none focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <Button size="sm" className="h-9 gap-1 shadow-sm">
              <Link href="/projects/new" className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only">Create Project</span>
              </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
          
          {/* 1. Greeting Section */}
          <div className="flex items-end justify-between">
              <Greeting />
              <div className="hidden sm:flex text-sm text-muted-foreground items-center gap-2 bg-background/50 px-3 py-1 rounded-full border">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
          </div>

          {/* 2. Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Projects"
              value={stats.projects.total}
              icon={Building2}
              trend="Projects"
              trendUp={true}
              loading={stats.loading}
              iconColor="bg-blue-500/10 text-blue-600"
            />
            <StatCard
              title="Active Contractors"
              value={stats.contractors}
              icon={Users}
              trend="Verified partners"
              loading={stats.loading}
              iconColor="bg-violet-500/10 text-violet-600"
            />
            <StatCard
              title="Total Workforce"
              value={stats.labours}
              icon={HardHat}
              trend="On-site staff"
              loading={stats.loading}
              iconColor="bg-amber-500/10 text-amber-600"
            />
            <StatCard
              title="Blueprints"
              value={stats.drawings}
              icon={FileText}
              trend="Documents stored"
              loading={stats.loading}
              iconColor="bg-emerald-500/10 text-emerald-600"
            />
          </div>

          {/* 3. Main Layout Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Left Column: Recent Projects (Span 2) */}
              <div className="xl:col-span-2 space-y-6">
                  <Card className="h-full border shadow-sm">
                      <CardHeader className="flex flex-row items-center justify-between pb-4">
                          <div>
                              <CardTitle className="text-lg">Recent Projects</CardTitle>
                              <CardDescription>Overview of your latest construction sites.</CardDescription>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                              <Link href="/projects" className="text-xs h-8 gap-1">
                                  View All <ArrowUpRight className="h-3.5 w-3.5" />
                              </Link>
                          </Button>
                      </CardHeader>
                      <CardContent className="p-0">
                          {stats.loading ? (
                              <div className="p-6 space-y-4">
                                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
                              </div>
                          ) : (stats.recentProjects?.length ?? 0) === 0 ? (
                              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground bg-muted/10">
                                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                      <Building2 className="h-6 w-6 opacity-40" />
                                  </div>
                                  <p className="font-medium text-sm">No projects created yet</p>
                                  <Button variant="link" asChild className="mt-2">
                                      <Link href="/projects/new">Create your first project</Link>
                                  </Button>
                              </div>
                          ) : (
                              <Table>
                                  <TableHeader>
                                      <TableRow className="hover:bg-transparent">
                                          <TableHead className="w-[250px] pl-6">Project Name</TableHead>
                                          <TableHead>Location</TableHead>
                                          <TableHead>Status</TableHead>
                                          <TableHead className="text-right pr-6">Actions</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {(stats.recentProjects ?? []).map((project) => (
                                          <TableRow key={project.id} className="group cursor-pointer hover:bg-muted/40">
                                              <TableCell className="pl-6 font-medium">
                                                  <div className="flex items-center gap-3">
                                                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                                                          <Building2 className="h-4 w-4" />
                                                      </div>
                                                      <Link href={`/projects/${project.id}`} className="hover:underline underline-offset-4 decoration-muted-foreground/50">
                                                          {project.name || "Untitled Project"}
                                                      </Link>
                                                  </div>
                                              </TableCell>
                                              <TableCell className="text-muted-foreground text-sm">
                                                  {project.location || "No location"}
                                              </TableCell>
                                              <TableCell>
                                                  <StatusBadge status={project.status || "PLANNING"} />
                                              </TableCell>
                                              <TableCell className="text-right pr-6">
                                                  <DropdownMenu>
                                                      <DropdownMenuTrigger asChild>
                                                          <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                              <span className="sr-only">Open menu</span>
                                                              <MoreHorizontal className="h-4 w-4" />
                                                          </Button>
                                                      </DropdownMenuTrigger>
                                                      <DropdownMenuContent align="end">
                                                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                          <DropdownMenuItem asChild>
                                                              <Link href={`/projects/${project.id}`}>View Details</Link>
                                                          </DropdownMenuItem>
                                                          <DropdownMenuItem>Edit Project</DropdownMenuItem>
                                                      </DropdownMenuContent>
                                                  </DropdownMenu>
                                              </TableCell>
                                          </TableRow>
                                      ))}
                                  </TableBody>
                              </Table>
                          )}
                      </CardContent>
                  </Card>
              </div>

              {/* Right Column: Analytics & Quick Actions (Span 1) */}
              <div className="flex flex-col gap-6">
                  
                  {/* Project Status Donut Chart */}
                  <ProjectStatusChart
                    data={chartData}
                    config={chartConfig}
                    totalProjects={totalProjects}
                    activeProjects={stats.projects.active}
                  />

                  {/* Quick Actions Widget */}
                  <Card className="border shadow-sm">
                      <CardHeader className="pb-3">
                          <CardTitle className="text-base">Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-2">
                           <Button variant="outline" className="w-full justify-start h-10 gap-2" asChild>
                              <Link href="/contractors/new">
                                  <Users className="h-4 w-4 text-violet-500" />
                                  <span>Register Contractor</span>
                              </Link>
                           </Button>
                           <Button variant="outline" className="w-full justify-start h-10 gap-2" asChild>
                              <Link href="/labours/new">
                                  <HardHat className="h-4 w-4 text-amber-500" />
                                  <span>Add Labour</span>
                              </Link>
                           </Button>
                           <Button variant="outline" className="w-full justify-start h-10 gap-2" asChild>
                              <Link href="/materials/new">
                                  <Hammer className="h-4 w-4 text-blue-500" />
                                  <span>Request Material</span>
                              </Link>
                           </Button>
                           <Button variant="outline" className="w-full justify-start h-10 gap-2" asChild>
                              <Link href="/drawings/upload">
                                  <FileUp className="h-4 w-4 text-emerald-500" />
                                  <span>Upload Drawing</span>
                              </Link>
                           </Button>
                      </CardContent>
                  </Card>
              </div>
          </div>
      </main>
    </div>
  )
}