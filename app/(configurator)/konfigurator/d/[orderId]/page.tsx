import { notFound } from "next/navigation";
import { WizardClient } from "@/components/wizard/WizardClient";
import { parseMonumentDraft } from "@/lib/config/monument-schema";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function KonfiguratorDraftPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });
  if (!order) {
    notFound();
  }
  const initialDraft = parseMonumentDraft(order.configuration ?? { schemaVersion: 1 });
  return (
    <WizardClient
      orderId={order.id}
      initialDraft={initialDraft}
      initialCustomerEmail={order.customerEmail}
    />
  );
}
