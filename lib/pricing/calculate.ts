import { z } from "zod";
import type { MonumentDraft } from "@/lib/config/monument-schema";
import { modelAssetSchema } from "@/lib/models/model-asset";

export type PriceLine = {
  id: string;
  label: string;
  quantity: number;
  unitPriceNet: number;
  lineTotalNet: number;
};

export type PriceResult =
  | {
      canCalculate: false;
      reason: string;
    }
  | {
      canCalculate: true;
      lines: PriceLine[];
      subtotalNet: number;
      vatRate: number;
      vatAmount: number;
      totalGross: number;
    };

export const priceCatalogSchema = z.object({
  schemaVersion: z.literal(1),
  currency: z.string(),
  vatRate: z.number(),
  taxLabel: z.string().optional(),
  letterSandPerChar: z.number(),
  goldPerCharAddon: z.number(),
  ornamentEach: z.number(),
  montageNet: z.number(),
  laserFlatNet: z.number().default(250),
  fallbackPricing: z
    .object({
      baseNet: z.number(),
      referenceVolumeCm3: z.number().positive(),
      grabtypAddons: z.record(z.string(), z.number()),
      formAddons: z.record(z.string(), z.number()),
      materialFactors: z.record(z.string(), z.number().positive()),
      surfaceAddons: z.record(z.string(), z.number()),
    })
    .default({
      baseNet: 620,
      referenceVolumeCm3: 24000,
      grabtypAddons: {},
      formAddons: {},
      materialFactors: {},
      surfaceAddons: {},
    }),
  bronzePrices: z.record(z.string(), z.number()),
  enclosurePrices: z.record(z.string(), z.number()),
  models: z.array(modelAssetSchema).default([]),
  bases: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      grabtyp: z.string(),
      form: z.string(),
      material: z.string(),
      surface: z.string(),
      heightCm: z.number(),
      widthCm: z.number(),
      depthCm: z.number(),
      priceNet: z.number(),
    }),
  ),
});

export type PriceCatalog = z.infer<typeof priceCatalogSchema>;

export function parsePriceCatalog(raw: unknown): PriceCatalog | null {
  const r = priceCatalogSchema.safeParse(raw);
  return r.success ? r.data : null;
}

function countInscriptionChars(ins: MonumentDraft["inscription"]): number {
  if (!ins?.name) return 0;
  const parts = [ins.name, ins.dates ?? "", ins.epitaph ?? ""];
  return parts.join("").length;
}

function dimensionsFromDraft(draft: MonumentDraft) {
  const { heightCm, widthCm, depthCm } = draft;
  if (heightCm == null || widthCm == null || depthCm == null) return null;
  return { heightCm, widthCm, depthCm };
}

function dimensionFactor(volume: number, referenceVolume: number) {
  const raw = Math.pow(volume / referenceVolume, 0.72);
  return Math.min(2.4, Math.max(0.72, raw));
}

function findBestBase(draft: MonumentDraft, catalog: PriceCatalog) {
  const { grabtyp, form, material, surface, heightCm, widthCm, depthCm } =
    draft;
  if (
    !grabtyp ||
    !form ||
    !material ||
    !surface ||
    heightCm == null ||
    widthCm == null ||
    depthCm == null
  ) {
    return null;
  }
  const candidates = catalog.bases.filter(
    (b) =>
      b.grabtyp === grabtyp &&
      b.form === form &&
      b.material === material &&
      b.surface === surface,
  );
  if (candidates.length === 0) return null;
  const scored = candidates.map((b) => {
    const d =
      Math.abs(b.heightCm - heightCm) +
      Math.abs(b.widthCm - widthCm) +
      Math.abs(b.depthCm - depthCm);
    return { b, d };
  });
  scored.sort((a, b) => a.d - b.d);
  return scored[0]!.b;
}

