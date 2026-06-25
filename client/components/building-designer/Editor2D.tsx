"use client";

import { useState, useRef, useEffect, MouseEvent } from "react";
import { FloorPlanData, WallNode, Wall, Opening, SiteElement, SiteElementType, RoomLabel } from "./types";
import { Plus, MousePointer2, Trash2, FileDown, DoorOpen, PlusCircle, MinusCircle, Trees, Car, LayoutPanelLeft, Fence, Box, Tag, Footprints, Settings, Ruler, Columns3, Bath, CookingPot, BedDouble, Sofa, UtensilsCrossed, Warehouse, Droplets, Pilcrow, Armchair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";

interface Editor2DProps {
  data: FloorPlanData;
  onChange: (data: FloorPlanData) => void;
  title?: string;
}

type Mode = "select" | "draw_wall" | "add_door" | "add_window" | "add_grass" | "add_parking" | "add_vehicle" | "add_gate" | "add_tree" | "add_stairs" | "add_label" | "add_compound" | "add_column" | "add_beam" | "add_toilet" | "add_washbasin" | "add_counter" | "add_stove" | "add_bed" | "add_sofa" | "add_dining_table" | "add_wardrobe" | "add_balcony_railing" | "add_water_tank" | "measure";

export default function Editor2D({ data, onChange, title }: Editor2DProps) {
  const [mode, setMode] = useState<Mode>("select");
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [selectedOpeningId, setSelectedOpeningId] = useState<string | null>(null);
  const [selectedSiteElementId, setSelectedSiteElementId] = useState<string | null>(null);
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [drawingStartNode, setDrawingStartNode] = useState<WallNode | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [snappedWallInfo, setSnappedWallInfo] = useState<{ wall: Wall; t: number } | null>(null);
  const [activeFloor, setActiveFloor] = useState<number>(0);
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);
  const [measureEnd, setMeasureEnd] = useState<{ x: number; y: number } | null>(null);
  const [measureLines, setMeasureLines] = useState<Array<{ x1: number; y1: number; x2: number; y2: number; dist: number }>>([]); 
  const svgRef = useRef<SVGSVGElement>(null);

  // Constants
  const GRID_SIZE = 20;
  const SNAP_DISTANCE = 15;
  const PIXELS_PER_METER = 20; // 1 Meter = 20 SVG units

  // Helper to find defined floors dynamically
  const maxFloorIndex = Math.max(
    0,
    ...data.nodes.map((n) => n.floorIndex || 0),
    ...data.walls.map((w) => w.floorIndex || 0)
  );

  const getSvgCoordinates = (e: MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    return {
      x: (e.clientX - CTM.e) / CTM.a,
      y: (e.clientY - CTM.f) / CTM.d,
    };
  };

  const snapToGrid = (val: number) => Math.round(val / GRID_SIZE) * GRID_SIZE;

  // Filter current floor walls/nodes/openings
  const currentNodes = data.nodes.filter(n => (n.floorIndex || 0) === activeFloor);
  const currentWalls = data.walls.filter(w => (w.floorIndex || 0) === activeFloor);
  const currentOpenings = data.openings.filter(o => (o.floorIndex || 0) === activeFloor);

  const handleMouseMove = (e: MouseEvent) => {
    const rawPos = getSvgCoordinates(e);

    if (mode === "add_door" || mode === "add_window") {
      let snapWall: Wall | null = null;
      let snapPos = { x: 0, y: 0 };
      let snapDist = Infinity;
      let snapT = 0;

      // Only snap to walls on the active floor
      currentWalls.forEach(wall => {
        const start = data.nodes.find(n => n.id === wall.startNodeId);
        const end = data.nodes.find(n => n.id === wall.endNodeId);
        if (!start || !end) return;

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const wallLen = Math.hypot(dx, dy);
        if (wallLen === 0) return;

        let t = ((rawPos.x - start.x) * dx + (rawPos.y - start.y) * dy) / (wallLen * wallLen);
        t = Math.max(0, Math.min(1, t));

        const projX = start.x + t * dx;
        const projY = start.y + t * dy;
        const dist = Math.hypot(rawPos.x - projX, rawPos.y - projY);

        if (dist < snapDist) {
          snapDist = dist;
          snapPos = { x: projX, y: projY };
          snapT = t;
          snapWall = wall;
        }
      });

      if (snapWall && snapDist < 30) {
        setMousePos(snapPos);
        setSnappedWallInfo({ wall: snapWall, t: snapT });
      } else {
        setMousePos({ x: snapToGrid(rawPos.x), y: snapToGrid(rawPos.y) });
        setSnappedWallInfo(null);
      }
    } else {
      let snappedPos = {
        x: snapToGrid(rawPos.x),
        y: snapToGrid(rawPos.y),
      };

      for (const node of currentNodes) {
        const dist = Math.hypot(node.x - rawPos.x, node.y - rawPos.y);
        if (dist < SNAP_DISTANCE) {
          snappedPos = { x: node.x, y: node.y };
          break;
        }
      }

      setMousePos(snappedPos);
      setSnappedWallInfo(null);
      
      if (isDraggingElement) {
        if (selectedSiteElementId) {
          const newSiteElements = (data.siteElements || []).map(s => 
            s.id === selectedSiteElementId ? { ...s, x: snappedPos.x, y: snappedPos.y } : s
          );
          onChange({ ...data, siteElements: newSiteElements });
        } else if (selectedLabelId) {
          const newLabels = (data.roomLabels || []).map(l => 
            l.id === selectedLabelId ? { ...l, x: snappedPos.x, y: snappedPos.y } : l
          );
          onChange({ ...data, roomLabels: newLabels });
        }
      }
    }
  };

  const handleSvgClick = (e: MouseEvent) => {
    if (mode === "select") {
      setSelectedWallId(null);
      setSelectedOpeningId(null);
      setSelectedSiteElementId(null);
      setSelectedLabelId(null);
      return;
    }

    if (mode === "draw_wall") {
      const pos = mousePos;

      let existingNode = currentNodes.find(n => n.x === pos.x && n.y === pos.y);
      let nodeId = existingNode?.id;

      let newNodes = [...data.nodes];
      if (!existingNode) {
        nodeId = `node_${Date.now()}`;
        const newNode = { id: nodeId, x: pos.x, y: pos.y, floorIndex: activeFloor };
        newNodes.push(newNode);
        existingNode = newNode;
      }

      if (!drawingStartNode) {
        setDrawingStartNode(existingNode);
        onChange({ ...data, nodes: newNodes });
      } else {
        if (drawingStartNode.id !== nodeId) {
          const newWall: Wall = {
            id: `wall_${Date.now()}`,
            startNodeId: drawingStartNode.id,
            endNodeId: nodeId as string,
            thickness: 0.2,
            height: 3,
            floorIndex: activeFloor,
          };
          onChange({
            ...data,
            nodes: newNodes,
            walls: [...data.walls, newWall]
          });
        }
        setDrawingStartNode(existingNode);
      }
    }

    if ((mode === "add_door" || mode === "add_window") && snappedWallInfo) {
      const { wall, t } = snappedWallInfo;
      const start = data.nodes.find(n => n.id === wall.startNodeId);
      const end = data.nodes.find(n => n.id === wall.endNodeId);
      if (start && end) {
        const wallLen = Math.hypot(end.x - start.x, end.y - start.y);
        const newOpening: Opening = {
          id: `opening_${Date.now()}`,
          wallId: wall.id,
          type: mode === "add_door" ? "door" : "window",
          distanceFromStart: t * wallLen,
          width: mode === "add_door" ? 0.9 : 1.2,
          height: mode === "add_door" ? 2.1 : 1.2,
          elevation: mode === "add_door" ? 0 : 0.9,
          floorIndex: activeFloor,
        };

        onChange({
          ...data,
          openings: [...data.openings, newOpening]
        });
      }
    }

    if (mode === "measure") {
      if (!measureStart) {
        setMeasureStart({ x: mousePos.x, y: mousePos.y });
      } else {
        const dist = Math.hypot(mousePos.x - measureStart.x, mousePos.y - measureStart.y) / PIXELS_PER_METER;
        setMeasureLines(prev => [...prev, { x1: measureStart.x, y1: measureStart.y, x2: mousePos.x, y2: mousePos.y, dist }]);
        setMeasureStart(null);
        setMeasureEnd(null);
      }
      return;
    }

    if (mode.startsWith("add_") && !["add_door", "add_window", "add_label"].includes(mode)) {
      const typeMap: Record<string, SiteElementType> = {
        add_grass: "grass",
        add_parking: "parking",
        add_vehicle: "vehicle",
        add_gate: "gate",
        add_tree: "tree",
        add_stairs: "stairs",
        add_compound: "compound",
        add_column: "column",
        add_beam: "beam",
        add_toilet: "toilet",
        add_washbasin: "washbasin",
        add_counter: "counter",
        add_stove: "stove",
        add_bed: "bed",
        add_sofa: "sofa",
        add_dining_table: "dining_table",
        add_wardrobe: "wardrobe",
        add_balcony_railing: "balcony_railing",
        add_water_tank: "water_tank",
      };
      const siteType = typeMap[mode];
      if (siteType) {
        let defaultWidth = 2;
        let defaultLength = 2;
        if (siteType === "grass") { defaultWidth = 4; defaultLength = 4; }
        if (siteType === "parking") { defaultWidth = 3; defaultLength = 5; }
        if (siteType === "vehicle") { defaultWidth = 2; defaultLength = 4.5; }
        if (siteType === "gate") { defaultWidth = 3; defaultLength = 1; }
        if (siteType === "tree") { defaultWidth = 1.5; defaultLength = 1.5; }
        if (siteType === "stairs") { defaultWidth = 1.2; defaultLength = 3; }
        if (siteType === "compound") { defaultWidth = 20; defaultLength = 15; }
        if (siteType === "column") { defaultWidth = 0.3; defaultLength = 0.3; }
        if (siteType === "beam") { defaultWidth = 0.3; defaultLength = 3; }
        if (siteType === "toilet") { defaultWidth = 0.5; defaultLength = 0.7; }
        if (siteType === "washbasin") { defaultWidth = 0.5; defaultLength = 0.4; }
        if (siteType === "counter") { defaultWidth = 2.5; defaultLength = 0.6; }
        if (siteType === "stove") { defaultWidth = 0.6; defaultLength = 0.6; }
        if (siteType === "bed") { defaultWidth = 1.8; defaultLength = 2; }
        if (siteType === "sofa") { defaultWidth = 2; defaultLength = 0.8; }
        if (siteType === "dining_table") { defaultWidth = 1.5; defaultLength = 0.9; }
        if (siteType === "wardrobe") { defaultWidth = 1.8; defaultLength = 0.6; }
        if (siteType === "balcony_railing") { defaultWidth = 3; defaultLength = 0.5; }
        if (siteType === "water_tank") { defaultWidth = 1.5; defaultLength = 1.5; }

        const newSiteElement: SiteElement = {
          id: `site_${Date.now()}`,
          type: siteType,
          x: mousePos.x,
          y: mousePos.y,
          rotation: 0,
          width: defaultWidth,
          length: defaultLength,
          floorIndex: activeFloor,
        };

        onChange({
          ...data,
          siteElements: [...(data.siteElements || []), newSiteElement],
        });
      }
      return;
    }

    if (mode === "add_label") {
      const presets = ["Bedroom", "Bathroom", "Kitchen", "Living Room", "Dining Room", "Hall", "Balcony", "Store", "Garage", "Office", "Lobby", "Staircase"];
      const labelText = prompt(
        `Enter room name:\n\nPresets: ${presets.join(", ")}\n\nOr type your own:`
      );
      if (labelText && labelText.trim()) {
        const newLabel: RoomLabel = {
          id: `label_${Date.now()}`,
          text: labelText.trim(),
          x: mousePos.x,
          y: mousePos.y,
          floorIndex: activeFloor,
        };
        onChange({
          ...data,
          roomLabels: [...(data.roomLabels || []), newLabel],
        });
      }
      return;
    }
  };

  const handleDelete = () => {
    if (selectedWallId) {
      const newWalls = data.walls.filter(w => w.id !== selectedWallId);
      const newOpenings = data.openings.filter(o => o.wallId !== selectedWallId);
      
      const usedNodeIds = new Set<string>();
      newWalls.forEach(w => {
        usedNodeIds.add(w.startNodeId);
        usedNodeIds.add(w.endNodeId);
      });
      const newNodes = data.nodes.filter(n => usedNodeIds.has(n.id));

      onChange({ ...data, walls: newWalls, nodes: newNodes, openings: newOpenings });
      setSelectedWallId(null);
    } else if (selectedOpeningId) {
      const newOpenings = data.openings.filter(o => o.id !== selectedOpeningId);
      onChange({ ...data, openings: newOpenings });
      setSelectedOpeningId(null);
    } else if (selectedSiteElementId) {
      const newSiteElements = (data.siteElements || []).filter(s => s.id !== selectedSiteElementId);
      onChange({ ...data, siteElements: newSiteElements });
      setSelectedSiteElementId(null);
    } else if (selectedLabelId) {
      const newLabels = (data.roomLabels || []).filter(l => l.id !== selectedLabelId);
      onChange({ ...data, roomLabels: newLabels });
      setSelectedLabelId(null);
    }
  };

  const handleAddFloor = () => {
    setActiveFloor(maxFloorIndex + 1);
  };

  const handleDeleteFloor = () => {
    if (activeFloor === 0) {
      // Clear ground floor
      const newWalls = data.walls.filter(w => (w.floorIndex || 0) !== 0);
      const newOpenings = data.openings.filter(o => (o.floorIndex || 0) !== 0);
      const newNodes = data.nodes.filter(n => (n.floorIndex || 0) !== 0);
      onChange({ ...data, walls: newWalls, nodes: newNodes, openings: newOpenings });
      return;
    }

    // Delete current floor and shift floors above down (optional) or just delete current floor
    const newWalls = data.walls.filter(w => (w.floorIndex || 0) !== activeFloor);
    const newOpenings = data.openings.filter(o => (o.floorIndex || 0) !== activeFloor);
    const newNodes = data.nodes.filter(n => (n.floorIndex || 0) !== activeFloor);
    
    onChange({ ...data, walls: newWalls, nodes: newNodes, openings: newOpenings });
    setActiveFloor(activeFloor - 1);
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm" });
    const titleText = title || "Building Floor Plan";

    // Global layout scaling coordinates based on ALL nodes
    const paperCX = 95;
    const paperCY = 100;

    let minX = -100, maxX = 100, minY = -100, maxY = 100;
    if (data.nodes.length > 0) {
      minX = Math.min(...data.nodes.map(n => n.x)) - 60;
      maxX = Math.max(...data.nodes.map(n => n.x)) + 60;
      minY = Math.min(...data.nodes.map(n => n.y)) - 60;
      maxY = Math.max(...data.nodes.map(n => n.y)) + 60;
    }

    const w = maxX - minX;
    const h = maxY - minY;
    const scaleMM = Math.min(160 / (w || 1), 120 / (h || 1));

    const mapX = (svgX: number) => paperCX + (svgX - (minX + maxX) / 2) * scaleMM;
    const mapY = (svgY: number) => paperCY + (svgY - (minY + maxY) / 2) * scaleMM;

    for (let floor = 0; floor <= maxFloorIndex; floor++) {
      if (floor > 0) doc.addPage();

      // Draw border
      doc.setDrawColor(71, 85, 105);
      doc.setLineWidth(0.8);
      doc.rect(8, 8, 281, 194);
      doc.rect(9.5, 9.5, 278, 191);

      // Write title block
      doc.rect(190, 140, 97.5, 60.5);
      doc.line(190, 153, 287.5, 153);
      doc.line(190, 168, 287.5, 168);
      doc.line(238.75, 168, 238.75, 200.5);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text("CIVIL DESK", 194, 147);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("ENGINEERING PLAN DESIGNER", 194, 151);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("DRAWING TITLE:", 194, 157);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${titleText} - ${floor === 0 ? "GROUND FLOOR" : `FLOOR ${floor}`}`, 194, 163);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("SCALE: 1:100 (A4)", 194, 175);
      doc.text("DATE: " + new Date().toLocaleDateString(), 194, 184);

      doc.text(`LEVEL: L${floor}`, 242.75, 175);
      doc.text("VERSION: 1.0", 242.75, 184);

      // Draw background grid lines on blueprint
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.1);
      for (let g = -500; g <= 500; g += GRID_SIZE) {
        if (mapX(g) >= 12 && mapX(g) <= 185) doc.line(mapX(g), mapY(-500), mapX(g), mapY(500));
        if (mapY(g) >= 12 && mapY(g) <= 190) doc.line(mapX(-500), mapY(g), mapX(500), mapY(g));
      }

      // Draw walls on this floor
      doc.setDrawColor(51, 65, 85);
      const floorWalls = data.walls.filter(w => (w.floorIndex || 0) === floor);
      const floorOpenings = data.openings.filter(o => (o.floorIndex || 0) === floor);

      floorWalls.forEach(wall => {
        const start = data.nodes.find(n => n.id === wall.startNodeId);
        const end = data.nodes.find(n => n.id === wall.endNodeId);
        if (start && end) {
          const thicknessMM = wall.thickness * PIXELS_PER_METER * scaleMM;
          doc.setLineWidth(thicknessMM);
          doc.line(mapX(start.x), mapY(start.y), mapX(end.x), mapY(end.y));
        }
      });

      // Erase openings and draw door swing arcs / window highlights
      floorOpenings.forEach(opening => {
        const wall = data.walls.find(w => w.id === opening.wallId);
        if (!wall) return;
        const start = data.nodes.find(n => n.id === wall.startNodeId);
        const end = data.nodes.find(n => n.id === wall.endNodeId);
        if (start && end) {
          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const wallLen = Math.hypot(dx, dy);
          const ux = dx / wallLen;
          const uy = dy / wallLen;
          const cx = start.x + ux * opening.distanceFromStart;
          const cy = start.y + uy * opening.distanceFromStart;
          const wPx = opening.width * PIXELS_PER_METER;

          const ox1 = cx - ux * (wPx / 2);
          const oy1 = cy - uy * (wPx / 2);
          const ox2 = cx + ux * (wPx / 2);
          const oy2 = cy + uy * (wPx / 2);

          // Erase wall segment underneath the opening
          doc.setDrawColor(255, 255, 255);
          doc.setLineWidth(wall.thickness * PIXELS_PER_METER * scaleMM + 0.3);
          doc.line(mapX(ox1), mapY(oy1), mapX(ox2), mapY(oy2));

          const angle = Math.atan2(dy, dx);
          const px = -Math.sin(angle);
          const py = Math.cos(angle);

          if (opening.type === "door") {
            const sx = px * wPx;
            const sy = py * wPx;

            doc.setDrawColor(244, 63, 94); // rose-500 door
            doc.setLineWidth(0.4);
            doc.line(mapX(ox1), mapY(oy1), mapX(ox1 + sx), mapY(oy1 + sy)); // door panel

            // Dotted swing path
            doc.setLineWidth(0.15);
            const segments = 8;
            let prevX = ox2;
            let prevY = oy2;
            for (let i = 1; i <= segments; i++) {
              const theta = (i / segments) * (Math.PI / 2);
              const localX = wPx * Math.cos(theta);
              const localY = wPx * Math.sin(theta);
              const arcX = ox1 + (localX * ux - localY * px);
              const arcY = oy1 + (localX * uy - localY * py);
              if (i % 2 === 0) {
                doc.line(mapX(prevX), mapY(prevY), mapX(arcX), mapY(arcY));
              }
              prevX = arcX;
              prevY = arcY;
            }
          } else {
            // Window
            doc.setDrawColor(14, 165, 233); // sky-500 window
            doc.setLineWidth(0.3);
            doc.line(mapX(ox1), mapY(oy1), mapX(ox2), mapY(oy2));
            doc.setLineWidth(0.1);
            const thicknessMM = (wall.thickness * PIXELS_PER_METER * scaleMM) / 2;
            doc.line(mapX(ox1 + px * thicknessMM), mapY(oy1 + py * thicknessMM), mapX(ox2 + px * thicknessMM), mapY(oy2 + py * thicknessMM));
            doc.line(mapX(ox1 - px * thicknessMM), mapY(oy1 - py * thicknessMM), mapX(ox2 - px * thicknessMM), mapY(oy2 - py * thicknessMM));
          }
        }
      });

      // Write dimensions on this floor
      doc.setTextColor(2, 132, 199);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      floorWalls.forEach(wall => {
        const start = data.nodes.find(n => n.id === wall.startNodeId);
        const end = data.nodes.find(n => n.id === wall.endNodeId);
        if (start && end) {
          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const lenM = Math.hypot(dx, dy) / PIXELS_PER_METER;
          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2;
          const angle = Math.atan2(dy, dx);
          const px = -Math.sin(angle);
          const py = Math.cos(angle);
          const tx = midX + px * 15;
          const ty = midY + py * 15;

          doc.text(`${lenM.toFixed(1)}m`, mapX(tx), mapY(ty), { align: "center" });
        }
      });

      // Draw Site Elements
      const floorSites = (data.siteElements || []).filter(s => (s.floorIndex || 0) === floor);
      floorSites.forEach(site => {
        const wMM = site.width * PIXELS_PER_METER * scaleMM;
        const lMM = site.length * PIXELS_PER_METER * scaleMM;
        const sx = mapX(site.x);
        const sy = mapY(site.y);

        // A basic representation for blueprint: save context is not easy in raw jspdf without advanced plugins,
        // so we just draw the bounding box to keep it simple, applying rotation manually if possible, or just a simple rect if not rotated.
        // For simplicity, let's draw a rotated rectangle manually using lines.
        const rad = (site.rotation * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        const pts = [
          { x: -wMM/2, y: -lMM/2 },
          { x: wMM/2, y: -lMM/2 },
          { x: wMM/2, y: lMM/2 },
          { x: -wMM/2, y: lMM/2 }
        ].map(p => ({
          x: sx + (p.x * cos - p.y * sin),
          y: sy + (p.x * sin + p.y * cos)
        }));

        if (site.type === "grass") {
          doc.setDrawColor(34, 197, 94); // green
          doc.setLineWidth(0.5);
        } else if (site.type === "parking") {
          doc.setDrawColor(100, 116, 139); // slate
          doc.setLineWidth(0.8);
        } else if (site.type === "vehicle") {
          doc.setDrawColor(2, 132, 199); // sky
          doc.setLineWidth(0.6);
        } else if (site.type === "gate") {
          doc.setDrawColor(180, 83, 9); // amber/brown
          doc.setLineWidth(1.0);
        } else if (site.type === "tree") {
          doc.setDrawColor(21, 128, 61); // green
          doc.setLineWidth(0.6);
          // Drawing a simple circle
          doc.circle(sx, sy, wMM/2, "S");
          return; // Skip rect drawing
        } else if (site.type === "stairs") {
          doc.setDrawColor(120, 113, 108); // stone
          doc.setLineWidth(0.6);
          // Draw rect with tread lines inside
          doc.line(pts[0].x, pts[0].y, pts[1].x, pts[1].y);
          doc.line(pts[1].x, pts[1].y, pts[2].x, pts[2].y);
          doc.line(pts[2].x, pts[2].y, pts[3].x, pts[3].y);
          doc.line(pts[3].x, pts[3].y, pts[0].x, pts[0].y);
          // Draw tread lines
          const numTreads = Math.max(3, Math.round(lMM / 2));
          const cos = Math.cos((site.rotation * Math.PI) / 180);
          const sin = Math.sin((site.rotation * Math.PI) / 180);
          doc.setLineWidth(0.2);
          for (let i = 1; i < numTreads; i++) {
            const frac = i / numTreads;
            const tx1 = sx + ((-wMM/2) * cos - (-lMM/2 + lMM * frac) * sin);
            const ty1 = sy + ((-wMM/2) * sin + (-lMM/2 + lMM * frac) * cos);
            const tx2 = sx + ((wMM/2) * cos - (-lMM/2 + lMM * frac) * sin);
            const ty2 = sy + ((wMM/2) * sin + (-lMM/2 + lMM * frac) * cos);
            doc.line(tx1, ty1, tx2, ty2);
          }
          doc.setTextColor(100, 116, 139);
          doc.setFontSize(6);
          doc.text("STAIRS", sx, sy, { align: "center", baseline: "middle" });
          return; // Skip default rect drawing
        }

        // Draw rotated rect
        doc.line(pts[0].x, pts[0].y, pts[1].x, pts[1].y);
        doc.line(pts[1].x, pts[1].y, pts[2].x, pts[2].y);
        doc.line(pts[2].x, pts[2].y, pts[3].x, pts[3].y);
        doc.line(pts[3].x, pts[3].y, pts[0].x, pts[0].y);

        // Add label
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(6);
        doc.text(site.type.toUpperCase(), sx, sy, { align: "center", baseline: "middle" });
      });

      // Draw Room Labels
      const floorLabels = (data.roomLabels || []).filter(l => (l.floorIndex || 0) === floor);
      floorLabels.forEach(label => {
        const lx = mapX(label.x);
        const ly = mapY(label.y);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(label.text.toUpperCase(), lx, ly, { align: "center", baseline: "middle" });
      });
    }

    // Download
    doc.save(`${titleText.replace(/\s+/g, "_")}.pdf`);
  };

  const handleDeleteRef = useRef(handleDelete);
  handleDeleteRef.current = handleDelete;
  const selectedSiteElementIdRef = useRef(selectedSiteElementId);
  selectedSiteElementIdRef.current = selectedSiteElementId;
  const dataRef = useRef(data);
  dataRef.current = data;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawingStartNode(null);
        setMode("select");
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        handleDeleteRef.current();
      }
      if (e.key === "R" || e.key === "r") {
        const siteId = selectedSiteElementIdRef.current;
        if (siteId) {
          const currentData = dataRef.current;
          const newSiteElements = (currentData.siteElements || []).map(s => {
            if (s.id === siteId) {
              return { ...s, rotation: (s.rotation + 90) % 360 };
            }
            return s;
          });
          onChangeRef.current({ ...currentData, siteElements: newSiteElements });
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="w-full h-full relative flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Floor Stack Navigation and controls */}
      <div className="absolute top-14 lg:top-4 left-4 z-10 flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl shadow-sm">
        <select
          className="bg-transparent text-slate-700 dark:text-slate-200 border-none rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-violet-500/50 outline-none cursor-pointer"
          value={activeFloor}
          onChange={(e) => {
            setActiveFloor(parseInt(e.target.value));
            setDrawingStartNode(null);
            setSelectedWallId(null);
            setSelectedOpeningId(null);
            setSelectedSiteElementId(null);
          }}
        >
          {Array.from({ length: maxFloorIndex + 1 }, (_, i) => (
            <option key={i} value={i}>
              {i === 0 ? "Ground Floor" : `Floor ${i}`}
            </option>
          ))}
        </select>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-xl" 
          onClick={handleAddFloor}
          title="Add Floor"
        >
          <PlusCircle className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl" 
          disabled={maxFloorIndex === 0 && activeFloor === 0}
          onClick={handleDeleteFloor}
          title="Delete Level"
        >
          <MinusCircle className="h-4 w-4" />
        </Button>
      </div>

      {/* 2D Design Toolbar (Right Sidebar) */}
      <div className="absolute top-4 right-4 bottom-4 z-10 w-52 flex flex-col gap-5 overflow-y-auto overflow-x-hidden custom-scrollbar bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-3xl shadow-2xl p-4">
        
        {/* Core & Structural */}
        <div className="flex flex-col gap-1">
          <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 px-1">Structural</h3>
          <Button variant={mode === "select" ? "default" : "ghost"} size="sm" className="w-full justify-start h-8 text-xs rounded-xl" onClick={() => { setMode("select"); setDrawingStartNode(null); }}>
            <MousePointer2 className="h-3.5 w-3.5 mr-2" /> Select
          </Button>
          <Button variant={mode === "draw_wall" ? "default" : "ghost"} size="sm" className="w-full justify-start h-8 text-xs rounded-xl" onClick={() => setMode("draw_wall")}>
            <Plus className="h-3.5 w-3.5 mr-2" /> Wall
          </Button>
          <Button variant={mode === "add_door" ? "default" : "ghost"} size="sm" className="w-full justify-start h-8 text-xs rounded-xl" onClick={() => { setMode("add_door"); setDrawingStartNode(null); }}>
            <DoorOpen className="h-3.5 w-3.5 mr-2" /> Door
          </Button>
          <Button variant={mode === "add_window" ? "default" : "ghost"} size="sm" className="w-full justify-start h-8 text-xs rounded-xl" onClick={() => { setMode("add_window"); setDrawingStartNode(null); }}>
            <Plus className="h-3.5 w-3.5 mr-2" /> Window
          </Button>
          <Button variant={mode === "add_column" ? "default" : "ghost"} size="sm" className="w-full justify-start h-8 text-xs rounded-xl" onClick={() => { setMode("add_column"); setDrawingStartNode(null); }}>
            <Columns3 className="h-3.5 w-3.5 mr-2" /> Column
          </Button>
          <Button variant={mode === "add_beam" ? "default" : "ghost"} size="sm" className="w-full justify-start h-8 text-xs rounded-xl" onClick={() => { setMode("add_beam"); setDrawingStartNode(null); }}>
            <Box className="h-3.5 w-3.5 mr-2" /> Beam
          </Button>
          <Button variant={mode === "add_stairs" ? "default" : "ghost"} size="sm" className="w-full justify-start h-8 text-xs rounded-xl" onClick={() => { setMode("add_stairs"); setDrawingStartNode(null); }}>
            <Footprints className="h-3.5 w-3.5 mr-2" /> Stairs
          </Button>
        </div>

        {/* Fixtures */}
        <div className="flex flex-col gap-1">
          <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 px-1">Fixtures</h3>
          <Button variant={mode === "add_toilet" ? "default" : "ghost"} size="sm" className="w-full justify-start h-8 text-xs rounded-xl" onClick={() => { setMode("add_toilet"); setDrawingStartNode(null); }}>
            <Bath className="h-3.5 w-3.5 mr-2" /> Toilet
          </Button>
          <Button variant={mode === "add_washbasin" ? "default" : "ghost"} size="sm" className="w-full justify-start h-8 text-xs rounded-xl" onClick={() => { setMode("add_washbasin"); setDrawingStartNode(null); }}>
            <Droplets className="h-3.5 w-3.5 mr-2" /> Washbasin
          </Button>
          <Button variant={mode === "add_counter" ? "default" : "ghost"} size="sm" className="w-full justify-start h-8 text-xs rounded-xl" onClick={() => { setMode("add_counter"); setDrawingStartNode(null); }}>
            <UtensilsCrossed className="h-3.5 w-3.5 mr-2" /> Counter
          </Button>
          <Button variant={mode === "add_stove" ? "default" : "ghost"} size="sm" className="w-full justify-start h-8 text-xs rounded-xl" onClick={() => { setMode("add_stove"); setDrawingStartNode(null); }}>
            <CookingPot className="h-3.5 w-3.5 mr-2" /> Stove
          </Button>
        </div>

        {/* Furniture */}
        <div className="flex flex-col gap-1">
          <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 px-1">Furniture</h3>
          <Button variant={mode === "add_bed" ? "default" : "ghost"} size="sm" className="w-full justify-start h-8 text-xs rounded-xl" onClick={() => { setMode("add_bed"); setDrawingStartNode(null); }}>
            <BedDouble className="h-3.5 w-3.5 mr-2" /> Bed
          </Button>
          <Button variant={mode === "add_sofa" ? "default" : "ghost"} size="sm" className="w-full justify-start h-8 text-xs rounded-xl" onClick={() => { setMode("add_sofa"); setDrawingStartNode(null); }}>
            <Sofa className="h-3.5 w-3.5 mr-2" /> Sofa
          </Button>
          <Button variant={mode === "add_dining_table" ? "default" : "ghost"} size="sm" className="w-full justify-start h-8 text-xs rounded-xl" onClick={() => { setMode("add_dining_table"); setDrawingStartNode(null); }}>
            <Armchair className="h-3.5 w-3.5 mr-2" /> Dining
          </Button>
          <Button variant={mode === "add_wardrobe" ? "default" : "ghost"} size="sm" className="w-full justify-start h-8 text-xs rounded-xl" onClick={() => { setMode("add_wardrobe"); setDrawingStartNode(null); }}>
            <Box className="h-3.5 w-3.5 mr-2" /> Wardrobe
          </Button>
        </div>

        {/* Outdoor & Misc */}
        <div className="flex flex-col gap-1">
          <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 px-1">Exterior & Environment</h3>
          <Button variant={mode === "add_compound" ? "default" : "ghost"} size="sm" className="w-full justify-start h-8 text-xs rounded-xl" onClick={() => { setMode("add_compound"); setDrawingStartNode(null); }}>
            <Box className="h-3.5 w-3.5 mr-2" /> Compound Wall
          </Button>
          <Button variant={mode === "add_gate" ? "default" : "ghost"} size="sm" className="w-full justify-start h-8 text-xs rounded-xl" onClick={() => { setMode("add_gate"); setDrawingStartNode(null); }}>
            <Fence className="h-3.5 w-3.5 mr-2" /> Main Gate
          </Button>
          <Button variant={mode === "add_balcony_railing" ? "default" : "ghost"} size="sm" className="w-full justify-start h-8 text-xs rounded-xl" onClick={() => { setMode("add_balcony_railing"); setDrawingStartNode(null); }}>
            <Pilcrow className="h-3.5 w-3.5 mr-2" /> Balcony Railing
          </Button>
          <Button variant={mode === "add_water_tank" ? "default" : "ghost"} size="sm" className="w-full justify-start h-8 text-xs rounded-xl" onClick={() => { setMode("add_water_tank"); setDrawingStartNode(null); }}>
            <Warehouse className="h-3.5 w-3.5 mr-2" /> Water Tank
          </Button>
          <Button variant={mode === "add_tree" ? "default" : "ghost"} size="sm" className="w-full justify-start h-8 text-xs rounded-xl" onClick={() => { setMode("add_tree"); setDrawingStartNode(null); }}>
            <Trees className="h-3.5 w-3.5 mr-2" /> Tree
          </Button>
          <Button variant={mode === "add_grass" ? "default" : "ghost"} size="sm" className="w-full justify-start h-8 text-xs rounded-xl" onClick={() => { setMode("add_grass"); setDrawingStartNode(null); }}>
            <LayoutPanelLeft className="h-3.5 w-3.5 mr-2" /> Grass Area
          </Button>
          <Button variant={mode === "add_parking" ? "default" : "ghost"} size="sm" className="w-full justify-start h-8 text-xs rounded-xl" onClick={() => { setMode("add_parking"); setDrawingStartNode(null); }}>
            <Box className="h-3.5 w-3.5 mr-2" /> Parking Area
          </Button>
          <Button variant={mode === "add_vehicle" ? "default" : "ghost"} size="sm" className="w-full justify-start h-8 text-xs rounded-xl" onClick={() => { setMode("add_vehicle"); setDrawingStartNode(null); }}>
            <Car className="h-3.5 w-3.5 mr-2" /> Vehicle
          </Button>
        </div>

        {/* Utilities */}
        <div className="flex flex-col gap-1 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/60">
          <Button variant={mode === "add_label" ? "default" : "ghost"} size="sm" className="w-full justify-start h-8 text-xs rounded-xl" onClick={() => { setMode("add_label"); setDrawingStartNode(null); }}>
            <Tag className="h-3.5 w-3.5 mr-2" /> Room Label
          </Button>
          <Button variant={mode === "measure" ? "default" : "ghost"} size="sm" className="w-full justify-start h-8 text-xs rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 dark:hover:bg-indigo-900" onClick={() => { setMode("measure"); setMeasureStart(null); setDrawingStartNode(null); }}>
            <Ruler className="h-3.5 w-3.5 mr-2" /> Measure Tool
          </Button>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="icon" className="h-8 flex-1 rounded-xl hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/50" disabled={!selectedWallId && !selectedOpeningId && !selectedSiteElementId && !selectedLabelId} onClick={handleDelete} title="Delete Selected">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 flex-1 rounded-xl" onClick={handleDownloadPdf} title="Export as PDF">
              <FileDown className="h-3.5 w-3.5 text-sky-500" />
            </Button>
          </div>
        </div>

      </div>

      <svg
        ref={svgRef}
        className="w-full h-full cursor-crosshair touch-none"
        onMouseMove={handleMouseMove}
        onClick={handleSvgClick}
        onMouseUp={() => setIsDraggingElement(false)}
        onMouseLeave={() => setIsDraggingElement(false)}
        viewBox="-400 -300 800 600"
      >
        <defs>
          <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
            <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="#27272a" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect x="-2000" y="-2000" width="4000" height="4000" fill="url(#grid)" />

        {/* Lower Floor Ghost Trace Overlay */}
        {activeFloor > 0 && data.walls.filter(w => (w.floorIndex || 0) === activeFloor - 1).map(wall => {
          const start = data.nodes.find(n => n.id === wall.startNodeId);
          const end = data.nodes.find(n => n.id === wall.endNodeId);
          if (!start || !end) return null;
          return (
            <line
              key={`ghost_${wall.id}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke="#059669" // green overlay
              strokeWidth={wall.thickness * PIXELS_PER_METER}
              strokeDasharray="4,4"
              opacity={0.3}
              pointerEvents="none"
            />
          );
        })}

        {/* Dynamic Measurement overlay while drawing */}
        {mode === "draw_wall" && drawingStartNode && (
          <g>
            <line
              x1={drawingStartNode.x}
              y1={drawingStartNode.y}
              x2={mousePos.x}
              y2={mousePos.y}
              stroke="#94a3b8"
              strokeWidth={10}
              strokeDasharray="5,5"
              strokeLinecap="round"
              opacity={0.5}
            />
            <g transform={`translate(${(drawingStartNode.x + mousePos.x)/2}, ${(drawingStartNode.y + mousePos.y)/2})`}>
              <rect x={-20} y={-8} width={40} height={16} rx={4} fill="#1e293b" />
              <text textAnchor="middle" dominantBaseline="central" fill="#fbbf24" fontSize={9} fontWeight="bold">
                {(Math.hypot(mousePos.x - drawingStartNode.x, mousePos.y - drawingStartNode.y) / PIXELS_PER_METER).toFixed(1)}m
              </text>
            </g>
          </g>
        )}

        {/* Render Active Floor Walls */}
        {currentWalls.map(wall => {
          const start = data.nodes.find(n => n.id === wall.startNodeId);
          const end = data.nodes.find(n => n.id === wall.endNodeId);
          if (!start || !end) return null;

          const isSelected = selectedWallId === wall.id;
          const lengthMeters = Math.hypot(end.x - start.x, end.y - start.y) / PIXELS_PER_METER;

          const angleRad = Math.atan2(end.y - start.y, end.x - start.x);
          let angleDeg = (angleRad * 180) / Math.PI;
          if (angleDeg > 90 || angleDeg < -90) angleDeg += 180;

          const px = -Math.sin(angleRad);
          const py = Math.cos(angleRad);
          const textX = (start.x + end.x) / 2 + px * 15;
          const textY = (start.y + end.y) / 2 + py * 15;

          return (
            <g key={wall.id}>
              <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={isSelected ? "#3b82f6" : "#cbd5e1"}
                strokeWidth={wall.thickness * PIXELS_PER_METER}
                strokeLinecap="round"
                className={mode === "select" ? "cursor-pointer hover:stroke-blue-400 transition-colors" : ""}
                onClick={(e) => {
                  if (mode === "select") {
                    e.stopPropagation();
                    setSelectedWallId(wall.id);
                    setSelectedOpeningId(null);
                  }
                }}
              />
              <g transform={`translate(${textX}, ${textY}) rotate(${angleDeg})`}>
                <rect x={-20} y={-8} width={40} height={16} rx={4} fill="#1e293b" opacity={0.8} />
                <text textAnchor="middle" dominantBaseline="central" fill="#38bdf8" fontSize={10} fontWeight="semibold">
                  {lengthMeters.toFixed(1)}m
                </text>
              </g>
            </g>
          );
        })}

        {/* Render Active Floor Openings */}
        {currentOpenings.map(opening => {
          const wall = data.walls.find(w => w.id === opening.wallId);
          if (!wall) return null;
          const start = data.nodes.find(n => n.id === wall.startNodeId);
          const end = data.nodes.find(n => n.id === wall.endNodeId);
          if (!start || !end) return null;

          const isSelected = selectedOpeningId === opening.id;

          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const wallLen = Math.hypot(dx, dy);
          const ux = dx / wallLen;
          const uy = dy / wallLen;
          const px = -uy;
          const py = ux;

          const cx = start.x + ux * opening.distanceFromStart;
          const cy = start.y + uy * opening.distanceFromStart;
          const wPx = opening.width * PIXELS_PER_METER;
          const thicknessPx = wall.thickness * PIXELS_PER_METER;

          const x1 = cx - ux * (wPx / 2);
          const y1 = cy - uy * (wPx / 2);
          const x2 = cx + ux * (wPx / 2);
          const y2 = cy + uy * (wPx / 2);

          const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

          return (
            <g 
              key={opening.id} 
              onClick={(e) => {
                if (mode === "select") {
                  e.stopPropagation();
                  setSelectedOpeningId(opening.id);
                  setSelectedWallId(null);
                }
              }}
              className="cursor-pointer"
            >
              <rect
                x={-wPx/2}
                y={-thicknessPx/2 - 1}
                width={wPx}
                height={thicknessPx + 2}
                fill="#0f172a"
                transform={`translate(${cx}, ${cy}) rotate(${angleDeg})`}
              />

              {opening.type === "door" ? (
                <g>
                  <line x1={x1} y1={y1} x2={x1 + px * wPx} y2={y1 + py * wPx} stroke={isSelected ? "#3b82f6" : "#f43f5e"} strokeWidth={2.5} />
                  <path d={`M ${x2} ${y2} A ${wPx} ${wPx} 0 0 0 ${x1 + px * wPx} ${y1 + py * wPx}`} fill="none" stroke={isSelected ? "#3b82f6" : "#f43f5e"} strokeWidth={1.5} strokeDasharray="3,3" />
                </g>
              ) : (
                <g transform={`translate(${cx}, ${cy}) rotate(${angleDeg})`}>
                  <rect x={-wPx/2} y={-thicknessPx/2} width={wPx} height={thicknessPx} fill="none" stroke={isSelected ? "#3b82f6" : "#0ea5e9"} strokeWidth={1.5} />
                  <line x1={-wPx/2} y1={0} x2={wPx/2} y2={0} stroke={isSelected ? "#3b82f6" : "#38bdf8"} strokeWidth={2} />
                </g>
              )}
            </g>
          );
        })}

        {/* Structural nodes on current floor */}
        {currentNodes.map(node => (
          <circle key={node.id} cx={node.x} cy={node.y} r={4} fill="#475569" />
        ))}

        {/* Render Active Floor Site Elements */}
        {(data.siteElements || []).filter(s => (s.floorIndex || 0) === activeFloor).map(site => {
          const isSelected = selectedSiteElementId === site.id;
          const wPx = site.width * PIXELS_PER_METER;
          const lPx = site.length * PIXELS_PER_METER;

          let renderEl = null;
          if (site.type === "grass") {
            renderEl = <rect x={-wPx/2} y={-lPx/2} width={wPx} height={lPx} fill="#166534" opacity={0.6} stroke={isSelected ? "#3b82f6" : "#22c55e"} strokeWidth={isSelected ? 3 : 1} strokeDasharray="4,4" />;
          } else if (site.type === "parking") {
            renderEl = <rect x={-wPx/2} y={-lPx/2} width={wPx} height={lPx} fill="#334155" stroke={isSelected ? "#3b82f6" : "#475569"} strokeWidth={isSelected ? 3 : 2} />;
          } else if (site.type === "vehicle") {
            renderEl = (
              <g>
                <rect x={-wPx/2} y={-lPx/2} width={wPx} height={lPx} rx={4} fill="#0284c7" stroke={isSelected ? "#3b82f6" : "#0369a1"} strokeWidth={isSelected ? 3 : 1} />
                <rect x={-wPx/2 + 2} y={-lPx/4} width={wPx - 4} height={lPx/2} rx={2} fill="#0f172a" opacity={0.8} />
              </g>
            );
          } else if (site.type === "gate") {
            const numBars = Math.max(3, Math.round(wPx / 6));
            renderEl = (
              <g>
                <rect x={-wPx/2} y={-lPx/2} width={wPx} height={lPx} fill="#451a03" opacity={0.3} stroke={isSelected ? "#3b82f6" : "#78350f"} strokeWidth={isSelected ? 3 : 2} rx={1} />
                {/* Vertical bars */}
                {Array.from({ length: numBars }, (_, i) => (
                  <line key={i} x1={-wPx/2 + (wPx / (numBars - 1)) * i} y1={-lPx/2 + 1} x2={-wPx/2 + (wPx / (numBars - 1)) * i} y2={lPx/2 - 1} stroke={isSelected ? "#60a5fa" : "#92400e"} strokeWidth={1.5} />
                ))}
                {/* Middle rail */}
                <line x1={-wPx/2 + 1} y1={0} x2={wPx/2 - 1} y2={0} stroke={isSelected ? "#60a5fa" : "#78350f"} strokeWidth={1.5} />
                {/* Gate label */}
                <text textAnchor="middle" dominantBaseline="central" fill={isSelected ? "#93c5fd" : "#b45309"} fontSize={7} fontWeight="bold" y={lPx/2 + 8}>GATE</text>
              </g>
            );
          } else if (site.type === "tree") {
            renderEl = <circle cx={0} cy={0} r={wPx/2} fill="#22c55e" opacity={0.8} stroke={isSelected ? "#3b82f6" : "#15803d"} strokeWidth={isSelected ? 3 : 2} />;
          } else if (site.type === "stairs") {
            const numTreads = Math.max(3, Math.round(lPx / 8));
            const treadH = lPx / numTreads;
            renderEl = (
              <g>
                <rect x={-wPx/2} y={-lPx/2} width={wPx} height={lPx} fill="#44403c" stroke={isSelected ? "#3b82f6" : "#78716c"} strokeWidth={isSelected ? 3 : 1.5} rx={2} />
                {Array.from({ length: numTreads }, (_, i) => (
                  <line key={i} x1={-wPx/2 + 2} y1={-lPx/2 + treadH * (i + 1)} x2={wPx/2 - 2} y2={-lPx/2 + treadH * (i + 1)} stroke={isSelected ? "#60a5fa" : "#a8a29e"} strokeWidth={1.2} />
                ))}
                {/* Arrow indicating direction */}
                <polygon points={`0,${-lPx/2 + 6} ${-4},${-lPx/2 + 14} ${4},${-lPx/2 + 14}`} fill={isSelected ? "#60a5fa" : "#d6d3d1"} />
              </g>
            );
          } else if (site.type === "compound") {
            const cornerSize = Math.min(wPx, lPx) * 0.04;
            renderEl = (
              <g>
                {/* Compound boundary */}
                <rect x={-wPx/2} y={-lPx/2} width={wPx} height={lPx} fill="none" stroke={isSelected ? "#3b82f6" : "#64748b"} strokeWidth={isSelected ? 4 : 3} rx={2} strokeDasharray="10,5" />
                {/* Corner pillars */}
                <rect x={-wPx/2 - 2} y={-lPx/2 - 2} width={cornerSize} height={cornerSize} fill={isSelected ? "#3b82f6" : "#475569"} rx={1} />
                <rect x={wPx/2 - cornerSize + 2} y={-lPx/2 - 2} width={cornerSize} height={cornerSize} fill={isSelected ? "#3b82f6" : "#475569"} rx={1} />
                <rect x={-wPx/2 - 2} y={lPx/2 - cornerSize + 2} width={cornerSize} height={cornerSize} fill={isSelected ? "#3b82f6" : "#475569"} rx={1} />
                <rect x={wPx/2 - cornerSize + 2} y={lPx/2 - cornerSize + 2} width={cornerSize} height={cornerSize} fill={isSelected ? "#3b82f6" : "#475569"} rx={1} />
                {/* Label */}
                <text textAnchor="middle" dominantBaseline="central" fill={isSelected ? "#60a5fa" : "#94a3b8"} fontSize={9} fontWeight="bold" y={-lPx/2 - 10}>COMPOUND WALL</text>
              </g>
            );
          } else if (site.type === "column") {
            renderEl = (
              <g>
                <rect x={-wPx/2} y={-lPx/2} width={wPx} height={lPx} fill="#78716c" stroke={isSelected ? "#3b82f6" : "#44403c"} strokeWidth={isSelected ? 3 : 2} />
                <line x1={-wPx/2} y1={-lPx/2} x2={wPx/2} y2={lPx/2} stroke={isSelected ? "#60a5fa" : "#57534e"} strokeWidth={1} />
                <line x1={wPx/2} y1={-lPx/2} x2={-wPx/2} y2={lPx/2} stroke={isSelected ? "#60a5fa" : "#57534e"} strokeWidth={1} />
              </g>
            );
          } else if (site.type === "beam") {
            renderEl = (
              <g>
                <rect x={-wPx/2} y={-lPx/2} width={wPx} height={lPx} fill="#a8a29e" stroke={isSelected ? "#3b82f6" : "#57534e"} strokeWidth={isSelected ? 3 : 1.5} />
                <line x1={-wPx/2} y1={0} x2={wPx/2} y2={0} stroke="#78716c" strokeWidth={1} strokeDasharray="4,3" />
              </g>
            );
          } else if (site.type === "toilet") {
            renderEl = (
              <g>
                <rect x={-wPx/2} y={-lPx/2} width={wPx} height={lPx} fill="#e2e8f0" stroke={isSelected ? "#3b82f6" : "#94a3b8"} strokeWidth={isSelected ? 3 : 1.5} rx={3} />
                <ellipse cx={0} cy={lPx*0.1} rx={wPx*0.35} ry={lPx*0.3} fill="none" stroke={isSelected ? "#60a5fa" : "#64748b"} strokeWidth={1.5} />
                <rect x={-wPx*0.35} y={-lPx/2 + 2} width={wPx*0.7} height={lPx*0.2} rx={2} fill="none" stroke={isSelected ? "#60a5fa" : "#64748b"} strokeWidth={1.5} />
              </g>
            );
          } else if (site.type === "washbasin") {
            renderEl = (
              <g>
                <rect x={-wPx/2} y={-lPx/2} width={wPx} height={lPx} fill="#e2e8f0" stroke={isSelected ? "#3b82f6" : "#94a3b8"} strokeWidth={isSelected ? 3 : 1.5} rx={3} />
                <ellipse cx={0} cy={0} rx={wPx*0.3} ry={lPx*0.3} fill="none" stroke={isSelected ? "#60a5fa" : "#64748b"} strokeWidth={1.5} />
                <circle cx={0} cy={-lPx*0.15} r={2} fill={isSelected ? "#60a5fa" : "#475569"} />
              </g>
            );
          } else if (site.type === "counter") {
            renderEl = (
              <g>
                <rect x={-wPx/2} y={-lPx/2} width={wPx} height={lPx} fill="#d6d3d1" stroke={isSelected ? "#3b82f6" : "#78716c"} strokeWidth={isSelected ? 3 : 1.5} rx={1} />
                <ellipse cx={wPx*0.25} cy={0} rx={wPx*0.1} ry={lPx*0.25} fill="none" stroke={isSelected ? "#60a5fa" : "#57534e"} strokeWidth={1.5} />
                <circle cx={wPx*0.25} cy={-lPx*0.1} r={2} fill={isSelected ? "#60a5fa" : "#475569"} />
              </g>
            );
          } else if (site.type === "stove") {
            renderEl = (
              <g>
                <rect x={-wPx/2} y={-lPx/2} width={wPx} height={lPx} fill="#27272a" stroke={isSelected ? "#3b82f6" : "#3f3f46"} strokeWidth={isSelected ? 3 : 1.5} rx={2} />
                <circle cx={-wPx*0.18} cy={-lPx*0.18} r={wPx*0.15} fill="none" stroke={isSelected ? "#60a5fa" : "#71717a"} strokeWidth={1.5} />
                <circle cx={wPx*0.18} cy={-lPx*0.18} r={wPx*0.15} fill="none" stroke={isSelected ? "#60a5fa" : "#71717a"} strokeWidth={1.5} />
                <circle cx={-wPx*0.18} cy={lPx*0.18} r={wPx*0.15} fill="none" stroke={isSelected ? "#60a5fa" : "#71717a"} strokeWidth={1.5} />
                <circle cx={wPx*0.18} cy={lPx*0.18} r={wPx*0.15} fill="none" stroke={isSelected ? "#60a5fa" : "#71717a"} strokeWidth={1.5} />
              </g>
            );
          } else if (site.type === "bed") {
            renderEl = (
              <g>
                <rect x={-wPx/2} y={-lPx/2} width={wPx} height={lPx} fill="#dbeafe" stroke={isSelected ? "#3b82f6" : "#93c5fd"} strokeWidth={isSelected ? 3 : 1.5} rx={3} />
                <rect x={-wPx/2 + 2} y={-lPx/2 + 2} width={wPx - 4} height={lPx*0.15} rx={2} fill={isSelected ? "#3b82f6" : "#60a5fa"} opacity={0.6} />
                <rect x={-wPx*0.35} y={-lPx/2 + lPx*0.2} width={wPx*0.3} height={lPx*0.2} rx={3} fill="none" stroke={isSelected ? "#60a5fa" : "#93c5fd"} strokeWidth={1} />
                <rect x={wPx*0.05} y={-lPx/2 + lPx*0.2} width={wPx*0.3} height={lPx*0.2} rx={3} fill="none" stroke={isSelected ? "#60a5fa" : "#93c5fd"} strokeWidth={1} />
              </g>
            );
          } else if (site.type === "sofa") {
            renderEl = (
              <g>
                <rect x={-wPx/2} y={-lPx/2} width={wPx} height={lPx} fill="#fef3c7" stroke={isSelected ? "#3b82f6" : "#d97706"} strokeWidth={isSelected ? 3 : 1.5} rx={4} />
                <rect x={-wPx/2 + 3} y={-lPx/2 + lPx*0.55} width={wPx - 6} height={lPx*0.35} rx={3} fill={isSelected ? "#3b82f6" : "#f59e0b"} opacity={0.4} />
                <rect x={-wPx/2 + 2} y={-lPx/2 + 2} width={wPx*0.12} height={lPx - 4} rx={2} fill={isSelected ? "#60a5fa" : "#d97706"} opacity={0.3} />
                <rect x={wPx/2 - wPx*0.12 - 2} y={-lPx/2 + 2} width={wPx*0.12} height={lPx - 4} rx={2} fill={isSelected ? "#60a5fa" : "#d97706"} opacity={0.3} />
              </g>
            );
          } else if (site.type === "dining_table") {
            renderEl = (
              <g>
                <rect x={-wPx/2} y={-lPx/2} width={wPx} height={lPx} fill="#d6d3d1" stroke={isSelected ? "#3b82f6" : "#78350f"} strokeWidth={isSelected ? 3 : 1.5} rx={2} />
                <circle cx={-wPx*0.3} cy={-lPx/2 - 5} r={4} fill="none" stroke={isSelected ? "#60a5fa" : "#a8a29e"} strokeWidth={1.5} />
                <circle cx={wPx*0.3} cy={-lPx/2 - 5} r={4} fill="none" stroke={isSelected ? "#60a5fa" : "#a8a29e"} strokeWidth={1.5} />
                <circle cx={-wPx*0.3} cy={lPx/2 + 5} r={4} fill="none" stroke={isSelected ? "#60a5fa" : "#a8a29e"} strokeWidth={1.5} />
                <circle cx={wPx*0.3} cy={lPx/2 + 5} r={4} fill="none" stroke={isSelected ? "#60a5fa" : "#a8a29e"} strokeWidth={1.5} />
              </g>
            );
          } else if (site.type === "wardrobe") {
            renderEl = (
              <g>
                <rect x={-wPx/2} y={-lPx/2} width={wPx} height={lPx} fill="#92400e" stroke={isSelected ? "#3b82f6" : "#78350f"} strokeWidth={isSelected ? 3 : 1.5} rx={2} />
                <line x1={0} y1={-lPx/2 + 2} x2={0} y2={lPx/2 - 2} stroke={isSelected ? "#60a5fa" : "#451a03"} strokeWidth={1.5} />
                <circle cx={-3} cy={0} r={1.5} fill={isSelected ? "#60a5fa" : "#d6d3d1"} />
                <circle cx={3} cy={0} r={1.5} fill={isSelected ? "#60a5fa" : "#d6d3d1"} />
              </g>
            );
          } else if (site.type === "balcony_railing") {
            const numPosts = Math.max(3, Math.round(wPx / 10));
            renderEl = (
              <g>
                {/* Main railing bar background */}
                <rect x={-wPx/2} y={-lPx/2} width={wPx} height={lPx} fill="#52525b" stroke={isSelected ? "#3b82f6" : "#3f3f46"} strokeWidth={isSelected ? 3 : 2} rx={1} />
                {/* Top rail accent */}
                <line x1={-wPx/2} y1={-lPx/2} x2={wPx/2} y2={-lPx/2} stroke={isSelected ? "#60a5fa" : "#a1a1aa"} strokeWidth={2} />
                {/* Bottom rail accent */}
                <line x1={-wPx/2} y1={lPx/2} x2={wPx/2} y2={lPx/2} stroke={isSelected ? "#60a5fa" : "#a1a1aa"} strokeWidth={2} />
                {/* Vertical posts */}
                {Array.from({ length: numPosts }, (_, i) => (
                  <line key={i} x1={-wPx/2 + (wPx / (numPosts - 1)) * i} y1={-lPx/2} x2={-wPx/2 + (wPx / (numPosts - 1)) * i} y2={lPx/2} stroke={isSelected ? "#60a5fa" : "#a1a1aa"} strokeWidth={1.5} />
                ))}
                {/* Label */}
                <text textAnchor="middle" dominantBaseline="central" fill={isSelected ? "#93c5fd" : "#a1a1aa"} fontSize={7} fontWeight="bold" y={lPx/2 + 8}>RAILING</text>
              </g>
            );
          } else if (site.type === "water_tank") {
            renderEl = (
              <g>
                <circle cx={0} cy={0} r={wPx/2} fill="#0ea5e9" opacity={0.3} stroke={isSelected ? "#3b82f6" : "#0284c7"} strokeWidth={isSelected ? 3 : 2} />
                <circle cx={0} cy={0} r={wPx/2 - 3} fill="none" stroke={isSelected ? "#60a5fa" : "#0369a1"} strokeWidth={1} strokeDasharray="3,3" />
                <text textAnchor="middle" dominantBaseline="central" fill={isSelected ? "#93c5fd" : "#0c4a6e"} fontSize={8} fontWeight="bold">WT</text>
              </g>
            );
          }

          return (
            <g
              key={site.id}
              transform={`translate(${site.x}, ${site.y}) rotate(${site.rotation})`}
              className={mode === "select" ? (isDraggingElement && isSelected ? "cursor-grabbing" : "cursor-grab") : ""}
              onMouseDown={(e) => {
                if (mode === "select") {
                  e.stopPropagation();
                  setSelectedSiteElementId(site.id);
                  setSelectedWallId(null);
                  setSelectedOpeningId(null);
                  setSelectedLabelId(null);
                  setIsDraggingElement(true);
                }
              }}
              onClick={(e) => {
                if (mode === "select") {
                  e.stopPropagation();
                }
                // Allow placing elements on compound boundary area
                if (mode.startsWith("add_") && site.type === "compound") {
                  // Don't stop propagation — let the click pass through to handleSvgClick
                  return;
                }
              }}
              style={{ pointerEvents: (mode.startsWith("add_") && site.type === "compound" && mode !== "add_compound") ? "none" : "auto" }}
            >
              {renderEl}
            </g>
          );
        })}

        {/* Render Active Floor Room Labels */}
        {(data.roomLabels || []).filter(l => (l.floorIndex || 0) === activeFloor).map(label => {
          const isSelected = selectedLabelId === label.id;
          const textLen = label.text.length;
          const bgWidth = Math.max(50, textLen * 8 + 16);

          return (
            <g
              key={label.id}
              transform={`translate(${label.x}, ${label.y})`}
              className={mode === "select" ? (isDraggingElement && isSelected ? "cursor-grabbing" : "cursor-grab") : ""}
              onMouseDown={(e) => {
                if (mode === "select") {
                  e.stopPropagation();
                  setSelectedLabelId(label.id);
                  setSelectedWallId(null);
                  setSelectedOpeningId(null);
                  setSelectedSiteElementId(null);
                  setIsDraggingElement(true);
                }
              }}
              onClick={(e) => {
                if (mode === "select") {
                  e.stopPropagation();
                }
              }}
              onDoubleClick={(e) => {
                if (mode === "select") {
                  e.stopPropagation();
                  const newText = prompt("Rename room:", label.text);
                  if (newText && newText.trim()) {
                    const updatedLabels = (data.roomLabels || []).map(l =>
                      l.id === label.id ? { ...l, text: newText.trim() } : l
                    );
                    onChange({ ...data, roomLabels: updatedLabels });
                  }
                }
              }}
            >
              <rect
                x={-bgWidth / 2}
                y={-10}
                width={bgWidth}
                height={20}
                rx={6}
                fill={isSelected ? "#1e3a5f" : "#1e293b"}
                stroke={isSelected ? "#3b82f6" : "#475569"}
                strokeWidth={isSelected ? 2 : 1}
                opacity={0.9}
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fill={isSelected ? "#93c5fd" : "#e2e8f0"}
                fontSize={11}
                fontWeight="bold"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {label.text}
              </text>
            </g>
          );
        })}

        {/* Measure Tool Lines */}
        {measureLines.map((line, i) => (
          <g key={`measure_${i}`}>
            <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#6366f1" strokeWidth={2} strokeDasharray="5,5" />
            <circle cx={line.x1} cy={line.y1} r={3} fill="#6366f1" />
            <circle cx={line.x2} cy={line.y2} r={3} fill="#6366f1" />
            <rect x={(line.x1 + line.x2)/2 - 20} y={(line.y1 + line.y2)/2 - 10} width={40} height={20} rx={4} fill="#1e1b4b" opacity={0.8} />
            <text x={(line.x1 + line.x2)/2} y={(line.y1 + line.y2)/2} textAnchor="middle" dominantBaseline="central" fill="#818cf8" fontSize={10} fontWeight="bold">
              {line.dist.toFixed(2)}m
            </text>
          </g>
        ))}

        {mode === "measure" && measureStart && (
          <line x1={measureStart.x} y1={measureStart.y} x2={mousePos.x} y2={mousePos.y} stroke="#818cf8" strokeWidth={2} strokeDasharray="5,5" opacity={0.5} />
        )}

        {/* Placing indicator */}
        {mode.startsWith("add_") && (mode === "add_door" || mode === "add_window" ? snappedWallInfo : true) && (
          <g>
            <circle cx={mousePos.x} cy={mousePos.y} r={5} fill="#fbbf24" className="animate-ping" />
          </g>
        )}

        {mode === "draw_wall" && (
          <circle cx={mousePos.x} cy={mousePos.y} r={4} fill="#3b82f6" className="animate-pulse" />
        )}
      </svg>

      {/* Floating Property Editor for Site Elements */}
      {selectedSiteElementId && (
        <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 p-4 rounded-3xl shadow-2xl shadow-slate-200/20 dark:shadow-none w-[240px] transition-all">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
            <Settings className="h-3.5 w-3.5" /> Properties
          </div>
          {(() => {
            const el = (data.siteElements || []).find(s => s.id === selectedSiteElementId);
            if (!el) return null;
            return (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Rotation</label>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-md hover:bg-white dark:hover:bg-slate-700 shadow-sm" onClick={() => {
                      const newSiteElements = (data.siteElements || []).map(s => s.id === el.id ? { ...s, rotation: (s.rotation - 15) % 360 } : s);
                      onChange({ ...data, siteElements: newSiteElements });
                    }}>-</Button>
                    <span className="text-xs w-8 text-center font-mono">{el.rotation}°</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-md hover:bg-white dark:hover:bg-slate-700 shadow-sm" onClick={() => {
                      const newSiteElements = (data.siteElements || []).map(s => s.id === el.id ? { ...s, rotation: (s.rotation + 15) % 360 } : s);
                      onChange({ ...data, siteElements: newSiteElements });
                    }}>+</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Width (m)</label>
                  <input type="number" value={el.width} step="0.5" className="w-16 h-7 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 focus:ring-2 focus:ring-violet-500/50 outline-none" onChange={(e) => {
                     const val = parseFloat(e.target.value);
                     if (!isNaN(val) && val > 0) {
                       const newSiteElements = (data.siteElements || []).map(s => s.id === el.id ? { ...s, width: val } : s);
                       onChange({ ...data, siteElements: newSiteElements });
                     }
                  }} />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Length (m)</label>
                  <input type="number" value={el.length} step="0.5" className="w-16 h-7 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 focus:ring-2 focus:ring-violet-500/50 outline-none" onChange={(e) => {
                     const val = parseFloat(e.target.value);
                     if (!isNaN(val) && val > 0) {
                       const newSiteElements = (data.siteElements || []).map(s => s.id === el.id ? { ...s, length: val } : s);
                       onChange({ ...data, siteElements: newSiteElements });
                     }
                  }} />
                </div>
                {el.type === "compound" && (
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Design</label>
                    <select
                      className="w-20 h-7 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-1 focus:ring-2 focus:ring-violet-500/50 outline-none"
                      value={el.style || "solid"}
                      onChange={(e) => {
                        const newSiteElements = (data.siteElements || []).map(s => s.id === el.id ? { ...s, style: e.target.value as any } : s);
                        onChange({ ...data, siteElements: newSiteElements });
                      }}
                    >
                      <option value="solid">Solid</option>
                      <option value="brick">Brick</option>
                      <option value="modern">Modern</option>
                      <option value="picket">Picket</option>
                    </select>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
