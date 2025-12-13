"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function LabourAnalyticsPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-muted rounded-full">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Labour Analytics</h1>
          <p className="text-muted-foreground">
            Labour attendance and productivity insights are coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
