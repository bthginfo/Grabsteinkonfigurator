import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "grabstein_admin_session";
const ADMIN_SESSION_SECONDS = 60 * 60 * 24 * 7;

function adminSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function sign(value: string) {
  return createHmac("sha256", adminSecret()).update(value).digest("hex");
}

function constantTimeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function isAdminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export async function setAdminSessionCookie() {
  const issuedAt = Date.now().toString();
  const signature = sign(issuedAt);
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE, `${issuedAt}.${signature}`, {
    httpOnly: true,
    maxAge: ADMIN_SESSION_SECONDS,
    path: "/admin",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/admin",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function isAdminAuthenticated() {
  if (!isAdminConfigured()) return false;

  const cookieStore = await cookies();
  const raw = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!raw) return false;

  const [issuedAt, signature] = raw.split(".");
  if (!issuedAt || !signature) return false;

  const ageMs = Date.now() - Number(issuedAt);
  if (!Number.isFinite(ageMs) || ageMs < 0) return false;
  if (ageMs > ADMIN_SESSION_SECONDS * 1000) return false;

  return constantTimeEqual(signature, sign(issuedAt));
}

export function isValidAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return password === expected;
}
