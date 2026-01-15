"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  fetchProjectQCIssues,
  fetchQCStats,
  createQCIssue,
  assignContractor,
  contractorUpdateQC,
  verifyQCIssue,
  closeQCIssue,
  rejectQCIssue,
  deleteQCIssue,
  type QCIssue,
  type QCType,
  type NCRStatus,
  type QCPriority,
  type QCStats,
} from "@/app/actions/quality-control/main"
import { fetchContractors } from "@/app/actions/contractors/main"
import { fetchProjectTasks } from "@/app/actions/tasks/main"
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  X,
  Shield,
  Wrench,
  Bug,
  HardHat,
  MapPin,
  Calendar,
  User,
  Building,
  ArrowRight,
  AlertCircle,
  XCircle,
  PlayCircle,
  Eye,
  Trash2,
} from "lucide-react"
import Loader from "../ui/loader"

interface QCManagementProps {
  projectId: string
}

// Status configuration with colors and icons
const statusConfig: Record<NCRStatus, { label: string; color: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType; bgClass: string }> = {
  OPEN: { label: "Open", color: "destructive", icon: AlertCircle, bgClass: "bg-red-50 dark:bg-red-950/20" },
  ASSIGNED: { label: "Assigned", color: "default", icon: User, bgClass: "bg-blue-50 dark:bg-blue-950/20" },
  IN_PROGRESS: { label: "In Progress", color: "default", icon: PlayCircle, bgClass: "bg-yellow-50 dark:bg-yellow-950/20" },
  FIXED: { label: "Fixed", color: "secondary", icon: Wrench, bgClass: "bg-purple-50 dark:bg-purple-950/20" },
  VERIFIED: { label: "Verified", color: "outline", icon: Eye, bgClass: "bg-green-50 dark:bg-green-950/20" },
  CLOSED: { label: "Closed", color: "outline", icon: CheckCircle, bgClass: "bg-gray-50 dark:bg-gray-950/20" },
  REJECTED: { label: "Rejected", color: "destructive", icon: XCircle, bgClass: "bg-red-50 dark:bg-red-950/20" },
}

const typeConfig: Record<QCType, { label: string; icon: React.ElementType; color: string }> = {
  QUALITY: { label: "Quality Issue", icon: AlertTriangle, color: "text-orange-600" },
  SAFETY: { label: "Safety Issue", icon: HardHat, color: "text-red-600" },
  DEFECT: { label: "Defect/Snag", icon: Bug, color: "text-purple-600" },
  REWORK: { label: "Rework Required", icon: Wrench, color: "text-blue-600" },
}

const priorityConfig: Record<QCPriority, { label: string; color: "default" | "secondary" | "destructive" | "outline" }> = {
  LOW: { label: "Low", color: "secondary" },
  MEDIUM: { label: "Medium", color: "default" },
  HIGH: { label: "High", color: "destructive" },
  CRITICAL: { label: "Critical", color: "destructive" },
}

