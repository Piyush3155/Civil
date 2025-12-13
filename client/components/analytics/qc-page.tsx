"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function QCAnalyticsPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-muted rounded-full">
              <ShieldCheck className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">QC Analytics</h1>
          <p className="text-muted-foreground">
            Quality control and safety analytics are coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
