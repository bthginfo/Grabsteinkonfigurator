"use client";

import { Suspense, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls, RoundedBox, Text, useTexture } from "@react-three/drei";
import { Download, LoaderCircle } from "lucide-react";
import {
  BufferGeometry,
  CatmullRomCurve3,
  CanvasTexture,
  Color,
  Float32BufferAttribute,
  IcosahedronGeometry,
  LinearFilter,
  LineCurve3,
  RepeatWrapping,
  Shape,
  SRGBColorSpace,
  Texture,
  Vector2,
  Vector3,
} from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { MonumentDraft } from "@/lib/config/monument-schema";
import { cmToMeters, stoneAppearance, type StoneMaterialProps } from "@/lib/preview/stone-appearance";

const FONT_URLS = {
  antiqua: "/fonts/cormorant-roman.ttf",
  kapitalelchen: "/fonts/cinzel.ttf",
  kursiv: "/fonts/cormorant-italic.ttf",
  modern: "/fonts/montserrat.ttf",
  handschrift: "/fonts/great-vibes.ttf",
} as const;

const MARBLE_TEXTURES = [
  "/textures/Marble003/Marble003_1K-JPG_Color.jpg",
  "/textures/Marble003/Marble003_1K-JPG_NormalGL.jpg",
  "/textures/Marble003/Marble003_1K-JPG_Roughness.jpg",
] as const;
const ROCK_TEXTURES = [
  "/textures/Rock024/Rock024_1K-JPG_Color.jpg",
  "/textures/Rock024/Rock024_1K-JPG_NormalGL.jpg",
  "/textures/Rock024/Rock024_1K-JPG_Roughness.jpg",
] as const;

if (typeof window !== "undefined") {
  useTexture.preload([...MARBLE_TEXTURES]);
  useTexture.preload([...ROCK_TEXTURES]);
}

