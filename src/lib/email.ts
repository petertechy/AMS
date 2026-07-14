import { Resend } from "resend";

const APP_URL = process.env.APP_URL || "http://localhost:3000";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "AMS <onboarding@resend.dev>";

let resendClient: Resend | null = null;
function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

export interface PasswordResetEmailInput {
  to: string;
  name: string;
  /** Path only, e.g. "/reset-password/<token>" — combined with APP_URL to build the full link. */
  resetPath: string;
}

/**
 * Sends a password-reset email via Resend if RESEND_API_KEY is configured.
 * If it isn't configured (e.g. local development), this quietly does nothing —
 * callers should still show the reset link on screen as a fallback for that case.
 */
export async function sendPasswordResetEmail({
  to,
  name,
  resetPath,
}: PasswordResetEmailInput): Promise<{ sent: boolean }> {
  const client = getClient();
  if (!client) return { sent: false };

  const link = `${APP_URL}${resetPath}`;

  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Reset your AMS password",
      html: `
        <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color:#0f172a;">Reset your password</h2>
          <p style="color:#334155;">Hi ${name},</p>
          <p style="color:#334155;">
            We received a request to set a password for your Asset Management System account.
            This link expires in 1 hour.
          </p>
          <p style="margin: 24px 0;">
            <a href="${link}" style="background:#0f172a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
              Set your password
            </a>
          </p>
          <p style="color:#94a3b8; font-size: 13px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });
    return { sent: true };
  } catch (err) {
    console.error("Failed to send password reset email via Resend:", err);
    return { sent: false };
  }
}
