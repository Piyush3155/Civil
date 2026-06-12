"use client";

import { useState, useRef, useEffect, MouseEvent } from "react";
import { FloorPlanData, WallNode, Wall } from "./types";
import { Plus, MousePointer2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Editor2DProps {
  data: FloorPlanData;
  onChange: (data: FloorPlanData) => void;
}

type Mode = "select" | "draw_wall";

export default function Editor2D({ data, onChange }: Editor2DProps) {
  const [mode, setMode] = useState<Mode>("select");
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [drawingStartNode, setDrawingStartNode] = useState<WallNode | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Constants
  const GRID_SIZE = 20;
  const SNAP_DISTANCE = 15;

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

  const handleMouseMove = (e: MouseEvent) => {
    const rawPos = getSvgCoordinates(e);
    
    // Snap to grid
    let snappedPos = {
      x: snapToGrid(rawPos.x),
      y: snapToGrid(rawPos.y),
    };

    // Snap to existing nodes if close enough
    for (const node of data.nodes) {
      const dist = Math.hypot(node.x - rawPos.x, node.y - rawPos.y);
      if (dist < SNAP_DISTANCE) {
        snappedPos = { x: node.x, y: node.y };
        break;
      }
    }

    setMousePos(snappedPos);
  };

  const handleSvgClick = (e: MouseEvent) => {
    if (mode === "select") {
      setSelectedWallId(null); // Clicked on empty space
      return;
    }

    if (mode === "draw_wall") {
      const pos = mousePos;

      // Find or create node
      let existingNode = data.nodes.find(n => n.x === pos.x && n.y === pos.y);
      let nodeId = existingNode?.id;

      let newNodes = [...data.nodes];
      if (!existingNode) {
        nodeId = `node_${Date.now()}`;
        const newNode = { id: nodeId, x: pos.x, y: pos.y };
        newNodes.push(newNode);
        existingNode = newNode;
      }

      if (!drawingStartNode) {
        // Start drawing
        setDrawingStartNode(existingNode);
        onChange({ ...data, nodes: newNodes });
      } else {
        // Finish wall
        if (drawingStartNode.id !== nodeId) { // Don't create zero-length wall
          const newWall: Wall = {
            id: `wall_${Date.now()}`,
            startNodeId: drawingStartNode.id,
            endNodeId: nodeId as string,
            thickness: 0.2, // 20cm thickness by default
            height: 3,      // 3m height by default
          };
          onChange({
            ...data,
            nodes: newNodes,
            walls: [...data.walls, newWall]
          });
        }
        // Continue drawing from the new node
        setDrawingStartNode(existingNode);
      }
    }
  };

  const handleDelete = () => {
    if (!selectedWallId) return;
    const newWalls = data.walls.filter(w => w.id !== selectedWallId);
    
    // Cleanup orphaned nodes
    const usedNodeIds = new Set<string>();
    newWalls.forEach(w => {
      usedNodeIds.add(w.startNodeId);
      usedNodeIds.add(w.endNodeId);
    });
    const newNodes = data.nodes.filter(n => usedNodeIds.has(n.id));

    onChange({ ...data, walls: newWalls, nodes: newNodes });
    setSelectedWallId(null);
  };

  // Keyboard support for ESC and Delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawingStartNode(null);
        setMode("select");
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        handleDelete();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedWallId, data]);

  return (
    <div className="w-full h-full relative flex flex-col bg-slate-900">
      {/* 2D Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-slate-800/90 backdrop-blur border border-slate-700 p-2 rounded-lg shadow-xl">
        <Button 
          variant={mode === "select" ? "default" : "secondary"} 
          size="sm" 
          onClick={() => { setMode("select"); setDrawingStartNode(null); }}
        >
          <MousePointer2 className="h-4 w-4 mr-2" /> Select
        </Button>
        <Button 
          variant={mode === "draw_wall" ? "default" : "secondary"} 
          size="sm" 
          onClick={() => setMode("draw_wall")}
        >
          <Plus className="h-4 w-4 mr-2" /> Draw Wall
        </Button>
        <div className="w-px h-6 bg-slate-700 mx-2" />
        <Button 
          variant="destructive" 
          size="sm" 
          disabled={!selectedWallId}
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" /> Delete
        </Button>
      </div>

      <svg
        ref={svgRef}
        className="w-full h-full cursor-crosshair touch-none"
        onMouseMove={handleMouseMove}
        onClick={handleSvgClick}
        viewBox="-400 -300 800 600"
      >
        {/* Grid Definition */}
        <defs>
          <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
            <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="#334155" strokeWidth="0.5" />
          </pattern>
        </defs>

        {/* Background Grid */}
        <rect x="-2000" y="-2000" width="4000" height="4000" fill="url(#grid)" />

        {/* Existing Walls */}
        {data.walls.map(wall => {
          const start = data.nodes.find(n => n.id === wall.startNodeId);
          const end = data.nodes.find(n => n.id === wall.endNodeId);
          if (!start || !end) return null;

          const isSelected = selectedWallId === wall.id;

          return (
            <line
              key={wall.id}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={isSelected ? "#3b82f6" : "#cbd5e1"}
              strokeWidth={wall.thickness * 50} // Scale thickness for 2D view visually
              strokeLinecap="round"
              className={mode === "select" ? "cursor-pointer hover:stroke-blue-400 transition-colors" : ""}
              onClick={(e) => {
                if (mode === "select") {
                  e.stopPropagation();
                  setSelectedWallId(wall.id);
                }
              }}
            />
          );
        })}

        {/* Existing Nodes */}
        {data.nodes.map(node => (
          <circle
            key={node.id}
            cx={node.x}
            cy={node.y}
            r={3}
            fill="#64748b"
          />
        ))}

        {/* Preview Line while drawing */}
        {mode === "draw_wall" && drawingStartNode && (
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
        )}

        {/* Mouse Cursor Preview */}
        {mode === "draw_wall" && (
          <circle cx={mousePos.x} cy={mousePos.y} r={4} fill="#3b82f6" className="animate-pulse" />
        )}
      </svg>
    </div>
  );
}
