"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Download, TrendingUp, Users, Package, AlertTriangle, IndianRupee, FileText, Calendar } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { getProjectOverview, getAllProjects } from "@/app/actions/analytics/main";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import type { ProjectListItem, ProjectOverview } from "@/types/analytics";

export default function AnalyticsOverviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedProject, setSelectedProject] = useState(projectId || "");
  const [overview, setOverview] = useState<ProjectOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchOverview();
    }
  }, [selectedProject]);

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

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const result = await getProjectOverview(selectedProject);
      if (result.success && result.data) {
        setOverview(result.data);
      }
    } catch (error) {
      console.error("Error fetching overview:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = (value: string) => {
    setSelectedProject(value);
    router.push(`/analytics/overview?projectId=${value}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Project Analytics</h1>
        <p>Select a project to view analytics</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Project Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for your construction project
          </p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedProject} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-[300px]">
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
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Project Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>{overview.project.name}</CardTitle>
          <CardDescription>
            Project Code: {overview.project.code} | Status: {overview.project.status}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Overall Progress</p>
              <p className="text-2xl font-bold">{overview.overview.overallProgress}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="text-lg">
                {overview.project.startDate
                  ? new Date(overview.project.startDate).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">End Date</p>
              <p className="text-lg">
                {overview.project.endDate
                  ? new Date(overview.project.endDate).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Next Milestone</p>
              <p className="text-lg">{overview.project.nextMilestone || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.overview.tasks.completed}/{overview.overview.tasks.total}</div>
            <p className="text-xs text-muted-foreground">
              {overview.overview.tasks.inProgress} in progress, {overview.overview.tasks.pending} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Labour (Today)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.overview.labour.todayCount}</div>
            <p className="text-xs text-muted-foreground">Workers on site today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchase Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.overview.procurement.pendingPOs}</div>
            <p className="text-xs text-muted-foreground">
              Pending out of {overview.overview.procurement.totalPOs} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QC Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{overview.overview.qc.openIssues}</div>
            <p className="text-xs text-muted-foreground">
              Open out of {overview.overview.qc.totalIssues} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Billing & Materials */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Task Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Task Status Overview</CardTitle>
            <CardDescription>Breakdown of task completion status</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                completed: {
                  label: "Completed",
                  color: "hsl(var(--chart-1))",
                },
                inProgress: {
                  label: "In Progress",
                  color: "hsl(var(--chart-2))",
                },
                pending: {
                  label: "Pending",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-[300px]"
            >
              <BarChart
                data={[
                  {
                    name: "Tasks",
                    completed: overview.overview.tasks.completed,
                    inProgress: overview.overview.tasks.inProgress,
                    pending: overview.overview.tasks.pending,
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="completed" fill="var(--color-completed)" />
                <Bar dataKey="inProgress" fill="var(--color-inProgress)" />
                <Bar dataKey="pending" fill="var(--color-pending)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Billing Overview Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Overview</CardTitle>
            <CardDescription>Payment status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                paid: {
                  label: "Paid",
                  color: "hsl(var(--chart-4))",
                },
                pending: {
                  label: "Pending",
                  color: "hsl(var(--chart-5))",
                },
              }}
              className="h-[300px]"
            >
              <BarChart
                data={[
                  {
                    name: "Amount (₹)",
                    paid: overview.overview.billing.paidAmount,
                    pending: overview.overview.billing.pendingAmount,
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="paid" fill="var(--color-paid)" />
                <Bar dataKey="pending" fill="var(--color-pending)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Billing & Materials Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Billing Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Billed</span>
              <span className="font-semibold">
                ₹{overview.overview.billing.totalAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Paid</span>
              <span className="font-semibold text-green-600">
                ₹{overview.overview.billing.paidAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Pending</span>
              <span className="font-semibold text-orange-600">
                ₹{overview.overview.billing.pendingAmount.toLocaleString()}
              </span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Total Bills</span>
                <span className="font-semibold">{overview.overview.billing.totalBills}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Materials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Consumed</span>
              <span className="font-semibold">
                {overview.overview.materials.totalConsumed.toLocaleString()} units
              </span>
            </div>
            <div className="pt-4">
              <Button variant="outline" className="w-full" onClick={() => router.push(`/analytics/materials?projectId=${selectedProject}`)}>
                View Detailed Material Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analytics</CardTitle>
          <CardDescription>View comprehensive analytics for different aspects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" onClick={() => router.push(`/analytics/progress?projectId=${selectedProject}`)}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Progress
            </Button>
            <Button variant="outline" onClick={() => router.push(`/analytics/materials?projectId=${selectedProject}`)}>
              <Package className="mr-2 h-4 w-4" />
              Materials
            </Button>
            <Button variant="outline" onClick={() => router.push(`/analytics/procurement?projectId=${selectedProject}`)}>
              <FileText className="mr-2 h-4 w-4" />
              Procurement
            </Button>
            <Button variant="outline" onClick={() => router.push(`/analytics/billing?projectId=${selectedProject}`)}>
              <IndianRupee className="mr-2 h-4 w-4" />
              Billing
            </Button>
            <Button variant="outline" onClick={() => router.push(`/analytics/qc?projectId=${selectedProject}`)}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              QC/Safety
            </Button>
            <Button variant="outline" onClick={() => router.push(`/analytics/labour?projectId=${selectedProject}`)}>
              <Users className="mr-2 h-4 w-4" />
              Labour
            </Button>
            <Button variant="outline" onClick={() => router.push(`/analytics/diary?projectId=${selectedProject}`)}>
              <Calendar className="mr-2 h-4 w-4" />
              Site Diary
            </Button>
            <Button variant="default" onClick={() => router.push(`/analytics/reports?projectId=${selectedProject}`)}>
              <Download className="mr-2 h-4 w-4" />
              Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
