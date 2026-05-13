"use client";

import { Suspense, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Html, OrbitControls } from "@react-three/drei";
import type { MonumentDraft } from "@/lib/config/monument-schema";
import { cmToMeters, stoneAppearance } from "@/lib/preview/stone-appearance";

function StoneScene({ draft }: { draft: MonumentDraft }) {
  const { w, h, d } = cmToMeters(draft);
  const mat = stoneAppearance(draft.material, draft.surface);
  const name = draft.inscription?.name?.trim() || "—";
  const dates = draft.inscription?.dates?.trim();
  const epitaph = draft.inscription?.epitaph?.trim();

  return (
    <>
      <ambientLight intensity={0.38} />
      <directionalLight
        castShadow
        position={[3.5, 6, 2.5]}
        intensity={1.15}
        shadow-mapSize={[1024, 1024]}
      />
      <group rotation={[0, -0.4, 0]}>
        <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
          <boxGeometry args={[w, h, d]} />
          <meshPhysicalMaterial
            color={mat.color}
            roughness={mat.roughness}
            metalness={mat.metalness}
            clearcoat={mat.clearcoat}
            clearcoatRoughness={mat.clearcoatRoughness}
          />
        </mesh>
        <Html
          transform
          position={[0, h * 0.58, d / 2 + 0.008]}
          style={{ pointerEvents: "none" }}
          center
        >
          <div className="w-44 rounded bg-white/90 px-2 py-1.5 text-center text-[11px] font-medium leading-snug text-zinc-900 shadow-md backdrop-blur-sm">
            <div>{name}</div>
            {dates ? <div className="mt-0.5 text-zinc-600">{dates}</div> : null}
            {epitaph ? (
              <div className="mt-1 line-clamp-3 text-[10px] text-zinc-600">{epitaph}</div>
            ) : null}
          </div>
        </Html>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#d4d4d8" roughness={1} metalness={0} />
      </mesh>
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.06}
        minDistance={Math.max(1.1, Math.max(w, h, d) * 1.2)}
        maxDistance={8}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />
    </>
  );
}

export function MonumentPreview({
  draft,
  orderId,
}: {
  draft: MonumentDraft;
  orderId: string;
}) {
  const capture = useCallback(() => {
    const canvas = document.querySelector(
      "#monument-preview-root canvas",
    ) as HTMLCanvasElement | null;
    if (!canvas) return;
    try {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `Vorschau-${orderId}.png`;
      a.rel = "noopener";
      a.click();
    } catch {
      window.alert(
        "Screenshot konnte nicht erzeugt werden (Browser / WebGL).",
      );
    }
  }, [orderId]);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Vereinfachte 3D-Vorschau
      </p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Geometrie als Platzhalter (Quader), Material nur farblich angenähert — kein
        fotorealistischer Stein.
      </p>
      <div
        id="monument-preview-root"
        className="relative h-72 w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-300 dark:border-zinc-700 dark:bg-zinc-800"
      >
        <Canvas
          shadows
          camera={{ position: [2.4, 1.5, 2.4], fov: 42 }}
          gl={{ preserveDrawingBuffer: true, antialias: true, alpha: false }}
          dpr={[1, 2]}
        >
          <color attach="background" args={["#d4d4d8"]} />
          <Suspense fallback={null}>
            <Environment preset="city" />
          </Suspense>
          <StoneScene draft={draft} />
        </Canvas>
      </div>
      <button
        type="button"
        onClick={capture}
        className="w-fit rounded-lg border border-zinc-400 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        Screenshot (PNG) herunterladen
      </button>
    </div>
  );
}
