import PDFDocument from "pdfkit";
import type { MonumentDraft } from "@/lib/config/monument-schema";
import type { PriceResult } from "@/lib/pricing/calculate";
import {
  getMonumentComponents,
  SPEC_LABELS,
} from "@/lib/specification/monument-spec";
import { assessProductionReadiness } from "@/lib/specification/production-readiness";
import { formatEuroDe } from "./customer-de";

type OrderInfo = {
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
};

const PAGE_WIDTH = 595.28;
const CONTENT_WIDTH = PAGE_WIDTH - 80;

function valueOrDash(value?: string | number | null) {
  return value == null || value === "" ? "-" : String(value);
}

function section(doc: PDFKit.PDFDocument, title: string) {
  doc.moveDown(0.65);
  const y = doc.y;
  doc.rect(40, y, CONTENT_WIDTH, 18).fill("#e8eeeb");
  doc.fillColor("#174b3b").font("Helvetica-Bold").fontSize(9).text(title.toUpperCase(), 47, y + 5, { characterSpacing: 0.7 });
  doc.y = y + 23;
}

function row(doc: PDFKit.PDFDocument, label: string, value: string | number | undefined | null) {
  const y = doc.y;
  doc.fillColor("#666").font("Helvetica").fontSize(8).text(label, 45, y, { width: 155 });
  doc.fillColor("#111").font("Helvetica-Bold").fontSize(8.5).text(valueOrDash(value), 200, y, { width: 345 });
  doc.moveDown(0.7);
}

function dimensionLine(doc: PDFKit.PDFDocument, x1: number, y1: number, x2: number, y2: number, label: string) {
  doc.save().strokeColor("#65706b").lineWidth(0.6);
  doc.moveTo(x1, y1).lineTo(x2, y2).stroke();
  if (Math.abs(x2 - x1) > Math.abs(y2 - y1)) {
    doc.moveTo(x1, y1 - 4).lineTo(x1, y1 + 4).moveTo(x2, y2 - 4).lineTo(x2, y2 + 4).stroke();
    doc.fillColor("#333").font("Helvetica").fontSize(7).text(label, (x1 + x2) / 2 - 28, y1 + 5, { width: 56, align: "center" });
  } else {
    doc.moveTo(x1 - 4, y1).lineTo(x1 + 4, y1).moveTo(x2 - 4, y2).lineTo(x2 + 4, y2).stroke();
    doc.fillColor("#333").font("Helvetica").fontSize(7).text(label, x1 + 6, (y1 + y2) / 2 - 4, { width: 52 });
  }
  doc.restore();
}

function drawFrontShape(doc: PDFKit.PDFDocument, draft: MonumentDraft, x: number, bottom: number, width: number, height: number) {
  const top = bottom - height;
  doc.save().lineWidth(1.2).strokeColor("#202522").fillColor("#e1e4e2");
  if (draft.form === "herz") {
    doc.moveTo(x + width / 2, bottom)
      .bezierCurveTo(x + width * 0.38, bottom - height * 0.2, x, bottom - height * 0.46, x, top + height * 0.25)
      .bezierCurveTo(x, top, x + width * 0.33, top - height * 0.02, x + width / 2, top + height * 0.2)
      .bezierCurveTo(x + width * 0.67, top - height * 0.02, x + width, top, x + width, top + height * 0.25)
      .bezierCurveTo(x + width, bottom - height * 0.46, x + width * 0.62, bottom - height * 0.2, x + width / 2, bottom)
      .fillAndStroke();
  } else if (draft.form === "kreuz") {
    const bar = width * 0.32;
    const armY = top + height * 0.31;
    const armH = height * 0.2;
    doc.polygon(
      [x + (width - bar) / 2, bottom], [x + (width + bar) / 2, bottom],
      [x + (width + bar) / 2, armY + armH], [x + width, armY + armH],
      [x + width, armY], [x + (width + bar) / 2, armY],
      [x + (width + bar) / 2, top], [x + (width - bar) / 2, top],
      [x + (width - bar) / 2, armY], [x, armY], [x, armY + armH],
      [x + (width - bar) / 2, armY + armH],
    ).fillAndStroke();
  } else if (draft.form === "buch") {
    doc.polygon([x, bottom], [x, top + height * 0.08], [x + width / 2, top], [x + width, top + height * 0.08], [x + width, bottom], [x + width / 2, bottom - height * 0.06]).fillAndStroke();
    doc.moveTo(x + width / 2, top).lineTo(x + width / 2, bottom - height * 0.06).stroke();
  } else if (draft.form === "felsen") {
    doc.polygon([x, bottom], [x + width * 0.05, top + height * 0.28], [x + width * 0.22, top + height * 0.06], [x + width * 0.58, top], [x + width * 0.9, top + height * 0.2], [x + width, bottom]).fillAndStroke();
  } else if (draft.form === "liegestein" || draft.form === "kissenstein") {
    doc.rect(x, top, width, height).fillAndStroke();
  } else {
    doc.moveTo(x, bottom).lineTo(x, top + height * 0.18)
      .bezierCurveTo(x + width * 0.18, top, x + width * 0.36, top, x + width / 2, top + height * 0.04)
      .bezierCurveTo(x + width * 0.68, top, x + width * 0.9, top + height * 0.04, x + width, top + height * 0.18)
      .lineTo(x + width, bottom).closePath().fillAndStroke();
  }
  doc.restore();
}

