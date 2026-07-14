"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { upsertActiveCatalog } from "@/lib/catalog";
import {
  clearAdminSessionCookie,
  isAdminAuthenticated,
  isAdminConfigured,
  isValidAdminPassword,
  setAdminSessionCookie,
} from "@/lib/admin-auth";
import { orderStatusSchema } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";

export type AdminLoginState = { error?: string };
export type CatalogImportState = { ok?: boolean; error?: string; message?: string };

export async function loginAdminAction(
  _prev: AdminLoginState | null,
  formData: FormData,
): Promise<AdminLoginState> {
  if (!isAdminConfigured()) {
    return { error: "ADMIN_PASSWORD ist nicht gesetzt." };
  }

  const password = formData.get("password")?.toString() ?? "";
  if (!isValidAdminPassword(password)) {
    return { error: "Passwort ist falsch." };
  }

  await setAdminSessionCookie();
  redirect("/admin");
}

export async function logoutAdminAction() {
  await clearAdminSessionCookie();
  redirect("/admin/login");
}

export async function updateOrderStatusAction(formData: FormData) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const orderId = formData.get("orderId")?.toString();
  const status = orderStatusSchema.safeParse(formData.get("status")?.toString());
  if (!orderId || !status.success) {
    return;
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: status.data },
  });
  revalidatePath("/admin");
}

export async function importCatalogAction(
  _prev: CatalogImportState | null,
  formData: FormData,
): Promise<CatalogImportState> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const raw = formData.get("catalogJson")?.toString() ?? "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "JSON konnte nicht gelesen werden." };
  }

  const result = await upsertActiveCatalog(parsed);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/admin/catalog");
  revalidatePath("/konfigurator");
  return { ok: true, message: "Katalog wurde gespeichert." };
}
