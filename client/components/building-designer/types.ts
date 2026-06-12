export type Point2D = { x: number; y: number };

export interface WallNode {
  id: string;
  x: number;
  y: number;
}

export interface Wall {
  id: string;
  startNodeId: string;
  endNodeId: string;
  thickness: number;
  height: number;
  color?: string; // Customizable color
}

export interface Opening {
  id: string;
  wallId: string;
  type: "door" | "window";
  distanceFromStart: number; // Center of the opening along the wall in SVG coordinates (scaled by PIXELS_PER_METER)
  width: number; // in meters
  height: number; // in meters
  elevation: number; // in meters (distance from floor, e.g., 0 for doors, 0.9 for standard windows)
}

export interface FloorPlanData {
  nodes: WallNode[];
  walls: Wall[];
  openings: Opening[];
}

export interface Aesthetics {
  wallColor: string;
  floorColor: string;
  groundColor: string;
  ambientLightIntensity: number;
  // Roof aesthetics
  showRoof: boolean;
  roofColor: string;
  roofType: "flat" | "pitched";
  roofHeight: number; // in meters (height of pitch above the wall height)
}

export const DEFAULT_AESTHETICS: Aesthetics = {
  wallColor: "#cbd5e1", // slate-300
  floorColor: "#475569", // slate-600
  groundColor: "#0f172a", // slate-900
  ambientLightIntensity: 0.6,
  showRoof: false,
  roofColor: "#64748b", // slate-500
  roofType: "flat",
  roofHeight: 2.0,
};
