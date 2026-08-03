const APP_URL = process.env.APP_URL || "http://localhost:3000";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL;
const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * Sends an email via Resend if RESEND_API_KEY and RESEND_FROM_EMAIL are configured. If they
 * aren't (e.g. local development), this quietly does nothing — callers should degrade gracefully
 * (e.g. the password-reset flow falls back to showing the link on screen).
 *
 * Uses Resend's REST API directly rather than their SDK — it's one POST request, and this avoids
 * an extra dependency for a handful of call sites.
 */
async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean }> {
  const token = process.env.RESEND_API_KEY;
  if (!token || !FROM_EMAIL) return { sent: false };

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
        subject,
        html,
      }),
    });

    const body = await res.json().catch(() => null);
    // Resend returns { id } on success. Failures come back as a non-2xx status with
    // { name, message } (e.g. domain not verified, invalid from address).
    if (!res.ok || !body?.id) {
      console.error(`Resend rejected email "${subject}" to ${to} (${res.status}):`, body);
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error(`Failed to send email "${subject}" to ${to} via Resend:`, err);
    return { sent: false };
  }
}

function emailShell(heading: string, bodyHtml: string): string {
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#0f172a;">${heading}</h2>
      ${bodyHtml}
    </div>
  `;
}

function linkButton(href: string, label: string): string {
  return `
    <p style="margin: 24px 0;">
      <a href="${href}" style="background:#0f172a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
        ${label}
      </a>
    </p>
  `;
}

export interface PasswordResetEmailInput {
  to: string;
  name: string;
  /** Path only, e.g. "/reset-password/<token>" — combined with APP_URL to build the full link. */
  resetPath: string;
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetPath,
}: PasswordResetEmailInput): Promise<{ sent: boolean }> {
  return sendEmail({
    to,
    subject: "Reset your AMS password",
    html: emailShell(
      "Reset your password",
      `
        <p style="color:#334155;">Hi ${name},</p>
        <p style="color:#334155;">
          We received a request to set a password for your Asset Management System account.
          This link expires in 1 hour.
        </p>
        ${linkButton(`${APP_URL}${resetPath}`, "Set your password")}
        <p style="color:#94a3b8; font-size: 13px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      `
    ),
  });
}

export interface MaintenanceSubmittedEmailInput {
  to: string;
  name: string;
  reporterName: string;
  assetName: string;
  title: string;
  requestId: number;
}

/** Notifies an admin that a new maintenance request needs triage. */
export async function sendMaintenanceSubmittedEmail({
  to,
  name,
  reporterName,
  assetName,
  title,
  requestId,
}: MaintenanceSubmittedEmailInput): Promise<{ sent: boolean }> {
  return sendEmail({
    to,
    subject: `New maintenance request: ${title}`,
    html: emailShell(
      "New maintenance request submitted",
      `
        <p style="color:#334155;">Hi ${name},</p>
        <p style="color:#334155;">
          ${reporterName} submitted a new maintenance request for <strong>${assetName}</strong>:
        </p>
        <p style="color:#0f172a; font-weight: 600;">${title}</p>
        ${linkButton(`${APP_URL}/admin/maintenance/${requestId}`, "View request")}
      `
    ),
  });
}

export interface MaintenanceAssignedEmailInput {
  to: string;
  name: string;
  title: string;
  requestId: number;
}

/** Notifies a handler they've been assigned to a maintenance request. */
export async function sendMaintenanceAssignedEmail({
  to,
  name,
  title,
  requestId,
}: MaintenanceAssignedEmailInput): Promise<{ sent: boolean }> {
  return sendEmail({
    to,
    subject: `You were assigned: ${title}`,
    html: emailShell(
      "You've been assigned a maintenance request",
      `
        <p style="color:#334155;">Hi ${name},</p>
        <p style="color:#334155;">You've been assigned to handle:</p>
        <p style="color:#0f172a; font-weight: 600;">${title}</p>
        ${linkButton(`${APP_URL}/maintenance/${requestId}`, "View request")}
      `
    ),
  });
}

export type MaintenanceStatusForEmail = "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "CANCELLED";

const STATUS_EMAIL_TEXT: Record<MaintenanceStatusForEmail, string> = {
  IN_PROGRESS: "is now in progress",
  RESOLVED: "has been resolved",
  CLOSED: "has been closed",
  CANCELLED: "has been cancelled",
};

export interface MaintenanceStatusEmailInput {
  to: string;
  name: string;
  title: string;
  requestId: number;
  status: MaintenanceStatusForEmail;
}

/** Notifies the reporter that their maintenance request's status changed. */
export async function sendMaintenanceStatusEmail({
  to,
  name,
  title,
  requestId,
  status,
}: MaintenanceStatusEmailInput): Promise<{ sent: boolean }> {
  return sendEmail({
    to,
    subject: `Maintenance request update: ${title}`,
    html: emailShell(
      "Maintenance request update",
      `
        <p style="color:#334155;">Hi ${name},</p>
        <p style="color:#334155;">
          Your maintenance request <strong>${title}</strong> ${STATUS_EMAIL_TEXT[status]}.
        </p>
        ${linkButton(`${APP_URL}/maintenance/${requestId}`, "View request")}
      `
    ),
  });
}
