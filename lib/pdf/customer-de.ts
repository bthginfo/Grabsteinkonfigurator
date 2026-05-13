import PDFDocument from "pdfkit";
import type { PriceResult } from "@/lib/pricing/calculate";
import type { MonumentDraft } from "@/lib/config/monument-schema";

export function formatEuroDe(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function draftSummaryLines(draft: MonumentDraft): string[] {
  const lines: string[] = [];
  if (draft.grabtyp) lines.push(`Grabtyp: ${draft.grabtyp}`);
  if (draft.form) lines.push(`Form: ${draft.form}`);
  if (draft.material) lines.push(`Material: ${draft.material}`);
  if (draft.surface) lines.push(`Oberfläche: ${draft.surface}`);
  if (
    draft.heightCm != null &&
    draft.widthCm != null &&
    draft.depthCm != null
  ) {
    lines.push(
      `Maße (H×B×T): ${draft.heightCm} × ${draft.widthCm} × ${draft.depthCm} cm`,
    );
  }
  if (draft.inscription?.name) {
    lines.push(`Inschrift: ${draft.inscription.name}`);
    if (draft.inscription.dates) lines.push(`Daten: ${draft.inscription.dates}`);
    if (draft.inscription.epitaph)
      lines.push(`Spruch: ${draft.inscription.epitaph}`);
  }
  if (draft.engravingFinish)
    lines.push(`Gravur-Veredelung: ${draft.engravingFinish}`);
  if (draft.ornaments?.length)
    lines.push(`Ornamente: ${draft.ornaments.join(", ")}`);
  if (draft.bronze) lines.push(`Bronze: ${draft.bronze}`);
  if (draft.enclosure) lines.push(`Einfassung: ${draft.enclosure}`);
  lines.push(`Montage: ${draft.montage !== false ? "ja" : "nein"}`);
  return lines;
}

/** Angebot / Übersicht für den Kunden (Deutsch). */
export function buildCustomerDePdfBuffer(
  orderId: string,
  draft: MonumentDraft,
  price: PriceResult,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ size: "A4", margin: 48, info: { Title: `Angebot ${orderId}` } });
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("Angebot / Auftragsübersicht (Entwurf)", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#444").text(`Referenz: ${orderId}`, { continued: false });
    doc.text(`Datum: ${new Date().toLocaleDateString("de-DE")}`);
    doc.moveDown();
    doc.fillColor("#000").fontSize(11).text("Konfiguration", { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10);
    for (const line of draftSummaryLines(draft)) {
      doc.text(line, { paragraphGap: 2 });
    }
    doc.moveDown();

    doc.fontSize(11).text("Preis (indikativ)", { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10);
    if (price.canCalculate) {
      for (const row of price.lines) {
        doc.text(
          `${row.label} — ${formatEuroDe(row.lineTotalNet)}`,
        );
      }
      doc.moveDown(0.5);
      doc.fontSize(11).text(`Zwischensumme netto: ${formatEuroDe(price.subtotalNet)}`);
      doc.text(`USt: ${formatEuroDe(price.vatAmount)}`);
      doc.fontSize(12).text(`Gesamt brutto (indikativ): ${formatEuroDe(price.totalGross)}`, {
        continued: false,
      });
    } else {
      doc.fillColor("#a60").text(`Preis: ${price.reason}`);
    }
    doc.moveDown(1.5);
    doc.fillColor("#333").fontSize(9);
    doc.text(
      "Hinweis: Unverbindlicher Konfigurator-Entwurf. Rechtsverbindliche Angebote und Zahlungsbedingungen werden separat vereinbart. Anzahlung 50 % / Rest 50 % nur als branchenübliches Beispiel — bitte mit Ihrem Steinmetz abstimmen.",
      { align: "left", width: doc.page.width - 96 },
    );

    doc.end();
  });
}
