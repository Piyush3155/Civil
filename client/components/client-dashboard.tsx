"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Calendar,
  FileText,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Activity
} from "lucide-react";
import { fetchOwnerDashboard } from "@/app/actions/projects/main";
import { fetchProgressTimeline } from "@/app/actions/projects/progress";
import { OwnerDashboardData, ProgressLog, Drawing, MaterialDelivery, SiteDiary } from "@/types/billing";

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Progress Section Skeleton */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent className="pt-0">
          <Skeleton className="h-3 w-full mb-3 rounded-full" />
          <Skeleton className="h-10 w-full rounded-md" />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Project Info Skeleton */}
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Stats Skeleton */}
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="p-3 rounded border bg-muted/10 text-center space-y-2">
                  <Skeleton className="h-5 w-5 mx-auto" />
                  <Skeleton className="h-8 w-12 mx-auto" />
                  <Skeleton className="h-3 w-16 mx-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-10 w-full md:w-2/3 rounded-md" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-md" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
        <AlertCircle className="h-5 w-5" />
        <span className="font-medium">{error}</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Progress Section */}
      <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
        <CardHeader className="pb-3 relative">
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Project Progress
            </span>
            <Badge variant="secondary" className="text-base px-3 py-1 font-bold text-primary">
              {Number(data.progress || 0).toFixed(0)}%
            </Badge>
          </CardTitle>
          <CardDescription>
            Overall completion status and upcoming milestones
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 relative">
          <Progress value={Number(data.progress || 0)} className="h-4 mb-4 rounded-full" />
          <div className="flex items-center gap-3 text-sm text-muted-foreground bg-background/80 backdrop-blur-sm p-3 rounded-lg border shadow-sm">
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-foreground">Next Milestone</span>
              <span className="text-xs">{data.nextMilestone || "No upcoming milestones set"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Project Info */}
        <Card className="hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              Project Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium leading-none mb-1">Location</p>
                <p className="text-sm text-muted-foreground">{data.location}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium leading-none mb-1">Timeline</p>
                <p className="text-sm text-muted-foreground">
                  {data.startDate ? new Date(data.startDate).toLocaleDateString() : 'TBD'} - 
                  {data.endDate ? new Date(data.endDate).toLocaleDateString() : 'TBD'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity / Stats */}
        <Card className="hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/30 border hover:bg-muted/50 transition-colors text-center group">
                <div className="mb-2 p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 w-fit mx-auto text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold text-foreground">{data.drawings?.length || 0}</div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Drawings</div>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 border hover:bg-muted/50 transition-colors text-center group">
                <div className="mb-2 p-2 rounded-full bg-orange-100 dark:bg-orange-900/30 w-fit mx-auto text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                  <Truck className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold text-foreground">{data.materialDeliveries?.length || 0}</div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Deliveries</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1 gap-1">
          <TabsTrigger value="progress" className="text-sm py-2">Progress History</TabsTrigger>
          <TabsTrigger value="drawings" className="text-sm py-2">Drawings & Plans</TabsTrigger>
          <TabsTrigger value="materials" className="text-sm py-2">Material Logs</TabsTrigger>
          <TabsTrigger value="diaries" className="text-sm py-2">Site Diaries</TabsTrigger>
        </TabsList>
        
        <TabsContent value="progress" className="mt-4 animate-in fade-in slide-in-from-bottom-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Progress Timeline</CardTitle>
              <CardDescription>Historical progress updates and milestones</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {timeline?.slice(0, 10).map((log: ProgressLog) => (
                  <div key={log.id} className="relative pl-6 pb-4 border-l last:pb-0 last:border-l-0 ml-2">
                    <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                    <div className="flex flex-col gap-2 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-sm flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          Progress updated to {Number(log.progress).toFixed(0)}%
                        </div>
                        <Badge variant="secondary" className="text-xs font-normal">
                          {new Date(log.loggedAt).toLocaleDateString()}
                        </Badge>
                      </div>
                      {log.milestone && (
                        <div className="flex items-center gap-2 text-xs font-medium text-primary">
                          <CheckCircle2 className="h-3 w-3" />
                          Milestone: {log.milestone}
                        </div>
                      )}
                      {log.notes && (
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md italic">
                          &quot;{log.notes}&quot;
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                          {log.user.name.charAt(0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Updated by {log.user.name}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!timeline || timeline.length === 0) && (
                  <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2">
                    <TrendingUp className="h-8 w-8 opacity-20" />
                    <p>No progress updates recorded yet</p>
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
