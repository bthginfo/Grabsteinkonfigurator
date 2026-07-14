"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getActiveCatalog } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import {
  defaultMonumentDraft,
  isConfigurationComplete,
  monumentDraftSchema,
  parseMonumentDraft,
} from "@/lib/config/monument-schema";
import { calculatePrice } from "@/lib/pricing/calculate";

export type SubmitOrderState = {
  ok?: boolean;
  error?: string;
  message?: string;
};

const customerSchema = z.object({
  name: z.string().trim().min(2, "Bitte Namen eingeben.").max(120),
  email: z.string().trim().email("Bitte eine gültige E-Mail-Adresse eingeben."),
  phone: z.string().trim().max(60).optional(),
  postalCode: z.string().trim().min(3, "Bitte Postleitzahl eingeben.").max(20),
  message: z.string().trim().max(1200).optional(),
  consent: z.literal("on", {
    errorMap: () => ({ message: "Bitte der Kontaktaufnahme zustimmen." }),
  }),
});

export async function createDraftAndRedirect() {
  const draft = defaultMonumentDraft();
  const order = await prisma.order.create({
    data: {
      status: "draft",
      configuration: draft as Prisma.InputJsonValue,
    },
  });
  redirect(`/konfigurator/d/${order.id}`);
}

export async function saveDraftConfiguration(orderId: string, raw: unknown) {
  const base = parseMonumentDraft(raw);
  const merged = monumentDraftSchema.safeParse({ ...base, schemaVersion: 1 });
  if (!merged.success) {
    return { ok: false as const, error: "Ungültige Konfiguration." };
  }
  await prisma.order.update({
    where: { id: orderId },
    data: { configuration: merged.data as Prisma.InputJsonValue },
  });
  revalidatePath(`/konfigurator/d/${orderId}`);
  return { ok: true as const };
}

export async function submitOrderAction(
  _prev: SubmitOrderState | null,
  formData: FormData,
): Promise<SubmitOrderState> {
  const orderId = formData.get("orderId")?.toString();
  if (!orderId) return { ok: false, error: "Entwurfsreferenz fehlt." };

  const customer = customerSchema.safeParse({
    name: formData.get("name")?.toString(),
    email: formData.get("email")?.toString(),
    phone: formData.get("phone")?.toString() || undefined,
    postalCode: formData.get("postalCode")?.toString(),
    message: formData.get("message")?.toString() || undefined,
    consent: formData.get("consent")?.toString(),
  });
  if (!customer.success) {
    return { ok: false, error: customer.error.issues[0]?.message ?? "Kontaktdaten prüfen." };
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: "Entwurf nicht gefunden." };

  const draft = parseMonumentDraft(order.configuration ?? { schemaVersion: 1 });
  if (!isConfigurationComplete(draft)) {
    return { ok: false, error: "Die Konfiguration ist noch nicht vollständig." };
  }

  const catalog = await getActiveCatalog();
  const price = calculatePrice(draft, catalog);
  if (!price.canCalculate) return { ok: false, error: price.reason };

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "submitted",
      customerName: customer.data.name,
      customerEmail: customer.data.email,
      customerPhone: customer.data.phone,
      customerPostalCode: customer.data.postalCode,
      customerMessage: customer.data.message,
      submittedAt: new Date(),
      priceSnapshot: price as unknown as Prisma.InputJsonValue,
    },
  });

  revalidatePath(`/konfigurator/d/${orderId}`);
  revalidatePath("/admin");
  return {
    ok: true,
    message: "Ihre Anfrage wurde gespeichert. Wir melden uns mit einem verbindlichen Angebot.",
  };
}
