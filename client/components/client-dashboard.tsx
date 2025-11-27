"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Calendar,
  FileText,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { fetchOwnerDashboard } from "@/app/actions/projects/main";
import { fetchProgressTimeline } from "@/app/actions/projects/progress";
import { OwnerDashboardData, ProgressLog, Drawing, MaterialDelivery, SiteDiary } from "@/types/billing";

interface ClientDashboardProps {
  projectId: string;
}

export function ClientDashboard({ projectId }: ClientDashboardProps) {
  const [data, setData] = useState<OwnerDashboardData | null>(null);
  const [timeline, setTimeline] = useState<ProgressLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);  useEffect(() => {
    async function loadData() {
      try {
        const [dashboardData, timelineData] = await Promise.all([
          fetchOwnerDashboard(projectId),
          fetchProgressTimeline(projectId),
        ]);
        setData(dashboardData);
        setTimeline(timelineData);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [projectId]);

  if (loading) {
    return <div className="p-8 text-center">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Progress Section */}
      <Card className="bg-gradient-to-br from-primary/5 to-background border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <span>Project Progress</span>
            <Badge variant="outline" className="text-base px-2 py-1">
              {Number(data.progress || 0).toFixed(0)}%
            </Badge>
          </CardTitle>
          <CardDescription>
            Overall completion status
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Progress value={Number(data.progress || 0)} className="h-3 mb-3" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 p-2 rounded border">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="font-medium">Next Milestone:</span>
            <span>{data.nextMilestone || "Not set"}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Project Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">{data.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Timeline</p>
                <p className="text-sm text-muted-foreground">
                  {data.startDate ? new Date(data.startDate).toLocaleDateString() : 'TBD'} - 
                  {data.endDate ? new Date(data.endDate).toLocaleDateString() : 'TBD'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity / Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded bg-muted/50 text-center">
                <FileText className="h-5 w-5 mx-auto mb-1 text-primary" />
                <div className="text-xl font-bold">{data.drawings?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Drawings</div>
              </div>
              <div className="p-3 rounded bg-muted/50 text-center">
                <Truck className="h-5 w-5 mx-auto mb-1 text-primary" />
                <div className="text-xl font-bold">{data.materialDeliveries?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Deliveries</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-9">
          <TabsTrigger value="progress" className="text-sm">Progress History</TabsTrigger>
          <TabsTrigger value="drawings" className="text-sm">Drawings & Plans</TabsTrigger>
          <TabsTrigger value="materials" className="text-sm">Material Logs</TabsTrigger>
          <TabsTrigger value="diaries" className="text-sm">Site Diaries</TabsTrigger>
        </TabsList>
        
        <TabsContent value="progress" className="mt-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Progress Timeline</CardTitle>
              <CardDescription>Historical progress updates and milestones</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {timeline?.slice(0, 10).map((log: ProgressLog) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 border rounded">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">
                          Progress updated to {Number(log.progress).toFixed(0)}%
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {new Date(log.loggedAt).toLocaleDateString()}
                        </Badge>
                      </div>
                      {log.milestone && (
                        <p className="text-xs text-muted-foreground">
                          <strong>Milestone:</strong> {log.milestone}
                        </p>
                      )}
                      {log.notes && (
                        <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                          {log.notes}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Updated by {log.user.name}
                      </p>
                    </div>
                  </div>
                ))}
                {(!timeline || timeline.length === 0) && (
                  <div className="text-center py-6 text-muted-foreground">
                    No progress updates recorded yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drawings" className="mt-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Project Drawings</CardTitle>
              <CardDescription>Access all construction plans and layouts</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {data.drawings?.slice(0, 6).map((drawing: Drawing) => (
                  <div key={drawing.id} className="group relative flex flex-col gap-2 p-3 border rounded hover:bg-accent transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">{drawing.category}</Badge>
                      <span className="text-xs text-muted-foreground">v{drawing.version}</span>
                    </div>
                    <div className="font-medium text-sm truncate">{drawing.title}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(drawing.createdAt).toLocaleDateString()}
                    </div>
                    <a href={drawing.fileUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0" />
                  </div>
                ))}
                {(!data.drawings || data.drawings.length === 0) && (
                  <div className="col-span-full text-center py-6 text-muted-foreground">
                    No drawings uploaded yet
                  </div>
                )}
                {data.drawings && data.drawings.length > 6 && (
                  <div className="col-span-full text-center text-sm text-muted-foreground">
                    And {data.drawings.length - 6} more drawings...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="mt-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Material Deliveries</CardTitle>
              <CardDescription>Recent material arrivals on site</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data.materialDeliveries?.slice(0, 10).map((delivery: MaterialDelivery) => (
                  <div key={delivery.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Truck className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{delivery.material.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {delivery.supplierName} • {new Date(delivery.deliveryDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm">{Number(delivery.quantity)} {delivery.material.unit}</p>
                      <Badge variant={delivery.qcStatus === 'APPROVED' ? 'default' : 'secondary'} className="text-xs">
                        {delivery.qcStatus}
                      </Badge>
                    </div>
                  </div>
                ))}
                 {(!data.materialDeliveries || data.materialDeliveries.length === 0) && (
                  <div className="text-center py-6 text-muted-foreground">
                    No material deliveries recorded
                  </div>
                )}
                {data.materialDeliveries && data.materialDeliveries.length > 10 && (
                  <div className="text-center text-sm text-muted-foreground">
                    And {data.materialDeliveries.length - 10} more deliveries...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diaries" className="mt-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Site Diaries</CardTitle>
              <CardDescription>Daily progress reports from site engineers</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data.siteDiaries?.slice(0, 10).map((diary: SiteDiary) => (
                  <div key={diary.id} className="p-3 border rounded space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {new Date(diary.date).toLocaleDateString()}
                      </div>
                      <Badge variant="outline" className="text-xs">{diary.weather || "Sunny"}</Badge>
                    </div>
                    {diary.notes && (
                      <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                        {diary.notes}
                      </p>
                    )}
                    {diary.issues && (
                      <div className="flex items-start gap-2 text-xs text-red-500 bg-red-50 p-2 rounded">
                        <AlertCircle className="h-3 w-3 mt-0.5" />
                        <span>{diary.issues}</span>
                      </div>
                    )}
                  </div>
                ))}
                {(!data.siteDiaries || data.siteDiaries.length === 0) && (
                  <div className="text-center py-6 text-muted-foreground">
                    No site diaries available
                  </div>
                )}
                {data.siteDiaries && data.siteDiaries.length > 10 && (
                  <div className="text-center text-sm text-muted-foreground">
                    And {data.siteDiaries.length - 10} more diaries...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
