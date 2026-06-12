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

const PIXELS_PER_METER = 20;

export default function Viewer3D({ data, aesthetics }: Viewer3DProps) {
  // Compute dynamic split wall segments and opening models in 3D meters
  const { wallSegments, openingModels } = useMemo(() => {
    const segments: any[] = [];
    const models: any[] = [];

    data.walls.forEach((wall) => {
      const start = data.nodes.find((n) => n.id === wall.startNodeId);
      const end = data.nodes.find((n) => n.id === wall.endNodeId);
      if (!start || !end) return;

      // Convert SVG coordinates (pixels) to 3D meters
      const x1 = start.x / PIXELS_PER_METER;
      const z1 = start.y / PIXELS_PER_METER;
      const x2 = end.x / PIXELS_PER_METER;
      const z2 = end.y / PIXELS_PER_METER;

      const wallLen = Math.hypot(x2 - x1, z2 - z1);
      if (wallLen === 0) return;

      const ux = (x2 - x1) / wallLen;
      const uz = (z2 - z1) / wallLen;

      // Perpendicular vector for thickness
      const px = -uz;
      const pz = ux;

      const angle = Math.atan2(z1 - z2, x1 - x2);
      const rotationY = -angle;

      // Get openings associated with this wall
      const wallOpenings = data.openings
        .filter((op) => op.wallId === wall.id)
        .map((op) => ({
          ...op,
          distM: op.distanceFromStart / PIXELS_PER_METER,
        }))
        // Sort openings along wall start-to-end
        .sort((a, b) => a.distM - b.distM);

      let currentPos = 0;

      wallOpenings.forEach((op) => {
        // Op boundaries in meters
        const halfWidth = op.width / 2;
        const opStart = Math.max(0, op.distM - halfWidth);
        const opEnd = Math.min(wallLen, op.distM + halfWidth);

        // 1. Solid segment before this opening
        if (opStart > currentPos) {
          const segLen = opStart - currentPos;
          const midM = currentPos + segLen / 2;
          const cx = x1 + ux * midM;
          const cz = z1 + uz * midM;
          const cy = wall.height / 2;

          segments.push({
            id: `${wall.id}_seg_${currentPos.toFixed(2)}`,
            position: [cx, cy, cz],
            rotation: [0, rotationY, 0],
            args: [segLen, wall.height, wall.thickness],
            color: wall.color || aesthetics.wallColor,
          });
        }

        // 2. Erased zone (render sill/header pieces for openings)
        const opLen = opEnd - opStart;
        const midM = opStart + opLen / 2;
        const cx = x1 + ux * midM;
        const cz = z1 + uz * midM;

        if (op.type === "window") {
          // Sill wall (below window)
          if (op.elevation > 0) {
            const cy = op.elevation / 2;
            segments.push({
              id: `${wall.id}_sill_${op.id}`,
              position: [cx, cy, cz],
              rotation: [0, rotationY, 0],
              args: [opLen, op.elevation, wall.thickness],
              color: wall.color || aesthetics.wallColor,
            });
          }

          // Header wall (above window)
          const headerHeight = wall.height - (op.elevation + op.height);
          if (headerHeight > 0) {
            const cy = op.elevation + op.height + headerHeight / 2;
            segments.push({
              id: `${wall.id}_header_${op.id}`,
              position: [cx, cy, cz],
              rotation: [0, rotationY, 0],
              args: [opLen, headerHeight, wall.thickness],
              color: wall.color || aesthetics.wallColor,
            });
          }

          // Add window model metadata
          models.push({
            id: op.id,
            type: "window",
            position: [cx, op.elevation + op.height / 2, cz],
            rotation: [0, rotationY, 0],
            width: opLen,
            height: op.height,
            thickness: wall.thickness + 0.02,
          });
        } else if (op.type === "door") {
          // Header wall above door
          const headerHeight = wall.height - op.height;
          if (headerHeight > 0) {
            const cy = op.height + headerHeight / 2;
            segments.push({
              id: `${wall.id}_header_${op.id}`,
              position: [cx, cy, cz],
              rotation: [0, rotationY, 0],
              args: [opLen, headerHeight, wall.thickness],
              color: wall.color || aesthetics.wallColor,
            });
          }

          // Add door model metadata
          models.push({
            id: op.id,
            type: "door",
            position: [cx, op.height / 2, cz],
            rotation: [0, rotationY, 0],
            width: opLen,
            height: op.height,
            thickness: wall.thickness - 0.02,
          });
        }

        currentPos = opEnd;
      });

      // 3. Final solid segment after last opening
      if (currentPos < wallLen) {
        const segLen = wallLen - currentPos;
        const midM = currentPos + segLen / 2;
        const cx = x1 + ux * midM;
        const cz = z1 + uz * midM;
        const cy = wall.height / 2;

        segments.push({
          id: `${wall.id}_seg_end`,
          position: [cx, cy, cz],
          rotation: [0, rotationY, 0],
          args: [segLen, wall.height, wall.thickness],
          color: wall.color || aesthetics.wallColor,
        });
      }
    });

    return { wallSegments: segments, openingModels: models };
  }, [data, aesthetics]);

  // Compute Roof structure if enabled
  const roofMesh = useMemo(() => {
    if (!aesthetics.showRoof || data.nodes.length === 0) return null;

    // Find boundary of nodes
    const xs = data.nodes.map((n) => n.x / PIXELS_PER_METER);
    const zs = data.nodes.map((n) => n.y / PIXELS_PER_METER);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);

    const w = maxX - minX;
    const d = maxZ - minZ;
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;

    const wallHeight = data.walls.length > 0 ? Math.max(...data.walls.map((w) => w.height)) : 3.0;

    // Overhang in meters
    const overhang = 0.6;

    if (aesthetics.roofType === "flat") {
      return (
        <mesh position={[cx, wallHeight + 0.1, cz]} castShadow receiveShadow>
          <boxGeometry args={[w + overhang * 2, 0.2, d + overhang * 2]} />
          <meshStandardMaterial color={aesthetics.roofColor} roughness={0.5} />
        </mesh>
      );
    } else {
      // Pitched roof gable style
      // Ridge runs parallel to the longer axis of layout
      const isXLonger = w >= d;
      const pitchHeight = aesthetics.roofHeight;
      const roofThick = 0.15;

      if (isXLonger) {
        // Ridge parallel to X axis at cz. Slabs slope down to minZ and maxZ.
        const halfSpan = d / 2 + overhang;
        const slopeLen = Math.hypot(pitchHeight, halfSpan);
        const pitchAngle = Math.atan(pitchHeight / halfSpan);

        // Center height of slope slab
        const slabCY = wallHeight + pitchHeight / 2;

        return (
          <group position={[cx, 0, cz]}>
            {/* Front slope */}
            <mesh 
              position={[0, slabCY, -halfSpan / 2]} 
              rotation={[-pitchAngle, 0, 0]}
              castShadow 
              receiveShadow
            >
              <boxGeometry args={[w + overhang * 2, roofThick, slopeLen]} />
              <meshStandardMaterial color={aesthetics.roofColor} roughness={0.5} />
            </mesh>
            {/* Back slope */}
            <mesh 
              position={[0, slabCY, halfSpan / 2]} 
              rotation={[pitchAngle, 0, 0]}
              castShadow 
              receiveShadow
            >
              <boxGeometry args={[w + overhang * 2, roofThick, slopeLen]} />
              <meshStandardMaterial color={aesthetics.roofColor} roughness={0.5} />
            </mesh>
          </group>
        );
      } else {
        // Ridge parallel to Z axis at cx. Slabs slope down to minX and maxX.
        const halfSpan = w / 2 + overhang;
        const slopeLen = Math.hypot(pitchHeight, halfSpan);
        const pitchAngle = Math.atan(pitchHeight / halfSpan);

        const slabCY = wallHeight + pitchHeight / 2;

        return (
          <group position={[cx, 0, cz]}>
            {/* Left slope */}
            <mesh 
              position={[-halfSpan / 2, slabCY, 0]} 
              rotation={[0, 0, pitchAngle]}
              castShadow 
              receiveShadow
            >
              <boxGeometry args={[slopeLen, roofThick, d + overhang * 2]} />
              <meshStandardMaterial color={aesthetics.roofColor} roughness={0.5} />
            </mesh>
            {/* Right slope */}
            <mesh 
              position={[halfSpan / 2, slabCY, 0]} 
              rotation={[0, 0, -pitchAngle]}
              castShadow 
              receiveShadow
            >
              <boxGeometry args={[slopeLen, roofThick, d + overhang * 2]} />
              <meshStandardMaterial color={aesthetics.roofColor} roughness={0.5} />
            </mesh>
          </group>
        );
      }
    }
  }, [data, aesthetics]);

  return (
    <div className="w-full h-full relative" style={{ backgroundColor: aesthetics.groundColor }}>
      <Canvas camera={{ position: [10, 15, 10], fov: 50 }} shadows>
        <ambientLight intensity={aesthetics.ambientLightIntensity} />
        <directionalLight 
          position={[12, 25, 12]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024}
        />
        <Environment preset="city" />
        <OrbitControls makeDefault maxPolarAngle={Math.PI / 2 - 0.05} />

        {/* Floor Grid */}
        <Grid
          infiniteGrid
          fadeDistance={50}
          sectionColor={aesthetics.floorColor}
          cellColor="#334155"
          cellSize={1}
          sectionSize={5}
          position={[0, 0.01, 0]}
        />

        {/* Extruded Wall Segments */}
        {wallSegments.map((seg) => (
          <mesh
            key={seg.id}
            position={seg.position}
            rotation={seg.rotation}
            castShadow
            receiveShadow
          >
            <boxGeometry args={seg.args} />
            <meshStandardMaterial color={seg.color} roughness={0.7} />
          </mesh>
        ))}

        {/* 3D Door and Window Models inside cutouts */}
        {openingModels.map((model) => {
          if (model.type === "door") {
            // Door Frame and swung panel
            const panelWidth = model.width - 0.08;
            const swingAngle = Math.PI / 6; // 30 degrees open swing

            return (
              <group key={model.id} position={model.position} rotation={model.rotation}>
                {/* Frame Left */}
                <mesh position={[-model.width / 2 + 0.02, 0, 0]}>
                  <boxGeometry args={[0.04, model.height, model.thickness]} />
                  <meshStandardMaterial color="#1e293b" roughness={0.6} />
                </mesh>
                {/* Frame Right */}
                <mesh position={[model.width / 2 - 0.02, 0, 0]}>
                  <boxGeometry args={[0.04, model.height, model.thickness]} />
                  <meshStandardMaterial color="#1e293b" roughness={0.6} />
                </mesh>
                {/* Frame Top */}
                <mesh position={[0, model.height / 2 - 0.02, 0]}>
                  <boxGeometry args={[model.width, 0.04, model.thickness]} />
                  <meshStandardMaterial color="#1e293b" roughness={0.6} />
                </mesh>
                {/* Door Panel pivot (rotated) */}
                <group position={[-model.width / 2 + 0.04, 0, 0]} rotation={[0, swingAngle, 0]}>
                  <mesh position={[panelWidth / 2, 0, 0]}>
                    <boxGeometry args={[panelWidth, model.height - 0.08, 0.04]} />
                    <meshStandardMaterial color="#b45309" roughness={0.8} /> {/* amber-700 wooden color */}
                  </mesh>
                </group>
              </group>
            );
          } else {
            // Window Outer frame + Glass pane
            return (
              <group key={model.id} position={model.position} rotation={model.rotation}>
                {/* Frame Border */}
                <mesh>
                  <boxGeometry args={[model.width, model.height, 0.04]} />
                  <meshStandardMaterial color="#1e293b" roughness={0.6} />
                </mesh>
                {/* Glass Panel */}
                <mesh>
                  <boxGeometry args={[model.width - 0.08, model.height - 0.08, 0.01]} />
                  <meshStandardMaterial 
                    color="#38bdf8" 
                    roughness={0.1} 
                    metalness={0.9} 
                    transparent 
                    opacity={0.3} 
                  />
                </mesh>
              </group>
            );
          }
        })}

        {/* Roof rendering (Flat / Pitched) */}
        {roofMesh}

        {/* Solid ground plane base */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
          <planeGeometry args={[150, 150]} />
          <meshStandardMaterial color={aesthetics.floorColor} opacity={0.6} transparent />
        </mesh>
      </Canvas>
    </div>
  );
}
