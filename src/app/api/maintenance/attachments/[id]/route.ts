import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getMaintenanceAttachmentById, getMaintenanceRequestById } from "@/lib/models";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const session = await getSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const attachment = await getMaintenanceAttachmentById(Number(id));
  if (!attachment) return new NextResponse("Not found", { status: 404 });

  const request = await getMaintenanceRequestById(attachment.request_id);
  if (!request) return new NextResponse("Not found", { status: 404 });

  const isAdmin = session.role === "ADMIN";
  const isReporter = request.reporter_id === session.userId;
  const isAssignee = request.assignee_id === session.userId;
  if (!isAdmin && !isReporter && !isAssignee) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return new NextResponse(new Uint8Array(attachment.data), {
    headers: {
      "Content-Type": attachment.mime_type,
      "Content-Disposition": `inline; filename="${attachment.filename.replace(/"/g, "")}"`,
      "Content-Length": String(attachment.size_bytes),
      "Cache-Control": "private, max-age=0, no-cache",
    },
  });
}
