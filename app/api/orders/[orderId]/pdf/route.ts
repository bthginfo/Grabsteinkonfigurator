import { NextRequest, NextResponse } from "next/server";
import { getActiveCatalog } from "@/lib/catalog";
import { parseMonumentDraft } from "@/lib/config/monument-schema";
import { buildCustomerDePdfBuffer } from "@/lib/pdf/customer-de";
import { buildSupplierEnPdfBuffer } from "@/lib/pdf/supplier-en";
import { prisma } from "@/lib/prisma";
import { calculatePrice } from "@/lib/pricing/calculate";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await ctx.params;
  const variant = req.nextUrl.searchParams.get("variant") ?? "customer-de";
  const inline = req.nextUrl.searchParams.get("preview") === "1";

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return new NextResponse("Not found", { status: 404 });
  }

  const draft = parseMonumentDraft(order.configuration ?? { schemaVersion: 1 });
  const catalog = await getActiveCatalog();
  const price = calculatePrice(draft, catalog);

  const buf =
    variant === "supplier-en"
      ? await buildSupplierEnPdfBuffer(orderId, draft, price, {
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
        })
      : await buildCustomerDePdfBuffer(orderId, draft, price);

  const filename =
    variant === "supplier-en"
      ? `Order-${orderId}-supplier.pdf`
      : `Angebot-${orderId}.pdf`;

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"`,
    },
  });
}
