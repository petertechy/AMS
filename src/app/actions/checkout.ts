"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  createAllocation,
  returnAllocation,
  getActiveAllocationForAsset,
  getAssetById,
  logActivity,
} from "@/lib/models";
import { isFeatureEnabled } from "@/lib/features";

export async function checkOutAssetAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/signin");
  if (!(await isFeatureEnabled("self_service_checkout"))) redirect("/dashboard");

  const assetId = Number(formData.get("assetId"));
  const returnTo = String(formData.get("returnTo") || "/checkout");
  const asset = await getAssetById(assetId);

  if (!asset) redirect(returnTo);
  if (asset!.status !== "AVAILABLE") {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=${encodeURIComponent("This asset is no longer available.")}`);
  }

  await createAllocation({ assetId, userId: session!.userId, allocatedBy: session!.userId });
  await logActivity({
    actorId: session!.userId,
    actorName: session!.name,
    action: "checkout.self_service",
    summary: `${session!.name} checked out "${asset!.name}".`,
    entityType: "asset",
    entityId: assetId,
  });

  revalidatePath("/checkout");
  revalidatePath("/allocations");
  revalidatePath("/dashboard");
  revalidatePath(`/assets/${assetId}`);
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}checkedOut=1`);
}

export async function checkInAssetAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/signin");

  const assetId = Number(formData.get("assetId"));
  const returnTo = String(formData.get("returnTo") || "/checkout");
  const asset = await getAssetById(assetId);
  const activeAllocation = await getActiveAllocationForAsset(assetId);

  if (!activeAllocation || activeAllocation.user_id !== session!.userId) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=${encodeURIComponent("You can only check in assets currently checked out to you.")}`);
  }

  await returnAllocation(activeAllocation!.id);
  await logActivity({
    actorId: session!.userId,
    actorName: session!.name,
    action: "checkin.self_service",
    summary: `${session!.name} checked in "${asset?.name ?? `asset #${assetId}`}".`,
    entityType: "asset",
    entityId: assetId,
  });

  revalidatePath("/checkout");
  revalidatePath("/allocations");
  revalidatePath("/dashboard");
  revalidatePath(`/assets/${assetId}`);
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}checkedIn=1`);
}
