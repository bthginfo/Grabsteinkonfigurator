import { describe, expect, it } from "vitest";
import { buildSupplierEnPdfBuffer } from "./supplier-en";

describe("buildSupplierEnPdfBuffer", () => {
  it("creates a multi-page fabrication specification", async () => {
    const buffer = await buildSupplierEnPdfBuffer("test-order", {
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
        epitaph: "In liebevoller Erinnerung",
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
      cemeteryName: "Testfriedhof",
      graveField: "Feld 2",
      graveNumber: "14",
    }, {
      canCalculate: true,
      lines: [],
      subtotalNet: 1200,
      vatRate: 0.2,
      vatAmount: 240,
      totalGross: 1440,
    });

    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    expect(buffer.length).toBeGreaterThan(5_000);
  });
});
