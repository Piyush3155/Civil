"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { getProgressAnalytics, getAllProjects } from "@/app/actions/analytics/main";
import type { ProgressAnalytics, ProjectListItem } from "@/types/analytics";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

export default function ProgressAnalyticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedProject, setSelectedProject] = useState(projectId || "");
  const [analytics, setAnalytics] = useState<ProgressAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("30");

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchAnalytics();
    }
  }, [selectedProject, days]);

  const fetchProjects = async () => {
    try {
      const result = await getAllProjects();
      if (result.success && result.data) {
        setProjects(result.data);
        if (result.data.length > 0 && !selectedProject) {
          setSelectedProject(result.data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const result = await getProgressAnalytics(selectedProject, parseInt(days));
      if (result.success && result.data) {
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Skeleton className="h-10 w-full md:w-[250px]" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Progress Analytics</h1>
        <p>Select a project to view progress analytics</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-500";
      case "IN_PROGRESS":
        return "bg-blue-500";
      case "PENDING":
        return "bg-yellow-500";
      case "BLOCKED":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Progress Analytics</h1>
            <p className="text-sm md:text-base text-muted-foreground">Track project and task-level progress</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.code} - {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.totalTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.summary.completedTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.averageProgress.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.completionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Timeline</CardTitle>
          <CardDescription>Overall project progress over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              progress: {
                label: "Progress %",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[300px] w-full"
          >
            <LineChart data={analytics.progressTimeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value: string) => new Date(value).toLocaleDateString()}
              />
              <YAxis domain={[0, 100]} />
              <ChartTooltip
                content={<ChartTooltipContent />}
                labelFormatter={(value: string) => new Date(value).toLocaleDateString()}
              />
              <Line
                type="monotone"
                dataKey="progress"
                stroke="var(--color-progress)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* WBS Progress (Task List) */}
      <Card>
        <CardHeader>
          <CardTitle>Task-Level Progress (WBS)</CardTitle>
          <CardDescription>Individual task progress and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.wbsProgress.map((task) => (
              <div key={task.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{task.title}</h3>
                      <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                      {task.category && <Badge variant="outline">{task.category}</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {task.contractor && <span>Contractor: {task.contractor}</span>}
                      {task.startDate && (
                        <span className="ml-4">
                          Start: {new Date(task.startDate).toLocaleDateString()}
                        </span>
                      )}
                      {task.endDate && (
                        <span className="ml-4">
                          End: {new Date(task.endDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{task.progress}%</div>
                  </div>
                </div>
                <Progress value={task.progress} className="h-2" />
                {task.latestUpdate && (
                  <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                    <strong>Latest Update:</strong>{" "}
                    {new Date(task.latestUpdate.date).toLocaleDateString()} - {task.latestUpdate.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
