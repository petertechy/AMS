import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  getMaintenanceRequestById,
  getActiveAllocationForAsset,
  listMaintenanceAttachments,
  listMaintenanceComments,
} from "@/lib/models";
import {
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_STATUS_BADGE_CLASSES,
  MAINTENANCE_PRIORITY_BADGE_CLASSES,
} from "@/lib/constants";
import Badge from "@/components/Badge";
import SubmitButton from "@/components/SubmitButton";
import Toast from "@/components/Toast";
import MaintenanceDiscussion from "@/components/MaintenanceDiscussion";
import { cancelMaintenanceAction, addMaintenanceAttachmentAction } from "@/app/actions/maintenance";

function formatDateTime(ts: number | null) {
  if (!ts) return "Not set";
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function StaffMaintenanceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; cancelled?: string; uploaded?: string; commented?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/signin");

  const { id } = await params;
  const query = await searchParams;
  const requestId = Number(id);

  const request = await getMaintenanceRequestById(requestId);
  if (!request) notFound();

  const isReporter = request.reporter_id === session.userId;
  const isAssignee = request.assignee_id === session.userId;
  const isAdmin = session.role === "ADMIN";
  const activeAllocation = await getActiveAllocationForAsset(request.asset_id);
  const isHolder = activeAllocation?.user_id === session.userId;

  if (!isAdmin && !isReporter && !isAssignee && !isHolder) notFound();

  const [attachments, comments] = await Promise.all([
    listMaintenanceAttachments(requestId),
    listMaintenanceComments(requestId),
  ]);

  const returnTo = `/maintenance/${requestId}`;
  const canContribute = isReporter || isAssignee;

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Maintenance Detail</h1>
          <p className="text-sm text-slate-500">
            {request.asset_tag ?? `#${request.id}`} &bull; {MAINTENANCE_STATUS_LABELS[request.status]}
          </p>
        </div>
        <Link
          href="/maintenance"
          className="shrink-0 bg-white border border-slate-300 text-slate-700 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
        >
          Back to Maintenance
        </Link>
      </div>

      {query.error && <Toast key={query.error} type="error" message={query.error} />}
      {query.cancelled && <Toast type="success" message="Request cancelled." />}
      {query.uploaded && <Toast type="success" message="Attachment uploaded." />}
      {query.commented && <Toast type="success" message="Comment posted." />}

      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Asset</dt>
            <dd className="mt-0.5">
              <Link href={`/assets/${request.asset_id}`} className="text-slate-900 font-medium hover:underline">
                {request.asset_name}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Priority</dt>
            <dd className="mt-0.5">
              <Badge className={MAINTENANCE_PRIORITY_BADGE_CLASSES[request.priority]}>
                {MAINTENANCE_PRIORITY_LABELS[request.priority]}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Status</dt>
            <dd className="mt-0.5">
              <Badge className={MAINTENANCE_STATUS_BADGE_CLASSES[request.status]}>
                {MAINTENANCE_STATUS_LABELS[request.status]}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Reported By</dt>
            <dd className="mt-0.5 text-slate-800">{request.reporter_name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Assigned To</dt>
            <dd className="mt-0.5 text-slate-800">{request.assignee_name || "Unassigned"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Opened</dt>
            <dd className="mt-0.5 text-slate-700">{formatDateTime(request.opened_at)}</dd>
          </div>
        </dl>

        <div className="border-t border-slate-100 pt-4 space-y-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Title</dt>
            <dd className="mt-0.5 text-slate-900 font-medium">{request.title}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Description</dt>
            <dd className="mt-0.5 text-slate-700 whitespace-pre-wrap">{request.description}</dd>
          </div>
          {request.resolution_notes && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Resolution Notes</dt>
              <dd className="mt-0.5 text-slate-700 whitespace-pre-wrap">{request.resolution_notes}</dd>
            </div>
          )}
        </div>

        {isReporter && request.status === "OPEN" && (
          <form action={cancelMaintenanceAction} className="mt-4 pt-4 border-t border-slate-100">
            <input type="hidden" name="id" value={request.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <SubmitButton pendingLabel="…" className="text-amber-700 border border-amber-200 bg-amber-50 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-amber-100">
              Cancel Request
            </SubmitButton>
          </form>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Attachments</h2>
        {attachments.length > 0 ? (
          <ul className="divide-y divide-slate-100 mb-4">
            {attachments.map((a) => (
              <li key={a.id} className="py-2 flex items-center justify-between text-sm">
                <a
                  href={`/api/maintenance/attachments/${a.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-900 hover:underline"
                >
                  {a.filename}
                </a>
                <span className="text-xs text-slate-400">
                  {formatSize(a.size_bytes)} &bull; {formatDateTime(a.uploaded_at)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400 mb-4">No supporting documents uploaded yet.</p>
        )}
        {canContribute && (
          <form action={addMaintenanceAttachmentAction} className="flex items-center gap-2">
            <input type="hidden" name="requestId" value={request.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <input type="file" name="file" required className="text-sm" />
            <SubmitButton pendingLabel="Uploading…" className="bg-white border border-slate-300 text-slate-700 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-slate-50">
              Upload
            </SubmitButton>
          </form>
        )}
      </div>

      <MaintenanceDiscussion requestId={request.id} comments={comments} returnTo={returnTo} canReply={canContribute} />
    </div>
  );
}
