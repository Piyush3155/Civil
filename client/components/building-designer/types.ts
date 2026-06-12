export type Point2D = { x: number; y: number };

export interface WallNode {
  id: string;
  x: number;
  y: number;
  floorIndex?: number; // Level index (0 = Ground Floor, 1 = First Floor, etc.)
}

export interface Wall {
  id: string;
  startNodeId: string;
  endNodeId: string;
  thickness: number;
  height: number;
  color?: string; // Customizable color
  floorIndex?: number;
}

export interface Opening {
  id: string;
  wallId: string;
  type: "door" | "window";
  distanceFromStart: number; // Center of the opening along the wall in SVG coordinates
  width: number; // in meters
  height: number; // in meters
  elevation: number; // in meters (distance from floor)
  floorIndex?: number;
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
  roofType: "flat" | "pitched" | "hip" | "shed";
  roofHeight: number; // height of ridge pitch in meters
}

export const DEFAULT_AESTHETICS: Aesthetics = {
  wallColor: "#cbd5e1",
  floorColor: "#475569",
  groundColor: "#0f172a",
  ambientLightIntensity: 0.6,
  showRoof: false,
  roofColor: "#64748b",
  roofType: "flat",
  roofHeight: 2.0,
};
