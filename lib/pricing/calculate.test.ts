import { describe, it, expect } from "vitest";
import sampleCatalog from "@/config/catalog/sample.json";
import { calculatePrice } from "./calculate";
import type { MonumentDraft } from "@/lib/config/monument-schema";

/** Golden Path: Urnengrab laut Katalogeintrag `urne_stele_schwarz_45308` → 590 € netto Basis. */
describe("calculatePrice", () => {
  it("berechnet Urnengrab-Stele schwarz mit Katalogpreis 590 € netto (Basis)", () => {
    const draft: MonumentDraft = {
      schemaVersion: 1,
      grabtyp: "urnengrab",
      form: "stele",
      material: "granit_schwarz",
      surface: "poliert",
      heightCm: 45,
      widthCm: 30,
      depthCm: 8,
      engravingFinish: "sandgestrahlt",
      ornaments: [],
      bronze: "keins",
      enclosure: "keine",
      montage: false,
    };

    const result = calculatePrice(draft, sampleCatalog);
    expect(result.canCalculate).toBe(true);
    if (!result.canCalculate) return;
    const baseLine = result.lines.find((l) => l.id.startsWith("base:"));
    expect(baseLine?.lineTotalNet).toBe(590);
    expect(result.subtotalNet).toBe(590);
  });

  it("berechnet auch Kombinationen ohne eigenen Katalogeintrag", () => {
    const draft: MonumentDraft = {
      schemaVersion: 1,
      grabtyp: "familiengrab",
      form: "stele",
      material: "granit_schwarz",
      surface: "poliert",
      heightCm: 45,
      widthCm: 30,
      depthCm: 8,
    };
    const result = calculatePrice(draft, sampleCatalog);
    expect(result.canCalculate).toBe(true);
    if (!result.canCalculate) return;
    expect(result.lines[0]?.id).toBe("base:calculated");
    expect(result.subtotalNet).toBeGreaterThan(590);
  });

  it("skaliert den Basispreis mit den gewählten Maßen", () => {
    const small: MonumentDraft = {
      schemaVersion: 1,
      grabtyp: "gedenkstein",
      form: "felsen",
      material: "sandstein",
      surface: "naturspalt",
      heightCm: 40,
      widthCm: 30,
      depthCm: 8,
    };
    const large = { ...small, heightCm: 100, widthCm: 70, depthCm: 18 };
    const smallPrice = calculatePrice(small, sampleCatalog);
    const largePrice = calculatePrice(large, sampleCatalog);
    expect(smallPrice.canCalculate).toBe(true);
    expect(largePrice.canCalculate).toBe(true);
    if (!smallPrice.canCalculate || !largePrice.canCalculate) return;
    expect(largePrice.subtotalNet).toBeGreaterThan(smallPrice.subtotalNet);
  });

  it("berechnet den Breitstein als eigene Familiengrab-Form", () => {
    const result = calculatePrice({
      schemaVersion: 1,
      grabtyp: "familiengrab",
      form: "breitstein",
      material: "granit_grau",
      surface: "poliert",
      heightCm: 85,
      widthCm: 125,
      depthCm: 18,
    }, sampleCatalog);
    expect(result.canCalculate).toBe(true);
    if (!result.canCalculate) return;
    expect(result.lines[0]?.id).toBe("base:calculated");
    expect(result.subtotalNet).toBeGreaterThan(1_000);
  });
});
