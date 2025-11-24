"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import { fetchProjectTasks, updateTaskProgress } from "@/app/actions/tasks/main"
import { CheckCircle, Clock, AlertTriangle, PlayCircle, Loader, X } from "lucide-react"

interface Task {
  id: string
  title: string
  description?: string
  category?: string
  status: string
  weightage: number
  contractor?: {
    id: string
    name: string
  }
  progressLogs: Array<{
    progress: number
    notes?: string
    createdAt: string
  }>
}

interface RawTask {
  id: string
  title: string
  description?: string
  category?: string
  status: string
  weightage: string
  contractor?: {
    id: string
    name: string
  }
  progressLogs: Array<{
    progress: string
    notes?: string
    createdAt: string
  }>
}

interface TaskManagementProps {
  projectId: string
}

const statusConfig = {
  PENDING: { label: "Pending", color: "secondary" as const, icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "default" as const, icon: PlayCircle },
  COMPLETED: { label: "Completed", color: "outline" as const, icon: CheckCircle },
  BLOCKED: { label: "Blocked", color: "destructive" as const, icon: AlertTriangle },
}

const categoryLabels = {
  PRE_CONSTRUCTION: "Pre-Construction",
  FOUNDATION: "Foundation",
  PLINTH: "Plinth",
  STRUCTURE: "Structure",
  MASONRY: "Masonry",
  PLASTERING: "Plastering",
  ELECTRICAL: "Electrical",
  PLUMBING: "Plumbing",
  FLOORING: "Flooring",
  DOORS_WINDOWS: "Doors & Windows",
  PAINTING: "Painting",
  FINISHING: "Finishing",
  EXTERNAL_WORK: "External Work",
}

