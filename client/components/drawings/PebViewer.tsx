"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import type { PebParams } from "@/components/peb-designer/PebCanvas3D";
import { Box, Move, ZoomIn } from "lucide-react";

// Dynamic import to avoid SSR issues with canvas
const PebCanvas3D = dynamic(
  () => import("@/components/peb-designer/PebCanvas3D"),
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

const DEFAULT_PEB_PARAMS: PebParams = {
  width: 20,
  length: 40,
  eaveHeight: 7,
  roofSlope: 10,
  bays: 5,
  purlinsPerSlope: 3,
  girtsPerWall: 2,
  showPurlins: true,
  showGirts: true,
  showBracing: true,
};

/**
 * Parse PEB configuration from the drawing description field.
 * Looks for the <!--PEB_CONFIG:{...}:PEB_CONFIG--> marker.
 */
function parsePebConfig(description?: string): PebParams {
  if (!description) return DEFAULT_PEB_PARAMS;

  try {
    const match = description.match(/<!--PEB_CONFIG:(.*?):PEB_CONFIG-->/);
    if (match && match[1]) {
      const parsed = JSON.parse(match[1]);
      return { ...DEFAULT_PEB_PARAMS, ...parsed };
    }
  } catch (e) {
    console.error("Failed to parse PEB config:", e);
  }

  return DEFAULT_PEB_PARAMS;
}

interface PebViewerProps {
  description?: string;
}

export default function PebViewer({ description }: PebViewerProps) {
  const params = useMemo(() => parsePebConfig(description), [description]);

  const ridgeRise =
    (params.width / 2) * Math.tan((params.roofSlope * Math.PI) / 180);
  const ridgeHeight = params.eaveHeight + ridgeRise;
  const baySpacing = params.length / params.bays;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Interaction hints bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-700/50 shrink-0">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Box className="h-4 w-4 text-primary" />
          <span className="font-medium text-slate-300">
            PEB Structure — {params.width}×{params.length}m
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
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
          <PebCanvas3D params={params} />
        </div>
      </div>

      {/* Dimensions bar */}
      <div className="flex items-center justify-center gap-6 px-4 py-2 bg-slate-900/80 border-t border-slate-700/50 shrink-0">
        <div className="flex items-center gap-4 text-xs flex-wrap justify-center">
          <span className="text-blue-400">
            Width: <strong>{params.width}m</strong>
          </span>
          <span className="text-blue-400">
            Length: <strong>{params.length}m</strong>
          </span>
          <span className="text-blue-400">
            Eave: <strong>{params.eaveHeight}m</strong>
          </span>
          <span className="text-purple-400">
            Ridge: <strong>{ridgeHeight.toFixed(1)}m</strong>
          </span>
          <span className="text-slate-400">
            Slope: <strong>{params.roofSlope}°</strong>
          </span>
          <span className="text-slate-400">
            Bays: <strong>{params.bays}</strong> ({baySpacing.toFixed(1)}m)
          </span>
        </div>
      </div>
    </div>
  );
}
