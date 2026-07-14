"use client";

import { Suspense, useCallback, useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls, RoundedBox, Text, useTexture } from "@react-three/drei";
import {
  BufferGeometry,
  CanvasTexture,
  Color,
  Float32BufferAttribute,
  IcosahedronGeometry,
  LinearFilter,
  RepeatWrapping,
  Shape,
  SRGBColorSpace,
  Texture,
  Vector2,
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
  const asset = material.textureFamily === "marble" ? "Marble003/Marble003_1K-JPG" : "Rock024/Rock024_1K-JPG";
  const loaded = useTexture([
    `/textures/${asset}_Color.jpg`,
    `/textures/${asset}_NormalGL.jpg`,
    `/textures/${asset}_Roughness.jpg`,
  ]) as Texture[];
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
      <meshPhysicalMaterial color={style.color} metalness={style.metalness} roughness={style.roughness} clearcoat={style.metalness > 0.5 ? 0.25 : 0} />
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

function CameraRig({ draft }: { draft: MonumentDraft }) {
  const camera = useThree((state) => state.camera);
  const { w, h, d } = cmToMeters(draft);
  useEffect(() => {
    const plotWidth = draft.grabtyp === "familiengrab" ? 1.75 : draft.grabtyp === "urnengrab" ? 0.82 : 0.95;
    const size = Math.max(w, h, d, plotWidth * 0.72, 0.58);
    const distance = Math.max(1.35, size * 2.05);
    camera.position.set(distance * 0.68, distance * 0.53, distance);
    camera.lookAt(0, h * 0.46, 0);
    camera.updateProjectionMatrix();
  }, [camera, w, h, d, draft.grabtyp]);
  return null;
}

function GraveContext({ draft }: { draft: MonumentDraft }) {
  if (draft.grabtyp === "gedenkstein") {
    return (
      <mesh position={[0, 0.012, 0.2]} receiveShadow>
        <cylinderGeometry args={[0.55, 0.58, 0.024, 48]} />
        <meshStandardMaterial color="#777a73" roughness={0.95} />
      </mesh>
    );
  }
  const plot = draft.grabtyp === "familiengrab"
    ? { width: 1.75, depth: 1.65 }
    : draft.grabtyp === "urnengrab"
      ? { width: 0.82, depth: 0.78 }
      : draft.grabtyp === "kindergrab"
        ? { width: 0.82, depth: 1.05 }
        : { width: 0.96, depth: 1.55 };
  const border = 0.055;
  const centerZ = plot.depth / 2 - 0.04;
  return (
    <group>
      <mesh position={[0, 0.008, centerZ]} receiveShadow>
        <boxGeometry args={[plot.width, 0.016, plot.depth]} />
        <meshStandardMaterial color={draft.grabtyp === "urnengrab" ? "#68675e" : "#57574f"} roughness={1} />
      </mesh>
      <mesh position={[-plot.width / 2, 0.026, centerZ]} receiveShadow><boxGeometry args={[border, 0.052, plot.depth + border]} /><meshStandardMaterial color="#92938d" roughness={0.82} /></mesh>
      <mesh position={[plot.width / 2, 0.026, centerZ]} receiveShadow><boxGeometry args={[border, 0.052, plot.depth + border]} /><meshStandardMaterial color="#92938d" roughness={0.82} /></mesh>
      <mesh position={[0, 0.026, plot.depth - 0.04]} receiveShadow><boxGeometry args={[plot.width + border, 0.052, border]} /><meshStandardMaterial color="#92938d" roughness={0.82} /></mesh>
    </group>
  );
}

function Scene({ draft }: { draft: MonumentDraft }) {
  const { w, h, d } = cmToMeters(draft);
  const low = draft.form === "liegestein" || draft.form === "kissenstein" || draft.form === "buch";
  return (
    <>
      <CameraRig draft={draft} />
      <hemisphereLight args={["#f5f3ed", "#686c68", 0.52]} />
      <directionalLight castShadow position={[3.5, 5, 3]} intensity={1.18} shadow-mapSize={[2048, 2048]} shadow-bias={-0.0003} />
      <GraveContext draft={draft} />
      <group rotation={[0, -0.24, 0]}>
        <StoneModel draft={draft} />
        <Suspense fallback={null}><Inscription draft={draft} /></Suspense>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshBasicMaterial color="#969995" />
      </mesh>
      <ContactShadows position={[0, 0.006, 0]} opacity={0.5} scale={4} blur={2.7} far={2.8} />
      <OrbitControls makeDefault target={[0, low ? 0.12 : h * 0.45, 0]} enableDamping dampingFactor={0.07} minDistance={Math.max(0.9, Math.max(w, h, d) * 1.15)} maxDistance={8} minPolarAngle={0.45} maxPolarAngle={Math.PI / 2 - 0.035} />
    </>
  );
}

export function MonumentPreview({ draft, orderId, embedded = false, hero = false, downloadEnabled = true }: { draft: MonumentDraft; orderId: string; embedded?: boolean; hero?: boolean; downloadEnabled?: boolean }) {
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
      {!embedded && !hero ? <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">3D-Vorschau</p> : null}
      <div id="monument-preview-root" className={`relative w-full overflow-hidden bg-[#b4b6b2] ${hero ? "h-[min(68vh,620px)] min-h-112" : embedded ? "h-96" : "h-80 border border-zinc-200 dark:border-zinc-700"}`}>
        <Canvas shadows camera={{ position: [1.25, 0.9, 1.45], fov: 32 }} gl={{ preserveDrawingBuffer: true, antialias: true, alpha: false }} dpr={[1, 1.75]}>
          <color attach="background" args={["#b4b6b2"]} />
          <Environment resolution={128}>
            <Lightformer form="rect" intensity={3.2} color="#fffaf0" position={[0, 4, 2]} scale={[5, 5, 1]} />
            <Lightformer form="rect" intensity={2.1} color="#dce9e4" position={[-4, 1, 1]} rotation={[0, Math.PI / 2, 0]} scale={[3, 5, 1]} />
            <Lightformer form="rect" intensity={1.6} color="#d8d5cc" position={[4, 1, -2]} rotation={[0, -Math.PI / 2, 0]} scale={[3, 4, 1]} />
          </Environment>
          <Scene draft={draft} />
        </Canvas>
        {downloadEnabled ? <button type="button" onClick={capture} className="absolute bottom-3 right-3 border border-white/60 bg-black/65 px-3 py-2 text-xs font-medium text-white backdrop-blur hover:bg-black/80">PNG speichern</button> : null}
      </div>
    </div>
  );
}
