import { z } from "zod";

export const orderStatusSchema = z.enum([
  "draft",
  "submitted",
  "deposit_pending",
  "paid_deposit",
  "in_production",
  "completed",
  "cancelled",
]);

export const orderStatusOptions = orderStatusSchema.options;

export function labelForOrderStatus(status: string) {
  const labels: Record<string, string> = {
    draft: "Entwurf",
    submitted: "Eingereicht",
    deposit_pending: "Anzahlung offen",
    paid_deposit: "Anzahlung bezahlt",
    in_production: "In Produktion",
    completed: "Abgeschlossen",
    cancelled: "Storniert",
  };
  return labels[status] ?? status;
}
