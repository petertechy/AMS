"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  createMaintenanceRequest,
  getMaintenanceRequestById,
  updateMaintenanceRequest,
  assignMaintenanceHandler,
  startMaintenanceRequest,
  resolveMaintenanceRequest,
  closeMaintenanceRequest,
  cancelMaintenanceRequest,
  deleteMaintenanceRequest,
  createMaintenanceAttachment,
  createMaintenanceComment,
  getAssetById,
  getUserById,
  logActivity,
  createNotification,
  type MaintenancePriority,
} from "@/lib/models";
import { isFeatureEnabled } from "@/lib/features";

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
]);

function isAllowedAttachment(file: File): boolean {
  return file.type.startsWith("image/") || ALLOWED_ATTACHMENT_TYPES.has(file.type);
}

function withParam(path: string, param: string): string {
  return `${path}${path.includes("?") ? "&" : "?"}${param}`;
}

function safeBasePath(basePath: string): string {
  return basePath === "/maintenance" ? "/maintenance" : "/admin/maintenance";
}

function revalidateMaintenance(assetId: number): void {
  revalidatePath("/admin/maintenance");
  revalidatePath("/maintenance");
  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/dashboard");
}

export async function createMaintenanceRequestAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/signin");
  if (!(await isFeatureEnabled("maintenance_tracking"))) redirect("/dashboard");

  const basePath = safeBasePath(String(formData.get("basePath") || "/maintenance"));
  const assetId = Number(formData.get("assetId"));
  const title = String(formData.get("title") || "").trim();
  const issueType = String(formData.get("issueType") || "").trim() || null;
  const priority = String(formData.get("priority") || "MEDIUM") as MaintenancePriority;
  const description = String(formData.get("description") || "").trim();
  const notes = String(formData.get("notes") || "").trim() || null;

  const asset = await getAssetById(assetId);
  if (!asset) {
    redirect(`${basePath}/new?error=${encodeURIComponent("Asset not found.")}`);
  }
  if (!title || !description) {
    redirect(`${basePath}/new?error=${encodeURIComponent("Please provide a title and description.")}`);
  }

  const request = await createMaintenanceRequest({
    assetId,
    reporterId: session!.userId,
    title,
    issueType,
    priority,
    description,
    notes,
  });

  await logActivity({
    actorId: session!.userId,
    actorName: session!.name,
    action: "maintenance.opened",
    summary: `${session!.name} opened a maintenance request for "${asset!.name}".`,
    entityType: "asset",
    entityId: assetId,
  });

  revalidateMaintenance(assetId);
  redirect(`${basePath}/${request.id}?created=1`);
}

export async function updateMaintenanceRequestAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/signin");

  const id = Number(formData.get("id"));
  const returnTo = String(formData.get("returnTo") || "/admin/maintenance");
  const request = await getMaintenanceRequestById(id);
  if (!request) redirect("/admin/maintenance");

  const isAdmin = session!.role === "ADMIN";
  const isReporter = request!.reporter_id === session!.userId;
  if (!isAdmin && !isReporter) redirect(returnTo);
  if (request!.status !== "OPEN") {
    redirect(withParam(returnTo, `error=${encodeURIComponent("Only an open request can be edited.")}`));
  }

  const title = String(formData.get("title") || "").trim();
  const issueType = String(formData.get("issueType") || "").trim() || null;
  const priority = String(formData.get("priority") || request!.priority) as MaintenancePriority;
  const description = String(formData.get("description") || "").trim();
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!title || !description) {
    redirect(withParam(returnTo, `error=${encodeURIComponent("Please provide a title and description.")}`));
  }

  await updateMaintenanceRequest(id, { title, issueType, priority, description, notes });
  await logActivity({
    actorId: session!.userId,
    actorName: session!.name,
    action: "maintenance.updated",
    summary: `${session!.name} updated maintenance request "${title}".`,
    entityType: "asset",
    entityId: request!.asset_id,
  });

  revalidateMaintenance(request!.asset_id);
  redirect(withParam(returnTo, "updated=1"));
}

export async function assignMaintenanceHandlerAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  const id = Number(formData.get("id"));
  const returnTo = String(formData.get("returnTo") || "/admin/maintenance");
  const assigneeIdRaw = String(formData.get("assigneeId") || "").trim();
  const assigneeId = assigneeIdRaw ? Number(assigneeIdRaw) : null;

  const request = await getMaintenanceRequestById(id);
  if (!request) redirect("/admin/maintenance");

  const assignee = assigneeId ? await getUserById(assigneeId) : null;
  if (assigneeId && !assignee) {
    redirect(withParam(returnTo, `error=${encodeURIComponent("Selected handler not found.")}`));
  }

  await assignMaintenanceHandler(id, assigneeId);
  await logActivity({
    actorId: session!.userId,
    actorName: session!.name,
    action: "maintenance.assigned",
    summary: assignee
      ? `${session!.name} assigned "${request!.title}" to ${assignee.name}.`
      : `${session!.name} unassigned "${request!.title}".`,
    entityType: "asset",
    entityId: request!.asset_id,
  });
  if (assignee) {
    await createNotification({
      userId: assignee.id,
      message: `You were assigned maintenance request "${request!.title}".`,
      link: `/admin/maintenance/${id}`,
    });
  }

  revalidateMaintenance(request!.asset_id);
  redirect(withParam(returnTo, "assigned=1"));
}

export async function startMaintenanceAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  const id = Number(formData.get("id"));
  const returnTo = String(formData.get("returnTo") || "/admin/maintenance");
  const request = await getMaintenanceRequestById(id);
  if (!request) redirect("/admin/maintenance");
  if (request!.status !== "OPEN") {
    redirect(withParam(returnTo, `error=${encodeURIComponent("Only an open request can be started.")}`));
  }

  await startMaintenanceRequest(id);
  await logActivity({
    actorId: session!.userId,
    actorName: session!.name,
    action: "maintenance.started",
    summary: `${session!.name} started work on "${request!.title}".`,
    entityType: "asset",
    entityId: request!.asset_id,
  });

  revalidateMaintenance(request!.asset_id);
  redirect(withParam(returnTo, "started=1"));
}

export async function resolveMaintenanceAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  const id = Number(formData.get("id"));
  const returnTo = String(formData.get("returnTo") || "/admin/maintenance");
  const resolutionNotes = String(formData.get("resolutionNotes") || "").trim() || null;

  const request = await getMaintenanceRequestById(id);
  if (!request) redirect("/admin/maintenance");
  if (request!.status !== "OPEN" && request!.status !== "IN_PROGRESS") {
    redirect(withParam(returnTo, `error=${encodeURIComponent("Only an open or in-progress request can be resolved.")}`));
  }

  await resolveMaintenanceRequest(id, resolutionNotes);
  await logActivity({
    actorId: session!.userId,
    actorName: session!.name,
    action: "maintenance.resolved",
    summary: `${session!.name} resolved "${request!.title}".`,
    entityType: "asset",
    entityId: request!.asset_id,
  });
  await createNotification({
    userId: request!.reporter_id,
    message: `Your maintenance request "${request!.title}" was resolved.`,
    link: `/maintenance/${id}`,
  });

  revalidateMaintenance(request!.asset_id);
  redirect(withParam(returnTo, "resolved=1"));
}

export async function closeMaintenanceAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  const id = Number(formData.get("id"));
  const returnTo = String(formData.get("returnTo") || "/admin/maintenance");
  const request = await getMaintenanceRequestById(id);
  if (!request) redirect("/admin/maintenance");
  if (request!.status !== "RESOLVED") {
    redirect(withParam(returnTo, `error=${encodeURIComponent("Only a resolved request can be closed.")}`));
  }

  await closeMaintenanceRequest(id);
  await logActivity({
    actorId: session!.userId,
    actorName: session!.name,
    action: "maintenance.closed",
    summary: `${session!.name} closed "${request!.title}".`,
    entityType: "asset",
    entityId: request!.asset_id,
  });

  revalidateMaintenance(request!.asset_id);
  redirect(withParam(returnTo, "closed=1"));
}

