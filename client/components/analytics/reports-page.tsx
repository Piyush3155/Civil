"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCompleteAnalytics, getAllProjects, getProjectOverview, getProgressAnalytics } from "@/app/actions/analytics/main";
import type { ProjectListItem, ProjectOverview, ProgressAnalytics } from "@/types/analytics";
import { pdf } from "@react-pdf/renderer";

export default function ReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedProject, setSelectedProject] = useState(projectId || "");
  const [generating, setGenerating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchProjects();
    }
  }, [mounted]);

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

  useEffect(() => {
    if (mounted) {
      fetchProjects();
    }
  }, [mounted]);

  const generateReport = async (type: string) => {
    if (!selectedProject) return;
    
    setGenerating(true);
    try {
      let reportData: {
        overview?: ProjectOverview;
        progress?: ProgressAnalytics;
      } = {};
      
      // Map report types to data fetching
      // Daily, Weekly, Monthly reports all use overview + progress data
      const needsOverview = ["daily", "weekly", "monthly", "overview", "complete"].includes(type);
      const needsProgress = ["daily", "weekly", "monthly", "progress", "complete"].includes(type);
      
      // Fetch data based on report type
      if (needsOverview) {
        const overviewResult = await getProjectOverview(selectedProject);
        console.log("Overview Result:", overviewResult);
        if (overviewResult.success) {
          reportData.overview = overviewResult.data;
        } else {
          console.error("Overview fetch failed:", overviewResult.error);
          throw new Error(overviewResult.error || "Failed to fetch overview data");
        }
      }
      
      if (needsProgress) {
        // Adjust days based on report type
        const days = type === "daily" ? 1 : type === "weekly" ? 7 : 30;
        const progressResult = await getProgressAnalytics(selectedProject, days);
        console.log("Progress Result:", progressResult);
        if (progressResult.success) {
          reportData.progress = progressResult.data;
        } else {
          console.error("Progress fetch failed:", progressResult.error);
          throw new Error(progressResult.error || "Failed to fetch progress data");
        }
      }
      
      if (type === "complete") {
        const completeResult = await getCompleteAnalytics(selectedProject);
        console.log("Complete Result:", completeResult);
        if (completeResult.success) {
          reportData = { ...reportData, ...completeResult.data };
        } else {
          console.error("Complete fetch failed:", completeResult.error);
          throw new Error(completeResult.error || "Failed to fetch complete data");
        }
      }
      
      console.log("Final Report Data:", reportData);
      
      // Generate PDF
      const AnalyticsReportPDF = (await import("@/components/templates/pdf/page")).default;
      const blob = await pdf(
        <AnalyticsReportPDF 
          data={reportData} 
          reportType={type as "overview" | "progress" | "materials" | "procurement" | "billing" | "complete"}
        />
      ).toBlob();
      
      // Download PDF
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${type}-report-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate PDF report. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Reports</h1>
            <p className="text-muted-foreground">
              Generate comprehensive PDF reports for your project
            </p>
          </div>
        </div>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[250px]">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Daily Report
            </CardTitle>
            <CardDescription>Today&apos;s site activities and progress</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => generateReport("daily")}
              disabled={generating || !selectedProject}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Generate Daily Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Weekly Report
            </CardTitle>
            <CardDescription>Last 7 days summary</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => generateReport("weekly")}
              disabled={generating || !selectedProject}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Generate Weekly Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Monthly Report
            </CardTitle>
            <CardDescription>Last 30 days comprehensive report</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => generateReport("monthly")}
              disabled={generating || !selectedProject}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Generate Monthly Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Progress Report
            </CardTitle>
            <CardDescription>Detailed task and milestone progress</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => generateReport("progress")}
              disabled={generating || !selectedProject}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Generate Progress Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Material Report
            </CardTitle>
            <CardDescription>Material usage and stock analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => generateReport("material")}
              disabled={generating || !selectedProject}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Generate Material Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Financial Report
            </CardTitle>
            <CardDescription>Billing and payment summary</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => generateReport("financial")}
              disabled={generating || !selectedProject}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Generate Financial Report
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Complete Analytics Report</CardTitle>
          <CardDescription>
            Comprehensive report including all analytics data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => generateReport("complete")}
            disabled={generating || !selectedProject}
            variant="default"
            className="w-full"
            size="lg"
          >
            <Download className="mr-2 h-5 w-5" />
            Generate Complete Analytics Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
