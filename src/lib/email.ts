const APP_URL = process.env.APP_URL || "http://localhost:3000";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL;
const RESEND_API_URL = "https://api.resend.com/emails";

export interface PasswordResetEmailInput {
  to: string;
  name: string;
  /** Path only, e.g. "/reset-password/<token>" — combined with APP_URL to build the full link. */
  resetPath: string;
}

/**
 * Sends a password-reset email via Resend if RESEND_API_KEY and RESEND_FROM_EMAIL are
 * configured. If they aren't (e.g. local development), this quietly does nothing — callers
 * should still show the reset link on screen as a fallback for that case.
 *
 * Uses Resend's REST API directly rather than their SDK — it's one POST request, and this
 * avoids an extra dependency for a single call site.
 */
export async function sendPasswordResetEmail({
  to,
  name,
  resetPath,
}: PasswordResetEmailInput): Promise<{ sent: boolean }> {
  const token = process.env.RESEND_API_KEY;
  if (!token || !FROM_EMAIL) return { sent: false };

  const link = `${APP_URL}${resetPath}`;

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        from: `AMS <${FROM_EMAIL}>`,
        to: [to],
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
      }),
    });

    const body = await res.json().catch(() => null);
    // Resend returns { id } on success. Failures come back as a non-2xx status with
    // { name, message } (e.g. domain not verified, invalid from address).
    if (!res.ok || !body?.id) {
      console.error(`Resend rejected the password reset email (${res.status}):`, body);
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error("Failed to send password reset email via Resend:", err);
    return { sent: false };
  }
}
