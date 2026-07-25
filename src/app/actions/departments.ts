"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  createDepartment,
  renameDepartment,
  getDepartmentById,
  deleteDepartmentIfUnused,
  logActivity,
} from "@/lib/models";

export async function createDepartmentAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  const name = String(formData.get("name") || "").trim();
  if (!name) {
    redirect(`/admin/departments?error=${encodeURIComponent("Department name is required.")}`);
  }

  await createDepartment(name);
  await logActivity({
    actorId: session!.userId,
    actorName: session!.name,
    action: "department.created",
    summary: `Added department "${name}".`,
    entityType: "department",
  });

  revalidatePath("/admin/departments");
  redirect("/admin/departments?created=1");
}

export async function renameDepartmentAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  const id = Number(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const existing = await getDepartmentById(id);
  if (!existing) redirect("/admin/departments");
  if (!name) {
    redirect(`/admin/departments?error=${encodeURIComponent("Department name is required.")}`);
  }

  await renameDepartment(id, name);
  await logActivity({
    actorId: session!.userId,
    actorName: session!.name,
    action: "department.renamed",
    summary: `Renamed department "${existing!.name}" to "${name}".`,
    entityType: "department",
    entityId: id,
  });

  revalidatePath("/admin/departments");
  redirect("/admin/departments?updated=1");
}

export async function deleteDepartmentAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  const id = Number(formData.get("id"));
  const existing = await getDepartmentById(id);
  if (!existing) redirect("/admin/departments");

  const deleted = await deleteDepartmentIfUnused(id);
  if (!deleted) {
    redirect(
      `/admin/departments?error=${encodeURIComponent(
        `"${existing!.name}" is still in use by an asset or account and can't be deleted.`
      )}`
    );
  }

  await logActivity({
    actorId: session!.userId,
    actorName: session!.name,
    action: "department.deleted",
    summary: `Deleted department "${existing!.name}".`,
    entityType: "department",
  });

  revalidatePath("/admin/departments");
  redirect("/admin/departments?deleted=1");
}
