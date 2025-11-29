"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCompleteAnalytics, getAllProjects } from "@/app/actions/analytics/main";
import type { ProjectListItem } from "@/types/analytics";

export default function ReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedProject, setSelectedProject] = useState(projectId || "");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

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

  const generateReport = async (type: string) => {
    if (!selectedProject) return;
    
    setGenerating(true);
    try {
      // For now, just fetch the JSON data
      // In production, this would call a PDF generation endpoint
      const result = await getCompleteAnalytics(selectedProject);
      
      if (result.success && result.data) {
        // Convert data to JSON and download
        const jsonString = JSON.stringify(result.data, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${type}-report-${Date.now()}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert("Failed to generate report: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Report generation coming soon! For now, downloading as JSON.");
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
