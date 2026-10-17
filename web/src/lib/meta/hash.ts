import { createHash } from "crypto";

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Meta: trim, lowercase email before hash. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Meta: digits only; keep leading country code if present. */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function hashEmail(email: string): string | null {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes("@")) return null;
  return sha256Hex(normalized);
}

export function hashPhone(phone: string): string | null {
  const normalized = normalizePhone(phone);
  // Meta expects E.164-ish digits; skip very short values.
  if (normalized.length < 8) return null;
  return sha256Hex(normalized);
}
