"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  hashPassword,
  isAllowedOrgEmail,
  generateResetToken,
} from "@/lib/auth";
import {
  createUser,
  getUserByEmail,
  getUserById,
  setResetToken,
  updateUserRoleAndDepartment,
  logActivity,
  type Role,
} from "@/lib/models";
import { sendPasswordResetEmail } from "@/lib/email";

const RESET_TOKEN_TTL_MS = 1000 * 60 * 60; // 1 hour

async function issueResetLink(userId: number, name: string, email: string): Promise<string> {
  const token = generateResetToken();
  await setResetToken(userId, token, Date.now() + RESET_TOKEN_TTL_MS);
  const path = `/reset-password/${token}`;
  await sendPasswordResetEmail({ to: email, name, resetPath: path });
  return path;
}

export async function createUserAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const department = String(formData.get("department") || "").trim() || null;
  const role = String(formData.get("role") || "STAFF") as Role;

  if (!name || !email) {
    redirect(`/admin/accounts?error=${encodeURIComponent("Name and email are required.")}`);
  }
  if (!isAllowedOrgEmail(email)) {
    redirect(
      `/admin/accounts?error=${encodeURIComponent(
        "That email is outside your organisation's allowed domain(s)."
      )}`
    );
  }
  if (await getUserByEmail(email)) {
    redirect(`/admin/accounts?error=${encodeURIComponent("An account with this email already exists.")}`);
  }

  // The account is created with an unusable random password; the new user sets
  // their own password via the reset link we send/generate below.
  const randomPassword = generateResetToken();
  const user = await createUser({
    name,
    email,
    passwordHash: hashPassword(randomPassword),
    role: role === "ADMIN" ? "ADMIN" : "STAFF",
    department,
  });

  const resetPath = await issueResetLink(user.id, user.name, user.email);
  await logActivity({
    actorId: session!.userId,
    actorName: session!.name,
    action: "account.created",
    summary: `Created account for ${user.name} (${user.email}).`,
    entityType: "user",
    entityId: user.id,
  });

  revalidatePath("/admin/accounts");
  redirect(`/admin/accounts?created=1&devLink=${encodeURIComponent(resetPath)}`);
}

export async function updateUserAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  const userId = Number(formData.get("userId"));
  const role = String(formData.get("role") || "STAFF") as Role;
  const department = String(formData.get("department") || "").trim() || null;

  if (userId === session.userId && role !== "ADMIN") {
    redirect(`/admin/accounts?error=${encodeURIComponent("You can't remove your own admin access.")}`);
  }

  const target = await getUserById(userId);
  if (!target) redirect("/admin/accounts");

  await updateUserRoleAndDepartment(userId, role === "ADMIN" ? "ADMIN" : "STAFF", department);
  await logActivity({
    actorId: session!.userId,
    actorName: session!.name,
    action: "account.updated",
    summary: `Updated account for ${target!.name} (role: ${role}, department: ${department ?? "none"}).`,
    entityType: "user",
    entityId: userId,
  });

  revalidatePath("/admin/accounts");
  redirect("/admin/accounts?updated=1");
}

export async function sendResetLinkAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  const userId = Number(formData.get("userId"));
  const target = await getUserById(userId);
  if (!target) redirect("/admin/accounts");

  const resetPath = await issueResetLink(target!.id, target!.name, target!.email);
  await logActivity({
    actorId: session!.userId,
    actorName: session!.name,
    action: "account.reset_link_sent",
    summary: `Sent a password reset link to ${target!.name}.`,
    entityType: "user",
    entityId: target!.id,
  });

  revalidatePath("/admin/accounts");
  redirect(`/admin/accounts?linkSent=1&devLink=${encodeURIComponent(resetPath)}`);
}