export async function cancelMaintenanceAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/signin");

  const id = Number(formData.get("id"));
  const returnTo = String(formData.get("returnTo") || "/admin/maintenance");
  const request = await getMaintenanceRequestById(id);
  if (!request) redirect("/admin/maintenance");

  const isAdmin = session!.role === "ADMIN";
  const isReporter = request!.reporter_id === session!.userId;
  if (!isAdmin && !(isReporter && request!.status === "OPEN")) redirect(returnTo);
  if (request!.status === "CANCELLED" || request!.status === "CLOSED") {
    redirect(withParam(returnTo, `error=${encodeURIComponent("This request is already closed out.")}`));
  }

  await cancelMaintenanceRequest(id);
  await logActivity({
    actorId: session!.userId,
    actorName: session!.name,
    action: "maintenance.cancelled",
    summary: `${session!.name} cancelled "${request!.title}".`,
    entityType: "asset",
    entityId: request!.asset_id,
  });

  revalidateMaintenance(request!.asset_id);
  redirect(withParam(returnTo, "cancelled=1"));
}

export async function deleteMaintenanceAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  const id = Number(formData.get("id"));
  const returnTo = String(formData.get("returnTo") || "/admin/maintenance");
  const request = await getMaintenanceRequestById(id);
  if (!request) redirect(returnTo);

  await deleteMaintenanceRequest(id);
  await logActivity({
    actorId: session!.userId,
    actorName: session!.name,
    action: "maintenance.deleted",
    summary: `${session!.name} deleted maintenance request "${request!.title}".`,
    entityType: "asset",
    entityId: request!.asset_id,
  });

  revalidateMaintenance(request!.asset_id);
  redirect(withParam(returnTo, "deleted=1"));
}

export async function addMaintenanceAttachmentAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/signin");

  const requestId = Number(formData.get("requestId"));
  const returnTo = String(formData.get("returnTo") || "/admin/maintenance");
  const request = await getMaintenanceRequestById(requestId);
  if (!request) redirect("/admin/maintenance");

  const isAdmin = session!.role === "ADMIN";
  const isReporter = request!.reporter_id === session!.userId;
  const isAssignee = request!.assignee_id === session!.userId;
  if (!isAdmin && !isReporter && !isAssignee) redirect(returnTo);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect(withParam(returnTo, `error=${encodeURIComponent("Please choose a file to upload.")}`));
  }
  if (file!.size > MAX_ATTACHMENT_BYTES) {
    redirect(withParam(returnTo, `error=${encodeURIComponent("Attachments must be 5MB or smaller.")}`));
  }
  if (!isAllowedAttachment(file!)) {
    redirect(withParam(returnTo, `error=${encodeURIComponent("Unsupported file type.")}`));
  }

  const data = Buffer.from(await file!.arrayBuffer());
  await createMaintenanceAttachment({
    requestId,
    filename: file!.name,
    mimeType: file!.type || "application/octet-stream",
    sizeBytes: data.byteLength,
    data,
    uploadedBy: session!.userId,
  });

  revalidateMaintenance(request!.asset_id);
  redirect(withParam(returnTo, "uploaded=1"));
}

export async function addMaintenanceCommentAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/signin");

  const requestId = Number(formData.get("requestId"));
  const returnTo = String(formData.get("returnTo") || "/admin/maintenance");
  const parentIdRaw = String(formData.get("parentId") || "").trim();
  const parentId = parentIdRaw ? Number(parentIdRaw) : null;
  const body = String(formData.get("body") || "").trim();

  const request = await getMaintenanceRequestById(requestId);
  if (!request) redirect("/admin/maintenance");

  const isAdmin = session!.role === "ADMIN";
  const isReporter = request!.reporter_id === session!.userId;
  const isAssignee = request!.assignee_id === session!.userId;
  if (!isAdmin && !isReporter && !isAssignee) redirect(returnTo);
  if (!body) redirect(withParam(returnTo, `error=${encodeURIComponent("Comment cannot be empty.")}`));

  await createMaintenanceComment({ requestId, authorId: session!.userId, parentId, body });

  revalidatePath(`/admin/maintenance/${requestId}`);
  revalidatePath(`/maintenance/${requestId}`);
  redirect(withParam(returnTo, "commented=1"));
}
