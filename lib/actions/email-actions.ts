"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import catalogSample from "@/config/catalog/sample.json";
import { parseMonumentDraft } from "@/lib/config/monument-schema";
import { buildCustomerDePdfBuffer } from "@/lib/pdf/customer-de";
import { buildSupplierEnPdfBuffer } from "@/lib/pdf/supplier-en";
import { sendOfferPdfEmails } from "@/lib/mail/send-offer-pdfs";
import { prisma } from "@/lib/prisma";
import { calculatePrice } from "@/lib/pricing/calculate";

const emailSchema = z.string().email();

export type SendEmailState = { ok?: boolean; error?: string; message?: string };

export async function sendOfferEmailAction(
  _prev: SendEmailState | null,
  formData: FormData,
): Promise<SendEmailState> {
  const orderId = formData.get("orderId")?.toString()?.trim();
  const emailRaw = formData.get("email")?.toString()?.trim();
  if (!orderId) {
    return { ok: false, error: "Interner Fehler: orderId fehlt." };
  }
  const emailParsed = emailSchema.safeParse(emailRaw);
  if (!emailParsed.success) {
    return { ok: false, error: "Bitte eine gültige E-Mail-Adresse eingeben." };
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return { ok: false, error: "Auftrag nicht gefunden." };
  }

  const draft = parseMonumentDraft(order.configuration ?? { schemaVersion: 1 });
  const price = calculatePrice(draft, catalogSample);

  const [customerPdf, supplierPdf] = await Promise.all([
    buildCustomerDePdfBuffer(orderId, draft, price),
    buildSupplierEnPdfBuffer(orderId, draft, price),
  ]);

  const send = await sendOfferPdfEmails({
    orderId,
    customerEmail: emailParsed.data,
    customerPdf,
    supplierPdf,
  });

  if (!send.ok) {
    return { ok: false, error: send.error };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { customerEmail: emailParsed.data },
  });

  revalidatePath(`/konfigurator/d/${orderId}`);
  return {
    ok: true,
    message: "E-Mail wurde versendet.",
  };
}
