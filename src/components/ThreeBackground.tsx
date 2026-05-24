"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ── Colour constants (ultra-muted, almost monochrome) ──────
const C_FILL  = new THREE.Color(0.045, 0.26,  0.22);   // deep teal fill
const C_CYAN  = new THREE.Color(0.04,  0.24,  0.32);   // muted cyan fill
const C_EDGE  = new THREE.Color(0.10,  0.52,  0.44);   // edge highlight (brighter)
const C_GLOW  = new THREE.Color(0.03,  0.14,  0.12);   // deep background glow

// ── Build a deterministically distorted icosahedron ────────
function buildMembrane(seed: number): THREE.IcosahedronGeometry {
  const geo = new THREE.IcosahedronGeometry(1, 3);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const d =
      Math.sin(x * 4.1  + seed) *
      Math.cos(y * 3.7  + seed * 0.83) *
      Math.sin(z * 5.3  + seed * 1.61);
    const s = 1 + d * 0.17;
    pos.setXYZ(i, x * s, y * s, z * s);
  }
  geo.computeVertexNormals();
  return geo;
}

// ── Organic membrane shells ─────────────────────────────────
//    Each blob = a translucent fill sphere + glowing edge lines
function MembraneShells() {
  const solidRefs = useRef<(THREE.Mesh       | null)[]>([]);
  const edgeRefs  = useRef<(THREE.LineSegments | null)[]>([]);

  const blobs = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const solidGeo = buildMembrane(i * 2.19 + 0.47);
      const edgeGeo  = new THREE.EdgesGeometry(solidGeo, 11);
      return {
        solidGeo, edgeGeo,
        x:     (Math.random() - 0.5) * 20,
        y:     (Math.random() - 0.5) * 11,
        z:     -2.5 - Math.random() * 5,
        scale: 2.0  + Math.random() * 3.0,
        phase: (i / 7) * Math.PI * 2,
        bSpeed: 0.065 + Math.random() * 0.085,
        rv: [
          (Math.random() - 0.5) * 0.0028,
          (Math.random() - 0.5) * 0.0020,
          (Math.random() - 0.5) * 0.0010,
        ] as [number, number, number],
        solidOp: 0.014 + Math.random() * 0.021,
        edgeOp:  0.050 + Math.random() * 0.065,
        fill: i % 2 === 0 ? C_FILL : C_CYAN,
      };
    })
  , []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    blobs.forEach((b, i) => {
      const sm = solidRefs.current[i];
      const em = edgeRefs.current[i];
      if (!sm || !em) return;

      const pulse = 1 + Math.sin(t * b.bSpeed + b.phase) * 0.044;
      const x = b.x + Math.sin(t * 0.033 + b.phase) * 0.6;
      const y = b.y + Math.cos(t * 0.026 + b.phase * 1.27) * 0.38;
      const s = b.scale * pulse;

      sm.scale.setScalar(s);
      sm.position.set(x, y, b.z);
      sm.rotation.x += b.rv[0];
      sm.rotation.y += b.rv[1];
      sm.rotation.z += b.rv[2];

      // edge mirrors solid
      em.scale.copy(sm.scale);
      em.position.copy(sm.position);
      em.rotation.copy(sm.rotation);
    });
  });

  return (
    <>
      {blobs.map((b, i) => (
        <group key={i}>
          <mesh
            ref={(el) => { solidRefs.current[i] = el; }}
            geometry={b.solidGeo}
            position={[b.x, b.y, b.z]}
          >
            <meshBasicMaterial
              color={b.fill}
              transparent
              opacity={b.solidOp}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <lineSegments
            ref={(el) => { edgeRefs.current[i] = el; }}
            geometry={b.edgeGeo}
            position={[b.x, b.y, b.z]}
          >
            <lineBasicMaterial
              color={C_EDGE}
              transparent
              opacity={b.edgeOp}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </lineSegments>
        </group>
      ))}
    </>
  );
}

// ── Thin floating rings (membrane cross-sections) ──────────
function MembraneRings() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  const rings = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => ({
      x:     (Math.random() - 0.5) * 24,
      y:     (Math.random() - 0.5) * 13,
      z:     -0.5 - Math.random() * 9,
      r:     0.5  + Math.random() * 2.3,
      tube:  0.008 + Math.random() * 0.020,
      tilt:  [Math.random() * Math.PI, Math.random() * Math.PI, 0] as [number, number, number],
      rv:    [(Math.random() - 0.5) * 0.0035, (Math.random() - 0.5) * 0.0028, 0] as [number, number, number],
      phase: Math.random() * Math.PI * 2,
      speed: 0.042 + Math.random() * 0.052,
      baseOp: 0.038 + Math.random() * 0.055,
    }))
  , []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const r = rings[i];
      mesh.rotation.x += r.rv[0];
      mesh.rotation.y += r.rv[1];
      mesh.position.x = r.x + Math.sin(t * 0.036 + r.phase) * 0.48;
      mesh.position.y = r.y + Math.cos(t * 0.029 + r.phase) * 0.32;
      (mesh.material as THREE.MeshBasicMaterial).opacity =
        r.baseOp * (0.55 + Math.sin(t * r.speed + r.phase) * 0.45);
    });
  });

  return (
    <>
      {rings.map((r, i) => (
        <mesh
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          position={[r.x, r.y, r.z]}
          rotation={r.tilt}
        >
          <torusGeometry args={[r.r, r.tube, 4, 72]} />
          <meshBasicMaterial
            color={C_EDGE}
            transparent
            opacity={r.baseOp}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}

// ── Deep ambient volumetric glow ───────────────────────────
function AmbientGlow() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  const orbs = useMemo(() =>
    Array.from({ length: 4 }, (_, i) => ({
      x: (Math.random() - 0.5) * 16,
      y: (Math.random() - 0.5) * 9,
      z: -9 - Math.random() * 3,
      r: 3.5 + Math.random() * 2.5,
      phase: (i / 4) * Math.PI * 2,
      speed: 0.038 + Math.random() * 0.045,
    }))
  , []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const o = orbs[i];
      mesh.scale.setScalar(1 + Math.sin(t * o.speed + o.phase) * 0.07);
      mesh.position.x = o.x + Math.sin(t * 0.024 + o.phase) * 1.1;
      mesh.position.y = o.y + Math.cos(t * 0.019 + o.phase) * 0.75;
    });
  });

  return (
    <>
      {orbs.map((o, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }} position={[o.x, o.y, o.z]}>
          <sphereGeometry args={[o.r, 8, 8]} />
          <meshBasicMaterial
            color={C_GLOW}
            transparent
            opacity={0.09}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}

// ── Root export ────────────────────────────────────────────
export default function ThreeBackground() {
  return (
    <div className="fixed inset-0 z-0" style={{ background: "#060d0c" }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 65 }}
        gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
        dpr={[1, 1.5]}
        style={{ background: "transparent" }}
      >
        <AmbientGlow />
        <MembraneShells />
        <MembraneRings />
      </Canvas>

      {/* Film grain — SVG fractal noise, very low opacity */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.038, zIndex: 1 }}
      >
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.72"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      {/* Subtle central radial bloom */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 58% 40% at 50% 43%, rgba(13,148,136,0.04) 0%, transparent 68%)",
          zIndex: 2,
        }}
      />
    </div>
  );
}
