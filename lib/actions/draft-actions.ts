"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  defaultMonumentDraft,
  monumentDraftSchema,
  parseMonumentDraft,
} from "@/lib/config/monument-schema";

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
