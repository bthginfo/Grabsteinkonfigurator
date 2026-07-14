import { describe, expect, it } from "vitest";
import type { MonumentDraft } from "@/lib/config/monument-schema";
import { assessProductionReadiness } from "./production-readiness";

function completeDraft(overrides: Partial<MonumentDraft> = {}): MonumentDraft {
  return {
    schemaVersion: 1,
    grabtyp: "urnengrab",
    form: "buch",
    material: "granit_schwarz",
    stoneTradeName: "Nero Assoluto Zimbabwe",
    surface: "sandgestrahlt",
    edgeProfile: "gefast_3mm",
    heightCm: 18,
    widthCm: 55,
    depthCm: 38,
    inscription: {
      name: "Maria Muster",
      dates: "1942 - 2025",
      epitaph: "In Erinnerung",
      font: "antiqua",
      alignment: "mittig",
    },
    engravingFinish: "sandgestrahlt",
    inscriptionColor: "weiss",
    letterHeightMm: 28,
    engravingDepthMm: 3,
    ornaments: [],
    bronze: "keins",
    enclosure: "keine",
    montage: true,
    cemeteryName: "Waldfriedhof",
    cemeteryCity: "Musterstadt",
    graveField: "Feld 2",
    graveNumber: "14",
    ...overrides,
  };
}

describe("assessProductionReadiness", () => {
  it("marks a fully specified, plausible draft as quote ready", () => {
    const result = assessProductionReadiness(completeDraft());

    expect(result.score).toBe(100);
    expect(result.status).toBe("quote_ready");
    expect(result.issues.filter((item) => item.severity === "blocker")).toEqual([]);
    expect(result.releaseRequirements).toHaveLength(4);
  });

  it("detects insufficient contrast and an implausibly thin upright stone", () => {
    const result = assessProductionReadiness(completeDraft({
      grabtyp: "einzelgrab",
      form: "stele",
      heightCm: 110,
      widthCm: 50,
      depthCm: 8,
      inscriptionColor: "anthrazit",
    }));

    expect(result.status).toBe("review_required");
    expect(result.issues.map((item) => item.id)).toEqual(
      expect.arrayContaining(["upright-depth-low", "low-contrast-dark"]),
    );
  });

  it("scores missing supplier and site data without inventing it", () => {
    const result = assessProductionReadiness(completeDraft({
      stoneTradeName: undefined,
      cemeteryName: undefined,
      cemeteryCity: undefined,
      graveField: undefined,
      graveNumber: undefined,
    }));

    expect(result.score).toBe(77);
    expect(result.status).toBe("review_required");
    expect(result.issues.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        "missing-stone-trade-name",
        "missing-cemetery",
        "missing-grave-location",
      ]),
    );
  });
});