function drawTechnicalPage(doc: PDFKit.PDFDocument, draft: MonumentDraft) {
  const readiness = assessProductionReadiness(draft);
  doc.addPage();
  doc.fillColor("#174b3b").font("Helvetica-Bold").fontSize(16).text("DIMENSIONAL INTENT DRAWING", 40, 40);
  doc.fillColor("#555").font("Helvetica").fontSize(8).text("Not a structural or anchoring calculation. All dimensions in centimetres. Do not scale from PDF.", 40, 62);
  const h = draft.heightCm ?? 1;
  const w = draft.widthCm ?? 1;
  const d = draft.depthCm ?? 1;
  const scale = Math.min(240 / w, 205 / h, 3.2);
  const frontW = w * scale;
  const frontH = h * scale;
  const frontX = 55 + (270 - frontW) / 2;
  const bottom = 330;
  doc.fillColor("#333").font("Helvetica-Bold").fontSize(9).text("FRONT ELEVATION", 55, 92, { width: 270, align: "center" });
  drawFrontShape(doc, draft, frontX, bottom, frontW, frontH);
  dimensionLine(doc, frontX, bottom + 13, frontX + frontW, bottom + 13, `${w} cm`);
  dimensionLine(doc, frontX - 13, bottom, frontX - 13, bottom - frontH, `${h} cm`);

  const sideX = 390;
  const sideW = Math.max(8, d * scale);
  doc.fillColor("#333").font("Helvetica-Bold").fontSize(9).text("SIDE ELEVATION", 350, 92, { width: 180, align: "center" });
  doc.save().fillColor("#e1e4e2").strokeColor("#202522").lineWidth(1.2);
  if (draft.form === "kissenstein" || draft.form === "liegestein" || draft.form === "buch") {
    doc.polygon([sideX, bottom], [sideX, bottom - frontH * 0.45], [sideX + sideW, bottom - frontH], [sideX + sideW, bottom]).fillAndStroke();
  } else {
    doc.rect(sideX, bottom - frontH, sideW, frontH).fillAndStroke();
  }
  doc.restore();
  dimensionLine(doc, sideX, bottom + 13, sideX + sideW, bottom + 13, `${d} cm`);
  dimensionLine(doc, sideX - 13, bottom, sideX - 13, bottom - frontH, `${h} cm`);

  doc.y = 385;
  section(doc, "Component schedule");
  const components = getMonumentComponents(draft);
  for (const [index, component] of components.entries()) {
    doc.fillColor("#111").font("Helvetica-Bold").fontSize(8.5).text(`${index + 1}. ${component.item} | qty ${component.quantity}`, 45, doc.y);
    doc.fillColor("#444").font("Helvetica").fontSize(8).text(`H ${component.heightCm} x W ${component.widthCm} x D ${component.depthCm} cm | ${component.note}`, 60, doc.y + 11, { width: 475 });
    doc.moveDown(1.65);
  }
  section(doc, "Configuration checks");
  const visibleIssues = readiness.issues.slice(0, 6);
  if (!visibleIssues.length) {
    doc.fillColor("#285b48").font("Helvetica").fontSize(8.5).text("No dimensional, material or inscription contradictions detected by the configurator checks.", 50, doc.y, { width: 480 });
    doc.moveDown(0.55);
  } else {
    for (const item of visibleIssues) {
      const prefix = item.severity === "blocker" ? "BLOCKER" : item.severity === "warning" ? "CHECK" : "NOTE";
      doc.fillColor(item.severity === "blocker" ? "#7a2e21" : "#574d32").font("Helvetica").fontSize(8).text(`${prefix}: ${item.pdfMessage}`, 50, doc.y, { width: 480 });
      doc.moveDown(0.5);
    }
    if (readiness.issues.length > visibleIssues.length) {
      doc.fillColor("#555").font("Helvetica-Oblique").fontSize(7.5).text(`Plus ${readiness.issues.length - visibleIssues.length} additional configurator check(s) in the digital order record.`, 50, doc.y, { width: 480 });
      doc.moveDown(0.5);
    }
  }
  section(doc, "Mandatory production release controls");
  for (const requirement of readiness.releaseRequirements) {
    doc.fillColor("#7a2e21").font("Helvetica").fontSize(8).text(`- ${requirement.pdfMessage}`, 50, doc.y, { width: 480 });
    doc.moveDown(0.5);
  }
  doc.moveDown(0.5);
  doc.rect(40, doc.y, CONTENT_WIDTH, 42).strokeColor("#9da5a1").stroke();
  doc.fillColor("#333").font("Helvetica").fontSize(8).text("Supplier / mason approval, date and signature", 48, doc.y + 8);
}