type StoneMaps = { map?: Texture; normalMap?: Texture; roughnessMap?: Texture; bumpMap?: Texture };
const graniteMapCache = new Map<string, StoneMaps>();
const finishMapCache = new Map<string, Texture>();

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function createFinishBump(surface: StoneMaterialProps["surfaceKey"]): Texture | undefined {
  if (surface === "poliert") return undefined;
  const cached = finishMapCache.get(surface);
  if (cached) return cached;
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return undefined;
  context.fillStyle = "rgb(128,128,128)";
  context.fillRect(0, 0, size, size);
  const random = seededRandom(surface.length * 1877);

  if (surface === "sandgestrahlt") {
    for (let index = 0; index < 36000; index += 1) {
      const value = 96 + Math.floor(random() * 64);
      context.fillStyle = `rgb(${value},${value},${value})`;
      context.fillRect(random() * size, random() * size, 1.2, 1.2);
    }
  } else if (surface === "gestockt") {
    for (let index = 0; index < 4200; index += 1) {
      const value = random() > 0.45 ? 178 : 72;
      context.fillStyle = `rgba(${value},${value},${value},0.82)`;
      context.beginPath();
      context.arc(random() * size, random() * size, 0.8 + random() * 2.2, 0, Math.PI * 2);
      context.fill();
    }
  } else if (surface === "geflammt") {
    context.lineCap = "round";
    for (let index = 0; index < 240; index += 1) {
      const y = random() * size;
      const value = random() > 0.5 ? 184 : 78;
      context.strokeStyle = `rgba(${value},${value},${value},0.48)`;
      context.lineWidth = 1 + random() * 3;
      context.beginPath();
      context.moveTo(0, y);
      for (let x = 0; x <= size; x += 32) context.lineTo(x, y + Math.sin(x * 0.035 + index) * (2 + random() * 5));
      context.stroke();
    }
  } else if (surface === "gebuerstet") {
    for (let index = 0; index < 700; index += 1) {
      const y = random() * size;
      const value = 98 + Math.floor(random() * 76);
      context.strokeStyle = `rgba(${value},${value},${value},0.45)`;
      context.lineWidth = 0.4 + random();
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(size, y + random() * 2);
      context.stroke();
    }
  } else {
    for (let index = 0; index < 110; index += 1) {
      const y = random() * size;
      const value = random() > 0.5 ? 185 : 65;
      context.strokeStyle = `rgba(${value},${value},${value},0.52)`;
      context.lineWidth = 3 + random() * 9;
      context.beginPath();
      context.moveTo(0, y);
      for (let x = 0; x <= size; x += 40) context.lineTo(x, y + Math.sin(x * 0.025 + index) * (6 + random() * 14));
      context.stroke();
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(surface === "sandgestrahlt" || surface === "gestockt" ? 2.2 : 1.2, surface === "gebuerstet" ? 3.2 : 1.8);
  texture.minFilter = LinearFilter;
  finishMapCache.set(surface, texture);
  return texture;
}

function surfaceColor(material: StoneMaterialProps, baseColor = material.color) {
  const lift = material.surfaceKey === "sandgestrahlt"
    ? 0.34
    : material.surfaceKey === "gestockt"
      ? 0.27
      : material.surfaceKey === "geflammt" || material.surfaceKey === "naturspalt"
        ? 0.18
        : material.surfaceKey === "kombination"
          ? 0.07
          : 0;
  return new Color(baseColor).lerp(new Color("#ffffff"), lift).getStyle();
}

function createGraniteMaps(color: string, seed: number): StoneMaps {
  const cacheKey = `${color}:${seed}`;
  const cached = graniteMapCache.get(cacheKey);
  if (cached) return cached;
  const size = 512;
  const colorCanvas = document.createElement("canvas");
  const bumpCanvas = document.createElement("canvas");
  colorCanvas.width = colorCanvas.height = size;
  bumpCanvas.width = bumpCanvas.height = size;
  const colorContext = colorCanvas.getContext("2d");
  const bumpContext = bumpCanvas.getContext("2d");
  if (!colorContext || !bumpContext) return {};

  const base = new Color(color);
  const rgb = [base.r * 255, base.g * 255, base.b * 255];
  colorContext.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  colorContext.fillRect(0, 0, size, size);
  bumpContext.fillStyle = "rgb(128,128,128)";
  bumpContext.fillRect(0, 0, size, size);

  const random = seededRandom(seed);
  for (let index = 0; index < 9500; index += 1) {
    const x = random() * size;
    const y = random() * size;
    const radius = 0.25 + random() * 1.55;
    const light = random() > 0.56;
    const variation = light ? 28 + random() * 45 : -(18 + random() * 38);
    colorContext.fillStyle = `rgba(${Math.max(0, Math.min(255, rgb[0] + variation))}, ${Math.max(0, Math.min(255, rgb[1] + variation))}, ${Math.max(0, Math.min(255, rgb[2] + variation))}, ${0.18 + random() * 0.48})`;
    colorContext.beginPath();
    colorContext.arc(x, y, radius, 0, Math.PI * 2);
    colorContext.fill();
    const bumpValue = Math.round(128 + variation * 0.55);
    bumpContext.fillStyle = `rgba(${bumpValue},${bumpValue},${bumpValue},${0.2 + random() * 0.45})`;
    bumpContext.fillRect(x, y, Math.max(1, radius), Math.max(1, radius));
  }

  const map = new CanvasTexture(colorCanvas);
  map.colorSpace = SRGBColorSpace;
  map.wrapS = map.wrapT = RepeatWrapping;
  map.repeat.set(1.6, 2.2);
  map.minFilter = LinearFilter;
  const bumpMap = new CanvasTexture(bumpCanvas);
  bumpMap.wrapS = bumpMap.wrapT = RepeatWrapping;
  bumpMap.repeat.copy(map.repeat);
  bumpMap.minFilter = LinearFilter;
  const maps = { map, bumpMap };
  graniteMapCache.set(cacheKey, maps);
  return maps;
}

function PhysicalStoneMaterial({ material, maps, mappedColor }: { material: StoneMaterialProps; maps: StoneMaps; mappedColor: string }) {
  const finishBump = createFinishBump(material.surfaceKey);
  const bumpScale = material.surfaceKey === "gestockt"
    ? 0.055
    : material.surfaceKey === "geflammt"
      ? 0.035
      : material.surfaceKey === "sandgestrahlt"
        ? 0.022
        : material.surfaceKey === "gebuerstet"
          ? 0.009
          : material.surfaceKey === "naturspalt"
            ? 0.07
            : material.surfaceKey === "kombination"
              ? 0.024
              : material.normalStrength * 0.012;
  return (
    <meshPhysicalMaterial
      {...maps}
      bumpMap={finishBump ?? maps.bumpMap}
      color={mappedColor === "#ffffff" ? "#ffffff" : surfaceColor(material, mappedColor)}
      roughness={material.roughness}
      metalness={material.metalness}
      clearcoat={material.clearcoat}
      clearcoatRoughness={material.clearcoatRoughness}
      normalScale={new Vector2(material.normalStrength, material.normalStrength)}
      bumpScale={bumpScale}
      envMapIntensity={0.8}
    />
  );
}

function ProceduralStoneMaterial({ material, materialKey }: { material: StoneMaterialProps; materialKey?: string }) {
  const adjustedColor = surfaceColor(material);
  const maps = useMemo(() => createGraniteMaps(adjustedColor, materialKey === "schiefer" ? 913 : 431), [adjustedColor, materialKey]);
  return <PhysicalStoneMaterial material={material} maps={maps} mappedColor="#ffffff" />;
}

function PbrStoneMaterial({ material }: { material: StoneMaterialProps }) {
  const loaded = useTexture(material.textureFamily === "marble" ? [...MARBLE_TEXTURES] : [...ROCK_TEXTURES]) as Texture[];
  const maps = useMemo(() => {
    const [sourceColor, sourceNormal, sourceRoughness] = loaded;
    const map = sourceColor.clone();
    const normalMap = sourceNormal.clone();
    const roughnessMap = sourceRoughness.clone();
    for (const texture of [map, normalMap, roughnessMap]) {
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.repeat.set(material.textureFamily === "marble" ? 0.85 : 1.45, material.textureFamily === "marble" ? 1.15 : 1.9);
      texture.needsUpdate = true;
    }
    map.colorSpace = SRGBColorSpace;
    return { map, normalMap, roughnessMap };
  }, [loaded, material.textureFamily]);
  return <PhysicalStoneMaterial material={material} maps={maps} mappedColor={material.color} />;
}

function StoneMaterial({ material, materialKey }: { material: StoneMaterialProps; materialKey?: string }) {
  return material.textureFamily === "granite" || material.textureFamily === "slate"
    ? <ProceduralStoneMaterial material={material} materialKey={materialKey} />
    : <PbrStoneMaterial material={material} />;
}

function slabShape(w: number, h: number, form?: MonumentDraft["form"]) {
  const shape = new Shape();
  shape.moveTo(-w / 2, 0);
  if (form === "breitstein") {
    shape.lineTo(-w / 2, h * 0.72);
    shape.bezierCurveTo(-w * 0.46, h * 0.91, -w * 0.28, h, -w * 0.12, h * 0.94);
    shape.quadraticCurveTo(0, h * 0.87, w * 0.12, h * 0.94);
    shape.bezierCurveTo(w * 0.28, h, w * 0.46, h * 0.91, w / 2, h * 0.72);
  } else if (form === "sockelanlage") {
    shape.lineTo(-w / 2, h * 0.76);
    shape.quadraticCurveTo(-w * 0.48, h * 0.96, -w * 0.22, h);
    shape.quadraticCurveTo(w * 0.08, h * 1.02, w * 0.2, h * 0.92);
    shape.quadraticCurveTo(w * 0.34, h * 0.82, w / 2, h * 0.84);
  } else {
    shape.lineTo(-w / 2, h * 0.82);
    shape.bezierCurveTo(-w * 0.42, h * 0.97, -w * 0.2, h, 0, h);
    shape.bezierCurveTo(w * 0.2, h, w * 0.42, h * 0.97, w / 2, h * 0.82);
  }
  shape.lineTo(w / 2, 0);
  shape.closePath();
  return shape;
}

function ExtrudedStone({ shape, d, material, materialKey, bevel = 0.012 }: { shape: Shape; d: number; material: StoneMaterialProps; materialKey?: string; bevel?: number }) {
  return (
    <mesh castShadow receiveShadow position={[0, 0, -d / 2]}>
      <extrudeGeometry args={[shape, { depth: d, bevelEnabled: true, bevelSize: bevel, bevelThickness: Math.min(d * 0.12, bevel), bevelSegments: 5, curveSegments: 16 }]} />
      <StoneMaterial material={material} materialKey={materialKey} />
    </mesh>
  );
}

function HeartStone({ w, h, d, material, materialKey }: { w: number; h: number; d: number; material: StoneMaterialProps; materialKey?: string }) {
  const shape = useMemo(() => {
    const heart = new Shape();
    heart.moveTo(-w * 0.045, h * 0.09);
    heart.bezierCurveTo(-w * 0.16, h * 0.24, -w * 0.5, h * 0.48, -w * 0.5, h * 0.73);
    heart.bezierCurveTo(-w * 0.5, h * 1.01, -w * 0.17, h * 1.08, 0, h * 0.84);
    heart.bezierCurveTo(w * 0.17, h * 1.08, w * 0.5, h * 1.01, w * 0.5, h * 0.73);
    heart.bezierCurveTo(w * 0.5, h * 0.48, w * 0.16, h * 0.24, w * 0.045, h * 0.09);
    heart.quadraticCurveTo(0, h * 0.045, -w * 0.045, h * 0.09);
    return heart;
  }, [w, h]);
  const baseHeight = Math.max(0.09, h * 0.12);
  return (
    <group>
      <RoundedBox args={[w * 1.18, baseHeight, Math.max(d * 1.55, 0.2)]} radius={Math.min(baseHeight * 0.18, 0.018)} smoothness={6} position={[0, baseHeight / 2, 0]} castShadow receiveShadow>
        <StoneMaterial material={material} materialKey={materialKey} />
      </RoundedBox>
      <group position={[0, baseHeight - h * 0.055, 0]}>
        <ExtrudedStone shape={shape} d={d} material={material} materialKey={materialKey} bevel={Math.min(w, h) * 0.026} />
      </group>
    </group>
  );
}

function wedgeGeometry(w: number, depth: number, frontHeight: number, backHeight: number) {
  const x = w / 2;
  const z = depth / 2;
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute([
    -x, 0, z, x, 0, z, x, 0, -z, -x, 0, -z,
    -x, frontHeight, z, x, frontHeight, z, x, backHeight, -z, -x, backHeight, -z,
  ], 3));
  geometry.setIndex([
    0, 1, 5, 0, 5, 4,
    1, 2, 6, 1, 6, 5,
    2, 3, 7, 2, 7, 6,
    3, 0, 4, 3, 4, 7,
    3, 2, 1, 3, 1, 0,
    4, 5, 6, 4, 6, 7,
  ]);
  geometry.computeVertexNormals();
  return geometry;
}

function LowStone({ form, w, h, d, material, materialKey }: { form: "liegestein" | "kissenstein"; w: number; h: number; d: number; material: StoneMaterialProps; materialKey?: string }) {
  const isCushion = form === "kissenstein";
  const depth = Math.max(d, w * 0.68);
  const frontHeight = isCushion ? Math.max(0.075, h * 0.42) : Math.max(0.055, h * 0.72);
  const backHeight = isCushion ? Math.max(0.16, h) : Math.max(frontHeight + 0.018, h);
  const geometry = useMemo(
    () => wedgeGeometry(w, depth, frontHeight, backHeight),
    [w, depth, frontHeight, backHeight],
  );
  return (
    <group>
      {isCushion ? (
        <RoundedBox args={[w * 1.05, 0.045, depth * 1.04]} radius={0.012} smoothness={5} position={[0, 0.0225, 0]} castShadow receiveShadow>
          <StoneMaterial material={material} materialKey={materialKey} />
        </RoundedBox>
      ) : null}
      <mesh geometry={geometry} castShadow receiveShadow position={[0, isCushion ? 0.04 : 0, 0]}>
        <StoneMaterial material={material} materialKey={materialKey} />
      </mesh>
    </group>
  );
}

function BookStone({ w, h, d, material, materialKey }: { w: number; h: number; d: number; material: StoneMaterialProps; materialKey?: string }) {
  const depth = Math.max(d, w * 0.62);
  const frontHeight = Math.max(0.065, h * 0.36);
  const backHeight = Math.max(0.12, h * 0.68);
  const pageThickness = Math.max(0.035, h * 0.22);
  const angle = Math.atan2(backHeight - frontHeight, depth);
  const support = useMemo(() => wedgeGeometry(w * 0.96, depth, frontHeight, backHeight), [w, depth, frontHeight, backHeight]);
  const pageY = (frontHeight + backHeight) / 2 + pageThickness / 2;
  const radius = Math.min(0.012, pageThickness * 0.24);
  return (
    <group>
      <mesh geometry={support} castShadow receiveShadow>
        <StoneMaterial material={material} materialKey={materialKey} />
      </mesh>
      <RoundedBox args={[w * 0.48, pageThickness, depth * 0.94]} radius={radius} smoothness={6} position={[-w * 0.235, pageY, 0]} rotation={[angle, 0, -0.045]} castShadow receiveShadow>
        <StoneMaterial material={material} materialKey={materialKey} />
      </RoundedBox>
      <RoundedBox args={[w * 0.48, pageThickness, depth * 0.94]} radius={radius} smoothness={6} position={[w * 0.235, pageY, 0]} rotation={[angle, 0, 0.045]} castShadow receiveShadow>
        <StoneMaterial material={material} materialKey={materialKey} />
      </RoundedBox>
      <mesh position={[0, pageY + pageThickness * 0.54, 0]} rotation={[angle, 0, 0]} castShadow>
        <boxGeometry args={[0.012, 0.012, depth * 0.86]} />
        <meshStandardMaterial color="#20201e" roughness={0.72} />
      </mesh>
    </group>
  );
}

function CrossStone({ w, h, d, material, materialKey }: { w: number; h: number; d: number; material: StoneMaterialProps; materialKey?: string }) {
  const shape = useMemo(() => {
    const bar = w * 0.31;
    const armY = h * 0.65;
    const armH = h * 0.19;
    const cross = new Shape();
    cross.moveTo(-bar / 2, 0);
    cross.lineTo(-bar / 2, armY - armH / 2);
    cross.lineTo(-w / 2, armY - armH / 2);
    cross.lineTo(-w / 2, armY + armH / 2);
    cross.lineTo(-bar / 2, armY + armH / 2);
    cross.lineTo(-bar / 2, h);
    cross.lineTo(bar / 2, h);
    cross.lineTo(bar / 2, armY + armH / 2);
    cross.lineTo(w / 2, armY + armH / 2);
    cross.lineTo(w / 2, armY - armH / 2);
    cross.lineTo(bar / 2, armY - armH / 2);
    cross.lineTo(bar / 2, 0);
    cross.closePath();
    return cross;
  }, [w, h]);
  return <ExtrudedStone shape={shape} d={d} material={material} materialKey={materialKey} bevel={Math.min(w, h) * 0.018} />;
}

function RockStone({ w, h, d, material, materialKey }: { w: number; h: number; d: number; material: StoneMaterialProps; materialKey?: string }) {
  const geometry = useMemo(() => {
    const rock = mergeVertices(new IcosahedronGeometry(1, 4), 0.0001);
    const positions = rock.attributes.position;
    for (let index = 0; index < positions.count; index += 1) {
      const x = positions.getX(index);
      const y = positions.getY(index);
      const z = positions.getZ(index);
      const noise = 1 + Math.sin(x * 5.3 + y * 3.7) * 0.065 + Math.sin(z * 8.1 - y * 4.2) * 0.032 + Math.sin((x + z) * 17.4) * 0.012;
      positions.setXYZ(index, x * noise, y * noise, z * noise);
    }
    positions.needsUpdate = true;
    rock.computeVertexNormals();
    return rock;
  }, []);
  return (
    <mesh castShadow receiveShadow geometry={geometry} position={[0, h * 0.48, 0]} scale={[w * 0.54, h * 0.52, Math.max(d * 1.25, w * 0.3)]} rotation={[0.02, 0.08, -0.035]}>
      <StoneMaterial material={material} materialKey={materialKey} />
    </mesh>
  );
}

function StoneModel({ draft }: { draft: MonumentDraft }) {
  const { w, h, d } = cmToMeters(draft);
  const material = stoneAppearance(draft.material, draft.surface);
  const materialKey = draft.material;
  const radius = Math.max(0.008, Math.min(w, h, d) * 0.07);

  if (draft.form === "felsen") return <RockStone w={w} h={h} d={d} material={material} materialKey={materialKey} />;
  if (draft.form === "herz") return <HeartStone w={w} h={h} d={d} material={material} materialKey={materialKey} />;
  if (draft.form === "kreuz") return <CrossStone w={w} h={h} d={d} material={material} materialKey={materialKey} />;

  if (draft.form === "buch") {
    return <BookStone w={w} h={h} d={d} material={material} materialKey={materialKey} />;
  }

  if (draft.form === "liegestein" || draft.form === "kissenstein") {
    return <LowStone form={draft.form} w={w} h={h} d={d} material={material} materialKey={materialKey} />;
  }

  const shape = slabShape(w, h, draft.form);
  return (
    <group>
      <ExtrudedStone shape={shape} d={d} material={material} materialKey={materialKey} bevel={radius} />
      {draft.form === "sockelanlage" || draft.form === "breitstein" ? (
        <RoundedBox args={[w * 1.28, Math.max(0.11, h * 0.13), Math.max(d * 1.8, 0.24)]} radius={radius * 0.7} smoothness={5} position={[0, Math.max(0.055, h * 0.065), 0]} castShadow receiveShadow><StoneMaterial material={material} materialKey={materialKey} /></RoundedBox>
      ) : null}
    </group>
  );
}

function inscriptionStyle(finish?: MonumentDraft["engravingFinish"], material?: MonumentDraft["material"], selectedColor?: MonumentDraft["inscriptionColor"]) {
  const darkStone = !material || !["marmor_weiss", "marmor_grau", "sandstein", "kalkstein"].includes(material);
  const explicit = selectedColor && selectedColor !== "kontrast_auto" ? selectedColor : undefined;
  if (explicit === "gold" || finish === "vergoldet" || finish === "goldlack") return { color: "#e2c269", metalness: 0.58, roughness: 0.22 };
  if (explicit === "silber" || finish === "silber") return { color: "#eef1f2", metalness: 0.72, roughness: 0.19 };
  if (explicit === "bronze" || finish === "bronzebuchstaben") return { color: "#c49a62", metalness: 0.62, roughness: 0.27 };
  if (explicit === "weiss") return { color: "#f4f1e8", metalness: 0.02, roughness: 0.62 };
  if (explicit === "anthrazit") return { color: "#252523", metalness: 0.02, roughness: 0.72 };
  return { color: darkStone ? "#f2eee2" : "#242321", metalness: 0.02, roughness: finish === "laser" ? 0.68 : 0.78 };
}

function InscriptionLine({ children, y, size, draft, maxWidth, weight = 0 }: { children: string; y: number; size: number; draft: MonumentDraft; maxWidth: number; weight?: number }) {
  const fontKey = draft.inscription?.font ?? "antiqua";
  const alignment = draft.inscription?.alignment ?? "mittig";
  const style = inscriptionStyle(draft.engravingFinish, draft.material, draft.inscriptionColor);
  const rendered = fontKey === "kapitalelchen" ? children.toLocaleUpperCase("de-DE") : children;
  const x = alignment === "links" ? -maxWidth / 2 : alignment === "rechts" ? maxWidth / 2 : 0;
  const anchorX = alignment === "links" ? "left" : alignment === "rechts" ? "right" : "center";
  return (
    <Text
      position={[x, y, weight]}
      font={FONT_URLS[fontKey]}
      fontSize={size}
      maxWidth={maxWidth}
      lineHeight={1.08}
      letterSpacing={fontKey === "kapitalelchen" ? 0.055 : fontKey === "modern" ? 0.018 : 0.006}
      textAlign={alignment === "mittig" ? "center" : alignment === "links" ? "left" : "right"}
      anchorX={anchorX}
      anchorY="middle"
      overflowWrap="break-word"
      outlineWidth={style.metalness > 0.5 ? size * 0.016 : size * 0.007}
      outlineColor={style.color}
      castShadow
    >
      {rendered}
      <meshPhysicalMaterial color={style.color} emissive={style.color} emissiveIntensity={style.metalness > 0.5 ? 0.05 : 0.12} metalness={style.metalness} roughness={style.roughness} clearcoat={style.metalness > 0.5 ? 0.25 : 0} />
    </Text>
  );
}

function Inscription({ draft }: { draft: MonumentDraft }) {
  const { w, h, d } = cmToMeters(draft);
  const name = draft.inscription?.name?.trim() || "Ihre Inschrift";
  const dates = draft.inscription?.dates?.trim();
  const epitaph = draft.inscription?.epitaph?.trim();
  const book = draft.form === "buch";
  const low = draft.form === "liegestein" || draft.form === "kissenstein" || book;
  const cross = draft.form === "kreuz";
  const maxWidth = cross ? w * 0.25 : draft.form === "herz" ? w * 0.66 : book ? w * 0.4 : w * 0.76;
  const fontKey = draft.inscription?.font ?? "antiqua";
  const characterWidth = fontKey === "kapitalelchen" ? 0.62 : fontKey === "modern" ? 0.56 : fontKey === "handschrift" ? 0.43 : 0.5;
  const sizeReference = low ? Math.max(d, w * 0.68) : h;
  const requestedSize = (draft.letterHeightMm ?? (low ? 28 : 35)) / 1000;
  const nameSize = Math.min(maxWidth / Math.max(name.length * characterWidth, 4), requestedSize, sizeReference * (cross ? 0.055 : low ? 0.13 : 0.085));
  const lowDepth = Math.max(d, w * 0.68);
  const cushion = draft.form === "kissenstein";
  const frontHeight = cushion ? Math.max(0.075, h * 0.42) : Math.max(0.055, h * 0.72);
  const backHeight = cushion ? Math.max(0.16, h) : Math.max(frontHeight + 0.018, h);
  const bookFront = Math.max(0.065, h * 0.36);
  const bookBack = Math.max(0.12, h * 0.68);
  const lowAngle = Math.atan2((book ? bookBack : backHeight) - (book ? bookFront : frontHeight), lowDepth);
  const lowTop = book
    ? (bookFront + bookBack) / 2 + Math.max(0.035, h * 0.22) + 0.012
    : (frontHeight + backHeight) / 2 + (cushion ? 0.04 : 0) + 0.008;
  const heartLift = draft.form === "herz" ? Math.max(0.09, h * 0.12) - h * 0.055 : 0;
  const groupPosition: [number, number, number] = low
    ? [book ? w * 0.23 : 0, lowTop, 0]
    : [0, (cross ? h * 0.37 : h * 0.56) + heartLift, d / 2 + 0.014];
  const groupRotation: [number, number, number] = low ? [-Math.PI / 2 + lowAngle, 0, 0] : [0, 0, 0];

  return (
    <group position={groupPosition} rotation={groupRotation}>
      <InscriptionLine y={epitaph ? nameSize * 1.35 : nameSize * 0.6} size={nameSize} draft={draft} maxWidth={maxWidth}>{name}</InscriptionLine>
      {dates && !cross ? <InscriptionLine y={epitaph ? 0 : -nameSize * 0.85} size={nameSize * 0.6} draft={draft} maxWidth={maxWidth}>{dates}</InscriptionLine> : null}
      {epitaph && !cross ? <InscriptionLine y={-nameSize * 1.25} size={nameSize * 0.48} draft={draft} maxWidth={maxWidth}>{epitaph}</InscriptionLine> : null}
    </group>
  );
}

type MotifPath = Array<[number, number, number]>;

function motifPaths(kind: string): MotifPath[] {
  if (kind === "kreuz_motiv") {
    return [
      [[0, -0.5, 0], [0, 0.52, 0]],
      [[-0.3, 0.2, 0], [0.3, 0.2, 0]],
    ];
  }
  if (kind === "baum") {
    const crown = Array.from({ length: 25 }, (_, index) => {
      const angle = (index / 24) * Math.PI * 2;
      const radius = 1 + Math.sin(angle * 5) * 0.11;
      return [Math.cos(angle) * 0.4 * radius, Math.sin(angle) * 0.31 * radius + 0.2, 0] as [number, number, number];
    });
    return [
      [[-0.08, -0.5, 0], [-0.04, -0.18, 0], [0, 0.08, 0], [0.04, 0.25, 0]],
      [[0, -0.18, 0], [-0.2, 0.05, 0], [-0.31, 0.22, 0]],
      [[0, -0.04, 0], [0.18, 0.12, 0], [0.31, 0.31, 0]],
      [[-0.06, -0.47, 0], [-0.24, -0.55, 0]],
      [[-0.03, -0.43, 0], [0.2, -0.53, 0]],
      crown,
    ];
  }
  if (kind === "aere") {
    const paths: MotifPath[] = [[[-0.08, -0.53, 0], [-0.03, -0.2, 0], [0, 0.12, 0], [0.04, 0.52, 0]]];
    for (let index = 0; index < 6; index += 1) {
      const y = -0.12 + index * 0.105;
      const side = index % 2 ? 1 : -1;
      paths.push([
        [0.01, y, 0],
        [side * 0.16, y + 0.03, 0],
        [side * 0.2, y + 0.12, 0],
        [side * 0.07, y + 0.09, 0],
        [0.01, y, 0],
      ]);
    }
    paths.push([[-0.04, -0.3, 0], [-0.25, -0.12, 0], [-0.12, -0.04, 0], [-0.04, -0.3, 0]]);
    return paths;
  }
  if (kind === "lilie") {
    return [
      [[0, -0.5, 0], [-0.02, -0.16, 0], [0, 0.1, 0]],
      [[0, 0.08, 0], [-0.36, 0.4, 0], [-0.21, 0.47, 0], [-0.04, 0.22, 0], [0, 0.08, 0]],
      [[0, 0.08, 0], [0.36, 0.4, 0], [0.21, 0.47, 0], [0.04, 0.22, 0], [0, 0.08, 0]],
      [[0, 0.1, 0], [-0.08, 0.49, 0], [0, 0.58, 0], [0.08, 0.49, 0], [0, 0.1, 0]],
      [[-0.02, -0.15, 0], [-0.29, 0.02, 0], [-0.16, 0.09, 0], [-0.02, -0.15, 0]],
    ];
  }
  const petals: MotifPath[] = [[[0, 0.2, 0]]];
  for (let index = 0; index < 5; index += 1) {
    const a = (index / 5) * Math.PI * 2;
    const cx = Math.cos(a) * 0.19;
    const cy = Math.sin(a) * 0.17 + 0.22;
    const loop = Array.from({ length: 9 }, (_, pointIndex) => {
      const p = (pointIndex / 8) * Math.PI * 2;
      return [cx + Math.cos(p + a) * 0.15, cy + Math.sin(p + a) * 0.1, 0] as [number, number, number];
    });
    petals.push(loop);
  }
  const spiral = Array.from({ length: 20 }, (_, index) => {
    const a = index * 0.72;
    const radius = 0.12 * (1 - index / 22);
    return [Math.cos(a) * radius, Math.sin(a) * radius + 0.22, 0] as [number, number, number];
  });
  return [
    [[0, -0.52, 0], [-0.03, -0.18, 0], [0, 0.1, 0]],
    [[-0.02, -0.2, 0], [-0.28, -0.04, 0], [-0.16, 0.04, 0], [-0.02, -0.2, 0]],
    [[0, -0.08, 0], [0.26, 0.03, 0], [0.16, 0.11, 0], [0, -0.08, 0]],
    spiral,
    ...petals,
  ];
}

function MotifGlyph({ kind, color }: { kind: string; color: string }) {
  return (
    <group>
      {motifPaths(kind).filter((points) => points.length > 1).map((points, index) => {
        const vectors = points.map(([x, y, z]) => new Vector3(x, y, z));
        const first = vectors[0];
        const last = vectors[vectors.length - 1];
        const closed = vectors.length > 3 && first.distanceTo(last) < 0.001;
        const curve = vectors.length === 2
          ? new LineCurve3(vectors[0], vectors[1])
          : new CatmullRomCurve3(vectors, closed, "centripetal");
        return <mesh key={`${kind}-${index}`} castShadow>
          <tubeGeometry args={[curve, Math.max(8, vectors.length * 3), 0.018, 7, closed]} />
          <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={0.08} metalness={0.38} roughness={0.3} clearcoat={0.22} />
        </mesh>;
      })}
    </group>
  );
}

function Motifs({ draft }: { draft: MonumentDraft }) {
  const motifs = draft.ornaments ?? [];
  const { w, h, d } = cmToMeters(draft);
  if (!motifs.length || draft.form === "kreuz") return null;
  const book = draft.form === "buch";
  const low = draft.form === "liegestein" || draft.form === "kissenstein" || book;
  const lowDepth = Math.max(d, w * 0.68);
  const cushion = draft.form === "kissenstein";
  const frontHeight = cushion ? Math.max(0.075, h * 0.42) : Math.max(0.055, h * 0.72);
  const backHeight = cushion ? Math.max(0.16, h) : Math.max(frontHeight + 0.018, h);
  const bookFront = Math.max(0.065, h * 0.36);
  const bookBack = Math.max(0.12, h * 0.68);
  const angle = Math.atan2((book ? bookBack : backHeight) - (book ? bookFront : frontHeight), lowDepth);
  const top = book
    ? (bookFront + bookBack) / 2 + Math.max(0.035, h * 0.22) + 0.014
    : (frontHeight + backHeight) / 2 + (cushion ? 0.04 : 0) + 0.01;
  const scale = low ? Math.min(w, lowDepth) * 0.115 : Math.min(w, h) * 0.13;
  const style = inscriptionStyle(draft.engravingFinish, draft.material, draft.inscriptionColor);
  const position: [number, number, number] = low
    ? [book ? -w * 0.24 : 0, top, 0]
    : [0, h * 0.25, d / 2 + 0.018];
  const rotation: [number, number, number] = low ? [-Math.PI / 2 + angle, 0, 0] : [0, 0, 0];
  const visible = motifs.slice(0, 5);
  return (
    <group position={position} rotation={rotation}>
      {visible.map((kind, index) => (
        <group key={kind} position={[(index - (visible.length - 1) / 2) * scale * 1.35, 0, 0.002]} scale={scale}>
          <MotifGlyph kind={kind} color={style.color} />
        </group>
      ))}
    </group>
  );
}

function plotDimensions(draft: MonumentDraft) {
  if (draft.grabtyp === "familiengrab") return { width: 1.75, depth: 1.72 };
  if (draft.grabtyp === "urnengrab") return { width: 0.82, depth: 0.82 };
  if (draft.grabtyp === "kindergrab") return { width: 0.82, depth: 1.12 };
  if (draft.grabtyp === "gedenkstein") return { width: 1.1, depth: 1.05 };
  return { width: 0.96, depth: 1.62 };
}

function MountedBronzeCross({ draft, premium }: { draft: MonumentDraft; premium: boolean }) {
  const { w, h, d } = cmToMeters(draft);
  const low = draft.form === "liegestein" || draft.form === "kissenstein" || draft.form === "buch";
  if (low || draft.form === "kreuz") return null;
  const size = Math.min(w, h) * (premium ? 0.3 : 0.23);
  return (
    <group position={[w * 0.27, h * 0.72, d / 2 + 0.024]}>
      <mesh castShadow><boxGeometry args={[size * 0.18, size, 0.012]} /><meshPhysicalMaterial color="#9d7440" metalness={0.88} roughness={0.24} clearcoat={0.25} /></mesh>
      <mesh position={[0, size * 0.15, 0]} castShadow><boxGeometry args={[size * 0.62, size * 0.17, 0.013]} /><meshPhysicalMaterial color="#9d7440" metalness={0.88} roughness={0.24} clearcoat={0.25} /></mesh>
    </group>
  );
}

function BronzeAccessory({ draft }: { draft: MonumentDraft }) {
  const accessory = draft.bronze;
  if (!accessory || accessory === "keins") return null;
  if (accessory === "kreuz_standard" || accessory === "kreuz_premium") {
    return <MountedBronzeCross draft={draft} premium={accessory === "kreuz_premium"} />;
  }
  const plot = plotDimensions(draft);
  const x = plot.width * 0.31;
  const z = plot.depth * 0.68;
  if (accessory === "vase") {
    return <group position={[x, 0, z]}><mesh position={[0, 0.09, 0]} castShadow><cylinderGeometry args={[0.055, 0.04, 0.18, 24]} /><meshPhysicalMaterial color="#876337" metalness={0.83} roughness={0.3} clearcoat={0.18} /></mesh><mesh position={[0, 0.185, 0]}><torusGeometry args={[0.052, 0.008, 8, 24]} /><meshPhysicalMaterial color="#876337" metalness={0.83} roughness={0.3} clearcoat={0.18} /></mesh></group>;
  }
  if (accessory === "laterne") {
    return <group position={[x, 0, z]}><mesh position={[0, 0.025, 0]} castShadow><boxGeometry args={[0.13, 0.05, 0.13]} /><meshPhysicalMaterial color="#876337" metalness={0.83} roughness={0.3} clearcoat={0.18} /></mesh><mesh position={[0, 0.14, 0]} castShadow><boxGeometry args={[0.105, 0.18, 0.105]} /><meshPhysicalMaterial color="#c8b884" transparent opacity={0.62} roughness={0.18} /></mesh><mesh position={[0, 0.255, 0]} castShadow><coneGeometry args={[0.1, 0.06, 4]} /><meshPhysicalMaterial color="#876337" metalness={0.83} roughness={0.3} clearcoat={0.18} /></mesh></group>;
  }
  if (accessory === "weihwasserbecken") {
    return <group position={[x, 0, z]}><mesh position={[0, 0.055, 0]} castShadow><cylinderGeometry args={[0.1, 0.075, 0.11, 28]} /><meshPhysicalMaterial color="#876337" metalness={0.83} roughness={0.3} clearcoat={0.18} /></mesh><mesh position={[0, 0.112, 0]}><torusGeometry args={[0.085, 0.012, 8, 28]} /><meshPhysicalMaterial color="#876337" metalness={0.83} roughness={0.3} clearcoat={0.18} /></mesh></group>;
  }
  return <mesh position={[x, 0.055, z]} rotation={[-0.18, 0, 0]} castShadow><boxGeometry args={[0.18, 0.1, 0.025]} /><meshPhysicalMaterial color="#876337" metalness={0.83} roughness={0.3} clearcoat={0.18} /></mesh>;
}

function CameraRig({ draft }: { draft: MonumentDraft }) {
  const camera = useThree((state) => state.camera);
  const { w, h, d } = cmToMeters(draft);
  const plot = plotDimensions(draft);
  useEffect(() => {
    const low = draft.form === "liegestein" || draft.form === "kissenstein" || draft.form === "buch";
    const size = Math.max(w, h, d, plot.width * 0.76, plot.depth * 0.53, 0.62);
    const distance = Math.max(1.62, size * 2.15);
    camera.position.set(distance * 0.72, distance * 0.57, distance * 1.04);
    camera.lookAt(0, low ? 0.12 : h * 0.43, plot.depth * 0.2);
    camera.updateProjectionMatrix();
  }, [camera, w, h, d, plot.width, plot.depth, draft.form]);
  return null;
}

function BorderStone({ draft, position, size }: { draft: MonumentDraft; position: [number, number, number]; size: [number, number, number] }) {
  const appearance = stoneAppearance(draft.material, draft.surface);
  return <mesh position={position} castShadow receiveShadow><boxGeometry args={size} /><StoneMaterial material={appearance} /></mesh>;
}

function PebbleBed({ width, depth, centerZ }: { width: number; depth: number; centerZ: number }) {
  const pebbles = useMemo(() => Array.from({ length: 135 }, (_, index) => {
    const column = index % 15;
    const row = Math.floor(index / 15);
    const jitter = ((index * 37) % 23) / 23 - 0.5;
    return {
      x: -width * 0.43 + column * (width * 0.061) + jitter * 0.026,
      z: centerZ - depth * 0.42 + row * (depth * 0.105) - jitter * 0.035,
      scale: 0.011 + ((index * 13) % 9) * 0.0011,
      shade: ["#b9b4a8", "#8f918a", "#d1cec4", "#777b75"][index % 4],
    };
  }), [width, depth, centerZ]);
  return <group>{pebbles.map((pebble, index) => <mesh key={index} position={[pebble.x, 0.028, pebble.z]} rotation={[0, ((index * 29) % 17) * 0.11, 0]} scale={[1.35, 0.58, 1]} castShadow receiveShadow><dodecahedronGeometry args={[pebble.scale, 0]} /><meshStandardMaterial color={pebble.shade} roughness={0.92} /></mesh>)}</group>;
}

function Planting({ width, depth, centerZ }: { width: number; depth: number; centerZ: number }) {
  const plants = useMemo(() => Array.from({ length: 18 }, (_, index) => {
    const column = index % 6;
    const row = Math.floor(index / 6);
    return {
      x: -width * 0.34 + column * (width * 0.136),
      z: centerZ - depth * 0.29 + row * (depth * 0.23),
      flowering: index % 4 === 0,
    };
  }), [width, depth, centerZ]);
  return <group>{plants.map((plant, index) => <group key={index} position={[plant.x, 0.035, plant.z]} rotation={[0, (index % 5) * 0.42, 0]}>
    <mesh position={[-0.025, 0.026, 0]} rotation={[0.18, -0.55, -0.72]} scale={[1.15, 0.34, 0.55]} castShadow><sphereGeometry args={[0.042, 10, 7]} /><meshStandardMaterial color={index % 3 ? "#3e6948" : "#567c4e"} roughness={0.9} /></mesh>
    <mesh position={[0.025, 0.03, 0.004]} rotation={[-0.12, 0.5, 0.72]} scale={[1.18, 0.34, 0.55]} castShadow><sphereGeometry args={[0.043, 10, 7]} /><meshStandardMaterial color="#456f4d" roughness={0.9} /></mesh>
    <mesh position={[0, 0.038, -0.02]} rotation={[0.65, 0, 0]} scale={[1.05, 0.3, 0.52]} castShadow><sphereGeometry args={[0.038, 10, 7]} /><meshStandardMaterial color="#60845a" roughness={0.9} /></mesh>
    {plant.flowering ? <mesh position={[0, 0.075, 0]} castShadow><sphereGeometry args={[0.018, 10, 7]} /><meshStandardMaterial color={index % 8 ? "#ece6d7" : "#b56b61"} roughness={0.75} /></mesh> : null}
  </group>)}</group>;
}

function GraveContext({ draft }: { draft: MonumentDraft }) {
  const plot = plotDimensions(draft);
  const { w, d } = cmToMeters(draft);
  const border = 0.062;
  const stoneWidthFactor = draft.form === "breitstein" || draft.form === "sockelanlage" ? 1.28 : draft.form === "herz" ? 1.18 : 1;
  const foundationWidth = Math.max(plot.width + border, w * stoneWidthFactor + 0.08);
  const foundationDepth = Math.max(d + 0.06, 0.18);
  const joinZ = foundationDepth / 2;
  const surfaceDepth = Math.max(0.25, plot.depth - joinZ);
  const centerZ = joinZ + surfaceDepth / 2;
  const enclosure = draft.enclosure ?? "keine";
  const freeMemorial = draft.grabtyp === "gedenkstein";
  return (
    <group>
      <mesh position={[0, 0.008, centerZ]} receiveShadow>
        {freeMemorial ? <cylinderGeometry args={[plot.width * 0.52, plot.width * 0.56, 0.018, 48]} /> : <boxGeometry args={[plot.width, 0.016, surfaceDepth]} />}
        <meshStandardMaterial color={freeMemorial ? "#587153" : enclosure === "kieselpflaster" ? "#6f7068" : "#554f43"} roughness={1} />
      </mesh>
      {!freeMemorial && enclosure !== "keine" ? <>
        <BorderStone draft={draft} position={[0, 0.032, 0]} size={[foundationWidth, 0.064, foundationDepth]} />
        <BorderStone draft={draft} position={[-plot.width / 2, 0.032, centerZ]} size={[border, 0.064, surfaceDepth]} />
        <BorderStone draft={draft} position={[plot.width / 2, 0.032, centerZ]} size={[border, 0.064, surfaceDepth]} />
        <BorderStone draft={draft} position={[0, 0.032, plot.depth]} size={[plot.width + border, 0.064, border]} />
      </> : null}
      {!freeMemorial && enclosure === "abdeckplatte" ? <>
        <BorderStone draft={draft} position={[-plot.width * 0.275, 0.045, centerZ]} size={[plot.width * 0.43, 0.07, Math.max(0.18, surfaceDepth - border)]} />
        <BorderStone draft={draft} position={[plot.width * 0.275, 0.045, centerZ]} size={[plot.width * 0.43, 0.07, Math.max(0.18, surfaceDepth - border)]} />
      </> : null}
      {!freeMemorial && enclosure === "kieselpflaster" ? <PebbleBed width={plot.width} depth={surfaceDepth} centerZ={centerZ} /> : null}
      {!freeMemorial && enclosure === "pflanzflaeche" ? <Planting width={plot.width} depth={surfaceDepth} centerZ={centerZ} /> : null}
    </group>
  );
}

function CemeteryEnvironment() {
  const [map, normalMap, roughnessMap] = useTexture([
    "/assets/textures/leafy-grass/diffuse.jpg",
    "/assets/textures/leafy-grass/normal.jpg",
    "/assets/textures/leafy-grass/roughness.jpg",
  ], (loaded) => {
    (loaded as Texture[]).forEach((texture, index) => {
      if (index === 0) texture.colorSpace = SRGBColorSpace;
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.repeat.set(3.5, 3);
      texture.needsUpdate = true;
    });
  });
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.018, 0]} receiveShadow>
      <planeGeometry args={[14, 12, 1, 1]} />
      <meshStandardMaterial color="#78906f" map={map} normalMap={normalMap} normalScale={new Vector2(0.55, 0.55)} roughnessMap={roughnessMap} roughness={0.95} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.004, 2.92]} receiveShadow>
      <planeGeometry args={[7, 0.82]} />
      <meshStandardMaterial color="#bcb9af" roughness={0.9} />
    </mesh>
  </group>;
}

