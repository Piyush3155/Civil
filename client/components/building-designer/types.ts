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

export type SiteElementType = "grass" | "parking" | "vehicle" | "gate" | "tree" | "stairs" | "compound";

export interface SiteElement {
  id: string;
  type: SiteElementType;
  x: number; // Center x in SVG coordinates
  y: number; // Center y in SVG coordinates
  rotation: number; // degrees
  width: number; // in meters (width along local X)
  length: number; // in meters (length/depth along local Y/Z)
  floorIndex?: number; // Usually 0 for ground level elements
  style?: "solid" | "brick" | "modern" | "picket"; // For designed compound options
}

export interface RoomLabel {
  id: string;
  text: string; // e.g. "Bedroom", "Kitchen", "Bathroom"
  x: number; // Center x in SVG coordinates
  y: number; // Center y in SVG coordinates
  floorIndex?: number;
}

export interface FloorPlanData {
  nodes: WallNode[];
  walls: Wall[];
  openings: Opening[];
  siteElements?: SiteElement[]; // Optional for backward compatibility
  roomLabels?: RoomLabel[]; // Optional for backward compatibility
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
