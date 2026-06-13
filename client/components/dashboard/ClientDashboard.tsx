"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Building2,
  FileText,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Truck,
  Users,
  Eye,
  MessageSquare,
  Send,
  Phone,
  Mail,
  User,
  X,
} from "lucide-react"

// UI Imports
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

// Actions
import { fetchMyProjects, notifyProjectContractors } from "@/app/actions/projects/main"
import { getSession } from "@/lib/sessionAction"

interface ContractorUser {
  id: string
  name: string
  email: string
  phone?: string
}

interface Contractor {
  id: string
  name: string
  phone?: string
  type: string
  contractorUsers: ContractorUser[]
}

interface ProjectContractor {
  contractor: Contractor
}

interface Project {
  id: string
  name: string
  code: string
  location?: string
  status: string
  progress: number
  nextMilestone?: string
  milestoneDate?: string
  startDate?: string
  endDate?: string
  contractors?: ProjectContractor[]
  _count?: {
    drawings: number
    contractors: number
    members: number
  }
}

interface DashboardStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  averageProgress: number
  upcomingMilestones: number
}

// Progress ring component for visual appeal
const ProgressRing = ({ progress, size = 120 }: { progress: number; size?: number }) => {
  const radius = (size - 12) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (Number(progress || 0) / 100) * circumference
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" style={{ width: size, height: size }}>
        <circle
          className="text-muted stroke-current"
          strokeWidth="8"
          fill="none"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-primary stroke-current transition-all duration-500 ease-out"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold">{Number(progress).toFixed(0)}%</span>
      </div>
    </div>
  )
}

// Greeting component
const ClientGreeting = ({ username }: { username: string }) => {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
  
  return (
    <div className="flex flex-col space-y-1">
      <h2 className="text-2xl font-bold tracking-tight">{greeting}, {username || "Valued Client"}</h2>
      <p className="text-muted-foreground">
        Here's an overview of your construction projects.
      </p>
    </div>
  )
}

// Stat card component
const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  description,
  loading 
}: { 
  title: string
  value: number | string
  icon: React.ComponentType<any>
  description?: string
  loading?: boolean
}) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32 mt-2" />
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="mt-2">
          <h3 className="text-2xl font-bold">{value}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Project progress card with messaging
