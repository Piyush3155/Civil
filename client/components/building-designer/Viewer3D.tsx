"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment } from "@react-three/drei";
import { FloorPlanData, Aesthetics } from "./types";
import * as THREE from "three";

interface Viewer3DProps {
  data: FloorPlanData;
  aesthetics: Aesthetics;
}

// 1 Meter = 20 SVG units
const PIXELS_PER_METER = 20;

export default function Viewer3D({ data, aesthetics }: Viewer3DProps) {
  // Convert 2D SVG walls to 3D geometry props
  const wallMeshes = useMemo(() => {
    return data.walls.map((wall) => {
      const start = data.nodes.find((n) => n.id === wall.startNodeId);
      const end = data.nodes.find((n) => n.id === wall.endNodeId);

      if (!start || !end) return null;

      // Convert from SVG coordinates to 3D meters
      // SVG X -> 3D X
      // SVG Y -> 3D Z
      const x1 = start.x / PIXELS_PER_METER;
      const z1 = start.y / PIXELS_PER_METER;
      const x2 = end.x / PIXELS_PER_METER;
      const z2 = end.y / PIXELS_PER_METER;

      // Distance and center point
      const length = Math.hypot(x2 - x1, z2 - z1);
      const cx = (x1 + x2) / 2;
      const cz = (z1 + z2) / 2;
      const height = wall.height;
      const thickness = wall.thickness;
      const cy = height / 2; // Center of the wall vertically

      // Rotation around Y axis
      const angle = Math.atan2(z1 - z2, x1 - x2);

      return {
        id: wall.id,
        position: [cx, cy, cz] as [number, number, number],
        rotation: [0, -angle, 0] as [number, number, number],
        args: [length, height, thickness] as [number, number, number],
        color: wall.color || aesthetics.wallColor,
      };
    }).filter(Boolean);
  }, [data, aesthetics]);

  return (
    <div className="w-full h-full relative" style={{ backgroundColor: aesthetics.groundColor }}>
      <Canvas camera={{ position: [10, 15, 10], fov: 50 }}>
        {/* Environment & Lighting */}
        <ambientLight intensity={aesthetics.ambientLightIntensity} />
        <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
        <Environment preset="city" />

        {/* Camera Controls */}
        <OrbitControls makeDefault maxPolarAngle={Math.PI / 2 - 0.05} />

        {/* Ground Grid */}
        <Grid
          infiniteGrid
          fadeDistance={50}
          sectionColor={aesthetics.floorColor}
          cellColor="#334155"
          cellSize={1}
          sectionSize={5}
          position={[0, -0.01, 0]}
        />

        {/* Walls */}
        {wallMeshes.map((mesh) => {
          if (!mesh) return null;
          return (
            <mesh
              key={mesh.id}
              position={mesh.position}
              rotation={mesh.rotation}
              castShadow
              receiveShadow
            >
              <boxGeometry args={mesh.args} />
              <meshStandardMaterial color={mesh.color} roughness={0.7} />
            </mesh>
          );
        })}

        {/* Floor Plane (Optional solid base) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color={aesthetics.floorColor} opacity={0.5} transparent />
        </mesh>
      </Canvas>
    </div>
  );
}