/** RFQ and fabrication intent sheet for a stone supplier or executing mason. */
export function buildSupplierEnPdfBuffer(
  orderId: string,
  draft: MonumentDraft,
  price: PriceResult,
  orderInfo: OrderInfo = {},
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const readiness = assessProductionReadiness(draft);
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ size: "A4", margin: 40, info: { Title: `Fabrication specification ${orderId}` } });
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fillColor("#174b3b").font("Helvetica-Bold").fontSize(18).text("MONUMENT FABRICATION SPEC / RFQ");
    doc.fillColor("#555").font("Helvetica").fontSize(8.5).text(`Reference ${orderId} | Revision 01 | ${new Date().toISOString().slice(0, 10)}`);
    doc.moveDown(0.6);
    const bannerY = doc.y;
    doc.rect(40, bannerY, CONTENT_WIDTH, 30).fill("#f2e8dc");
    const statusText = readiness.status === "quote_ready"
      ? "STATUS: COMPLETE FOR QUOTATION / TECHNICAL REVIEW"
      : readiness.status === "review_required"
        ? "STATUS: CONFIGURATION CHECKS OPEN"
        : "STATUS: INCOMPLETE CONFIGURATION";
    doc.fillColor("#7a3d16").font("Helvetica-Bold").fontSize(9).text(statusText, 48, bannerY + 6);
    doc.font("Helvetica").fontSize(7.5).text("Do not manufacture before approved stone sample, cemetery approval and signed dimensional / inscription drawing.", 48, bannerY + 17);
    doc.y = bannerY + 34;

    section(doc, "Job and site");
    row(doc, "Customer / applicant", orderInfo.customerName);
    row(doc, "Contact", [orderInfo.customerEmail, orderInfo.customerPhone].filter(Boolean).join(" | "));
    row(doc, "Cemetery", [draft.cemeteryName, draft.cemeteryCity].filter(Boolean).join(", "));
    row(doc, "Grave location", [draft.graveField, draft.graveNumber].filter(Boolean).join(" / "));
    row(doc, "Use / grave type", draft.grabtyp ? SPEC_LABELS.graveTypes[draft.grabtyp] : undefined);
    row(doc, "Configuration completeness", `${readiness.score}% | ${readiness.issues.length} check(s) open`);

    section(doc, "Stone and workmanship");
    row(doc, "Monument form", draft.form ? SPEC_LABELS.forms[draft.form] : undefined);
    row(doc, "Stone family", draft.material ? SPEC_LABELS.materials[draft.material] : undefined);
    row(doc, "Commercial stone name", draft.stoneTradeName || "TBC - supplier sample approval required");
    row(doc, "Finished overall H x W x D", draft.heightCm && draft.widthCm && draft.depthCm ? `${draft.heightCm} x ${draft.widthCm} x ${draft.depthCm} cm` : undefined);
    row(doc, "Visible surface finish", draft.surface ? SPEC_LABELS.surfaces[draft.surface] : undefined);
    row(doc, "Face schedule", draft.surface === "kombination" ? "Inscription face polished; remaining exposed faces brushed / matt" : "Same selected finish to all exposed faces; rear included");
    row(doc, "Edge profile", draft.edgeProfile ? SPEC_LABELS.edges[draft.edgeProfile] : "3 mm chamfer");
    row(doc, "Parts", getMonumentComponents(draft).length);

    section(doc, "Inscription and artwork");
    row(doc, "Exact line 1", draft.inscription?.name);
    row(doc, "Exact line 2 / dates", draft.inscription?.dates);
    row(doc, "Exact line 3 / epitaph", draft.inscription?.epitaph);
    row(doc, "Typeface", draft.inscription?.font ? SPEC_LABELS.fonts[draft.inscription.font] : undefined);
    row(doc, "Alignment", draft.inscription?.alignment ? SPEC_LABELS.alignments[draft.inscription.alignment] : undefined);
    row(doc, "Capital letter height", draft.letterHeightMm ? `${draft.letterHeightMm} mm` : undefined);
    row(doc, "Lettering method", draft.engravingFinish ? SPEC_LABELS.engraving[draft.engravingFinish] : undefined);
    row(doc, "Nominal engraving depth", draft.engravingFinish === "bronzebuchstaben" ? "n/a - applied letters" : `${draft.engravingDepthMm ?? 3} mm`);
    row(doc, "Letter colour / finish", draft.inscriptionColor ? SPEC_LABELS.inscriptionColors[draft.inscriptionColor] : "Automatic contrasting fill");
    row(doc, "Ornaments", draft.ornaments?.join(", ") || "None");

    section(doc, "Accessories, installation and commercial");
    row(doc, "Bronze accessories", draft.bronze);
    row(doc, "Grave enclosure", draft.enclosure);
    row(doc, "Installation requested", draft.montage !== false ? "Yes" : "No");
    row(doc, "Foundation / anchoring", "By executing mason to local rules and applicable TA Grabmal requirements");
    row(doc, "Indicative net total", price.canCalculate ? formatEuroDe(price.subtotalNet) : price.reason);

    drawTechnicalPage(doc, draft);
    doc.end();
  });
}
