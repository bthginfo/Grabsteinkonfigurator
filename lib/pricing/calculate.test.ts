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

  it("liefert canCalculate false ohne passende Basis", () => {
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
    expect(result.canCalculate).toBe(false);
  });
});