function Scene({ draft }: { draft: MonumentDraft }) {
  const { w, h, d } = cmToMeters(draft);
  const plot = plotDimensions(draft);
  const low = draft.form === "liegestein" || draft.form === "kissenstein" || draft.form === "buch";
  const mountedAccessory = draft.bronze === "kreuz_standard" || draft.bronze === "kreuz_premium";
  return (
    <>
      <CameraRig draft={draft} />
      <hemisphereLight args={["#f4f7f3", "#52604d", 0.3]} />
      <directionalLight castShadow position={[-3.5, 6, 4.5]} intensity={1.08} color="#fff5df" shadow-mapSize={[2048, 2048]} shadow-bias={-0.0003} />
      <CemeteryEnvironment />
      <GraveContext draft={draft} />
      <group>
        <StoneModel draft={draft} />
        <Suspense fallback={null}><Inscription draft={draft} /></Suspense>
        <Motifs draft={draft} />
        {mountedAccessory ? <BronzeAccessory draft={draft} /> : null}
      </group>
      {!mountedAccessory ? <BronzeAccessory draft={draft} /> : null}
      <ContactShadows position={[0, 0.006, 0]} opacity={0.5} scale={4} blur={2.7} far={2.8} />
      <OrbitControls makeDefault target={[0, low ? 0.12 : h * 0.43, plot.depth * 0.2]} enableDamping dampingFactor={0.07} minDistance={Math.max(1.05, Math.max(w, h, d) * 1.25)} maxDistance={8} minPolarAngle={0.38} maxPolarAngle={Math.PI / 2 - 0.035} />
    </>
  );
}

