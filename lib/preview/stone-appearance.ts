import type { Material, Surface } from "@/lib/config/monument-schema";

export type StoneMaterialProps = {
  color: string;
  roughness: number;
  metalness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  textureFamily: "granite" | "marble" | "rock" | "slate";
  normalStrength: number;
  surfaceKey: Surface;
};

const MATERIAL_COLORS: Partial<Record<Material, string>> = {
  granit_schwarz: "#1a1a1c",
  granit_grau: "#5c5c62",
  granit_rot: "#6b3030",
  granit_gruen: "#2d4a3a",
  marmor_weiss: "#e8e6e1",
  marmor_grau: "#9a9894",
  sandstein: "#c4a574",
  kalkstein: "#d6d0c4",
  schiefer: "#4a4f52",
  heimischer_stein: "#7a6f63",
};

export function stoneAppearance(
  material?: Material,
  surface?: Surface,
): StoneMaterialProps {
  const surfaceKey = surface ?? "poliert";
  const color =
    (material && MATERIAL_COLORS[material]) ?? MATERIAL_COLORS.granit_grau ?? "#5c5c62";
  let roughness = 0.55;
  let clearcoat = 0.08;
  let clearcoatRoughness = 0.45;
  let normalStrength = 0.18;
  switch (surface) {
    case "poliert":
      roughness = 0.22;
      clearcoat = 0.45;
      clearcoatRoughness = 0.12;
      normalStrength = 0.05;
      break;
    case "gestockt":
    case "gebuerstet":
      roughness = 0.72;
      clearcoat = 0.04;
      normalStrength = 0.24;
      break;
    case "sandgestrahlt":
    case "geflammt":
      roughness = 0.85;
      clearcoat = 0.02;
      normalStrength = 0.32;
      break;
    case "naturspalt":
      roughness = 0.95;
      clearcoat = 0;
      normalStrength = 0.5;
      break;
    case "kombination":
      roughness = 0.5;
      clearcoat = 0.2;
      normalStrength = 0.16;
      break;
    default:
      break;
  }
  const metalness =
    material?.startsWith("marmor") ? 0.02 : material?.startsWith("granit") ? 0.06 : 0.04;
  const textureFamily = material?.startsWith("marmor")
    ? "marble"
    : material === "sandstein" || material === "kalkstein" || material === "heimischer_stein"
      ? "rock"
      : material === "schiefer"
        ? "slate"
        : "granite";
  return { color, roughness, metalness, clearcoat, clearcoatRoughness, textureFamily, normalStrength, surfaceKey };
}

export function cmToMeters(
  draft: { heightCm?: number; widthCm?: number; depthCm?: number },
): { w: number; h: number; d: number } {
  const h = (draft.heightCm ?? 60) / 100;
  const w = (draft.widthCm ?? 40) / 100;
  const d = (draft.depthCm ?? 10) / 100;
  return { w, h, d };
}
