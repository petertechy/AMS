import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SESSION_SECRET = process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type Role = "ADMIN" | "STAFF";

export interface SessionPayload {
  userId: number;
  email: string;
  name: string;
  role: Role;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, SESSION_SECRET, { expiresIn: SESSION_MAX_AGE_SECONDS });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, SESSION_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = "ams_session";
export { SESSION_MAX_AGE_SECONDS };

/** Allowed organisational email domains. Comma-separated in ORG_EMAIL_DOMAINS env var.
 *  If unset, any email domain is accepted (useful for local trials). */
export function isAllowedOrgEmail(email: string): boolean {
  const raw = process.env.ORG_EMAIL_DOMAINS?.trim();
  if (!raw) return true;
  const domains = raw.split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);
  const emailDomain = email.split("@")[1]?.toLowerCase();
  if (!emailDomain) return false;
  return domains.includes(emailDomain);
}

export function generateResetToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
