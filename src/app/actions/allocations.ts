"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  createAllocation,
  returnAllocation,
  getActiveAllocationForAsset,
  getAssetById,
  createReassignmentRequest,
  resolveReassignmentRequest,
  getReassignmentRequestById,
  getUserById,
} from "@/lib/models";
import { isFeatureEnabled } from "@/lib/features";

export async function allocateAssetAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  const assetId = Number(formData.get("assetId"));
  const userId = Number(formData.get("userId"));
  const notes = String(formData.get("notes") || "").trim() || null;

  const asset = await getAssetById(assetId);
  const user = await getUserById(userId);
  if (!asset || !user) {
    redirect(`/admin/allocations?error=${encodeURIComponent("Asset or user not found.")}`);
  }
  if (await getActiveAllocationForAsset(assetId)) {
    redirect(
      `/admin/allocations?error=${encodeURIComponent("This asset is already allocated. Return it first.")}`
    );
  }

  await createAllocation({ assetId, userId, allocatedBy: session!.userId, notes });

  revalidatePath("/admin/allocations");
  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/dashboard");
  revalidatePath("/allocations");
  redirect("/admin/allocations?allocated=1");
}

export async function returnAllocationAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  const allocationId = Number(formData.get("allocationId"));
  const assetId = Number(formData.get("assetId"));

  await returnAllocation(allocationId);

  revalidatePath("/admin/allocations");
  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/dashboard");
  revalidatePath("/allocations");
  redirect("/admin/allocations?returned=1");
}

export async function createReassignmentRequestAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/signin");

  if (!(await isFeatureEnabled("reassignment_requests"))) {
    redirect("/dashboard");
  }

  const assetId = Number(formData.get("assetId"));
  const reason = String(formData.get("reason") || "").trim();
  const asset = await getAssetById(assetId);

  if (!asset) redirect("/dashboard");
  if (!reason) {
    redirect(`/assets/${assetId}?error=${encodeURIComponent("Please provide a reason for the request.")}`);
  }

  await createReassignmentRequest({ assetId, requestedBy: session!.userId, reason });

  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/admin/requests");
  redirect(`/assets/${assetId}?requested=1`);
}

export async function resolveReassignmentRequestAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  const requestId = Number(formData.get("requestId"));
  const decision = String(formData.get("decision")) as "APPROVED" | "REJECTED";
  const notes = String(formData.get("notes") || "").trim() || null;

  const request = await getReassignmentRequestById(requestId);
  if (!request) redirect("/admin/requests");
  if (decision !== "APPROVED" && decision !== "REJECTED") redirect("/admin/requests");

  await resolveReassignmentRequest(requestId, decision, session!.userId, notes);

  revalidatePath("/admin/requests");
  revalidatePath(`/assets/${request!.asset_id}`);
  redirect("/admin/requests?resolved=1");
}
