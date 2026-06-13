"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { FloorPlanData, Aesthetics, DEFAULT_AESTHETICS } from "@/components/building-designer/types";
import { Box, Move, ZoomIn, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Dynamic import to avoid SSR issues with Three.js canvas
const Viewer3D = dynamic(
  () => import("@/components/building-designer/Viewer3D"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-slate-900 rounded-xl">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-slate-400">Loading 3D Engine...</p>
        </div>
      </div>
    ),
  }
);

const DEFAULT_PLAN_DATA: FloorPlanData = {
  nodes: [],
  walls: [],
  openings: [],
};

/**
 * Parse PLAN configuration from the drawing description field.
 * Looks for the <!--PLAN_CONFIG:{...}:PLAN_CONFIG--> marker.
 */
function parsePlanConfig(description?: string): { data: FloorPlanData; aesthetics: Aesthetics } {
  if (!description) return { data: DEFAULT_PLAN_DATA, aesthetics: DEFAULT_AESTHETICS };

  try {
    const match = description.match(/<!--PLAN_CONFIG:(.*?):PLAN_CONFIG-->/);
    if (match && match[1]) {
      const parsed = JSON.parse(match[1]);
      return {
        data: parsed.data || DEFAULT_PLAN_DATA,
        aesthetics: parsed.aesthetics || DEFAULT_AESTHETICS,
      };
    }
  } catch (e) {
    console.error("Failed to parse Building Plan config:", e);
  }

  return { data: DEFAULT_PLAN_DATA, aesthetics: DEFAULT_AESTHETICS };
}

interface PlanViewerProps {
  description?: string;
  drawingId?: string;
}

export default function PlanViewer({ description, drawingId }: PlanViewerProps) {
  const router = useRouter();
  const { data, aesthetics } = useMemo(() => parsePlanConfig(description), [description]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Interaction hints bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-700/50 shrink-0">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Box className="h-4 w-4 text-primary" />
          <span className="font-medium text-slate-300">
            Interactive Building Plan Viewer
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          {drawingId && (
            <Button
              variant="outline"
              className="h-7 px-3 text-xs flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white border-none transition-colors font-semibold cursor-pointer"
              onClick={() => {
                router.push(`/building-designer?drawingId=${drawingId}`);
              }}
            >
              <Edit className="h-3.5 w-3.5" />
              Edit Design
            </Button>
          )}
          <span className="flex items-center gap-1.5">
            <Move className="h-3 w-3" />
            Drag to rotate
          </span>
          <span className="flex items-center gap-1.5">
            <ZoomIn className="h-3 w-3" />
            Scroll to zoom
          </span>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 relative min-h-0 w-full h-full">
        <div className="absolute inset-0">
          <Viewer3D data={data} aesthetics={aesthetics} />
        </div>
      </div>
    </div>
  );
}
