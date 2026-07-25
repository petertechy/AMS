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
  listUsers,
  logActivity,
  createNotification,
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
  await logActivity({
    actorId: session!.userId,
    actorName: session!.name,
    action: "allocation.created",
    summary: `Allocated "${asset!.name}" to ${user!.name}.`,
    entityType: "asset",
    entityId: assetId,
  });
  await createNotification({
    userId,
    message: `"${asset!.name}" has been allocated to you.`,
    link: `/assets/${assetId}`,
  });

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
  const asset = await getAssetById(assetId);

  await returnAllocation(allocationId);
  await logActivity({
    actorId: session!.userId,
    actorName: session!.name,
    action: "allocation.returned",
    summary: `Marked "${asset?.name ?? `asset #${assetId}`}" as returned.`,
    entityType: "asset",
    entityId: assetId,
  });

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
  await logActivity({
    actorId: session!.userId,
    actorName: session!.name,
    action: "reassignment.requested",
    summary: `${session!.name} requested reassignment of "${asset!.name}".`,
    entityType: "asset",
    entityId: assetId,
  });
  const admins = (await listUsers()).filter((u) => u.role === "ADMIN");
  await Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin.id,
        message: `${session!.name} requested to reassign "${asset!.name}".`,
        link: "/admin/requests",
      })
    )
  );

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
  const asset = await getAssetById(request!.asset_id);
  await logActivity({
    actorId: session!.userId,
    actorName: session!.name,
    action: "reassignment.resolved",
    summary: `${decision === "APPROVED" ? "Approved" : "Rejected"} reassignment request for "${
      asset?.name ?? `asset #${request!.asset_id}`
    }".`,
    entityType: "asset",
    entityId: request!.asset_id,
  });
  await createNotification({
    userId: request!.requested_by,
    message: `Your reassignment request for "${asset?.name ?? `asset #${request!.asset_id}`}" was ${
      decision === "APPROVED" ? "approved" : "rejected"
    }.`,
    link: `/assets/${request!.asset_id}`,
  });

  revalidatePath("/admin/requests");
  revalidatePath(`/assets/${request!.asset_id}`);
  redirect("/admin/requests?resolved=1");
}