function SceneReady({ onReady }: { onReady: () => void }) {
  useEffect(onReady, [onReady]);
  return null;
}

export function MonumentPreview({ draft, orderId, embedded = false, hero = false, downloadEnabled = true }: { draft: MonumentDraft; orderId: string; embedded?: boolean; hero?: boolean; downloadEnabled?: boolean }) {
  const renderedDraft = useDeferredValue(draft);
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);
  const updating = !ready || renderedDraft !== draft;
  const capture = useCallback(() => {
    const canvas = document.querySelector("#monument-preview-root canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const anchor = document.createElement("a");
    anchor.href = canvas.toDataURL("image/png");
    anchor.download = `Vorschau-${orderId}.png`;
    anchor.click();
  }, [orderId]);

  return (
    <div className={embedded || hero ? "" : "flex flex-col gap-2"}>
      {!embedded && !hero ? <p className="text-sm font-medium text-[#35433c]">3D-Vorschau</p> : null}
      <div id="monument-preview-root" className={`relative w-full overflow-hidden bg-[#dce3dd] ${hero ? "h-[min(68vh,620px)] min-h-112" : embedded ? "h-96" : "h-80 border border-[#d8dfda]"}`}>
        <Canvas shadows camera={{ position: [1.25, 0.9, 1.45], fov: 32 }} gl={{ preserveDrawingBuffer: true, antialias: true, alpha: false }} dpr={[1, 1.75]}>
          <color attach="background" args={["#dce3dd"]} />
          <Environment files="/assets/environment/symmetrical_garden_02_2k.hdr" background blur={0.025} />
          <Suspense fallback={null}><Scene draft={renderedDraft} /><SceneReady onReady={markReady} /></Suspense>
        </Canvas>
        <div aria-live="polite" className={`pointer-events-none absolute inset-0 grid place-items-center bg-[#e8eeea]/28 backdrop-blur-[1px] transition-opacity duration-200 ${updating ? "opacity-100" : "opacity-0"}`}>
          <span className="inline-flex items-center gap-2 rounded-md border border-white/70 bg-white/92 px-3 py-2 text-xs font-semibold text-[#35433c] shadow-lg"><LoaderCircle className="size-4 animate-spin text-[#12644f]" /> 3D-Vorschau wird aktualisiert</span>
        </div>
        {downloadEnabled ? <button type="button" onClick={capture} title="Vorschau als PNG speichern" className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-md border border-white/60 bg-[#17372d]/88 px-3 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur transition hover:bg-[#102a22]"><Download className="size-4" aria-hidden="true" /> PNG</button> : null}
      </div>
    </div>
  );
}
