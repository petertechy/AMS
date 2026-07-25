"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  createMaintenanceRecord,
  completeMaintenanceRecord,
  getMaintenanceRecordById,
  getAssetById,
  logActivity,
} from "@/lib/models";
import { isFeatureEnabled } from "@/lib/features";

export async function openMaintenanceAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");
  if (!(await isFeatureEnabled("maintenance_tracking"))) redirect("/dashboard");

  const assetId = Number(formData.get("assetId"));
  const description = String(formData.get("description") || "").trim();
  const asset = await getAssetById(assetId);

  if (!asset) {
    redirect(`/admin/maintenance?error=${encodeURIComponent("Asset not found.")}`);
  }
  if (asset!.status !== "AVAILABLE") {
    redirect(
      `/admin/maintenance?error=${encodeURIComponent(
        "Asset must be available (returned and not already in maintenance) to schedule maintenance."
      )}`
    );
  }
  if (!description) {
    redirect(`/admin/maintenance?error=${encodeURIComponent("Please describe the maintenance work.")}`);
  }

  await createMaintenanceRecord({ assetId, openedBy: session!.userId, description });
  await logActivity({
    actorId: session!.userId,
    actorName: session!.name,
    action: "maintenance.opened",
    summary: `Opened maintenance record for "${asset!.name}".`,
    entityType: "asset",
    entityId: assetId,
  });

  revalidatePath("/admin/maintenance");
  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/dashboard");
  redirect("/admin/maintenance?opened=1");
}

export async function completeMaintenanceAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  const id = Number(formData.get("id"));
  const notes = String(formData.get("notes") || "").trim() || null;
  const costRaw = String(formData.get("cost") || "").trim();
  const cost = costRaw ? Number(costRaw) : null;

  const record = await getMaintenanceRecordById(id);
  if (!record) redirect("/admin/maintenance");

  await completeMaintenanceRecord(id, { notes, cost });
  const asset = await getAssetById(record!.asset_id);
  await logActivity({
    actorId: session!.userId,
    actorName: session!.name,
    action: "maintenance.completed",
    summary: `Completed maintenance on "${asset?.name ?? `asset #${record!.asset_id}`}".`,
    entityType: "asset",
    entityId: record!.asset_id,
  });

  revalidatePath("/admin/maintenance");
  revalidatePath(`/assets/${record!.asset_id}`);
  revalidatePath("/dashboard");
  redirect("/admin/maintenance?completed=1");
}
