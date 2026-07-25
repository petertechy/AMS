const APP_URL = process.env.APP_URL || "http://localhost:3000";
const FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL;
const POSTMARK_API_URL = "https://api.postmarkapp.com/email";

export interface PasswordResetEmailInput {
  to: string;
  name: string;
  /** Path only, e.g. "/reset-password/<token>" — combined with APP_URL to build the full link. */
  resetPath: string;
}

/**
 * Sends a password-reset email via Postmark if POSTMARK_API_TOKEN and POSTMARK_FROM_EMAIL are
 * configured. If they aren't (e.g. local development), this quietly does nothing — callers
 * should still show the reset link on screen as a fallback for that case.
 *
 * Uses Postmark's REST API directly rather than their SDK — it's one POST request, and this
 * avoids an extra dependency for a single call site.
 */
export async function sendPasswordResetEmail({
  to,
  name,
  resetPath,
}: PasswordResetEmailInput): Promise<{ sent: boolean }> {
  const token = process.env.POSTMARK_API_TOKEN;
  if (!token || !FROM_EMAIL) return { sent: false };

  const link = `${APP_URL}${resetPath}`;

  try {
    const res = await fetch(POSTMARK_API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": token,
      },
      body: JSON.stringify({
        From: `AMS <${FROM_EMAIL}>`,
        To: to,
        Subject: "Reset your AMS password",
        MessageStream: "outbound",
        HtmlBody: `
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
    // Postmark returns an ErrorCode of 0 on success even though the HTTP status is 200;
    // non-zero (with a non-2xx status for most failure types) means it wasn't accepted.
    if (!res.ok || !body || body.ErrorCode !== 0) {
      console.error(`Postmark rejected the password reset email (${res.status}):`, body);
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error("Failed to send password reset email via Postmark:", err);
    return { sent: false };
  }
}
