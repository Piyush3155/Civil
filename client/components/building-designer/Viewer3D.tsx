"use client";

import { useMemo, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Environment, ContactShadows, Edges } from "@react-three/drei";
import { FloorPlanData, Aesthetics } from "./types";
import * as THREE from "three";

interface Viewer3DProps {
  data: FloorPlanData;
  aesthetics: Aesthetics;
}

const PIXELS_PER_METER = 20;

// ─── Reusable Edge-Outlined Wall Segment ────────────────────────────────────
function WallSegment({ position, rotation, args, color }: {
  position: [number, number, number];
  rotation: [number, number, number];
  args: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial
        color={color}
        roughness={0.85}
        metalness={0.05}
        flatShading={false}
      />
      <Edges threshold={15} color="#1e293b" lineWidth={1} />
    </mesh>
  );
}

// ─── Detailed 3D Door ───────────────────────────────────────────────────────
function Door3D({ position, rotation, width, height, thickness }: {
  position: [number, number, number];
  rotation: [number, number, number];
  width: number;
  height: number;
  thickness: number;
}) {
  const panelWidth = width - 0.1;
  const swingAngle = Math.PI / 6;

  return (
    <group position={position} rotation={rotation}>
      {/* Door Frame — Left Jamb */}
      <mesh position={[-width / 2 + 0.025, 0, 0]} castShadow>
        <boxGeometry args={[0.05, height, thickness]} />
        <meshStandardMaterial color="#292524" roughness={0.4} metalness={0.3} />
        <Edges threshold={15} color="#0c0a09" lineWidth={1} />
      </mesh>
      {/* Door Frame — Right Jamb */}
      <mesh position={[width / 2 - 0.025, 0, 0]} castShadow>
        <boxGeometry args={[0.05, height, thickness]} />
        <meshStandardMaterial color="#292524" roughness={0.4} metalness={0.3} />
        <Edges threshold={15} color="#0c0a09" lineWidth={1} />
      </mesh>
      {/* Door Frame — Header */}
      <mesh position={[0, height / 2 - 0.025, 0]} castShadow>
        <boxGeometry args={[width, 0.05, thickness]} />
        <meshStandardMaterial color="#292524" roughness={0.4} metalness={0.3} />
        <Edges threshold={15} color="#0c0a09" lineWidth={1} />
      </mesh>
      {/* Swinging Door Panel (hinged at left) */}
      <group position={[-width / 2 + 0.05, 0, 0]} rotation={[0, swingAngle, 0]}>
        {/* Main panel */}
        <mesh position={[panelWidth / 2, 0, 0]} castShadow>
          <boxGeometry args={[panelWidth, height - 0.1, 0.045]} />
          <meshStandardMaterial color="#78350f" roughness={0.75} metalness={0.05} />
          <Edges threshold={15} color="#451a03" lineWidth={1} />
        </mesh>
        {/* Raised panel detail (upper) */}
        <mesh position={[panelWidth / 2, height * 0.18, 0.024]}>
          <boxGeometry args={[panelWidth - 0.14, height * 0.3, 0.008]} />
          <meshStandardMaterial color="#92400e" roughness={0.8} />
        </mesh>
        {/* Raised panel detail (lower) */}
        <mesh position={[panelWidth / 2, -height * 0.15, 0.024]}>
          <boxGeometry args={[panelWidth - 0.14, height * 0.35, 0.008]} />
          <meshStandardMaterial color="#92400e" roughness={0.8} />
        </mesh>
        {/* Door Handle (lever) */}
        <mesh position={[panelWidth - 0.1, 0, 0.03]}>
          <boxGeometry args={[0.02, 0.12, 0.04]} />
          <meshStandardMaterial color="#a8a29e" roughness={0.2} metalness={0.85} />
        </mesh>
        {/* Handle base plate */}
        <mesh position={[panelWidth - 0.1, 0, 0.025]}>
          <boxGeometry args={[0.05, 0.18, 0.01]} />
          <meshStandardMaterial color="#78716c" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

// ─── Detailed 3D Window ─────────────────────────────────────────────────────
function Window3D({ position, rotation, width, height }: {
  position: [number, number, number];
  rotation: [number, number, number];
  width: number;
  height: number;
}) {
  const frameThick = 0.05;
  const mullionWidth = 0.035;

  return (
    <group position={position} rotation={rotation}>
      {/* Outer Frame */}
      {/* Top */}
      <mesh position={[0, height / 2 - frameThick / 2, 0]} castShadow>
        <boxGeometry args={[width, frameThick, 0.06]} />
        <meshStandardMaterial color="#1e293b" roughness={0.35} metalness={0.4} />
        <Edges threshold={15} color="#0f172a" lineWidth={1} />
      </mesh>
      {/* Bottom (sill) */}
      <mesh position={[0, -height / 2 + frameThick / 2, 0]} castShadow>
        <boxGeometry args={[width + 0.06, frameThick, 0.09]} />
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.3} />
        <Edges threshold={15} color="#0f172a" lineWidth={1} />
      </mesh>
      {/* Left */}
      <mesh position={[-width / 2 + frameThick / 2, 0, 0]} castShadow>
        <boxGeometry args={[frameThick, height - frameThick * 2, 0.06]} />
        <meshStandardMaterial color="#1e293b" roughness={0.35} metalness={0.4} />
      </mesh>
      {/* Right */}
      <mesh position={[width / 2 - frameThick / 2, 0, 0]} castShadow>
        <boxGeometry args={[frameThick, height - frameThick * 2, 0.06]} />
        <meshStandardMaterial color="#1e293b" roughness={0.35} metalness={0.4} />
      </mesh>
      {/* Horizontal Mullion (center divider) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width - frameThick * 2, mullionWidth, 0.04]} />
        <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Vertical Mullion (center divider) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[mullionWidth, height - frameThick * 2, 0.04]} />
        <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Glass Panes (4 quadrants) */}
      {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([xSign, ySign], idx) => {
        const paneW = (width - frameThick * 2 - mullionWidth) / 2;
        const paneH = (height - frameThick * 2 - mullionWidth) / 2;
        return (
          <mesh
            key={`pane_${idx}`}
            position={[
              xSign * (paneW / 2 + mullionWidth / 2),
              ySign * (paneH / 2 + mullionWidth / 2),
              0,
            ]}
          >
            <boxGeometry args={[paneW - 0.01, paneH - 0.01, 0.008]} />
            <meshPhysicalMaterial
              color="#bfdbfe"
              roughness={0.05}
              metalness={0.1}
              transparent
              opacity={0.35}
              transmission={0.6}
              reflectivity={0.9}
              clearcoat={1}
              clearcoatRoughness={0.05}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── Realistic Tree ─────────────────────────────────────────────────────────
function Tree3D({ position, rotation }: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Trunk */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.22, 2.4, 12]} />
        <meshStandardMaterial color="#5c3d1e" roughness={0.95} metalness={0} />
        <Edges threshold={20} color="#3b2212" lineWidth={1} />
      </mesh>
      {/* Branch stubs */}
      <mesh position={[0.2, 1.8, 0.1]} rotation={[0, 0, -0.5]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.6, 6]} />
        <meshStandardMaterial color="#5c3d1e" roughness={0.95} />
      </mesh>
      <mesh position={[-0.15, 2.0, -0.08]} rotation={[0.3, 0, 0.6]} castShadow>
        <cylinderGeometry args={[0.03, 0.05, 0.5, 6]} />
        <meshStandardMaterial color="#5c3d1e" roughness={0.95} />
      </mesh>
      {/* Canopy — bottom layer (widest, darkest) */}
      <mesh position={[0, 3.0, 0]} castShadow>
        <sphereGeometry args={[1.6, 20, 16]} />
        <meshStandardMaterial color="#15803d" roughness={0.9} metalness={0} />
      </mesh>
      {/* Canopy — middle layer */}
      <mesh position={[0.3, 3.6, -0.2]} castShadow>
        <sphereGeometry args={[1.2, 16, 14]} />
        <meshStandardMaterial color="#16a34a" roughness={0.85} metalness={0} />
      </mesh>
      {/* Canopy — top layer (smallest, lightest) */}
      <mesh position={[-0.2, 4.1, 0.15]} castShadow>
        <sphereGeometry args={[0.85, 14, 12]} />
        <meshStandardMaterial color="#22c55e" roughness={0.8} metalness={0} />
      </mesh>
    </group>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
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
        position: [cx, f * 3.0 - 0.075, cz],
        args: [w + 0.4, 0.15, d + 0.4],
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

      const floorIdx = wall.floorIndex || 0;
      const baseY = floorIdx * 3.0;

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

    const roofBaseY = (maxFloorIndex + 1) * 3.0;
    const overhang = 0.6;
    const roofW = w + overhang * 2;
    const roofD = d + overhang * 2;
    const pitchHeight = aesthetics.roofHeight;
    const roofThick = 0.15;

    switch (aesthetics.roofType) {
      case "flat":
        return (
          <mesh position={[cx, roofBaseY + 0.1, cz]} castShadow receiveShadow>
            <boxGeometry args={[roofW, 0.2, roofD]} />
            <meshStandardMaterial color={aesthetics.roofColor} roughness={0.6} metalness={0.1} />
            <Edges threshold={15} color="#1e293b" lineWidth={1} />
          </mesh>
        );

      case "pitched": {
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
                <meshStandardMaterial color={aesthetics.roofColor} roughness={0.6} metalness={0.1} />
                <Edges threshold={15} color="#1e293b" lineWidth={1} />
              </mesh>
              <mesh position={[0, slabCY, halfSpan / 2]} rotation={[pitchAngle, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[roofW, roofThick, slopeLen]} />
                <meshStandardMaterial color={aesthetics.roofColor} roughness={0.6} metalness={0.1} />
                <Edges threshold={15} color="#1e293b" lineWidth={1} />
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
                <meshStandardMaterial color={aesthetics.roofColor} roughness={0.6} metalness={0.1} />
                <Edges threshold={15} color="#1e293b" lineWidth={1} />
              </mesh>
              <mesh position={[halfSpan / 2, slabCY, 0]} rotation={[0, 0, -pitchAngle]} castShadow receiveShadow>
                <boxGeometry args={[slopeLen, roofThick, roofD]} />
                <meshStandardMaterial color={aesthetics.roofColor} roughness={0.6} metalness={0.1} />
                <Edges threshold={15} color="#1e293b" lineWidth={1} />
              </mesh>
            </group>
          );
        }
      }

      case "hip": {
        const scaleX = roofW / Math.sqrt(2);
        const scaleZ = roofD / Math.sqrt(2);

        return (
          <mesh 
            position={[cx, roofBaseY + pitchHeight / 2, cz]} 
            rotation={[0, Math.PI / 4, 0]}
            scale={[scaleX, 1, scaleZ]}
            castShadow 
            receiveShadow
          >
            <cylinderGeometry args={[0, 1, pitchHeight, 4, 1]} />
            <meshStandardMaterial color={aesthetics.roofColor} roughness={0.6} metalness={0.1} />
            <Edges threshold={15} color="#1e293b" lineWidth={1} />
          </mesh>
        );
      }

      case "shed": {
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
              <meshStandardMaterial color={aesthetics.roofColor} roughness={0.6} metalness={0.1} />
              <Edges threshold={15} color="#1e293b" lineWidth={1} />
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
              <meshStandardMaterial color={aesthetics.roofColor} roughness={0.6} metalness={0.1} />
              <Edges threshold={15} color="#1e293b" lineWidth={1} />
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
      <Canvas
        camera={{ position: [18, 22, 18], fov: 40 }}
        shadows
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      >
        {/* ─── Lighting System (3-point + hemisphere) ─── */}
        <ambientLight intensity={0.35} color="#e2e8f0" />
        <hemisphereLight
          args={["#bfdbfe", "#d6d3d1", 0.4]}
        />
        {/* Key Light (main directional — sun) */}
        <directionalLight
          position={[20, 40, 20]}
          intensity={1.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
          shadow-camera-near={0.5}
          shadow-camera-far={80}
          shadow-bias={-0.0005}
          color="#fef3c7"
        />
        {/* Fill Light (softer, opposite side) */}
        <directionalLight
          position={[-15, 20, -10]}
          intensity={0.5}
          color="#dbeafe"
        />
        {/* Rim Light (back edge highlight) */}
        <directionalLight
          position={[-5, 15, -25]}
          intensity={0.3}
          color="#e0e7ff"
        />

        <Environment preset="apartment" />
        <OrbitControls
          makeDefault
          maxPolarAngle={Math.PI / 2 - 0.05}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.6}
          zoomSpeed={0.8}
          panSpeed={0.5}
        />

        {/* Floor Grid */}
        <Grid
          infiniteGrid
          fadeDistance={60}
          sectionColor={aesthetics.floorColor}
          cellColor="#475569"
          cellSize={1}
          sectionSize={5}
          position={[0, 0.01, 0]}
        />

        {/* Contact Shadows (soft shadow pool under objects) */}
        <ContactShadows
          position={[0, 0.005, 0]}
          opacity={0.5}
          scale={80}
          blur={2.5}
          far={15}
          color="#1e293b"
        />

        {/* Floor concrete separation slabs */}
        {separationSlabs.map((slab) => (
          <mesh key={slab.id} position={slab.position} castShadow receiveShadow>
            <boxGeometry args={slab.args} />
            <meshStandardMaterial color={aesthetics.floorColor} roughness={0.75} metalness={0.1} />
            <Edges threshold={15} color="#1e293b" lineWidth={1} />
          </mesh>
        ))}

        {/* Extruded Wall segments with edge outlines */}
        {wallSegments.map((seg) => (
          <WallSegment
            key={seg.id}
            position={seg.position}
            rotation={seg.rotation}
            args={seg.args}
            color={seg.color}
          />
        ))}

        {/* 3D door/window opening models */}
        {openingModels.map((model) => {
          if (model.type === "door") {
            return (
              <Door3D
                key={model.id}
                position={model.position}
                rotation={model.rotation}
                width={model.width}
                height={model.height}
                thickness={model.thickness}
              />
            );
          } else {
            return (
              <Window3D
                key={model.id}
                position={model.position}
                rotation={model.rotation}
                width={model.width}
                height={model.height}
              />
            );
          }
        })}

        {/* 3D Site Elements */}
        {(data.siteElements || []).map((site) => {
          const cx = site.x / PIXELS_PER_METER;
          const cz = site.y / PIXELS_PER_METER;
          const cy = (site.floorIndex || 0) * 3.0;
          const rotY = -(site.rotation * Math.PI) / 180;

          if (site.type === "grass") {
            return (
              <group key={site.id} position={[cx, cy, cz]} rotation={[0, rotY, 0]}>
                {/* Base soil layer */}
                <mesh position={[0, 0.01, 0]} receiveShadow>
                  <boxGeometry args={[site.width, 0.02, site.length]} />
                  <meshStandardMaterial color="#3f2d17" roughness={1} />
                </mesh>
                {/* Grass layer */}
                <mesh position={[0, 0.035, 0]} receiveShadow>
                  <boxGeometry args={[site.width - 0.02, 0.03, site.length - 0.02]} />
                  <meshStandardMaterial color="#15803d" roughness={0.95} metalness={0} />
                </mesh>
                {/* Grass variation patches */}
                <mesh position={[site.width * 0.15, 0.05, site.length * 0.1]} receiveShadow>
                  <boxGeometry args={[site.width * 0.4, 0.01, site.length * 0.3]} />
                  <meshStandardMaterial color="#16a34a" roughness={0.9} />
                </mesh>
                <mesh position={[-site.width * 0.2, 0.05, -site.length * 0.15]} receiveShadow>
                  <boxGeometry args={[site.width * 0.3, 0.01, site.length * 0.35]} />
                  <meshStandardMaterial color="#22c55e" roughness={0.85} />
                </mesh>
                {/* Grass edge border */}
                <mesh position={[0, 0.03, 0]} receiveShadow>
                  <boxGeometry args={[site.width, 0.06, site.length]} />
                  <meshStandardMaterial color="#166534" roughness={1} transparent opacity={0} />
                  <Edges threshold={15} color="#14532d" lineWidth={1} />
                </mesh>
              </group>
            );
          } else if (site.type === "parking") {
            return (
              <group key={site.id} position={[cx, cy, cz]} rotation={[0, rotY, 0]}>
                {/* Asphalt surface */}
                <mesh position={[0, 0.025, 0]} receiveShadow>
                  <boxGeometry args={[site.width, 0.05, site.length]} />
                  <meshStandardMaterial color="#27272a" roughness={0.95} metalness={0.05} />
                  <Edges threshold={15} color="#18181b" lineWidth={1} />
                </mesh>
                {/* Parking line markings */}
                {/* Center line */}
                <mesh position={[0, 0.055, 0]} receiveShadow>
                  <boxGeometry args={[0.06, 0.005, site.length - 0.2]} />
                  <meshStandardMaterial color="#fafafa" roughness={0.6} />
                </mesh>
                {/* Left boundary */}
                <mesh position={[-site.width / 2 + 0.08, 0.055, 0]} receiveShadow>
                  <boxGeometry args={[0.06, 0.005, site.length - 0.2]} />
                  <meshStandardMaterial color="#fafafa" roughness={0.6} />
                </mesh>
                {/* Right boundary */}
                <mesh position={[site.width / 2 - 0.08, 0.055, 0]} receiveShadow>
                  <boxGeometry args={[0.06, 0.005, site.length - 0.2]} />
                  <meshStandardMaterial color="#fafafa" roughness={0.6} />
                </mesh>
                {/* Top/Bottom boundary lines */}
                <mesh position={[0, 0.055, site.length / 2 - 0.08]} receiveShadow>
                  <boxGeometry args={[site.width - 0.1, 0.005, 0.06]} />
                  <meshStandardMaterial color="#fafafa" roughness={0.6} />
                </mesh>
                <mesh position={[0, 0.055, -site.length / 2 + 0.08]} receiveShadow>
                  <boxGeometry args={[site.width - 0.1, 0.005, 0.06]} />
                  <meshStandardMaterial color="#fafafa" roughness={0.6} />
                </mesh>
                {/* Parking symbol (P) — small raised block */}
                <mesh position={[0, 0.058, 0]} receiveShadow>
                  <boxGeometry args={[0.35, 0.003, 0.45]} />
                  <meshStandardMaterial color="#3b82f6" roughness={0.5} />
                </mesh>
              </group>
            );
          } else if (site.type === "vehicle") {
            // Detailed vehicle with body, cabin, wheels, lights
            const bW = site.width;
            const bL = site.length;
            const bodyH = 0.5;
            const cabinH = 0.45;
            const wheelR = 0.25;
            const wheelW = 0.15;

            return (
              <group key={site.id} position={[cx, cy, cz]} rotation={[0, rotY, 0]}>
                {/* Lower body / chassis */}
                <mesh position={[0, bodyH / 2, 0]} castShadow>
                  <boxGeometry args={[bW, bodyH, bL]} />
                  <meshStandardMaterial color="#1e40af" roughness={0.25} metalness={0.75} />
                  <Edges threshold={20} color="#0f1d5c" lineWidth={1} />
                </mesh>

                {/* Upper cabin (windowed section) */}
                <mesh position={[0, bodyH + cabinH / 2, -bL * 0.05]} castShadow>
                  <boxGeometry args={[bW - 0.15, cabinH, bL * 0.55]} />
                  <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.8} transparent opacity={0.85} />
                  <Edges threshold={20} color="#020617" lineWidth={1} />
                </mesh>

                {/* Windshield */}
                <mesh position={[0, bodyH + cabinH * 0.6, bL * 0.22]} rotation={[0.3, 0, 0]} castShadow>
                  <boxGeometry args={[bW - 0.2, cabinH * 0.7, 0.02]} />
                  <meshPhysicalMaterial color="#bfdbfe" roughness={0.05} metalness={0.1} transparent opacity={0.35} transmission={0.5} />
                </mesh>

                {/* Rear windshield */}
                <mesh position={[0, bodyH + cabinH * 0.6, -bL * 0.32]} rotation={[-0.3, 0, 0]} castShadow>
                  <boxGeometry args={[bW - 0.2, cabinH * 0.7, 0.02]} />
                  <meshPhysicalMaterial color="#bfdbfe" roughness={0.05} metalness={0.1} transparent opacity={0.35} transmission={0.5} />
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

                {/* Headlights */}
                <mesh position={[-bW / 2 + 0.2, 0.3, bL / 2 + 0.01]}>
                  <boxGeometry args={[0.22, 0.1, 0.04]} />
                  <meshStandardMaterial color="#fef3c7" emissive="#fbbf24" emissiveIntensity={0.8} />
                </mesh>
                <mesh position={[bW / 2 - 0.2, 0.3, bL / 2 + 0.01]}>
                  <boxGeometry args={[0.22, 0.1, 0.04]} />
                  <meshStandardMaterial color="#fef3c7" emissive="#fbbf24" emissiveIntensity={0.8} />
                </mesh>

                {/* Taillights */}
                <mesh position={[-bW / 2 + 0.2, 0.3, -bL / 2 - 0.01]}>
                  <boxGeometry args={[0.22, 0.1, 0.04]} />
                  <meshStandardMaterial color="#fca5a5" emissive="#ef4444" emissiveIntensity={0.6} />
                </mesh>
                <mesh position={[bW / 2 - 0.2, 0.3, -bL / 2 - 0.01]}>
                  <boxGeometry args={[0.22, 0.1, 0.04]} />
                  <meshStandardMaterial color="#fca5a5" emissive="#ef4444" emissiveIntensity={0.6} />
                </mesh>

                {/* 4 Wheels */}
                <mesh position={[-bW / 2 - wheelW / 2, wheelR, bL * 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[wheelR, wheelR, wheelW, 16]} />
                  <meshStandardMaterial color="#1c1917" roughness={0.9} />
                </mesh>
                <mesh position={[bW / 2 + wheelW / 2, wheelR, bL * 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[wheelR, wheelR, wheelW, 16]} />
                  <meshStandardMaterial color="#1c1917" roughness={0.9} />
                </mesh>
                <mesh position={[-bW / 2 - wheelW / 2, wheelR, -bL * 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[wheelR, wheelR, wheelW, 16]} />
                  <meshStandardMaterial color="#1c1917" roughness={0.9} />
                </mesh>
                <mesh position={[bW / 2 + wheelW / 2, wheelR, -bL * 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[wheelR, wheelR, wheelW, 16]} />
                  <meshStandardMaterial color="#1c1917" roughness={0.9} />
                </mesh>

                {/* Wheel rims */}
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

                {/* Roof rack */}
                <mesh position={[0, bodyH + cabinH + 0.02, -bL * 0.05]}>
                  <boxGeometry args={[bW - 0.3, 0.02, bL * 0.45]} />
                  <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.6} />
                </mesh>
              </group>
            );
          } else if (site.type === "gate") {
            const gateHeight = 2.2;
            const gateThick = 0.35;
            const barCount = Math.max(3, Math.floor(site.width / 0.15));

            return (
              <group key={site.id} position={[cx, cy, cz]} rotation={[0, rotY, 0]}>
                {/* Left Pillar */}
                <mesh position={[-site.width / 2, gateHeight / 2, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.35, gateHeight, gateThick]} />
                  <meshStandardMaterial color="#44403c" roughness={0.75} metalness={0.15} />
                  <Edges threshold={15} color="#1c1917" lineWidth={1} />
                </mesh>
                {/* Left pillar cap */}
                <mesh position={[-site.width / 2, gateHeight + 0.08, 0]} castShadow>
                  <boxGeometry args={[0.45, 0.15, 0.45]} />
                  <meshStandardMaterial color="#57534e" roughness={0.7} metalness={0.2} />
                  <Edges threshold={15} color="#1c1917" lineWidth={1} />
                </mesh>
                {/* Right Pillar */}
                <mesh position={[site.width / 2, gateHeight / 2, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.35, gateHeight, gateThick]} />
                  <meshStandardMaterial color="#44403c" roughness={0.75} metalness={0.15} />
                  <Edges threshold={15} color="#1c1917" lineWidth={1} />
                </mesh>
                {/* Right pillar cap */}
                <mesh position={[site.width / 2, gateHeight + 0.08, 0]} castShadow>
                  <boxGeometry args={[0.45, 0.15, 0.45]} />
                  <meshStandardMaterial color="#57534e" roughness={0.7} metalness={0.2} />
                  <Edges threshold={15} color="#1c1917" lineWidth={1} />
                </mesh>
                {/* Gate Header */}
                <mesh position={[0, gateHeight - 0.06, 0]} castShadow>
                  <boxGeometry args={[site.width - 0.35, 0.12, 0.08]} />
                  <meshStandardMaterial color="#292524" roughness={0.3} metalness={0.7} />
                </mesh>
                {/* Gate Bottom Rail */}
                <mesh position={[0, 0.15, 0]} castShadow>
                  <boxGeometry args={[site.width - 0.35, 0.08, 0.06]} />
                  <meshStandardMaterial color="#292524" roughness={0.3} metalness={0.7} />
                </mesh>
                {/* Middle horizontal rail */}
                <mesh position={[0, gateHeight * 0.45, 0]} castShadow>
                  <boxGeometry args={[site.width - 0.35, 0.06, 0.05]} />
                  <meshStandardMaterial color="#292524" roughness={0.3} metalness={0.7} />
                </mesh>
                {/* Vertical iron bars */}
                {Array.from({ length: barCount }, (_, i) => {
                  const barX = -site.width / 2 + 0.35 + ((site.width - 0.7) / (barCount - 1)) * i;
                  return (
                    <mesh key={`bar_${i}`} position={[barX, gateHeight / 2, 0]} castShadow>
                      <boxGeometry args={[0.025, gateHeight - 0.4, 0.025]} />
                      <meshStandardMaterial color="#1c1917" roughness={0.4} metalness={0.6} />
                    </mesh>
                  );
                })}
                {/* Decorative top spikes on each bar */}
                {Array.from({ length: barCount }, (_, i) => {
                  const barX = -site.width / 2 + 0.35 + ((site.width - 0.7) / (barCount - 1)) * i;
                  return (
                    <mesh key={`spike_${i}`} position={[barX, gateHeight - 0.1, 0]} castShadow>
                      <coneGeometry args={[0.025, 0.1, 4]} />
                      <meshStandardMaterial color="#1c1917" roughness={0.4} metalness={0.6} />
                    </mesh>
                  );
                })}
              </group>
            );
          } else if (site.type === "tree") {
            return (
              <Tree3D
                key={site.id}
                position={[cx, cy, cz]}
                rotation={[0, rotY, 0]}
              />
            );
          } else if (site.type === "stairs") {
            const stW = site.width;
            const stL = site.length;
            const totalH = 3.0;
            const numTreads = Math.max(4, Math.round(stL / 0.28));
            const treadDepth = stL / numTreads;
            const riserH = totalH / numTreads;
            const treadThickness = 0.05;
            const nosingOverhang = 0.02;
            const railHeight = 0.9;
            const railThickness = 0.04;
            const postSize = 0.05;

            return (
              <group key={site.id} position={[cx, cy, cz]} rotation={[0, rotY, 0]}>
                {/* Individual treads with nosing overhang */}
                {Array.from({ length: numTreads }, (_, i) => {
                  const treadY = riserH * (i + 1);
                  const treadZ = -stL / 2 + treadDepth * i + treadDepth / 2;

                  return (
                    <mesh key={`tread_${i}`} position={[0, treadY, treadZ + nosingOverhang / 2]} castShadow receiveShadow>
                      <boxGeometry args={[stW + 0.02, treadThickness, treadDepth + nosingOverhang]} />
                      <meshStandardMaterial color="#78716c" roughness={0.65} metalness={0.1} />
                      <Edges threshold={15} color="#44403c" lineWidth={1} />
                    </mesh>
                  );
                })}

                {/* Risers */}
                {Array.from({ length: numTreads }, (_, i) => {
                  const riserY = riserH * i + riserH / 2;
                  const riserZ = -stL / 2 + treadDepth * i + treadDepth / 2;

                  return (
                    <mesh key={`riser_${i}`} position={[0, riserY, riserZ]} castShadow>
                      <boxGeometry args={[stW, riserH, treadThickness]} />
                      <meshStandardMaterial color="#57534e" roughness={0.8} metalness={0.05} />
                    </mesh>
                  );
                })}

                {/* Left stringer */}
                <mesh position={[-stW / 2 - 0.02, totalH / 2, 0]} castShadow>
                  <boxGeometry args={[0.05, totalH, stL]} />
                  <meshStandardMaterial color="#44403c" roughness={0.6} metalness={0.1} />
                  <Edges threshold={15} color="#292524" lineWidth={1} />
                </mesh>
                {/* Right stringer */}
                <mesh position={[stW / 2 + 0.02, totalH / 2, 0]} castShadow>
                  <boxGeometry args={[0.05, totalH, stL]} />
                  <meshStandardMaterial color="#44403c" roughness={0.6} metalness={0.1} />
                  <Edges threshold={15} color="#292524" lineWidth={1} />
                </mesh>

                {/* Left railing */}
                <mesh position={[-stW / 2 - 0.02, totalH + railHeight / 2, 0]}>
                  <boxGeometry args={[railThickness, railHeight, stL]} />
                  <meshStandardMaterial color="#71717a" roughness={0.25} metalness={0.75} />
                </mesh>
                {/* Right railing */}
                <mesh position={[stW / 2 + 0.02, totalH + railHeight / 2, 0]}>
                  <boxGeometry args={[railThickness, railHeight, stL]} />
                  <meshStandardMaterial color="#71717a" roughness={0.25} metalness={0.75} />
                </mesh>

                {/* Railing posts (left side) */}
                {Array.from({ length: Math.ceil(numTreads / 3) + 1 }, (_, i) => {
                  const postI = i * 3;
                  const postY = Math.min(riserH * (postI + 1), totalH) + railHeight / 2;
                  const postZ = -stL / 2 + treadDepth * Math.min(postI, numTreads - 1) + treadDepth / 2;
                  return (
                    <mesh key={`lpost_${i}`} position={[-stW / 2 - 0.02, postY, postZ]}>
                      <boxGeometry args={[postSize, railHeight, postSize]} />
                      <meshStandardMaterial color="#a1a1aa" roughness={0.25} metalness={0.7} />
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
                      <meshStandardMaterial color="#a1a1aa" roughness={0.25} metalness={0.7} />
                    </mesh>
                  );
                })}
              </group>
            );
          } else if (site.type === "compound") {
            const w = site.width;
            const l = site.length;

            let h = 1.8;
            let th = 0.2;
            let wallColor = "#94a3b8";
            let pillarColor = "#64748b";
            const pillarH = h + 0.15;
            const pillarW = 0.3;
            const capExtra = 0.1;

            if (site.style === "brick") {
              wallColor = "#991b1b";
              pillarColor = "#78350f";
            } else if (site.style === "modern") {
              wallColor = "#334155";
              pillarColor = "#1e293b";
              h = 2.0;
            } else if (site.style === "picket") {
              wallColor = "#ffffff";
              pillarColor = "#e2e8f0";
              h = 1.2;
              th = 0.1;
            }

            return (
              <group key={site.id} position={[cx, cy, cz]} rotation={[0, rotY, 0]}>
                {/* Front wall */}
                <mesh position={[0, h / 2, l / 2]} castShadow receiveShadow>
                  <boxGeometry args={[w + th, h, th]} />
                  <meshStandardMaterial color={wallColor} roughness={0.8} metalness={0.05} />
                  <Edges threshold={15} color="#1e293b" lineWidth={1} />
                </mesh>
                {/* Back wall */}
                <mesh position={[0, h / 2, -l / 2]} castShadow receiveShadow>
                  <boxGeometry args={[w + th, h, th]} />
                  <meshStandardMaterial color={wallColor} roughness={0.8} metalness={0.05} />
                  <Edges threshold={15} color="#1e293b" lineWidth={1} />
                </mesh>
                {/* Left wall */}
                <mesh position={[-w / 2, h / 2, 0]} castShadow receiveShadow>
                  <boxGeometry args={[th, h, l - th]} />
                  <meshStandardMaterial color={wallColor} roughness={0.8} metalness={0.05} />
                  <Edges threshold={15} color="#1e293b" lineWidth={1} />
                </mesh>
                {/* Right wall */}
                <mesh position={[w / 2, h / 2, 0]} castShadow receiveShadow>
                  <boxGeometry args={[th, h, l - th]} />
                  <meshStandardMaterial color={wallColor} roughness={0.8} metalness={0.05} />
                  <Edges threshold={15} color="#1e293b" lineWidth={1} />
                </mesh>

                {/* Corner pillars with caps */}
                {[
                  [-w / 2, l / 2],
                  [w / 2, l / 2],
                  [-w / 2, -l / 2],
                  [w / 2, -l / 2],
                ].map(([px, pz], idx) => (
                  <group key={`pillar_${idx}`}>
                    {/* Pillar body */}
                    <mesh position={[px, pillarH / 2, pz]} castShadow receiveShadow>
                      <boxGeometry args={[pillarW, pillarH, pillarW]} />
                      <meshStandardMaterial color={pillarColor} roughness={0.7} metalness={0.15} />
                      <Edges threshold={15} color="#0f172a" lineWidth={1} />
                    </mesh>
                    {/* Pillar cap */}
                    <mesh position={[px, pillarH + 0.05, pz]} castShadow>
                      <boxGeometry args={[pillarW + capExtra, 0.1, pillarW + capExtra]} />
                      <meshStandardMaterial color={pillarColor} roughness={0.6} metalness={0.2} />
                      <Edges threshold={15} color="#0f172a" lineWidth={1} />
                    </mesh>
                  </group>
                ))}
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
          const cy = floorIdx * 3.0 + 0.15;

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

        {/* Ground base plate — solid matte concrete */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
          <planeGeometry args={[150, 150]} />
          <meshStandardMaterial color="#e7e5e4" roughness={0.95} metalness={0.02} />
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
