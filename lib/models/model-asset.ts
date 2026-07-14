import { z } from "zod";

const vector3Schema = z.tuple([z.number(), z.number(), z.number()]);
const fallbackFormSchema = z.enum([
  "stele", "breitstein", "liegestein", "felsen", "herz", "buch",
  "kissenstein", "kreuz", "sockelanlage",
]);

export const modelAssetSchema = z.object({
  id: z.string().trim().regex(/^[a-z0-9][a-z0-9-_]*$/, "Nur Kleinbuchstaben, Zahlen, - und _ verwenden."),
  label: z.string().trim().min(2).max(120),
  description: z.string().trim().max(240).default("Individuelles 3D-Modell"),
  enabled: z.boolean().default(true),
  runtimeUrl: z.string().trim().refine(
    (value) => value.startsWith("/models/") || value.startsWith("https://"),
    "GLB/glTF muss unter /models/ oder über HTTPS erreichbar sein.",
  ),
  format: z.enum(["glb", "gltf"]).default("glb"),
  fallbackForm: fallbackFormSchema.default("stele"),
  nativeSizeCm: z.object({
    height: z.number().positive().max(500),
    width: z.number().positive().max(500),
    depth: z.number().positive().max(500),
  }),
  transform: z.object({
    rotationDeg: vector3Schema.default([0, 0, 0]),
    offsetCm: vector3Schema.default([0, 0, 0]),
    uniformScale: z.number().positive().max(100).default(1),
  }).default({}),
  materialMode: z.enum(["configurable", "embedded"]).default("configurable"),
  inscriptionSurface: z.object({
    mode: z.enum(["upright", "inclined", "disabled"]).default("upright"),
    positionRatio: vector3Schema.default([0, 0.55, 0.5]),
    rotationDeg: vector3Schema.default([0, 0, 0]),
    maxWidthRatio: z.number().positive().max(1).default(0.72),
  }).default({}),
  source: z.object({
    originalFileName: z.string().trim().max(240).optional(),
    originalFormat: z.enum(["step", "stp", "iges", "igs", "3dm", "dwg", "dxf", "stl", "obj", "fbx", "glb", "gltf", "other"]).optional(),
    supplierReference: z.string().trim().max(160).optional(),
    checksumSha256: z.string().trim().regex(/^[a-fA-F0-9]{64}$/).optional(),
    notes: z.string().trim().max(500).optional(),
  }).optional(),
});

export type ModelAsset = z.infer<typeof modelAssetSchema>;

export function modelSelectionValue(model: Pick<ModelAsset, "id">) {
  return `model:${model.id}`;
}