function calculateBaseLine(draft: MonumentDraft, catalog: PriceCatalog): PriceLine | null {
  const dimensions = dimensionsFromDraft(draft);
  if (!draft.grabtyp || !draft.form || !draft.material || !draft.surface || !dimensions) {
    return null;
  }

  const requestedVolume =
    dimensions.heightCm * dimensions.widthCm * dimensions.depthCm;
  const catalogBase = findBestBase(draft, catalog);

  if (catalogBase) {
    const referenceVolume =
      catalogBase.heightCm * catalogBase.widthCm * catalogBase.depthCm;
    const price = Math.round(
      catalogBase.priceNet * dimensionFactor(requestedVolume, referenceVolume),
    );
    return {
      id: `base:${catalogBase.id}`,
      label: catalogBase.label,
      quantity: 1,
      unitPriceNet: price,
      lineTotalNet: price,
    };
  }

  const fallback = catalog.fallbackPricing;
  const beforeMaterial =
    fallback.baseNet +
    (fallback.grabtypAddons[draft.grabtyp] ?? 0) +
    (fallback.formAddons[draft.form] ?? 0) +
    (fallback.surfaceAddons[draft.surface] ?? 0);
  const materialFactor = fallback.materialFactors[draft.material] ?? 1;
  const scaled =
    beforeMaterial *
    materialFactor *
    dimensionFactor(requestedVolume, fallback.referenceVolumeCm3);
  const price = Math.round(scaled / 10) * 10;

  return {
    id: "base:calculated",
    label: "Grabmal nach Auswahl und Maß",
    quantity: 1,
    unitPriceNet: price,
    lineTotalNet: price,
  };
}

/**
 * Preisberechnung aus Entwurf + Katalog.
 * Netto-Logik; USt aus `catalog.vatRate` (nur Darstellung).
 */
export function calculatePrice(
  draft: MonumentDraft,
  catalogRaw: unknown,
): PriceResult {
  const catalog = parsePriceCatalog(catalogRaw);
  if (!catalog) {
    return { canCalculate: false, reason: "Ungültiger Katalog." };
  }

  const baseLine = calculateBaseLine(draft, catalog);
  if (!baseLine) {
    return {
      canCalculate: false,
      reason: "Für einen Richtpreis fehlen noch Modell, Material, Oberfläche oder Maße.",
    };
  }

  const lines: PriceLine[] = [baseLine];

  let subtotal = baseLine.lineTotalNet;

  const chars = countInscriptionChars(draft.inscription);
  if (
    chars > 0 &&
    draft.engravingFinish &&
    draft.engravingFinish !== "laser"
  ) {
    let perChar = catalog.letterSandPerChar;
    if (
      draft.engravingFinish === "vergoldet" ||
      draft.engravingFinish === "goldlack"
    ) {
      perChar += catalog.goldPerCharAddon;
    }
    const letterTotal = Math.round(perChar * chars * 100) / 100;
    lines.push({
      id: "gravur:zeichen",
      label: `Gravur (${draft.engravingFinish}), ${chars} Zeichen`,
      quantity: chars,
      unitPriceNet: perChar,
      lineTotalNet: letterTotal,
    });
    subtotal += letterTotal;
  }

  if (draft.engravingFinish === "laser") {
    const laser = catalog.laserFlatNet;
    lines.push({
      id: "gravur:laser",
      label: "Lasergravur (Pauschale)",
      quantity: 1,
      unitPriceNet: laser,
      lineTotalNet: laser,
    });
    subtotal += laser;
  }

  const ornaments = draft.ornaments ?? [];
  if (ornaments.length > 0) {
    const o = ornaments.length * catalog.ornamentEach;
    lines.push({
      id: "ornamente",
      label: `Ornamente (${ornaments.length}×)`,
      quantity: ornaments.length,
      unitPriceNet: catalog.ornamentEach,
      lineTotalNet: o,
    });
    subtotal += o;
  }

  if (draft.bronze) {
    const p = catalog.bronzePrices[draft.bronze] ?? 0;
    if (p > 0) {
      lines.push({
        id: `bronze:${draft.bronze}`,
        label: `Bronze: ${draft.bronze}`,
        quantity: 1,
        unitPriceNet: p,
        lineTotalNet: p,
      });
      subtotal += p;
    }
  }

  if (draft.enclosure) {
    const p = catalog.enclosurePrices[draft.enclosure] ?? 0;
    if (p > 0) {
      lines.push({
        id: `einfassung:${draft.enclosure}`,
        label: `Einfassung: ${draft.enclosure}`,
        quantity: 1,
        unitPriceNet: p,
        lineTotalNet: p,
      });
      subtotal += p;
    }
  }

  if (draft.montage) {
    lines.push({
      id: "montage",
      label: "Montage & Versetzung (pauschal)",
      quantity: 1,
      unitPriceNet: catalog.montageNet,
      lineTotalNet: catalog.montageNet,
    });
    subtotal += catalog.montageNet;
  }

  const subtotalNet = Math.round(subtotal * 100) / 100;
  const vatAmount = Math.round(subtotalNet * catalog.vatRate * 100) / 100;
  const totalGross = Math.round((subtotalNet + vatAmount) * 100) / 100;

  return {
    canCalculate: true,
    lines,
    subtotalNet,
    vatRate: catalog.vatRate,
    vatAmount,
    totalGross,
  };
}