const ProjectProgressCard = ({ 
  project, 
  onClick,
  onMessage
}: { 
  project: Project
  onClick: () => void
  onMessage: () => void
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500'
      case 'PAUSED': return 'bg-yellow-500'
      case 'COMPLETED': return 'bg-blue-500'
      case 'CANCELLED': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default'
      case 'PAUSED': return 'secondary'
      case 'COMPLETED': return 'outline'
      case 'CANCELLED': return 'destructive'
      default: return 'default'
    }
  }
  
  return (
    <Card className="hover:shadow-lg transition-all duration-300 group overflow-hidden">
      {/* Progress bar at top */}
      <div className="h-1.5 bg-muted">
        <div 
          className={`h-full ${getStatusColor(project.status)} transition-all duration-500`}
          style={{ width: `${project.progress || 0}%` }}
        />
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
              {project.name}
            </CardTitle>
            <CardDescription className="truncate">{project.code}</CardDescription>
          </div>
          <Badge variant={getStatusBadge(project.status) as any} className="shrink-0">
            {project.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{Number(project.progress || 0).toFixed(1)}%</span>
          </div>
          <Progress value={Number(project.progress || 0)} className="h-2" />
        </div>
        
        {/* Next milestone */}
        {project.nextMilestone && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Next Milestone</p>
              <p className="text-sm font-medium truncate">{project.nextMilestone}</p>
              {project.milestoneDate && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(project.milestoneDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Stats row */}
        <div className="flex items-center gap-4 pt-2 border-t">
          {project._count && (
            <>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                <span>{project._count.drawings} drawings</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>{project._count.contractors} contractors</span>
              </div>
            </>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 gap-2"
            onClick={onClick}
          >
            <Eye className="h-4 w-4" />
            View
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1 gap-2"
            onClick={(e) => {
              e.stopPropagation()
              onMessage()
            }}
          >
            <MessageSquare className="h-4 w-4" />
            Message
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Messaging Panel Component
const MessagingPanel = ({ 
  projects,
  isOpen,
  onClose 
}: { 
  projects: Project[]
  isOpen: boolean
  onClose: () => void
}) => {
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [messageTitle, setMessageTitle] = useState("")
  const [messageBody, setMessageBody] = useState("")
  const [sending, setSending] = useState(false)

  const selectedProjectData = projects.find(p => p.id === selectedProject)
  const contractors = selectedProjectData?.contractors || []

  const handleSendMessage = async () => {
    if (!selectedProject || !messageTitle || !messageBody) {
      toast.error("Please fill in all fields")
      return
    }

    setSending(true)
    try {
      const result = await notifyProjectContractors(selectedProject, messageTitle, messageBody)
      if (result.success) {
        toast.success(`Message sent to ${result.notifiedCount} contractor(s)`)
        setMessageTitle("")
        setMessageBody("")
        onClose()
      } else {
        toast.error(result.message || "Failed to send message")
      }
    } catch (error: any) {
      console.error("Error sending message:", error)
      toast.error(error.message || "Failed to send message")
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Contact Contractors
          </DialogTitle>
          <DialogDescription>
            Send a message to all contractors working on your project. They will receive a push notification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="project">Select Project</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a project..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{project.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {project._count?.contractors || 0} contractors
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contractors List */}
          {selectedProject && contractors.length > 0 && (
            <div className="space-y-2">
              <Label>Contractors on this project</Label>
              <div className="grid gap-2 max-h-40 overflow-y-auto">
                {contractors.map((pc) => (
                  <div 
                    key={pc.contractor.id} 
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{pc.contractor.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                          {pc.contractor.type}
                        </Badge>
                        {pc.contractor.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {pc.contractor.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedProject && contractors.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No contractors assigned to this project yet.</p>
            </div>
          )}

          {/* Message Form */}
          {selectedProject && contractors.length > 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">Message Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Schedule Update Required"
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Enter your message to the contractors..."
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  rows={4}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendMessage} 
            disabled={sending || !selectedProject || !messageTitle || !messageBody || contractors.length === 0}
          >
            {sending ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Notification
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ClientDashboard() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [userInfo, setUserInfo] = useState({ username: "", isLoading: true })
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    averageProgress: 0,
    upcomingMilestones: 0,
  })
  const [messagingOpen, setMessagingOpen] = useState(false)
  const [selectedProjectForMessage, setSelectedProjectForMessage] = useState<string>("")

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      // Get user session
      const session = await getSession()
      setUserInfo({ 
        username: session.name || session.username || "", 
        isLoading: false 
      })
      
      // Fetch projects assigned to this client
      const projectsData = await fetchMyProjects()
      
      // Ensure projectsData is an array before processing
      if (Array.isArray(projectsData)) {
        setProjects(projectsData)
        
        // Calculate stats
        const activeProjects = projectsData.filter((p: Project) => p.status === 'ACTIVE').length
        const completedProjects = projectsData.filter((p: Project) => p.status === 'COMPLETED').length
        const totalProgress = projectsData.reduce((acc: number, p: Project) => acc + (Number(p.progress) || 0), 0)
        const avgProgress = projectsData.length > 0 ? totalProgress / projectsData.length : 0
        const milestonesCount = projectsData.filter((p: Project) => p.nextMilestone).length
        
        setStats({
          totalProjects: projectsData.length,
          activeProjects,
          completedProjects,
          averageProgress: avgProgress,
          upcomingMilestones: milestonesCount,
        })
      } else {
        console.error("Projects data is not an array:", projectsData)
        setProjects([])
      }
    } catch (error: any) {
      console.error("Failed to load client dashboard:", error)
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      toast.error(`Failed to load dashboard: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenMessage = (projectId?: string) => {
    if (projectId) {
      setSelectedProjectForMessage(projectId)
    }
    setMessagingOpen(true)
  }

  return (
    <div className="bg-muted/30 min-h-screen">
      {/* Header */}
      <header className="hidden md:flex h-16 shrink-0 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-6 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="-ml-2" />
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center text-sm font-medium text-muted-foreground">
            <Building2 className="mr-2 h-4 w-4" />
            <span>Client Dashboard</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleOpenMessage()}
            className="gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Contact Contractors
          </Button>
          <AnimatedThemeToggler className="h-9 w-9" />
        </div>
      </header>

      <main className="flex-1 p-6 space-y-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
        
        {/* Greeting Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <ClientGreeting username={userInfo.username} />
          <div className="flex gap-2 items-center">
            <Button 
              variant="default" 
              size="sm"
              onClick={() => handleOpenMessage()}
              className="gap-2 md:hidden"
            >
              <MessageSquare className="h-4 w-4" />
              Contact Contractors
            </Button>
            <div className="flex text-sm text-muted-foreground items-center gap-2 bg-background/50 px-3 py-1 rounded-full border">
              <Calendar className="h-3.5 w-3.5" />
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="My Projects"
            value={stats.totalProjects}
            icon={Building2}
            description="Total projects assigned"
            loading={loading}
          />
          <StatCard
            title="Active Projects"
            value={stats.activeProjects}
            icon={TrendingUp}
            description="Currently in progress"
            loading={loading}
          />
          <StatCard
            title="Completed"
            value={stats.completedProjects}
            icon={CheckCircle2}
            description="Successfully delivered"
            loading={loading}
          />
          <StatCard
            title="Avg. Progress"
            value={`${Number(stats.averageProgress).toFixed(0)}%`}
            icon={TrendingUp}
            description="Across all projects"
            loading={loading}
          />
        </div>

        {/* Projects Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Your Projects</h2>
              <p className="text-sm text-muted-foreground">
                Track the progress of your construction projects
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/projects" className="gap-1">
                View All <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center h-72 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
                <p className="text-muted-foreground max-w-sm">
                  You haven't been assigned to any projects yet. Contact your project manager for access.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <ProjectProgressCard
                  key={project.id}
                  project={project}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  onMessage={() => {
                    setSelectedProjectForMessage(project.id)
                    setMessagingOpen(true)
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Overall Progress Overview for clients with multiple projects */}
        {projects.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Overall Progress Overview
              </CardTitle>
              <CardDescription>
                Summary of all your construction projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Progress ring */}
                <div className="flex flex-col items-center">
                  <ProgressRing progress={stats.averageProgress} size={140} />
                  <p className="text-sm text-muted-foreground mt-2">Average Completion</p>
                </div>
                
                {/* Project breakdown */}
                <div className="flex-1 grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats.activeProjects}</p>
                      <p className="text-sm text-muted-foreground">Active Projects</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-500/10">
                    <Building2 className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats.completedProjects}</p>
                      <p className="text-sm text-muted-foreground">Completed Projects</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-purple-500/10">
                    <Clock className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats.upcomingMilestones}</p>
                      <p className="text-sm text-muted-foreground">Upcoming Milestones</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-orange-500/10">
                    <Truck className="h-8 w-8 text-orange-600" />
                    <div>
                      <p className="text-2xl font-bold">{projects.reduce((acc, p) => acc + (p._count?.contractors || 0), 0)}</p>
                      <p className="text-sm text-muted-foreground">Total Contractors</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Messaging Panel */}
      <MessagingPanel 
        projects={projects}
        isOpen={messagingOpen}
        onClose={() => {
          setMessagingOpen(false)
          setSelectedProjectForMessage("")
        }}
      />
    </div>
  )
}
