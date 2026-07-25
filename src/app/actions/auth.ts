"use server";

import { redirect } from "next/navigation";
import {
  hashPassword,
  verifyPassword,
  isAllowedOrgEmail,
  generateResetToken,
} from "@/lib/auth";
import { setSessionCookie, clearSessionCookie } from "@/lib/session";
import { sendPasswordResetEmail } from "@/lib/email";
import {
  createUser,
  getUserByEmail,
  setResetToken,
  getUserByResetToken,
  updatePasswordAndClearToken,
} from "@/lib/models";
import { isFeatureEnabled } from "@/lib/features";

const RESET_TOKEN_TTL_MS = 1000 * 60 * 60; // 1 hour

export async function signupAction(formData: FormData): Promise<void> {
  if (!(await isFeatureEnabled("public_signup"))) {
    redirect("/signin");
  }

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const department = String(formData.get("department") || "").trim();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!name || !email || !password) {
    redirect(`/signup?error=${encodeURIComponent("All required fields must be filled in.")}`);
  }
  if (password !== confirmPassword) {
    redirect(`/signup?error=${encodeURIComponent("Passwords do not match.")}`);
  }
  if (password.length < 8) {
    redirect(`/signup?error=${encodeURIComponent("Password must be at least 8 characters.")}`);
  }
  if (!isAllowedOrgEmail(email)) {
    redirect(
      `/signup?error=${encodeURIComponent(
        "Please sign up using your registered organisational email address."
      )}`
    );
  }
  if (await getUserByEmail(email)) {
    redirect(`/signup?error=${encodeURIComponent("An account with this email already exists.")}`);
  }

  const user = await createUser({
    name,
    email,
    passwordHash: hashPassword(password),
    role: "STAFF",
    department: department || null,
  });

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  redirect("/dashboard");
}

export async function signinAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const user = await getUserByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    redirect(`/signin?error=${encodeURIComponent("Invalid email or password.")}`);
  }

  await setSessionCookie({
    userId: user!.id,
    email: user!.email,
    name: user!.name,
    role: user!.role,
  });

  redirect("/dashboard");
}

export async function signoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/signin");
}

export async function forgotPasswordAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const user = await getUserByEmail(email);

  if (!user) {
    // Do not reveal whether the account exists.
    redirect(
      `/forgot-password?sent=1`
    );
  }

  const token = generateResetToken();
  await setResetToken(user!.id, token, Date.now() + RESET_TOKEN_TTL_MS);
  const resetPath = `/reset-password/${token}`;

  const { sent } = await sendPasswordResetEmail({ to: user!.email, name: user!.name, resetPath });

  // If no email service is configured (no POSTMARK_API_TOKEN set), fall back to
  // showing the link directly so local development still works end to end.
  if (sent) {
    redirect(`/forgot-password?sent=1`);
  }
  redirect(`/forgot-password?sent=1&devLink=${encodeURIComponent(resetPath)}`);
}

export async function resetPasswordAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!token) {
    redirect(`/forgot-password?error=${encodeURIComponent("Reset link is invalid.")}`);
  }
  if (password !== confirmPassword) {
    redirect(
      `/reset-password/${token}?error=${encodeURIComponent("Passwords do not match.")}`
    );
  }
  if (password.length < 8) {
    redirect(
      `/reset-password/${token}?error=${encodeURIComponent(
        "Password must be at least 8 characters."
      )}`
    );
  }

  const user = await getUserByResetToken(token);
  if (!user || !user.reset_token_expires || user.reset_token_expires < Date.now()) {
    redirect(
      `/forgot-password?error=${encodeURIComponent(
        "This reset link is invalid or has expired. Please request a new one."
      )}`
    );
  }

  await updatePasswordAndClearToken(user!.id, hashPassword(password));
  redirect(`/signin?reset=1`);
}
