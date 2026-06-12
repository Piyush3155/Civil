"use client";

import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
export interface PebParams {
  width: number;       // meters (X axis)
  length: number;      // meters (Z axis)
  eaveHeight: number;  // meters (Y axis — wall height)
  roofSlope: number;   // degrees
  bays: number;        // number of bays along length
  purlinsPerSlope: number;
  girtsPerWall: number;
  showPurlins: boolean;
  showGirts: boolean;
  showBracing: boolean;
}

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface Edge {
  from: Vec3;
  to: Vec3;
  color: string;
  width: number;
  dash?: number[];
}

interface Label3D {
  position: Vec3;
  text: string;
  color: string;
}

export interface PebCanvas3DHandle {
  getCanvas: () => HTMLCanvasElement | null;
}

// ──────────────────────────────────────────────
// Color palette
// ──────────────────────────────────────────────
const COLORS = {
  column:   "#3b82f6", // blue-500
  rafter:   "#ef4444", // red-500
  purlin:   "#22c55e", // green-500
  girt:     "#f97316", // orange-500
  base:     "#6b7280", // gray-500
  ridge:    "#a855f7", // purple-500
  bracing:  "#eab308", // yellow-500
  grid:     "rgba(148, 163, 184, 0.18)", // slate-400 faint
  gridAxis: "rgba(148, 163, 184, 0.35)",
  label:    "#94a3b8", // slate-400
  dimLine:  "#60a5fa", // blue-400
  bgGradientTop: "#0f172a",    // slate-900
  bgGradientBot: "#1e293b",    // slate-800
};

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────
const PebCanvas3D = forwardRef<PebCanvas3DHandle, { params: PebParams }>(
  function PebCanvas3D({ params }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameRef = useRef<number>(0);
    const rotRef = useRef({ rx: -0.45, ry: 0.65 }); // orbit angles
    const zoomRef = useRef(1);
    const dragRef = useRef<{ active: boolean; lastX: number; lastY: number }>({
      active: false,
      lastX: 0,
      lastY: 0,
    });

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
    }));

    // ── 3D math helpers ──────────────────────
    const rotateY = useCallback((v: Vec3, angle: number): Vec3 => {
      const c = Math.cos(angle),
        s = Math.sin(angle);
      return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c };
    }, []);

    const rotateX = useCallback((v: Vec3, angle: number): Vec3 => {
      const c = Math.cos(angle),
        s = Math.sin(angle);
      return { x: v.x, y: v.y * c - v.z * s, z: v.y * s + v.z * c };
    }, []);

    const project = useCallback(
      (v: Vec3, w: number, h: number, zoom: number): { x: number; y: number; depth: number } => {
        const fov = 600;
        const dist = fov + v.z;
        const scale = (fov / Math.max(dist, 1)) * zoom;
        return { x: w / 2 + v.x * scale, y: h / 2 - v.y * scale, depth: v.z };
      },
      []
    );

    const transformAndProject = useCallback(
      (v: Vec3, rx: number, ry: number, w: number, h: number, zoom: number) => {
        let p = rotateY(v, ry);
        p = rotateX(p, rx);
        return project(p, w, h, zoom);
      },
      [rotateX, rotateY, project]
    );

    // ── Generate PEB geometry ────────────────
    const generateGeometry = useCallback(
      (p: PebParams): { edges: Edge[]; labels: Label3D[] } => {
        const edges: Edge[] = [];
        const labels: Label3D[] = [];

        const W = p.width;
        const L = p.length;
        const H = p.eaveHeight;
        const ridgeRise = (W / 2) * Math.tan((p.roofSlope * Math.PI) / 180);
        const ridgeH = H + ridgeRise;
        const baySpacing = L / p.bays;

        // Center the model
        const cx = W / 2;
        const cz = L / 2;

        const pt = (x: number, y: number, z: number): Vec3 => ({
          x: (x - cx) * 8,
          y: (y) * 8,
          z: (z - cz) * 8,
        });

        // Bay positions along Z
        const bayPositions: number[] = [];
        for (let i = 0; i <= p.bays; i++) {
          bayPositions.push(i * baySpacing);
        }

        // ─── Columns (vertical members) ─────────
        for (const z of bayPositions) {
          // Left column
          edges.push({
            from: pt(0, 0, z),
            to: pt(0, H, z),
            color: COLORS.column,
            width: 2.5,
          });
          // Right column
          edges.push({
            from: pt(W, 0, z),
            to: pt(W, H, z),
            color: COLORS.column,
            width: 2.5,
          });
        }

        // ─── Rafters (roof slope members) ────────
        for (const z of bayPositions) {
          // Left slope
          edges.push({
            from: pt(0, H, z),
            to: pt(W / 2, ridgeH, z),
            color: COLORS.rafter,
            width: 2.2,
          });
          // Right slope
          edges.push({
            from: pt(W, H, z),
            to: pt(W / 2, ridgeH, z),
            color: COLORS.rafter,
            width: 2.2,
          });
        }

        // ─── Base beams (ground perimeter) ───────
        // Along length (left side)
        for (let i = 0; i < bayPositions.length - 1; i++) {
          edges.push({
            from: pt(0, 0, bayPositions[i]),
            to: pt(0, 0, bayPositions[i + 1]),
            color: COLORS.base,
            width: 2,
          });
        }
        // Along length (right side)
        for (let i = 0; i < bayPositions.length - 1; i++) {
          edges.push({
            from: pt(W, 0, bayPositions[i]),
            to: pt(W, 0, bayPositions[i + 1]),
            color: COLORS.base,
            width: 2,
          });
        }
        // End walls base
        edges.push({ from: pt(0, 0, 0), to: pt(W, 0, 0), color: COLORS.base, width: 2 });
        edges.push({ from: pt(0, 0, L), to: pt(W, 0, L), color: COLORS.base, width: 2 });

        // ─── Eave beams (top of walls along length) ──
        for (let i = 0; i < bayPositions.length - 1; i++) {
          edges.push({
            from: pt(0, H, bayPositions[i]),
            to: pt(0, H, bayPositions[i + 1]),
            color: COLORS.column,
            width: 1.8,
          });
          edges.push({
            from: pt(W, H, bayPositions[i]),
            to: pt(W, H, bayPositions[i + 1]),
            color: COLORS.column,
            width: 1.8,
          });
        }

        // ─── Ridge beam ─────────────────────────
        for (let i = 0; i < bayPositions.length - 1; i++) {
          edges.push({
            from: pt(W / 2, ridgeH, bayPositions[i]),
            to: pt(W / 2, ridgeH, bayPositions[i + 1]),
            color: COLORS.ridge,
            width: 2,
          });
        }

        // ─── Purlins (along roof between bays) ──
        if (p.showPurlins && p.purlinsPerSlope > 0) {
          for (let i = 0; i < bayPositions.length - 1; i++) {
            const z1 = bayPositions[i];
            const z2 = bayPositions[i + 1];
            for (let j = 1; j <= p.purlinsPerSlope; j++) {
              const t = j / (p.purlinsPerSlope + 1);
              // Left slope purlins
              const lx = 0 + t * (W / 2);
              const ly = H + t * ridgeRise;
              edges.push({
                from: pt(lx, ly, z1),
                to: pt(lx, ly, z2),
                color: COLORS.purlin,
                width: 1.2,
              });
              // Right slope purlins
              const rx = W - t * (W / 2);
              edges.push({
                from: pt(rx, ly, z1),
                to: pt(rx, ly, z2),
                color: COLORS.purlin,
                width: 1.2,
              });
            }
          }
        }

        // ─── Girts (horizontal wall members) ────
        if (p.showGirts && p.girtsPerWall > 0) {
          for (let i = 0; i < bayPositions.length - 1; i++) {
            const z1 = bayPositions[i];
            const z2 = bayPositions[i + 1];
            for (let j = 1; j <= p.girtsPerWall; j++) {
              const t = j / (p.girtsPerWall + 1);
              const gy = t * H;
              // Left wall girts
              edges.push({
                from: pt(0, gy, z1),
                to: pt(0, gy, z2),
                color: COLORS.girt,
                width: 1.2,
              });
              // Right wall girts
              edges.push({
                from: pt(W, gy, z1),
                to: pt(W, gy, z2),
                color: COLORS.girt,
                width: 1.2,
              });
            }
          }
        }

        // ─── Cross-bracing on end walls ─────────
        if (p.showBracing) {
          // Front wall (z=0) X-brace
          edges.push({
            from: pt(0, 0, 0),
            to: pt(W / 2, H, 0),
            color: COLORS.bracing,
            width: 1.2,
            dash: [6, 4],
          });
          edges.push({
            from: pt(W, 0, 0),
            to: pt(W / 2, H, 0),
            color: COLORS.bracing,
            width: 1.2,
            dash: [6, 4],
          });
          // Back wall (z=L) X-brace
          edges.push({
            from: pt(0, 0, L),
            to: pt(W / 2, H, L),
            color: COLORS.bracing,
            width: 1.2,
            dash: [6, 4],
          });
          edges.push({
            from: pt(W, 0, L),
            to: pt(W / 2, H, L),
            color: COLORS.bracing,
            width: 1.2,
            dash: [6, 4],
          });

          // Side wall bracing (first and last bay)
          if (bayPositions.length >= 2) {
            // Left wall, first bay
            edges.push({
              from: pt(0, 0, bayPositions[0]),
              to: pt(0, H, bayPositions[1]),
              color: COLORS.bracing,
              width: 1.2,
              dash: [6, 4],
            });
            edges.push({
              from: pt(0, H, bayPositions[0]),
              to: pt(0, 0, bayPositions[1]),
              color: COLORS.bracing,
              width: 1.2,
              dash: [6, 4],
            });
            // Right wall, last bay
            const lastIdx = bayPositions.length - 1;
            edges.push({
              from: pt(W, 0, bayPositions[lastIdx - 1]),
              to: pt(W, H, bayPositions[lastIdx]),
              color: COLORS.bracing,
              width: 1.2,
              dash: [6, 4],
            });
            edges.push({
              from: pt(W, H, bayPositions[lastIdx - 1]),
              to: pt(W, 0, bayPositions[lastIdx]),
              color: COLORS.bracing,
              width: 1.2,
              dash: [6, 4],
            });
          }
        }

        // ─── End wall cladding framing ──────────
        // Front end wall (z=0) top beams
        edges.push({ from: pt(0, H, 0), to: pt(W, H, 0), color: COLORS.column, width: 1.8 });
        // Back end wall (z=L) top beams
        edges.push({ from: pt(0, H, L), to: pt(W, H, L), color: COLORS.column, width: 1.8 });

        // ─── Dimension labels ───────────────────
        // Width label
        labels.push({
          position: pt(W / 2, -1.5, 0),
          text: `${W.toFixed(1)}m (Width)`,
          color: COLORS.dimLine,
        });
        // Length label
        labels.push({
          position: pt(W + 2, -1.5, L / 2),
          text: `${L.toFixed(1)}m (Length)`,
          color: COLORS.dimLine,
        });
        // Eave height label
        labels.push({
          position: pt(-2.5, H / 2, 0),
          text: `${H.toFixed(1)}m (Eave)`,
          color: COLORS.dimLine,
        });
        // Ridge height label
        labels.push({
          position: pt(W / 2, ridgeH + 1.5, L / 2),
          text: `${ridgeH.toFixed(1)}m (Ridge)`,
          color: COLORS.ridge,
        });
        // Bay spacing label
        if (bayPositions.length >= 2) {
          labels.push({
            position: pt(W + 2, 0.5, baySpacing / 2),
            text: `${baySpacing.toFixed(1)}m (Bay)`,
            color: COLORS.label,
          });
        }

        return { edges, labels };
      },
      []
    );

    // ── Generate grid floor ──────────────────
    const generateGrid = useCallback((): Edge[] => {
      const gridEdges: Edge[] = [];
      const size = 300; // grid extends ±300 units
      const step = 40;
      for (let i = -size; i <= size; i += step) {
        // Lines along X
        gridEdges.push({
          from: { x: -size, y: 0, z: i },
          to: { x: size, y: 0, z: i },
          color: i === 0 ? COLORS.gridAxis : COLORS.grid,
          width: i === 0 ? 1 : 0.5,
        });
        // Lines along Z
        gridEdges.push({
          from: { x: i, y: 0, z: -size },
          to: { x: i, y: 0, z: size },
          color: i === 0 ? COLORS.gridAxis : COLORS.grid,
          width: i === 0 ? 1 : 0.5,
        });
      }
      return gridEdges;
    }, []);

    // ── Render loop ──────────────────────────
    const render = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Resize to container
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      }

      const w = rect.width;
      const h = rect.height;
      const rx = rotRef.current.rx;
      const ry = rotRef.current.ry;
      const zoom = zoomRef.current;

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, COLORS.bgGradientTop);
      grad.addColorStop(1, COLORS.bgGradientBot);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Helper to draw an edge
      const drawEdge = (edge: Edge) => {
        const from = transformAndProject(edge.from, rx, ry, w, h, zoom);
        const to = transformAndProject(edge.to, rx, ry, w, h, zoom);
        ctx.beginPath();
        ctx.strokeStyle = edge.color;
        ctx.lineWidth = edge.width;
        if (edge.dash) {
          ctx.setLineDash(edge.dash);
        } else {
          ctx.setLineDash([]);
        }
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.setLineDash([]);
      };

      // Draw grid
      const gridEdges = generateGrid();
      for (const e of gridEdges) {
        drawEdge(e);
      }

      // Generate and draw PEB
      const { edges, labels } = generateGeometry(params);

      // Sort edges by average depth for basic painter's algorithm
      const sortedEdges = [...edges].sort((a, b) => {
        const aFrom = transformAndProject(a.from, rx, ry, w, h, zoom);
        const aTo = transformAndProject(a.to, rx, ry, w, h, zoom);
        const bFrom = transformAndProject(b.from, rx, ry, w, h, zoom);
        const bTo = transformAndProject(b.to, rx, ry, w, h, zoom);
        const aDepth = (aFrom.depth + aTo.depth) / 2;
        const bDepth = (bFrom.depth + bTo.depth) / 2;
        return bDepth - aDepth; // far first
      });

      for (const e of sortedEdges) {
        drawEdge(e);
      }

      // Draw joint nodes
      const nodeSet = new Set<string>();
      for (const e of edges) {
        for (const p of [e.from, e.to]) {
          const key = `${p.x},${p.y},${p.z}`;
          if (!nodeSet.has(key)) {
            nodeSet.add(key);
            const sp = transformAndProject(p, rx, ry, w, h, zoom);
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,255,255,0.6)";
            ctx.fill();
          }
        }
      }

      // Draw labels
      ctx.font = "600 12px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const label of labels) {
        const sp = transformAndProject(label.position, rx, ry, w, h, zoom);
        // Background pill
        const metrics = ctx.measureText(label.text);
        const pw = metrics.width + 14;
        const ph = 20;
        ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
        ctx.beginPath();
        ctx.roundRect(sp.x - pw / 2, sp.y - ph / 2, pw, ph, 4);
        ctx.fill();
        ctx.strokeStyle = label.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(sp.x - pw / 2, sp.y - ph / 2, pw, ph, 4);
        ctx.stroke();
        // Text
        ctx.fillStyle = label.color;
        ctx.fillText(label.text, sp.x, sp.y);
      }

      // Watermark
      ctx.font = "500 11px Inter, system-ui, sans-serif";
      ctx.fillStyle = "rgba(148, 163, 184, 0.3)";
      ctx.textAlign = "right";
      ctx.fillText("Civil Desk — PEB Designer", w - 16, h - 14);

      frameRef.current = requestAnimationFrame(render);
    }, [params, transformAndProject, generateGeometry, generateGrid]);

    // ── Start/stop animation loop ────────────
    useEffect(() => {
      frameRef.current = requestAnimationFrame(render);
      return () => cancelAnimationFrame(frameRef.current);
    }, [render]);

    // ── Mouse interaction handlers ───────────
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const onMouseDown = (e: MouseEvent) => {
        dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
        canvas.style.cursor = "grabbing";
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!dragRef.current.active) return;
        const dx = e.clientX - dragRef.current.lastX;
        const dy = e.clientY - dragRef.current.lastY;
        rotRef.current.ry += dx * 0.005;
        rotRef.current.rx += dy * 0.005;
        // Clamp vertical rotation
        rotRef.current.rx = Math.max(-Math.PI / 2.2, Math.min(0.1, rotRef.current.rx));
        dragRef.current.lastX = e.clientX;
        dragRef.current.lastY = e.clientY;
      };

      const onMouseUp = () => {
        dragRef.current.active = false;
        canvas.style.cursor = "grab";
      };

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        zoomRef.current = Math.max(0.3, Math.min(3, zoomRef.current + delta));
      };

      // Touch support
      const onTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 1) {
          const t = e.touches[0];
          dragRef.current = { active: true, lastX: t.clientX, lastY: t.clientY };
        }
      };

      const onTouchMove = (e: TouchEvent) => {
        if (!dragRef.current.active || e.touches.length !== 1) return;
        e.preventDefault();
        const t = e.touches[0];
        const dx = t.clientX - dragRef.current.lastX;
        const dy = t.clientY - dragRef.current.lastY;
        rotRef.current.ry += dx * 0.005;
        rotRef.current.rx += dy * 0.005;
        rotRef.current.rx = Math.max(-Math.PI / 2.2, Math.min(0.1, rotRef.current.rx));
        dragRef.current.lastX = t.clientX;
        dragRef.current.lastY = t.clientY;
      };

      const onTouchEnd = () => {
        dragRef.current.active = false;
      };

      canvas.addEventListener("mousedown", onMouseDown);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      canvas.addEventListener("wheel", onWheel, { passive: false });
      canvas.addEventListener("touchstart", onTouchStart, { passive: true });
      canvas.addEventListener("touchmove", onTouchMove, { passive: false });
      canvas.addEventListener("touchend", onTouchEnd, { passive: true });

      canvas.style.cursor = "grab";

      return () => {
        canvas.removeEventListener("mousedown", onMouseDown);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        canvas.removeEventListener("wheel", onWheel);
        canvas.removeEventListener("touchstart", onTouchStart);
        canvas.removeEventListener("touchmove", onTouchMove);
        canvas.removeEventListener("touchend", onTouchEnd);
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-xl"
        style={{ touchAction: "none" }}
      />
    );
  }
);

PebCanvas3D.displayName = "PebCanvas3D";
export default PebCanvas3D;