export function TaskManagement({ projectId }: TaskManagementProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [progressDialogOpen, setProgressDialogOpen] = useState(false)
  const [updatingProgress, setUpdatingProgress] = useState(false)
  const [progressFormData, setProgressFormData] = useState({
    progress: 0,
    notes: "",
  })

  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")

  const loadTasks = useCallback(async () => {
    try {
      const data = await fetchProjectTasks(projectId)
      const convertedData: Task[] = (data as RawTask[]).map((task) => ({
        ...task,
        weightage: Number(task.weightage) || 0,
        progressLogs: task.progressLogs.map((log) => ({
          ...log,
          progress: Number(log.progress) || 0,
        })),
      }))
      setTasks(convertedData)
    } catch (error) {
      console.error("Error loading tasks:", error)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const filteredAndGroupedTasks = useMemo(() => {
    let filtered = tasks

    if (filterCategory !== "all") {
      filtered = filtered.filter((task) => task.category === filterCategory)
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((task) => task.status === filterStatus)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.contractor?.name.toLowerCase().includes(query),
      )
    }

    const grouped: { [key: string]: Task[] } = {}
    filtered.forEach((task) => {
      const category = task.category || "OTHER"
      if (!grouped[category]) grouped[category] = []
      grouped[category].push(task)
    })

    return grouped
  }, [tasks, filterCategory, filterStatus, searchQuery])

  const uniqueCategories = useMemo(() => Array.from(new Set(tasks.map((t) => t.category).filter(Boolean))), [tasks])

  const uniqueStatuses = useMemo(() => Array.from(new Set(tasks.map((t) => t.status))), [tasks])

  async function handleUpdateProgress(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTask) return

    setUpdatingProgress(true)
    try {
      const updatedTask = await updateTaskProgress(selectedTask.id, progressFormData)
      setProgressDialogOpen(false)
      setProgressFormData({ progress: 0, notes: "" })
      setSelectedTask(null)
      setTasks((prevTasks) => prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)))
      await loadTasks()
    } catch (error) {
      console.error("Error updating progress:", error)
      alert("Failed to update progress")
    } finally {
      setUpdatingProgress(false)
    }
  }

  function getLatestProgress(task: Task): number {
    if (task.progressLogs.length === 0) return 0
    return task.progressLogs[0].progress
  }

  function calculateCategoryProgress(tasksInCategory: Task[]): number {
    if (tasksInCategory.length === 0) return 0
    const totalWeightage = tasksInCategory.reduce((sum, task) => sum + task.weightage, 0)
    const weightedProgress = tasksInCategory.reduce((sum, task) => {
      const progress = getLatestProgress(task)
      return sum + (progress * task.weightage) / 100
    }, 0)
    return totalWeightage > 0 ? (weightedProgress / totalWeightage) * 100 : 0
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 p-4 bg-card border rounded-lg shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-1">
            <Label htmlFor="search" className="text-xs font-medium mb-2 block">
              Search
            </Label>
            <div className="relative">
              <Input
                id="search"
                placeholder="Search by title, notes, contractor..."
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

          <div className="lg:col-span-1">
            <Label htmlFor="category-filter" className="text-xs font-medium mb-2 block">
              Category
            </Label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger id="category-filter" className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map((cat) => (
                  <SelectItem key={cat} value={cat || "OTHER"}>
                    {categoryLabels[cat as keyof typeof categoryLabels] || cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-1">
            <Label htmlFor="status-filter" className="text-xs font-medium mb-2 block">
              Status
            </Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger id="status-filter" className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {uniqueStatuses.map((status) => {
                  const statusInfo = statusConfig[status as keyof typeof statusConfig]
                  return (
                    <SelectItem key={status} value={status}>
                      {statusInfo.label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-1 flex items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterCategory("all")
                setFilterStatus("all")
                setSearchQuery("")
              }}
              className="w-full text-sm"
            >
              Reset Filters
            </Button>
          </div>
        </div>

        {(filterCategory !== "all" || filterStatus !== "all" || searchQuery) && (
          <div className="text-xs text-muted-foreground">
            Showing {Object.values(filteredAndGroupedTasks).reduce((sum, tasks) => sum + tasks.length, 0)} of{" "}
            {tasks.length} tasks
          </div>
        )}
      </div>

      {Object.entries(filteredAndGroupedTasks).length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-2">
            <p className="text-muted-foreground">No tasks match your filters</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterCategory("all")
                setFilterStatus("all")
                setSearchQuery("")
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        Object.entries(filteredAndGroupedTasks).map(([category, categoryTasks]) => {
          const categoryProgress = calculateCategoryProgress(categoryTasks)
          const totalWeightage = categoryTasks.reduce((sum, task) => sum + task.weightage, 0)

          return (
            <Card
              key={category}
              className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200 overflow-hidden"
            >
              <CardHeader className="pb-4 bg-gradient-to-br from-primary/5 to-transparent border-b">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="min-w-0">
                    <CardTitle className="text-xl md:text-2xl text-pretty">
                      {categoryLabels[category as keyof typeof categoryLabels] || category}
                    </CardTitle>
                    <CardDescription className="text-sm md:text-base mt-1">
                      {categoryTasks.length} {categoryTasks.length === 1 ? "task" : "tasks"} •{" "}
                      <span className="font-semibold text-foreground">Total weightage: {totalWeightage}%</span>
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-2 sm:text-right">
                    <div className="text-2xl md:text-3xl font-bold text-primary">{categoryProgress.toFixed(1)}%</div>
                    <Progress value={categoryProgress} className="w-full sm:w-32 h-2.5 rounded-full" />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                <div className="grid gap-3 md:gap-4">
                  {categoryTasks.map((task) => {
                    const statusInfo = statusConfig[task.status as keyof typeof statusConfig]
                    const StatusIcon = statusInfo.icon
                    const currentProgress = getLatestProgress(task)

                    return (
                      <div
                        key={task.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 md:p-4 border rounded-lg hover:bg-accent/50 transition-all duration-200 hover:shadow-md"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 flex-wrap">
                            <h4 className="font-semibold text-sm md:text-base text-pretty truncate">{task.title}</h4>
                            <Badge
                              variant={statusInfo.color}
                              className="w-fit flex items-center gap-1 text-xs md:text-sm"
                            >
                              <StatusIcon className="h-3 w-3" />
                              {statusInfo.label}
                            </Badge>
                          </div>

                          {task.description && (
                            <p className="text-xs md:text-sm text-muted-foreground mb-3 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs md:text-sm text-muted-foreground mb-3 sm:mb-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{task.weightage}%</span>
                              <span>Weightage</span>
                            </div>

                            {task.contractor && (
                              <div className="flex items-center gap-2 truncate">
                                <span className="font-medium text-foreground truncate">{task.contractor.name}</span>
                                <span className="hidden sm:inline">Contractor</span>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-foreground">{currentProgress}%</span>
                                <Progress value={currentProgress} className="w-12 h-1.5 hidden sm:block" />
                              </div>
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setSelectedTask(task)
                            setProgressFormData({ progress: currentProgress, notes: "" })
                            setProgressDialogOpen(true)
                          }}
                          className="w-full sm:w-auto whitespace-nowrap"
                        >
                          Update Progress
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })
      )}

      <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
        <DialogContent className="w-full max-w-md md:max-w-lg sm:rounded-lg">
          <form onSubmit={handleUpdateProgress}>
            <DialogHeader>
              <DialogTitle>Update Task Progress</DialogTitle>
              <DialogDescription className="text-pretty">
                Update progress for: <span className="font-semibold text-foreground">{selectedTask?.title}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="progress" className="text-sm md:text-base">
                  Progress (%) *
                </Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={progressFormData.progress}
                  onChange={(e) => setProgressFormData({ ...progressFormData, progress: Number(e.target.value) })}
                  required
                  className="text-base"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes" className="text-sm md:text-base">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about progress..."
                  value={progressFormData.notes}
                  onChange={(e) => setProgressFormData({ ...progressFormData, notes: e.target.value })}
                  className="min-h-20 text-base"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProgressDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updatingProgress} className="w-full sm:w-auto">
                {updatingProgress ? "Updating..." : "Update Progress"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
