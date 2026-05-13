import nodemailer from "nodemailer";

export type SmtpEnv = {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
  supplierTo?: string;
};

export function readSmtpEnv(): SmtpEnv | null {
  const host = process.env.SMTP_HOST?.trim();
  const from = process.env.SMTP_FROM?.trim();
  if (!host || !from) return null;
  const port = Number(process.env.SMTP_PORT ?? "587") || 587;
  const secure =
    process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "1";
  return {
    host,
    port,
    secure,
    user: process.env.SMTP_USER?.trim() || undefined,
    pass: process.env.SMTP_PASS?.trim() || undefined,
    from,
    supplierTo: process.env.SMTP_SUPPLIER_TO?.trim() || undefined,
  };
}

export function createSmtpTransport() {
  const cfg = readSmtpEnv();
  if (!cfg) return null;
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth:
      cfg.user && cfg.pass
        ? { user: cfg.user, pass: cfg.pass }
        : undefined,
  });
}
