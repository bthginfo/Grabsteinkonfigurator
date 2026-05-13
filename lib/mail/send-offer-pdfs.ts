import { createSmtpTransport, readSmtpEnv } from "./smtp";

export type SendPdfMailResult =
  | { ok: true }
  | { ok: false; error: string };

export async function sendOfferPdfEmails(params: {
  orderId: string;
  customerEmail: string;
  customerPdf: Buffer;
  supplierPdf: Buffer;
}): Promise<SendPdfMailResult> {
  const transport = createSmtpTransport();
  const cfg = readSmtpEnv();
  if (!transport || !cfg) {
    return { ok: false, error: "SMTP nicht konfiguriert (SMTP_HOST und SMTP_FROM setzen)." };
  }

  const { orderId, customerEmail, customerPdf, supplierPdf } = params;

  await transport.sendMail({
    from: cfg.from,
    to: customerEmail,
    subject: `Angebot Grabstein Konfigurator (${orderId})`,
    text: "anbei Ihre PDF-Übersicht (Entwurf).",
    attachments: [
      {
        filename: `Angebot-${orderId}.pdf`,
        content: customerPdf,
        contentType: "application/pdf",
      },
    ],
  });

  if (cfg.supplierTo) {
    await transport.sendMail({
      from: cfg.from,
      to: cfg.supplierTo,
      subject: `Stone order sheet — ${orderId}`,
      text: "Please find the supplier order sheet attached.",
      attachments: [
        {
          filename: `Order-${orderId}-supplier.pdf`,
          content: supplierPdf,
          contentType: "application/pdf",
        },
      ],
    });
  }

  return { ok: true };
}
