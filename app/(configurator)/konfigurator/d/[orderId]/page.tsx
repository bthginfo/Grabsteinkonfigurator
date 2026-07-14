import { notFound } from "next/navigation";
import { WizardClient } from "@/components/wizard/WizardClient";
import { getActiveCatalog } from "@/lib/catalog";
import { parseMonumentDraft } from "@/lib/config/monument-schema";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function KonfiguratorDraftPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  const { orderId } = await params;
  const requestedStep = Number((await searchParams).step ?? 1);
  const initialStep = Number.isInteger(requestedStep)
    ? Math.min(5, Math.max(1, requestedStep))
    : 1;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });
  if (!order) {
    notFound();
  }
  const initialDraft = parseMonumentDraft(order.configuration ?? { schemaVersion: 1 });
  const catalog = await getActiveCatalog();
  return (
    <WizardClient
      orderId={order.id}
      initialDraft={initialDraft}
      initialStep={initialStep}
      initialStatus={order.status}
      initialCustomer={{
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
        postalCode: order.customerPostalCode,
        message: order.customerMessage,
      }}
      catalog={catalog}
    />
  );
}
