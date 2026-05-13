import PDFDocument from "pdfkit";
import type { MonumentDraft } from "@/lib/config/monument-schema";
import type { PriceResult } from "@/lib/pricing/calculate";
import type { PriceResult } from "@/lib/pricing/calculate";
import { formatEuroDe } from "./customer-de";

/** Bestellblatt für Lieferant / Großhändler (Englisch). */
export function buildSupplierEnPdfBuffer(
  orderId: string,
  draft: MonumentDraft,
  price: PriceResult,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: "A4",
      margin: 48,
      info: { Title: `Order sheet ${orderId}` },
    });
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("Stone order sheet (draft)", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#444").text(`Reference: ${orderId}`);
    doc.text(`Date: ${new Date().toISOString().slice(0, 10)}`);
    doc.moveDown();
    doc.fillColor("#000").fontSize(11).text("Stone & finish", { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10);
    doc.text(`Type / use: ${draft.grabtyp ?? "—"}`);
    doc.text(`Shape: ${draft.form ?? "—"}`);
    doc.text(`Material: ${draft.material ?? "—"}`);
    doc.text(`Surface finish: ${draft.surface ?? "—"}`);
    if (
      draft.heightCm != null &&
      draft.widthCm != null &&
      draft.depthCm != null
    ) {
      doc.text(
        `Dimensions (H × W × D cm): ${draft.heightCm} × ${draft.widthCm} × ${draft.depthCm}`,
      );
    }
    doc.text(`Quantity: 1`);
    doc.moveDown();
    doc.fontSize(11).text("Inscription / artwork", { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10);
    doc.text(`Engraving finish: ${draft.engravingFinish ?? "—"}`);
    if (draft.inscription?.name) doc.text(`Line 1: ${draft.inscription.name}`);
    if (draft.inscription?.dates) doc.text(`Dates: ${draft.inscription.dates}`);
    if (draft.inscription?.epitaph) doc.text(`Epitaph: ${draft.inscription.epitaph}`);
    if (draft.inscription?.font) doc.text(`Font style: ${draft.inscription.font}`);
    if (draft.inscription?.alignment)
      doc.text(`Alignment: ${draft.inscription.alignment}`);
    if (draft.ornaments?.length)
      doc.text(`Ornaments / symbols: ${draft.ornaments.join(", ")}`);
    doc.text(`Bronze accessories: ${draft.bronze ?? "—"}`);
    doc.text(`Enclosure: ${draft.enclosure ?? "—"}`);
    doc.text(`Mounting on site: ${draft.montage !== false ? "yes" : "no"}`);
    doc.moveDown();
    doc.fontSize(11).text("Commercial (indicative)", { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10);
    if (price.canCalculate) {
      doc.text(`Net subtotal (EUR): ${formatEuroDe(price.subtotalNet)}`);
      doc.text(`VAT (${(price.vatRate * 100).toFixed(0)} %): ${formatEuroDe(price.vatAmount)}`);
      doc.text(`Gross total (EUR): ${formatEuroDe(price.totalGross)}`);
    } else {
      doc.text(`Pricing: ${price.reason}`);
    }
    doc.moveDown(1);
    doc.fontSize(9).fillColor("#333");
    doc.text(
      "Internal draft from online configurator. Please confirm slab availability, lead time, and freight before production.",
      { width: doc.page.width - 96 },
    );

    doc.end();
  });
}
