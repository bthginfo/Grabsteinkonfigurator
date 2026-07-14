import { Prisma } from "@prisma/client";
import catalogSample from "@/config/catalog/sample.json";
import {
  parsePriceCatalog,
  priceCatalogSchema,
  type PriceCatalog,
} from "@/lib/pricing/calculate";
import { prisma } from "@/lib/prisma";

export const ACTIVE_CATALOG_ID = "active";

export async function getActiveCatalog(): Promise<PriceCatalog> {
  const stored = await prisma.catalog.findUnique({
    where: { id: ACTIVE_CATALOG_ID },
  });
  const parsed = parsePriceCatalog(stored?.data ?? catalogSample);
  if (!parsed) {
    throw new Error("Aktiver Katalog ist ungültig.");
  }
  return {
    ...parsed,
    fallbackPricing: {
      ...parsed.fallbackPricing,
      formAddons: {
        ...catalogSample.fallbackPricing.formAddons,
        ...parsed.fallbackPricing.formAddons,
      },
    },
  };
}

export async function upsertActiveCatalog(raw: unknown) {
  const parsed = priceCatalogSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "catalog"}: ${issue.message}`)
        .join("; "),
    };
  }

  await prisma.catalog.upsert({
    where: { id: ACTIVE_CATALOG_ID },
    create: {
      id: ACTIVE_CATALOG_ID,
      data: parsed.data as Prisma.InputJsonValue,
    },
    update: {
      data: parsed.data as Prisma.InputJsonValue,
    },
  });

  return { ok: true as const };
}
