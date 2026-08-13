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
  const newOwnerRaw = String(formData.get("newOwnerId") || "").trim();
  const newOwnerId = newOwnerRaw ? Number(newOwnerRaw) : null;
  const asset = await getAssetById(assetId);

  if (!asset) redirect("/dashboard");
  if (!reason) {
    redirect(`/assets/${assetId}?error=${encodeURIComponent("Please provide a reason for the request.")}`);
  }
  if (newOwnerId && !(await getUserById(newOwnerId))) {
    redirect(`/assets/${assetId}?error=${encodeURIComponent("Selected new owner was not found.")}`);
  }

  await createReassignmentRequest({ assetId, requestedBy: session!.userId, reason, newOwnerId });
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
  if (request!.status !== "PENDING") {
    redirect(`/admin/requests?error=${encodeURIComponent("This request was already resolved.")}`);
  }

  const asset = await getAssetById(request!.asset_id);

  if (decision === "REJECTED") {
    await resolveReassignmentRequest(requestId, "REJECTED", session!.userId, notes);
    await logActivity({
      actorId: session!.userId,
      actorName: session!.name,
      action: "reassignment.resolved",
      summary: `Rejected reassignment request for "${asset?.name ?? `asset #${request!.asset_id}`}".`,
      entityType: "asset",
      entityId: request!.asset_id,
    });
    await createNotification({
      userId: request!.requested_by,
      message: `Your reassignment request for "${asset?.name ?? `asset #${request!.asset_id}`}" was rejected.`,
      link: `/assets/${request!.asset_id}`,
    });
    revalidatePath("/admin/requests");
    revalidatePath(`/assets/${request!.asset_id}`);
    redirect("/admin/requests?resolved=1");
  }

  // APPROVED: this is the step that actually moves ownership. A request only records a reason
  // (and optionally a suggested new owner) — approving it here performs the same return +
  // reallocate that /admin/allocations does manually, so "Approve" isn't just a status flip.
  const newOwnerRaw = String(formData.get("newOwnerId") || request!.new_owner_id || "").trim();
  const newOwnerId = newOwnerRaw ? Number(newOwnerRaw) : 0;
  const newOwner = newOwnerId ? await getUserById(newOwnerId) : undefined;
  if (!newOwner) {
    redirect(
      `/admin/requests?error=${encodeURIComponent("Choose who this asset should be reassigned to before approving.")}`
    );
  }
  if (!asset) redirect("/admin/requests");
  if (asset!.status === "RETIRED") {
    redirect(`/admin/requests?error=${encodeURIComponent("This asset is retired and can't be reassigned.")}`);
  }

  const activeAllocation = await getActiveAllocationForAsset(request!.asset_id);
  if (activeAllocation) {
    await returnAllocation(activeAllocation.id);
  }
  await createAllocation({
    assetId: request!.asset_id,
    userId: newOwner!.id,
    allocatedBy: session!.userId,
    notes: notes
      ? `Reassignment request #${requestId}: ${notes}`
      : `Reassigned via approved request #${requestId}.`,
  });
  await resolveReassignmentRequest(requestId, "APPROVED", session!.userId, notes, newOwner!.id);

  await logActivity({
    actorId: session!.userId,
    actorName: session!.name,
    action: "reassignment.resolved",
    summary: `Approved reassignment of "${asset!.name}" to ${newOwner!.name}.`,
    entityType: "asset",
    entityId: request!.asset_id,
  });
  await createNotification({
    userId: request!.requested_by,
    message: `Your reassignment request for "${asset!.name}" was approved — it's now assigned to ${newOwner!.name}.`,
    link: `/assets/${request!.asset_id}`,
  });
  if (activeAllocation && activeAllocation.user_id !== newOwner!.id) {
    await createNotification({
      userId: activeAllocation.user_id,
      message: `"${asset!.name}" has been reassigned away from you.`,
      link: `/assets/${request!.asset_id}`,
    });
  }
  if (activeAllocation?.user_id !== newOwner!.id) {
    await createNotification({
      userId: newOwner!.id,
      message: `"${asset!.name}" has been allocated to you.`,
      link: `/assets/${request!.asset_id}`,
    });
  }

  revalidatePath("/admin/requests");
  revalidatePath("/admin/allocations");
  revalidatePath(`/assets/${request!.asset_id}`);
  revalidatePath("/dashboard");
  revalidatePath("/allocations");
  redirect("/admin/requests?resolved=1");
}