export function QCManagement({ projectId }: QCManagementProps) {
  const [issues, setIssues] = useState<QCIssue[]>([])
  const [stats, setStats] = useState<QCStats | null>(null)
  const [contractors, setContractors] = useState<Array<{ id: string; name: string; type: string }>>([])
  const [tasks, setTasks] = useState<Array<{ id: string; title: string; category?: string }>>([])
  const [loading, setLoading] = useState(true)
  const [selectedIssue, setSelectedIssue] = useState<QCIssue | null>(null)
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"contractor-update" | "verify" | "close" | "reject" | null>(null)
  
  // Form states
  const [submitting, setSubmitting] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    type: "QUALITY" as QCType,
    title: "",
    description: "",
    priority: "MEDIUM" as QCPriority,
    taskId: "",
    location: "",
    dueDate: "",
  })
  const [assignFormData, setAssignFormData] = useState({
    contractorId: "",
    dueDate: "",
    notes: "",
  })
  const [actionFormData, setActionFormData] = useState({
    status: "" as "IN_PROGRESS" | "FIXED",
    approved: true,
    notes: "",
  })

  // Filters
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const loadData = useCallback(async () => {
    try {
      const [issuesData, statsData, contractorsData, tasksData] = await Promise.all([
        fetchProjectQCIssues(projectId),
        fetchQCStats(projectId),
        fetchContractors().catch(() => []),
        fetchProjectTasks(projectId).catch(() => []),
      ])
      setIssues(issuesData)
      setStats(statsData)
      setContractors(contractorsData)
      setTasks(tasksData)
    } catch (error) {
      console.error("Error loading QC data:", error)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredIssues = useMemo(() => {
    let filtered = issues

    if (filterType !== "all") {
      filtered = filtered.filter(issue => issue.type === filterType)
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(issue => issue.status === filterStatus)
    }

    if (filterPriority !== "all") {
      filtered = filtered.filter(issue => issue.priority === filterPriority)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(issue =>
        issue.title.toLowerCase().includes(query) ||
        issue.description?.toLowerCase().includes(query) ||
        issue.location?.toLowerCase().includes(query) ||
        issue.contractor?.name.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [issues, filterType, filterStatus, filterPriority, searchQuery])

  async function handleCreateIssue(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createQCIssue({
        projectId,
        type: createFormData.type,
        title: createFormData.title,
        description: createFormData.description || undefined,
        priority: createFormData.priority,
        taskId: createFormData.taskId || undefined,
        location: createFormData.location || undefined,
        dueDate: createFormData.dueDate || undefined,
      })
      setCreateDialogOpen(false)
      setCreateFormData({
        type: "QUALITY",
        title: "",
        description: "",
        priority: "MEDIUM",
        taskId: "",
        location: "",
        dueDate: "",
      })
      await loadData()
    } catch (error) {
      console.error("Error creating QC issue:", error)
      alert("Failed to create QC issue")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAssignContractor(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedIssue) return
    setSubmitting(true)
    try {
      await assignContractor(selectedIssue.id, {
        contractorId: assignFormData.contractorId,
        dueDate: assignFormData.dueDate || undefined,
        notes: assignFormData.notes || undefined,
      })
      setAssignDialogOpen(false)
      setAssignFormData({ contractorId: "", dueDate: "", notes: "" })
      setSelectedIssue(null)
      await loadData()
    } catch (error) {
      console.error("Error assigning contractor:", error)
      alert("Failed to assign contractor")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAction(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedIssue || !actionType) return
    setSubmitting(true)
    try {
      switch (actionType) {
        case "contractor-update":
          await contractorUpdateQC(selectedIssue.id, {
            status: actionFormData.status,
            notes: actionFormData.notes || undefined,
          })
          break
        case "verify":
          await verifyQCIssue(selectedIssue.id, {
            approved: actionFormData.approved,
            notes: actionFormData.notes || undefined,
          })
          break
        case "close":
          await closeQCIssue(selectedIssue.id, {
            approved: actionFormData.approved,
            notes: actionFormData.notes || undefined,
          })
          break
        case "reject":
          await rejectQCIssue(selectedIssue.id, {
            notes: actionFormData.notes,
          })
          break
      }
      setActionDialogOpen(false)
      setActionFormData({ status: "IN_PROGRESS", approved: true, notes: "" })
      setActionType(null)
      setSelectedIssue(null)
      await loadData()
    } catch (error) {
      console.error(`Error performing ${actionType}:`, error)
      alert(`Failed to ${actionType}`)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(issueId: string) {
    if (!confirm("Are you sure you want to delete this QC issue?")) return
    try {
      await deleteQCIssue(issueId)
      await loadData()
    } catch (error) {
      console.error("Error deleting QC issue:", error)
      alert("Failed to delete QC issue")
    }
  }

  function openActionDialog(issue: QCIssue, type: "contractor-update" | "verify" | "close" | "reject") {
    setSelectedIssue(issue)
    setActionType(type)
    setActionFormData({
      status: "IN_PROGRESS",
      approved: true,
      notes: "",
    })
    setActionDialogOpen(true)
  }

  function getAvailableActions(issue: QCIssue) {
    const actions: Array<{ label: string; action: () => void; variant?: "default" | "outline" | "destructive" }> = []

    switch (issue.status) {
      case "OPEN":
        actions.push({
          label: "Assign Contractor",
          action: () => {
            setSelectedIssue(issue)
            setAssignDialogOpen(true)
          },
        })
        actions.push({
          label: "Reject",
          action: () => openActionDialog(issue, "reject"),
          variant: "destructive",
        })
        break
      case "ASSIGNED":
        actions.push({
          label: "Start Work",
          action: () => {
            setSelectedIssue(issue)
            setActionFormData({
              ...actionFormData,
              status: "IN_PROGRESS",
            })
            setActionType("contractor-update")
            setActionDialogOpen(true)
          },
        })
        actions.push({
          label: "Mark as Fixed",
          action: () => {
            setSelectedIssue(issue)
            setActionFormData({
              ...actionFormData,
              status: "FIXED",
            })
            setActionType("contractor-update")
            setActionDialogOpen(true)
          },
        })
        break
      case "IN_PROGRESS":
        actions.push({
          label: "Mark as Fixed",
          action: () => {
            setSelectedIssue(issue)
            setActionFormData({
              ...actionFormData,
              status: "FIXED",
            })
            setActionType("contractor-update")
            setActionDialogOpen(true)
          },
        })
        break
      case "FIXED":
        actions.push({
          label: "Verify Fix",
          action: () => openActionDialog(issue, "verify"),
        })
        actions.push({
          label: "Reject Fix",
          action: () => {
            setSelectedIssue(issue)
            setActionFormData({ ...actionFormData, approved: false })
            setActionType("verify")
            setActionDialogOpen(true)
          },
          variant: "outline",
        })
        break
      case "VERIFIED":
        actions.push({
          label: "Close NCR",
          action: () => openActionDialog(issue, "close"),
        })
        actions.push({
          label: "Return for Rework",
          action: () => {
            setSelectedIssue(issue)
            setActionFormData({ ...actionFormData, approved: false })
            setActionType("close")
            setActionDialogOpen(true)
          },
          variant: "outline",
        })
        break
      case "REJECTED":
        actions.push({
          label: "Reopen",
          action: () => {
            setSelectedIssue(issue)
            setAssignDialogOpen(true)
          },
        })
        break
    }

    return actions
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <Loader/>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open Issues</p>
                  <p className="text-2xl font-bold text-red-600">{stats.openIssues}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.overdueIssues}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Safety Issues</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.byType.find(t => t.type === "SAFETY")?.count || 0}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Issues</p>
                  <p className="text-2xl font-bold">{issues.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-gray-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Create Button */}
      <div className="flex flex-col gap-3 p-4 bg-card border rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="font-semibold">Quality Control / NCR Issues</h3>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create NCR
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-1">
            <Label htmlFor="search" className="text-xs font-medium mb-2 block">
              Search
            </Label>
            <div className="relative">
              <Input
                id="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-8 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium mb-2 block">Type</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(typeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-medium mb-2 block">Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-medium mb-2 block">Priority</Label>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterType("all")
                setFilterStatus("all")
                setFilterPriority("all")
                setSearchQuery("")
              }}
              className="w-full text-sm"
            >
              Reset
            </Button>
          </div>
        </div>

        {(filterType !== "all" || filterStatus !== "all" || filterPriority !== "all" || searchQuery) && (
          <div className="text-xs text-muted-foreground">
            Showing {filteredIssues.length} of {issues.length} issues
          </div>
        )}
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-2">
            <CheckCircle className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No QC issues found</p>
            <Button variant="ghost" size="sm" onClick={() => setCreateDialogOpen(true)}>
              Create your first NCR
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredIssues.map((issue) => {
            const statusInfo = statusConfig[issue.status]
            const typeInfo = typeConfig[issue.type]
            const priorityInfo = priorityConfig[issue.priority]
            const StatusIcon = statusInfo.icon
            const TypeIcon = typeInfo.icon
            const availableActions = getAvailableActions(issue)
            const isOverdue = issue.dueDate && new Date(issue.dueDate) < new Date() && issue.status !== "CLOSED"

            return (
              <Card
                key={issue.id}
                className={`border-0 shadow-md hover:shadow-lg transition-shadow ${statusInfo.bgClass}`}
              >
                <CardContent className="pt-4">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <TypeIcon className={`h-5 w-5 ${typeInfo.color}`} />
                        <h4 className="font-semibold text-base truncate">{issue.title}</h4>
                        <Badge variant={statusInfo.color} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                        <Badge variant={priorityInfo.color}>{priorityInfo.label}</Badge>
                        {isOverdue && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Overdue
                          </Badge>
                        )}
                      </div>

                      {issue.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {issue.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        {issue.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{issue.location}</span>
                          </div>
                        )}
                        {issue.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(issue.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {issue.creator && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>Created by {issue.creator.name}</span>
                          </div>
                        )}
                        {issue.contractor && (
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            <span>{issue.contractor.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Status Flow */}
                      {issue.status !== "CLOSED" && issue.status !== "REJECTED" && (
                        <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="font-medium">Flow:</span>
                          {["OPEN", "ASSIGNED", "IN_PROGRESS", "FIXED", "VERIFIED", "CLOSED"].map((status, idx, arr) => (
                            <span key={status} className="flex items-center gap-1">
                              <span className={issue.status === status ? "font-bold text-primary" : ""}>
                                {statusConfig[status as NCRStatus].label}
                              </span>
                              {idx < arr.length - 1 && <ArrowRight className="h-3 w-3" />}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
                      {availableActions.map((action, idx) => (
                        <Button
                          key={idx}
                          variant={action.variant || "default"}
                          size="sm"
                          onClick={action.action}
                        >
                          {action.label}
                        </Button>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedIssue(issue)
                          setDetailDialogOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      {(issue.status === "OPEN" || issue.status === "REJECTED") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(issue.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create NCR Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleCreateIssue}>
            <DialogHeader>
              <DialogTitle>Create NCR / QC Issue</DialogTitle>
              <DialogDescription>
                Report a quality, safety, or defect issue
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={createFormData.type}
                    onValueChange={(v) => setCreateFormData({ ...createFormData, type: v as QCType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={createFormData.priority}
                    onValueChange={(v) => setCreateFormData({ ...createFormData, priority: v as QCPriority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={createFormData.title}
                  onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
                  placeholder="Brief description of the issue"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                  placeholder="Detailed description of the issue..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={createFormData.location}
                    onChange={(e) => setCreateFormData({ ...createFormData, location: e.target.value })}
                    placeholder="e.g., Slab 1, Level 2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={createFormData.dueDate}
                    onChange={(e) => setCreateFormData({ ...createFormData, dueDate: e.target.value })}
                  />
                </div>
              </div>

              {tasks.length > 0 && (
                <div className="grid gap-2">
                  <Label htmlFor="taskId">Related Task</Label>
                  <Select
                    value={createFormData.taskId || "none"}
                    onValueChange={(v) => setCreateFormData({ ...createFormData, taskId: v === "none" ? "" : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a task (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {tasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>{task.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create NCR"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Contractor Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleAssignContractor}>
            <DialogHeader>
              <DialogTitle>Assign Contractor</DialogTitle>
              <DialogDescription>
                Assign a contractor to resolve: {selectedIssue?.title}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="contractor">Contractor *</Label>
                <Select
                  value={assignFormData.contractorId}
                  onValueChange={(v) => setAssignFormData({ ...assignFormData, contractorId: v })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select contractor" />
                  </SelectTrigger>
                  <SelectContent>
                    {contractors.map((contractor) => (
                      <SelectItem key={contractor.id} value={contractor.id}>
                        {contractor.name} ({contractor.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="assignDueDate">Due Date</Label>
                <Input
                  id="assignDueDate"
                  type="date"
                  value={assignFormData.dueDate}
                  onChange={(e) => setAssignFormData({ ...assignFormData, dueDate: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="assignNotes">Notes</Label>
                <Textarea
                  id="assignNotes"
                  value={assignFormData.notes}
                  onChange={(e) => setAssignFormData({ ...assignFormData, notes: e.target.value })}
                  placeholder="Instructions for the contractor..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !assignFormData.contractorId}>
                {submitting ? "Assigning..." : "Assign Contractor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Action Dialog (Contractor Update, Verify, Close, Reject) */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleAction}>
            <DialogHeader>
              <DialogTitle>
                {actionType === "contractor-update" && "Update Status"}
                {actionType === "verify" && (actionFormData.approved ? "Verify Fix" : "Reject Fix")}
                {actionType === "close" && (actionFormData.approved ? "Close NCR" : "Return for Rework")}
                {actionType === "reject" && "Reject NCR"}
              </DialogTitle>
              <DialogDescription>
                {selectedIssue?.title}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {actionType === "contractor-update" && (
                <div className="grid gap-2">
                  <Label>Update Status To</Label>
                  <Select
                    value={actionFormData.status}
                    onValueChange={(v) => setActionFormData({ ...actionFormData, status: v as "IN_PROGRESS" | "FIXED" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="FIXED">Fixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="actionNotes">Notes {actionType === "reject" && "*"}</Label>
                <Textarea
                  id="actionNotes"
                  value={actionFormData.notes}
                  onChange={(e) => setActionFormData({ ...actionFormData, notes: e.target.value })}
                  placeholder={
                    actionType === "contractor-update" ? "Describe work done..." :
                    actionType === "verify" ? "Verification notes..." :
                    actionType === "close" ? "Closure notes..." :
                    "Reason for rejection..."
                  }
                  rows={3}
                  required={actionType === "reject"}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setActionDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || (actionType === "reject" && !actionFormData.notes)}
                variant={actionType === "reject" || !actionFormData.approved ? "destructive" : "default"}
              >
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail View Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedIssue && (
                <>
                  {(() => {
                    const TypeIcon = typeConfig[selectedIssue.type].icon
                    return <TypeIcon className={`h-5 w-5 ${typeConfig[selectedIssue.type].color}`} />
                  })()}
                  {selectedIssue.title}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              NCR Details and Activity Log
            </DialogDescription>
          </DialogHeader>

          {selectedIssue && (
            <div className="space-y-4">
              {/* Status and Priority */}
              <div className="flex flex-wrap gap-2">
                <Badge variant={statusConfig[selectedIssue.status].color} className="gap-1">
                  {(() => {
                    const StatusIcon = statusConfig[selectedIssue.status].icon
                    return <StatusIcon className="h-3 w-3" />
                  })()}
                  {statusConfig[selectedIssue.status].label}
                </Badge>
                <Badge variant={priorityConfig[selectedIssue.priority].color}>
                  {priorityConfig[selectedIssue.priority].label} Priority
                </Badge>
                <Badge variant="outline">{typeConfig[selectedIssue.type].label}</Badge>
              </div>

              {/* Description */}
              {selectedIssue.description && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedIssue.description}</p>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedIssue.location && (
                  <div>
                    <span className="text-muted-foreground">Location:</span>{" "}
                    <span className="font-medium">{selectedIssue.location}</span>
                  </div>
                )}
                {selectedIssue.dueDate && (
                  <div>
                    <span className="text-muted-foreground">Due Date:</span>{" "}
                    <span className="font-medium">{new Date(selectedIssue.dueDate).toLocaleDateString()}</span>
                  </div>
                )}
                {selectedIssue.creator && (
                  <div>
                    <span className="text-muted-foreground">Created By:</span>{" "}
                    <span className="font-medium">{selectedIssue.creator.name}</span>
                  </div>
                )}
                {selectedIssue.contractor && (
                  <div>
                    <span className="text-muted-foreground">Assigned To:</span>{" "}
                    <span className="font-medium">{selectedIssue.contractor.name}</span>
                  </div>
                )}
                {selectedIssue.verifier && (
                  <div>
                    <span className="text-muted-foreground">Verified By:</span>{" "}
                    <span className="font-medium">{selectedIssue.verifier.name}</span>
                  </div>
                )}
                {selectedIssue.closer && (
                  <div>
                    <span className="text-muted-foreground">Closed By:</span>{" "}
                    <span className="font-medium">{selectedIssue.closer.name}</span>
                  </div>
                )}
              </div>

              {/* Activity Log */}
              {selectedIssue.updates && selectedIssue.updates.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Activity Log</h4>
                  <div className="space-y-3">
                    {selectedIssue.updates.map((update) => (
                      <div key={update.id} className="flex gap-3 text-sm border-l-2 pl-3 py-1">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={statusConfig[update.status].color} className="text-xs">
                              {statusConfig[update.status].label}
                            </Badge>
                            <span className="text-muted-foreground text-xs">
                              by {update.user?.name} • {new Date(update.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {update.notes && (
                            <p className="mt-1 text-muted-foreground">{update.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
