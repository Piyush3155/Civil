"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ArrowLeft, TrendingDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { getMaterialAnalytics, getAllProjects } from "@/app/actions/analytics/main";
import type { MaterialAnalytics, ProjectListItem } from "@/types/analytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

export default function MaterialAnalyticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedProject, setSelectedProject] = useState(projectId || "");
  const [analytics, setAnalytics] = useState<MaterialAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchAnalytics();
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

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const result = await getMaterialAnalytics(selectedProject);
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
          <Skeleton className="h-10 w-full md:w-[250px]" />
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
        <h1 className="text-2xl font-bold mb-4">Material Analytics</h1>
        <p>Select a project to view material analytics</p>
      </div>
    );
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  const topMaterialsByValue = analytics.materials
    .sort((a, b) => b.estimatedValue - a.estimatedValue)
    .slice(0, 10);

  const wastageData = analytics.materials
    .filter((m) => m.wastage > 0)
    .sort((a, b) => b.wastagePercent - a.wastagePercent)
    .slice(0, 10);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Material Analytics</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Track material usage, delivery, and wastage
            </p>
          </div>
        </div>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-full md:w-[250px]">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.totalMaterials}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Delivered Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{(analytics.summary.totalDeliveredCost / 100000).toFixed(2)}L
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{(analytics.summary.totalStockValue / 100000).toFixed(2)}L
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {analytics.summary.lowStockItems}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.summary.outOfStockItems} out of stock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Materials by Value */}
      <Card>
        <CardHeader>
          <CardTitle>Top Materials by Stock Value</CardTitle>
          <CardDescription>Materials with highest current stock value</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              estimatedValue: {
                label: "Stock Value (₹)",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[300px] w-full"
          >
            <BarChart data={topMaterialsByValue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="estimatedValue" fill="var(--color-estimatedValue)" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Wastage Analysis */}
      {wastageData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-600" />
              Material Wastage Analysis
            </CardTitle>
            <CardDescription>Materials with highest wastage percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                wastagePercent: {
                  label: "Wastage %",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wastageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="wastagePercent" fill="var(--color-wastagePercent)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Material Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Material Details</CardTitle>
          <CardDescription>Complete material usage and stock information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Material</th>
                  <th className="text-right p-2">Unit</th>
                  <th className="text-right p-2">Delivered</th>
                  <th className="text-right p-2">Used</th>
                  <th className="text-right p-2">Stock</th>
                  <th className="text-right p-2">Wastage</th>
                  <th className="text-right p-2">Avg Cost</th>
                  <th className="text-right p-2">Stock Value</th>
                </tr>
              </thead>
              <tbody>
                {analytics.materials.map((material) => (
                  <tr key={material.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{material.name}</td>
                    <td className="text-right p-2">{material.unit}</td>
                    <td className="text-right p-2">{material.delivered.toFixed(2)}</td>
                    <td className="text-right p-2">{material.used.toFixed(2)}</td>
                    <td className="text-right p-2">
                      <span
                        className={
                          material.currentStock === 0
                            ? "text-red-600 font-semibold"
                            : material.currentStock <= 10
                            ? "text-orange-600"
                            : ""
                        }
                      >
                        {material.currentStock.toFixed(2)}
                      </span>
                    </td>
                    <td className="text-right p-2">
                      {material.wastage > 0 && (
                        <span className="text-orange-600">
                          {material.wastage.toFixed(2)} ({material.wastagePercent.toFixed(1)}%)
                        </span>
                      )}
                    </td>
                    <td className="text-right p-2">₹{material.avgUnitCost.toFixed(2)}</td>
                    <td className="text-right p-2 font-semibold">
                      ₹{material.estimatedValue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
