"use client";

import { useMemo, useEffect } from "react";
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
  // Compute max floor index
  const maxFloorIndex = useMemo(() => {
    return Math.max(
      0,
      ...data.nodes.map((n) => n.floorIndex || 0),
      ...data.walls.map((w) => w.floorIndex || 0)
    );
  }, [data]);

  // Compute separation concrete slabs between stacked floors
  const separationSlabs = useMemo(() => {
    const slabs: any[] = [];
    if (data.nodes.length === 0) return slabs;

    for (let f = 1; f <= maxFloorIndex; f++) {
      // Find boundary of nodes on this level (or fallback to global nodes if level nodes are missing)
      const levelNodes = data.nodes.filter((n) => (n.floorIndex || 0) === f);
      const targetNodes = levelNodes.length > 0 ? levelNodes : data.nodes;

      const xs = targetNodes.map((n) => n.x / PIXELS_PER_METER);
      const zs = targetNodes.map((n) => n.y / PIXELS_PER_METER);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minZ = Math.min(...zs);
      const maxZ = Math.max(...zs);

      const w = maxX - minX;
      const d = maxZ - minZ;
      const cx = (minX + maxX) / 2;
      const cz = (minZ + maxZ) / 2;

      slabs.push({
        id: `slab_${f}`,
        position: [cx, f * 3.0 - 0.075, cz], // 15cm slab centered right below level boundary
        args: [w + 0.4, 0.15, d + 0.4], // with a small overhang
      });
    }
    return slabs;
  }, [data, maxFloorIndex]);

  // Compute dynamic split wall segments and opening models in 3D meters
  const { wallSegments, openingModels } = useMemo(() => {
    const segments: any[] = [];
    const models: any[] = [];

    data.walls.forEach((wall) => {
      const start = data.nodes.find((n) => n.id === wall.startNodeId);
      const end = data.nodes.find((n) => n.id === wall.endNodeId);
      if (!start || !end) return;

      const x1 = start.x / PIXELS_PER_METER;
      const z1 = start.y / PIXELS_PER_METER;
      const x2 = end.x / PIXELS_PER_METER;
      const z2 = end.y / PIXELS_PER_METER;

      const wallLen = Math.hypot(x2 - x1, z2 - z1);
      if (wallLen === 0) return;

      const ux = (x2 - x1) / wallLen;
      const uz = (z2 - z1) / wallLen;

      const angle = Math.atan2(z1 - z2, x1 - x2);
      const rotationY = -angle;

      // Vertical stack base Y coordinate based on floorIndex
      const floorIdx = wall.floorIndex || 0;
      const baseY = floorIdx * 3.0; // 3 meters per level

      // Get openings associated with this wall
      const wallOpenings = data.openings
        .filter((op) => op.wallId === wall.id)
        .map((op) => ({
          ...op,
          distM: op.distanceFromStart / PIXELS_PER_METER,
        }))
        .sort((a, b) => a.distM - b.distM);

      let currentPos = 0;

      wallOpenings.forEach((op) => {
        const halfWidth = op.width / 2;
        const opStart = Math.max(0, op.distM - halfWidth);
        const opEnd = Math.min(wallLen, op.distM + halfWidth);

        // 1. Solid segment before this opening
        if (opStart > currentPos) {
          const segLen = opStart - currentPos;
          const midM = currentPos + segLen / 2;
          const cx = x1 + ux * midM;
          const cz = z1 + uz * midM;
          const cy = baseY + wall.height / 2;

          segments.push({
            id: `${wall.id}_seg_${currentPos.toFixed(2)}`,
            position: [cx, cy, cz],
            rotation: [0, rotationY, 0],
            args: [segLen, wall.height, wall.thickness],
            color: wall.color || aesthetics.wallColor,
          });
        }

        // 2. Sill/Header segments around opening
        const opLen = opEnd - opStart;
        const midM = opStart + opLen / 2;
        const cx = x1 + ux * midM;
        const cz = z1 + uz * midM;

        if (op.type === "window") {
          // Sill wall (below window)
          if (op.elevation > 0) {
            const cy = baseY + op.elevation / 2;
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
            const cy = baseY + op.elevation + op.height + headerHeight / 2;
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
            position: [cx, baseY + op.elevation + op.height / 2, cz],
            rotation: [0, rotationY, 0],
            width: opLen,
            height: op.height,
            thickness: wall.thickness + 0.02,
          });
        } else if (op.type === "door") {
          // Header wall above door
          const headerHeight = wall.height - op.height;
          if (headerHeight > 0) {
            const cy = baseY + op.height + headerHeight / 2;
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
            position: [cx, baseY + op.height / 2, cz],
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
        const cy = baseY + wall.height / 2;

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

  // Compute Roof structure on top of the highest floor
  const roofMesh = useMemo(() => {
    if (!aesthetics.showRoof || data.nodes.length === 0) return null;

    // Use nodes of the top floor for roof scaling
    const topFloorNodes = data.nodes.filter(n => (n.floorIndex || 0) === maxFloorIndex);
    const targetNodes = topFloorNodes.length > 0 ? topFloorNodes : data.nodes;

    const xs = targetNodes.map((n) => n.x / PIXELS_PER_METER);
    const zs = targetNodes.map((n) => n.y / PIXELS_PER_METER);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);

    const w = maxX - minX;
    const d = maxZ - minZ;
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;

    const roofBaseY = (maxFloorIndex + 1) * 3.0; // stacked ceiling height
    const overhang = 0.6; // 60cm overhang
    const roofW = w + overhang * 2;
    const roofD = d + overhang * 2;
    const pitchHeight = aesthetics.roofHeight;
    const roofThick = 0.15;

    switch (aesthetics.roofType) {
      case "flat":
        return (
          <mesh position={[cx, roofBaseY + 0.1, cz]} castShadow receiveShadow>
            <boxGeometry args={[roofW, 0.2, roofD]} />
            <meshStandardMaterial color={aesthetics.roofColor} roughness={0.5} />
          </mesh>
        );

      case "pitched": {
        // Gable style slanting from ridge
        const isXLonger = w >= d;
        if (isXLonger) {
          const halfSpan = d / 2 + overhang;
          const slopeLen = Math.hypot(pitchHeight, halfSpan);
          const pitchAngle = Math.atan(pitchHeight / halfSpan);
          const slabCY = roofBaseY + pitchHeight / 2;

          return (
            <group position={[cx, 0, cz]}>
              <mesh position={[0, slabCY, -halfSpan / 2]} rotation={[-pitchAngle, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[roofW, roofThick, slopeLen]} />
                <meshStandardMaterial color={aesthetics.roofColor} roughness={0.5} />
              </mesh>
              <mesh position={[0, slabCY, halfSpan / 2]} rotation={[pitchAngle, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[roofW, roofThick, slopeLen]} />
                <meshStandardMaterial color={aesthetics.roofColor} roughness={0.5} />
              </mesh>
            </group>
          );
        } else {
          const halfSpan = w / 2 + overhang;
          const slopeLen = Math.hypot(pitchHeight, halfSpan);
          const pitchAngle = Math.atan(pitchHeight / halfSpan);
          const slabCY = roofBaseY + pitchHeight / 2;

          return (
            <group position={[cx, 0, cz]}>
              <mesh position={[-halfSpan / 2, slabCY, 0]} rotation={[0, 0, pitchAngle]} castShadow receiveShadow>
                <boxGeometry args={[slopeLen, roofThick, roofD]} />
                <meshStandardMaterial color={aesthetics.roofColor} roughness={0.5} />
              </mesh>
              <mesh position={[halfSpan / 2, slabCY, 0]} rotation={[0, 0, -pitchAngle]} castShadow receiveShadow>
                <boxGeometry args={[slopeLen, roofThick, roofD]} />
                <meshStandardMaterial color={aesthetics.roofColor} roughness={0.5} />
              </mesh>
            </group>
          );
        }
      }

      case "hip": {
        // Hip style slanting pyramid-like on all four sides
        // Renders as a 4-sided cylinder (pyramid), scaled to rectangular dimensions
        const scaleX = roofW / Math.sqrt(2);
        const scaleZ = roofD / Math.sqrt(2);

        return (
          <mesh 
            position={[cx, roofBaseY + pitchHeight / 2, cz]} 
            rotation={[0, Math.PI / 4, 0]} // rotate 45 deg to align faces
            scale={[scaleX, 1, scaleZ]}
            castShadow 
            receiveShadow
          >
            <cylinderGeometry args={[0, 1, pitchHeight, 4, 1]} />
            <meshStandardMaterial color={aesthetics.roofColor} roughness={0.5} />
          </mesh>
        );
      }

      case "shed": {
        // Mono-pitched style slants single direction
        const isXLonger = w >= d;
        if (isXLonger) {
          const pitchAngle = Math.atan(pitchHeight / roofW);
          const slabLen = Math.hypot(pitchHeight, roofW);
          return (
            <mesh 
              position={[cx, roofBaseY + pitchHeight / 2, cz]} 
              rotation={[0, 0, -pitchAngle]}
              castShadow 
              receiveShadow
            >
              <boxGeometry args={[slabLen, roofThick, roofD]} />
              <meshStandardMaterial color={aesthetics.roofColor} roughness={0.5} />
            </mesh>
          );
        } else {
          const pitchAngle = Math.atan(pitchHeight / roofD);
          const slabLen = Math.hypot(pitchHeight, roofD);
          return (
            <mesh 
              position={[cx, roofBaseY + pitchHeight / 2, cz]} 
              rotation={[pitchAngle, 0, 0]}
              castShadow 
              receiveShadow
            >
              <boxGeometry args={[roofW, roofThick, slabLen]} />
              <meshStandardMaterial color={aesthetics.roofColor} roughness={0.5} />
            </mesh>
          );
        }
      }

      default:
        return null;
    }
  }, [data, aesthetics, maxFloorIndex]);

  return (
    <div className="w-full h-full relative" style={{ backgroundColor: aesthetics.groundColor }}>
      <Canvas camera={{ position: [15, 20, 15], fov: 45 }} shadows>
        <ambientLight intensity={aesthetics.ambientLightIntensity} />
        <directionalLight 
          position={[15, 35, 15]} 
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
          fadeDistance={60}
          sectionColor={aesthetics.floorColor}
          cellColor="#334155"
          cellSize={1}
          sectionSize={5}
          position={[0, 0.01, 0]}
        />

        {/* Floor concrete separation slabs */}
        {separationSlabs.map((slab) => (
          <mesh key={slab.id} position={slab.position} castShadow receiveShadow>
            <boxGeometry args={slab.args} />
            <meshStandardMaterial color={aesthetics.floorColor} roughness={0.8} />
          </mesh>
        ))}

        {/* Extruded Wall segments stacked vertically */}
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

        {/* 3D door/window opening models */}
        {openingModels.map((model) => {
          if (model.type === "door") {
            const panelWidth = model.width - 0.08;
            const swingAngle = Math.PI / 6;

            return (
              <group key={model.id} position={model.position} rotation={model.rotation}>
                <mesh position={[-model.width / 2 + 0.02, 0, 0]}>
                  <boxGeometry args={[0.04, model.height, model.thickness]} />
                  <meshStandardMaterial color="#1e293b" roughness={0.6} />
                </mesh>
                <mesh position={[model.width / 2 - 0.02, 0, 0]}>
                  <boxGeometry args={[0.04, model.height, model.thickness]} />
                  <meshStandardMaterial color="#1e293b" roughness={0.6} />
                </mesh>
                <mesh position={[0, model.height / 2 - 0.02, 0]}>
                  <boxGeometry args={[model.width, 0.04, model.thickness]} />
                  <meshStandardMaterial color="#1e293b" roughness={0.6} />
                </mesh>
                <group position={[-model.width / 2 + 0.04, 0, 0]} rotation={[0, swingAngle, 0]}>
                  <mesh position={[panelWidth / 2, 0, 0]}>
                    <boxGeometry args={[panelWidth, model.height - 0.08, 0.04]} />
                    <meshStandardMaterial color="#b45309" roughness={0.8} />
                  </mesh>
                </group>
              </group>
            );
          } else {
            return (
              <group key={model.id} position={model.position} rotation={model.rotation}>
                <mesh>
                  <boxGeometry args={[model.width, model.height, 0.04]} />
                  <meshStandardMaterial color="#1e293b" roughness={0.6} />
                </mesh>
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

        {/* 3D Site Elements */}
        {(data.siteElements || []).map((site) => {
          const cx = site.x / PIXELS_PER_METER;
          const cz = site.y / PIXELS_PER_METER;
          const cy = (site.floorIndex || 0) * 3.0; // Base Y for this floor
          const rotY = -(site.rotation * Math.PI) / 180;

          if (site.type === "grass") {
            return (
              <mesh key={site.id} position={[cx, cy + 0.02, cz]} rotation={[0, rotY, 0]} receiveShadow>
                <boxGeometry args={[site.width, 0.05, site.length]} />
                <meshStandardMaterial color="#15803d" roughness={1} />
              </mesh>
            );
          } else if (site.type === "parking") {
            return (
              <mesh key={site.id} position={[cx, cy + 0.03, cz]} rotation={[0, rotY, 0]} receiveShadow>
                <boxGeometry args={[site.width, 0.04, site.length]} />
                <meshStandardMaterial color="#334155" roughness={0.9} />
              </mesh>
            );
          } else if (site.type === "vehicle") {
            // Detailed vehicle with body, cabin, wheels, lights
            const bW = site.width;   // body width
            const bL = site.length;  // body length
            const bodyH = 0.5;
            const cabinH = 0.45;
            const wheelR = 0.25;
            const wheelW = 0.15;

            return (
              <group key={site.id} position={[cx, cy, cz]} rotation={[0, rotY, 0]}>
                {/* Lower body / chassis */}
                <mesh position={[0, bodyH / 2, 0]} castShadow>
                  <boxGeometry args={[bW, bodyH, bL]} />
                  <meshStandardMaterial color="#1e40af" roughness={0.3} metalness={0.7} />
                </mesh>

                {/* Upper cabin (windowed section, offset toward front) */}
                <mesh position={[0, bodyH + cabinH / 2, -bL * 0.05]} castShadow>
                  <boxGeometry args={[bW - 0.15, cabinH, bL * 0.55]} />
                  <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.8} transparent opacity={0.85} />
                </mesh>

                {/* Windshield (front glass, angled) */}
                <mesh position={[0, bodyH + cabinH * 0.6, bL * 0.22]} rotation={[0.3, 0, 0]} castShadow>
                  <boxGeometry args={[bW - 0.2, cabinH * 0.7, 0.02]} />
                  <meshStandardMaterial color="#38bdf8" roughness={0.05} metalness={0.9} transparent opacity={0.4} />
                </mesh>

                {/* Rear windshield */}
                <mesh position={[0, bodyH + cabinH * 0.6, -bL * 0.32]} rotation={[-0.3, 0, 0]} castShadow>
                  <boxGeometry args={[bW - 0.2, cabinH * 0.7, 0.02]} />
                  <meshStandardMaterial color="#38bdf8" roughness={0.05} metalness={0.9} transparent opacity={0.4} />
                </mesh>

                {/* Front bumper */}
                <mesh position={[0, 0.15, bL / 2 + 0.04]} castShadow>
                  <boxGeometry args={[bW + 0.04, 0.2, 0.08]} />
                  <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.5} />
                </mesh>

                {/* Rear bumper */}
                <mesh position={[0, 0.15, -bL / 2 - 0.04]} castShadow>
                  <boxGeometry args={[bW + 0.04, 0.2, 0.08]} />
                  <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.5} />
                </mesh>

                {/* Headlights (front left & right) */}
                <mesh position={[-bW / 2 + 0.2, 0.3, bL / 2 + 0.01]}>
                  <boxGeometry args={[0.22, 0.1, 0.04]} />
                  <meshStandardMaterial color="#fef3c7" emissive="#fbbf24" emissiveIntensity={0.8} />
                </mesh>
                <mesh position={[bW / 2 - 0.2, 0.3, bL / 2 + 0.01]}>
                  <boxGeometry args={[0.22, 0.1, 0.04]} />
                  <meshStandardMaterial color="#fef3c7" emissive="#fbbf24" emissiveIntensity={0.8} />
                </mesh>

                {/* Taillights (rear left & right) */}
                <mesh position={[-bW / 2 + 0.2, 0.3, -bL / 2 - 0.01]}>
                  <boxGeometry args={[0.22, 0.1, 0.04]} />
                  <meshStandardMaterial color="#fca5a5" emissive="#ef4444" emissiveIntensity={0.6} />
                </mesh>
                <mesh position={[bW / 2 - 0.2, 0.3, -bL / 2 - 0.01]}>
                  <boxGeometry args={[0.22, 0.1, 0.04]} />
                  <meshStandardMaterial color="#fca5a5" emissive="#ef4444" emissiveIntensity={0.6} />
                </mesh>

                {/* 4 Wheels (cylinders rotated sideways) */}
                {/* Front-left */}
                <mesh position={[-bW / 2 - wheelW / 2, wheelR, bL * 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[wheelR, wheelR, wheelW, 16]} />
                  <meshStandardMaterial color="#1c1917" roughness={0.9} />
                </mesh>
                {/* Front-right */}
                <mesh position={[bW / 2 + wheelW / 2, wheelR, bL * 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[wheelR, wheelR, wheelW, 16]} />
                  <meshStandardMaterial color="#1c1917" roughness={0.9} />
                </mesh>
                {/* Rear-left */}
                <mesh position={[-bW / 2 - wheelW / 2, wheelR, -bL * 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[wheelR, wheelR, wheelW, 16]} />
                  <meshStandardMaterial color="#1c1917" roughness={0.9} />
                </mesh>
                {/* Rear-right */}
                <mesh position={[bW / 2 + wheelW / 2, wheelR, -bL * 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[wheelR, wheelR, wheelW, 16]} />
                  <meshStandardMaterial color="#1c1917" roughness={0.9} />
                </mesh>

                {/* Wheel rims (shiny disc inside each wheel) */}
                {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([xSign, zSign], idx) => (
                  <mesh
                    key={`rim_${idx}`}
                    position={[xSign * (bW / 2 + wheelW / 2), wheelR, zSign * bL * 0.3]}
                    rotation={[0, 0, Math.PI / 2]}
                  >
                    <cylinderGeometry args={[wheelR * 0.55, wheelR * 0.55, wheelW + 0.02, 16]} />
                    <meshStandardMaterial color="#a1a1aa" roughness={0.2} metalness={0.8} />
                  </mesh>
                ))}

                {/* Roof rack lines (subtle chrome strips on top) */}
                <mesh position={[0, bodyH + cabinH + 0.02, -bL * 0.05]}>
                  <boxGeometry args={[bW - 0.3, 0.02, bL * 0.45]} />
                  <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.6} />
                </mesh>
              </group>
            );
          } else if (site.type === "gate") {
            return (
              <mesh key={site.id} position={[cx, cy + 0.6, cz]} rotation={[0, rotY, 0]} castShadow receiveShadow>
                <boxGeometry args={[site.width, 1.2, site.length]} />
                <meshStandardMaterial color="#b45309" roughness={0.7} />
              </mesh>
            );
          } else if (site.type === "tree") {
            return (
              <group key={site.id} position={[cx, cy, cz]} rotation={[0, rotY, 0]}>
                <mesh position={[0, 1.5, 0]} castShadow>
                  <cylinderGeometry args={[0.2, 0.3, 3, 8]} />
                  <meshStandardMaterial color="#78350f" roughness={0.9} />
                </mesh>
                <mesh position={[0, 3.5, 0]} castShadow>
                  <sphereGeometry args={[1.5, 16, 16]} />
                  <meshStandardMaterial color="#16a34a" roughness={0.8} />
                </mesh>
              </group>
            );
          } else if (site.type === "stairs") {
            // 3D Staircase with individual treads, stringers, and railings
            const stW = site.width;
            const stL = site.length;
            const totalH = 3.0; // One floor height
            const numTreads = Math.max(4, Math.round(stL / 0.28)); // ~28cm tread depth
            const treadDepth = stL / numTreads;
            const riserH = totalH / numTreads;
            const treadThickness = 0.05;
            const railHeight = 0.9;
            const railThickness = 0.04;
            const postSize = 0.05;

            return (
              <group key={site.id} position={[cx, cy, cz]} rotation={[0, rotY, 0]}>
                {/* Individual treads */}
                {Array.from({ length: numTreads }, (_, i) => {
                  const treadY = riserH * (i + 1);
                  const treadZ = -stL / 2 + treadDepth * i + treadDepth / 2;

                  return (
                    <mesh key={`tread_${i}`} position={[0, treadY, treadZ]} castShadow receiveShadow>
                      <boxGeometry args={[stW, treadThickness, treadDepth]} />
                      <meshStandardMaterial color="#78716c" roughness={0.7} />
                    </mesh>
                  );
                })}

                {/* Risers (vertical faces between treads) */}
                {Array.from({ length: numTreads }, (_, i) => {
                  const riserY = riserH * i + riserH / 2;
                  const riserZ = -stL / 2 + treadDepth * i + treadDepth / 2;

                  return (
                    <mesh key={`riser_${i}`} position={[0, riserY, riserZ]} castShadow>
                      <boxGeometry args={[stW, riserH, treadThickness]} />
                      <meshStandardMaterial color="#57534e" roughness={0.8} />
                    </mesh>
                  );
                })}

                {/* Left stringer (side beam) */}
                <mesh
                  position={[-stW / 2 - 0.02, totalH / 2, 0]}
                  castShadow
                >
                  <boxGeometry args={[0.04, totalH, stL]} />
                  <meshStandardMaterial color="#44403c" roughness={0.6} />
                </mesh>

                {/* Right stringer */}
                <mesh
                  position={[stW / 2 + 0.02, totalH / 2, 0]}
                  castShadow
                >
                  <boxGeometry args={[0.04, totalH, stL]} />
                  <meshStandardMaterial color="#44403c" roughness={0.6} />
                </mesh>

                {/* Left railing */}
                <mesh position={[-stW / 2 - 0.02, totalH + railHeight / 2, 0]}>
                  <boxGeometry args={[railThickness, railHeight, stL]} />
                  <meshStandardMaterial color="#71717a" roughness={0.3} metalness={0.7} />
                </mesh>

                {/* Right railing */}
                <mesh position={[stW / 2 + 0.02, totalH + railHeight / 2, 0]}>
                  <boxGeometry args={[railThickness, railHeight, stL]} />
                  <meshStandardMaterial color="#71717a" roughness={0.3} metalness={0.7} />
                </mesh>

                {/* Railing posts (left side) */}
                {Array.from({ length: Math.ceil(numTreads / 3) + 1 }, (_, i) => {
                  const postI = i * 3;
                  const postY = Math.min(riserH * (postI + 1), totalH) + railHeight / 2;
                  const postZ = -stL / 2 + treadDepth * Math.min(postI, numTreads - 1) + treadDepth / 2;
                  return (
                    <mesh key={`lpost_${i}`} position={[-stW / 2 - 0.02, postY, postZ]}>
                      <boxGeometry args={[postSize, railHeight, postSize]} />
                      <meshStandardMaterial color="#a1a1aa" roughness={0.3} metalness={0.6} />
                    </mesh>
                  );
                })}

                {/* Railing posts (right side) */}
                {Array.from({ length: Math.ceil(numTreads / 3) + 1 }, (_, i) => {
                  const postI = i * 3;
                  const postY = Math.min(riserH * (postI + 1), totalH) + railHeight / 2;
                  const postZ = -stL / 2 + treadDepth * Math.min(postI, numTreads - 1) + treadDepth / 2;
                  return (
                    <mesh key={`rpost_${i}`} position={[stW / 2 + 0.02, postY, postZ]}>
                      <boxGeometry args={[postSize, railHeight, postSize]} />
                      <meshStandardMaterial color="#a1a1aa" roughness={0.3} metalness={0.6} />
                    </mesh>
                  );
                })}
              </group>
            );
          }
          return null;
        })}

        {/* 3D Room Labels */}
        {(data.roomLabels || []).map((label) => {
          const cx = label.x / PIXELS_PER_METER;
          const cz = label.y / PIXELS_PER_METER;
          const floorIdx = label.floorIndex || 0;
          const cy = floorIdx * 3.0 + 0.15; // Slightly above floor

          return (
            <RoomLabel3D
              key={label.id}
              text={label.text}
              position={[cx, cy, cz]}
            />
          );
        })}

        {/* Stacked roof mesh at very top */}
        {roofMesh}

        {/* Ground base plate */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
          <planeGeometry args={[150, 150]} />
          <meshStandardMaterial color={aesthetics.floorColor} opacity={0.6} transparent />
        </mesh>
      </Canvas>
    </div>
  );
}

interface RoomLabel3DProps {
  text: string;
  position: [number, number, number];
}

function RoomLabel3D({ text, position }: RoomLabel3DProps) {
  const labelData = useMemo(() => {
    if (typeof window === "undefined") return null;

    // Create a temporary canvas to measure text length
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return null;

    const fontSize = 44;
    tempCtx.font = `bold ${fontSize}px sans-serif`;
    const textUpper = text.toUpperCase();
    const textWidth = tempCtx.measureText(textUpper).width;

    const paddingX = 40;
    const paddingY = 20;
    const borderThickness = 4;

    const rectW = textWidth + paddingX * 2;
    const rectH = fontSize + paddingY * 2;

    const canvasW = Math.max(128, Math.ceil(rectW));
    const canvasH = Math.max(64, Math.ceil(rectH));

    const canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Background Rounded Rect with Neon Border
    const radius = 16;
    const halfBorder = borderThickness / 2;
    const rx = halfBorder;
    const ry = halfBorder;
    const rw = canvasW - borderThickness;
    const rh = canvasH - borderThickness;

    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = borderThickness;

    ctx.beginPath();
    ctx.moveTo(rx + radius, ry);
    ctx.lineTo(rx + rw - radius, ry);
    ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
    ctx.lineTo(rx + rw, ry + rh - radius);
    ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
    ctx.lineTo(rx + radius, ry + rh);
    ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
    ctx.lineTo(rx, ry + radius);
    ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
    ctx.closePath();

    ctx.fill();
    ctx.stroke();

    // Draw text centered
    ctx.fillStyle = "#f1f5f9";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillText(textUpper, canvasW / 2, canvasH / 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;

    return {
      texture: tex,
      width: canvasW / 200,
      height: canvasH / 200,
    };
  }, [text]);

  useEffect(() => {
    return () => {
      if (labelData?.texture) {
        labelData.texture.dispose();
      }
    };
  }, [labelData]);

  if (!labelData) return null;

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[labelData.width, labelData.height]} />
      <meshBasicMaterial map={labelData.texture} transparent depthWrite={false} />
    </mesh>
  );
}
