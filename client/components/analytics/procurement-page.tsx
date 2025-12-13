"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { getProcurementAnalytics, getAllProjects } from "@/app/actions/analytics/main";
import type { ProcurementAnalytics, ProjectListItem } from "@/types/analytics";

export default function ProcurementAnalyticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedProject, setSelectedProject] = useState(projectId || "");
  const [analytics, setAnalytics] = useState<ProcurementAnalytics | null>(null);
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
      const result = await getProcurementAnalytics(selectedProject);
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Procurement Analytics</h1>
            <p className="text-sm md:text-base text-muted-foreground">Purchase orders and supplier performance</p>
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

      {analytics && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total POs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.summary.totalPOs}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{(analytics.summary.totalPOValue / 100000).toFixed(2)}L
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completed Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ₹{(analytics.summary.completedPOValue / 100000).toFixed(2)}L
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  ₹{(analytics.summary.pendingPOValue / 100000).toFixed(2)}L
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">PO Number</th>
                      <th className="text-left p-2">Supplier</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-right p-2">Value</th>
                      <th className="text-right p-2">Items</th>
                      <th className="text-left p-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.purchaseOrders.map((po) => (
                      <tr key={po.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{po.poNumber}</td>
                        <td className="p-2">{po.supplier.name}</td>
                        <td className="p-2">{po.status}</td>
                        <td className="text-right p-2">₹{po.totalValue.toLocaleString()}</td>
                        <td className="text-right p-2">{po.itemCount}</td>
                        <td className="p-2">{new Date(po.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
