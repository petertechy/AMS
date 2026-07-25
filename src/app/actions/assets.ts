"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  createAsset,
  updateAsset,
  updateAssetCondition,
  getAssetById,
  getActiveAllocationForAsset,
  logActivity,
  type AssetCondition,
} from "@/lib/models";
import { ASSET_CONDITIONS } from "@/lib/constants";

export async function updateConditionAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/signin");

  const assetId = Number(formData.get("assetId"));
  const condition = String(formData.get("condition")) as AssetCondition;
  const asset = await getAssetById(assetId);
  if (!asset) redirect("/dashboard");

  if (!ASSET_CONDITIONS.includes(condition)) {
    redirect(`/assets/${assetId}?error=${encodeURIComponent("Invalid condition value.")}`);
  }

  const isAdmin = session!.role === "ADMIN";
  const activeAllocation = await getActiveAllocationForAsset(assetId);
  const isCurrentHolder = activeAllocation?.user_id === session!.userId;

  if (!isAdmin && !isCurrentHolder) {
    redirect(
      `/assets/${assetId}?error=${encodeURIComponent(
        "You can only update the condition of assets currently allocated to you."
      )}`
    );
  }

  await updateAssetCondition(assetId, condition);
  await logActivity({
    actorId: session!.userId,
    actorName: session!.name,
    action: "asset.condition_changed",
    summary: `Changed condition of "${asset!.name}" to ${condition}.`,
    entityType: "asset",
    entityId: assetId,
  });
  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/dashboard");
  redirect(`/assets/${assetId}?updated=1`);
}

export async function createAssetAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const department = String(formData.get("department") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const serialNumber = String(formData.get("serialNumber") || "").trim() || null;
  const specifications = String(formData.get("specifications") || "").trim() || null;
  const condition = String(formData.get("condition") || "GOOD") as AssetCondition;
  const purchaseDate = String(formData.get("purchaseDate") || "").trim() || null;
  const valueRaw = String(formData.get("value") || "").trim();
  const value = valueRaw ? Number(valueRaw) : null;

  if (!name || !category || !department || !location) {
    redirect(
      `/admin/assets/new?error=${encodeURIComponent(
        "Name, category, department, and location are required."
      )}`
    );
  }

  const asset = await createAsset({
    name,
    category,
    department,
    location,
    serialNumber,
    specifications,
    condition,
    purchaseDate,
    value,
  });
  await logActivity({
    actorId: session!.userId,
    actorName: session!.name,
    action: "asset.created",
    summary: `Registered asset "${asset.name}".`,
    entityType: "asset",
    entityId: asset.id,
  });

  revalidatePath("/dashboard");
  revalidatePath("/admin/assets");
  redirect(`/assets/${asset.id}?created=1`);
}

export async function updateAssetDetailsAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  const assetId = Number(formData.get("assetId"));
  const asset = await getAssetById(assetId);
  if (!asset) redirect("/admin/assets");

  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const department = String(formData.get("department") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const serialNumber = String(formData.get("serialNumber") || "").trim() || null;
  const specifications = String(formData.get("specifications") || "").trim() || null;
  const purchaseDate = String(formData.get("purchaseDate") || "").trim() || null;
  const valueRaw = String(formData.get("value") || "").trim();
  const value = valueRaw ? Number(valueRaw) : null;

  if (!name || !category || !department || !location) {
    redirect(
      `/admin/assets/${assetId}/edit?error=${encodeURIComponent(
        "Name, category, department, and location are required."
      )}`
    );
  }

  await updateAsset(assetId, {
    name,
    category,
    department,
    location,
    serialNumber,
    specifications,
    purchaseDate,
    value,
  });
  await logActivity({
    actorId: session!.userId,
    actorName: session!.name,
    action: "asset.updated",
    summary: `Updated asset "${name}".`,
    entityType: "asset",
    entityId: assetId,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/admin/assets");
  redirect(`/assets/${assetId}?updated=1`);
}
