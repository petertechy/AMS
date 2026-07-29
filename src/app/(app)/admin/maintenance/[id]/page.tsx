import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getMaintenanceRequestById,
  listUsers,
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
import {
  assignMaintenanceHandlerAction,
  startMaintenanceAction,
  resolveMaintenanceAction,
  closeMaintenanceAction,
  cancelMaintenanceAction,
  deleteMaintenanceAction,
  addMaintenanceAttachmentAction,
} from "@/app/actions/maintenance";

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

export default async function AdminMaintenanceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    updated?: string;
    assigned?: string;
    started?: string;
    resolved?: string;
    closed?: string;
    cancelled?: string;
    uploaded?: string;
    commented?: string;
  }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const requestId = Number(id);

  const request = await getMaintenanceRequestById(requestId);
  if (!request) notFound();

  const [users, attachments, comments] = await Promise.all([
    listUsers(),
    listMaintenanceAttachments(requestId),
    listMaintenanceComments(requestId),
  ]);

  const returnTo = `/admin/maintenance/${requestId}`;

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Maintenance Detail</h1>
          <p className="text-sm text-slate-500">
            {request.asset_tag ?? `#${request.id}`} &bull; {MAINTENANCE_STATUS_LABELS[request.status]}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {request.status === "OPEN" && (
            <Link
              href={`/admin/maintenance/${requestId}/edit`}
              className="bg-white border border-slate-300 text-slate-700 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
            >
              Edit
            </Link>
          )}
          <Link
            href="/admin/maintenance"
            className="bg-white border border-slate-300 text-slate-700 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
          >
            Back to Maintenance
          </Link>
        </div>
      </div>

      {query.error && <Toast key={query.error} type="error" message={query.error} />}
      {query.updated && <Toast type="success" message="Maintenance request updated." />}
      {query.assigned && <Toast type="success" message="Handler assigned." />}
      {query.started && <Toast type="success" message="Request marked in progress." />}
      {query.resolved && <Toast type="success" message="Request resolved." />}
      {query.closed && <Toast type="success" message="Request closed." />}
      {query.cancelled && <Toast type="success" message="Request cancelled." />}
      {query.uploaded && <Toast type="success" message="Attachment uploaded." />}
      {query.commented && <Toast type="success" message="Comment posted." />}

      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
        <dl className="grid grid-cols-3 gap-4 text-sm mb-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Asset</dt>
            <dd className="mt-0.5">
              <Link href={`/assets/${request.asset_id}`} className="text-slate-900 font-medium hover:underline">
                {request.asset_name}
              </Link>
              {request.asset_tag && <div className="text-xs text-slate-400">{request.asset_tag}</div>}
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
            <dd className="mt-0.5 text-slate-800">
              {request.reporter_name} <span className="text-slate-400">({request.reporter_email})</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Assigned To</dt>
            <dd className="mt-0.5 text-slate-800">{request.assignee_name || "Unassigned"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Issue Type</dt>
            <dd className="mt-0.5 text-slate-800">{request.issue_type || "-"}</dd>
          </div>
        </dl>

        <dl className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm border-t border-slate-100 pt-4 mb-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Opened</dt>
            <dd className="mt-0.5 text-slate-700">{formatDateTime(request.opened_at)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Started</dt>
            <dd className="mt-0.5 text-slate-700">{formatDateTime(request.started_at)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Resolved</dt>
            <dd className="mt-0.5 text-slate-700">{formatDateTime(request.resolved_at)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Closed</dt>
            <dd className="mt-0.5 text-slate-700">{formatDateTime(request.closed_at)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Cancelled</dt>
            <dd className="mt-0.5 text-slate-700">{formatDateTime(request.cancelled_at)}</dd>
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
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Notes</dt>
            <dd className="mt-0.5 text-slate-700 whitespace-pre-wrap">{request.notes || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Resolution Notes</dt>
            <dd className="mt-0.5 text-slate-700 whitespace-pre-wrap">{request.resolution_notes || "No resolution notes."}</dd>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">Actions</h2>
        <p className="text-xs text-slate-500 mb-4">Workflow actions are limited by the current request status and your permissions.</p>

        <div className="flex flex-wrap items-start gap-3">
          <form action={assignMaintenanceHandlerAction} className="flex items-end gap-2">
            <input type="hidden" name="id" value={request.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Handler</label>
              <select
                name="assigneeId"
                defaultValue={request.assignee_id ?? ""}
                className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm bg-white"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <SubmitButton pendingLabel="…" className="bg-white border border-slate-300 text-slate-700 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-slate-50">
              Assign Handler
            </SubmitButton>
          </form>

          {request.status === "OPEN" && (
            <form action={startMaintenanceAction}>
              <input type="hidden" name="id" value={request.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <SubmitButton pendingLabel="…" className="bg-indigo-600 text-white rounded-md px-3 py-1.5 text-sm font-medium hover:bg-indigo-700">
                Start
              </SubmitButton>
            </form>
          )}

          {(request.status === "OPEN" || request.status === "IN_PROGRESS") && (
            <form action={resolveMaintenanceAction} className="flex items-end gap-2">
              <input type="hidden" name="id" value={request.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Resolution notes</label>
                <input
                  name="resolutionNotes"
                  placeholder="Optional"
                  className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
                />
              </div>
              <SubmitButton pendingLabel="…" className="bg-indigo-600 text-white rounded-md px-3 py-1.5 text-sm font-medium hover:bg-indigo-700">
                Resolve
              </SubmitButton>
            </form>
          )}

          {request.status === "RESOLVED" && (
            <form action={closeMaintenanceAction}>
              <input type="hidden" name="id" value={request.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <SubmitButton pendingLabel="…" className="bg-slate-900 text-white rounded-md px-3 py-1.5 text-sm font-medium hover:bg-slate-800">
                Close
              </SubmitButton>
            </form>
          )}

          {(request.status === "OPEN" || request.status === "IN_PROGRESS") && (
            <form action={cancelMaintenanceAction}>
              <input type="hidden" name="id" value={request.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <SubmitButton pendingLabel="…" className="text-amber-700 border border-amber-200 bg-amber-50 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-amber-100">
                Cancel
              </SubmitButton>
            </form>
          )}

          <form action={deleteMaintenanceAction}>
            <input type="hidden" name="id" value={request.id} />
            <input type="hidden" name="returnTo" value="/admin/maintenance" />
            <SubmitButton pendingLabel="…" className="text-red-700 border border-red-200 bg-red-50 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-red-100">
              Delete
            </SubmitButton>
          </form>
        </div>
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
                  {formatSize(a.size_bytes)} &bull; {a.uploaded_by_name} &bull; {formatDateTime(a.uploaded_at)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400 mb-4">No supporting documents uploaded yet.</p>
        )}
        <form action={addMaintenanceAttachmentAction} className="flex items-center gap-2">
          <input type="hidden" name="requestId" value={request.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <input type="file" name="file" required className="text-sm" />
          <SubmitButton pendingLabel="Uploading…" className="bg-white border border-slate-300 text-slate-700 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-slate-50">
            Upload
          </SubmitButton>
        </form>
      </div>

      <MaintenanceDiscussion requestId={request.id} comments={comments} returnTo={returnTo} canReply />
    </div>
  );
}
