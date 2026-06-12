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
  distanceFromStart: number; // Center of the opening along the wall
  width: number;
  height: number;
  elevation: number; // Distance from floor (0 for doors)
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
}

export const DEFAULT_AESTHETICS: Aesthetics = {
  wallColor: "#e2e8f0", // slate-200
  floorColor: "#94a3b8", // slate-400
  groundColor: "#0f172a", // slate-900 (for neon style: #020617)
  ambientLightIntensity: 0.5,
};
