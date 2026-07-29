import Link from "next/link";
import {
  listMaintenanceRequests,
  getMaintenanceStats,
  listAssets,
  listUsers,
  type MaintenanceRequestFilters,
} from "@/lib/models";
import {
  MAINTENANCE_STATUSES,
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_STATUS_BADGE_CLASSES,
  MAINTENANCE_PRIORITY_BADGE_CLASSES,
} from "@/lib/constants";
import Badge from "@/components/Badge";
import Toast from "@/components/Toast";

const PER_PAGE_OPTIONS = [15, 25, 50, 100];

function formatDate(ts: number | null) {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function startOfDay(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00`).getTime();
}

function endOfDay(dateStr: string): number {
  return new Date(`${dateStr}T23:59:59.999`).getTime();
}

type MaintenanceSearchParams = {
  q?: string;
  assetId?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  reporterId?: string;
  openedFrom?: string;
  openedTo?: string;
  perPage?: string;
  page?: string;
  error?: string;
  created?: string;
  updated?: string;
  assigned?: string;
  started?: string;
  resolved?: string;
  closed?: string;
  cancelled?: string;
  deleted?: string;
  uploaded?: string;
  commented?: string;
};

export default async function AdminMaintenancePage({
  searchParams,
}: {
  searchParams: Promise<MaintenanceSearchParams>;
}) {
  const query = await searchParams;

  const [assets, users, stats] = await Promise.all([listAssets(), listUsers(), getMaintenanceStats()]);

  const perPage = PER_PAGE_OPTIONS.includes(Number(query.perPage)) ? Number(query.perPage) : 15;
  const page = Math.max(1, Number(query.page) || 1);

  const filters: MaintenanceRequestFilters = {};
  if (query.q) filters.q = query.q;
  if (query.assetId) filters.assetId = Number(query.assetId);
  if (query.status) filters.status = query.status;
  if (query.priority) filters.priority = query.priority;
  if (query.assigneeId) filters.assigneeId = Number(query.assigneeId);
  if (query.reporterId) filters.reporterId = Number(query.reporterId);
  if (query.openedFrom) filters.openedFrom = startOfDay(query.openedFrom);
  if (query.openedTo) filters.openedTo = endOfDay(query.openedTo);

  const { rows, total } = await listMaintenanceRequests(filters, {
    limit: perPage,
    offset: (page - 1) * perPage,
  });
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const buildHref = (overrides: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    const merged = { ...query, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (
        value !== undefined &&
        value !== "" &&
        !["error", "created", "updated", "assigned", "started", "resolved", "closed", "cancelled", "deleted", "uploaded", "commented"].includes(
          key
        )
      ) {
        params.set(key, String(value));
      }
    }
    const qs = params.toString();
    return `/admin/maintenance${qs ? `?${qs}` : ""}`;
  };

  const statCards: { label: string; value: number }[] = [
    { label: "Total", value: stats.total },
    { label: "Open", value: stats.open },
    { label: "In Progress", value: stats.inProgress },
    { label: "Resolved", value: stats.resolved },
    { label: "Closed", value: stats.closed },
    { label: "Cancelled", value: stats.cancelled },
    { label: "Critical", value: stats.critical },
    { label: "High Priority", value: stats.highPriority },
  ];

  return (
    <div>
      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 mb-1">Maintenance</h1>
          <p className="text-sm text-slate-500">Open, track, and review asset maintenance requests.</p>
        </div>
        <Link
          href="/admin/maintenance/new"
          className="shrink-0 bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition"
        >
          Create Request
        </Link>
      </div>

      {query.error && <Toast key={query.error} type="error" message={query.error} />}
      {query.created && <Toast type="success" message="Maintenance request created." />}
      {query.updated && <Toast type="success" message="Maintenance request updated." />}
      {query.assigned && <Toast type="success" message="Handler assigned." />}
      {query.started && <Toast type="success" message="Request marked in progress." />}
      {query.resolved && <Toast type="success" message="Request resolved." />}
      {query.closed && <Toast type="success" message="Request closed." />}
      {query.cancelled && <Toast type="success" message="Request cancelled." />}
      {query.deleted && <Toast type="success" message="Request deleted." />}
      {query.uploaded && <Toast type="success" message="Attachment uploaded." />}
      {query.commented && <Toast type="success" message="Comment posted." />}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{card.label}</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <form
        action="/admin/maintenance"
        method="get"
        className="bg-white border border-slate-200 rounded-lg p-5 mb-6 grid sm:grid-cols-4 gap-3"
      >
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
          <input
            name="q"
            defaultValue={query.q}
            placeholder="Title, description, asset tag/name, assignee"
            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Asset</label>
          <select name="assetId" defaultValue={query.assetId ?? ""} className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm bg-white">
            <option value="">All Assets</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
          <select name="status" defaultValue={query.status ?? ""} className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm bg-white">
            <option value="">All Statuses</option>
            {MAINTENANCE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {MAINTENANCE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Priority</label>
          <select name="priority" defaultValue={query.priority ?? ""} className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm bg-white">
            <option value="">All Priorities</option>
            {MAINTENANCE_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {MAINTENANCE_PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Assignee</label>
          <select name="assigneeId" defaultValue={query.assigneeId ?? ""} className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm bg-white">
            <option value="">All Assignees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Reporter</label>
          <select name="reporterId" defaultValue={query.reporterId ?? ""} className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm bg-white">
            <option value="">All Reporters</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Opened From</label>
          <input type="date" name="openedFrom" defaultValue={query.openedFrom} className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Opened To</label>
          <input type="date" name="openedTo" defaultValue={query.openedTo} className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Per Page</label>
          <select name="perPage" defaultValue={String(perPage)} className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm bg-white">
            {PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-4 flex gap-2">
          <button type="submit" className="bg-indigo-600 text-white rounded-md px-4 py-1.5 text-sm font-medium hover:bg-indigo-700 transition">
            Apply Filters
          </button>
          <Link href="/admin/maintenance" className="bg-white border border-slate-300 text-slate-700 rounded-md px-4 py-1.5 text-sm font-medium hover:bg-slate-50 transition">
            Reset Filters
          </Link>
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-2 font-medium">Asset</th>
                <th className="text-left px-5 py-2 font-medium">Title</th>
                <th className="text-left px-5 py-2 font-medium">Priority</th>
                <th className="text-left px-5 py-2 font-medium">Status</th>
                <th className="text-left px-5 py-2 font-medium">Reported By</th>
                <th className="text-left px-5 py-2 font-medium">Assigned To</th>
                <th className="text-left px-5 py-2 font-medium">Opened At</th>
                <th className="text-right px-5 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-2.5">
                    <Link href={`/assets/${r.asset_id}`} className="text-slate-900 font-medium hover:underline">
                      {r.asset_name}
                    </Link>
                    {r.asset_tag && <div className="text-xs text-slate-400">{r.asset_tag}</div>}
                  </td>
                  <td className="px-5 py-2.5 text-slate-700 max-w-xs truncate">{r.title}</td>
                  <td className="px-5 py-2.5">
                    <Badge className={MAINTENANCE_PRIORITY_BADGE_CLASSES[r.priority]}>
                      {MAINTENANCE_PRIORITY_LABELS[r.priority]}
                    </Badge>
                  </td>
                  <td className="px-5 py-2.5">
                    <Badge className={MAINTENANCE_STATUS_BADGE_CLASSES[r.status]}>
                      {MAINTENANCE_STATUS_LABELS[r.status]}
                    </Badge>
                  </td>
                  <td className="px-5 py-2.5 text-slate-600">{r.reporter_name}</td>
                  <td className="px-5 py-2.5 text-slate-600">{r.assignee_name || "-"}</td>
                  <td className="px-5 py-2.5 text-slate-500 whitespace-nowrap">{formatDate(r.opened_at)}</td>
                  <td className="px-5 py-2.5">
                    <div className="flex gap-2 justify-end">
                      <Link
                        href={`/admin/maintenance/${r.id}`}
                        className="bg-white border border-slate-300 text-slate-700 rounded-md px-2.5 py-1 text-xs font-medium hover:bg-slate-50"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/maintenance/${r.id}/edit`}
                        className="bg-white border border-slate-300 text-slate-700 rounded-md px-2.5 py-1 text-xs font-medium hover:bg-slate-50"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    No maintenance requests match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 text-sm text-slate-500">
          <span>
            Page {page} of {totalPages} &bull; {total} total requests
          </span>
          <div className="flex gap-2">
            <Link
              href={buildHref({ page: page > 1 ? page - 1 : 1 })}
              aria-disabled={page <= 1}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                page <= 1
                  ? "border-slate-200 text-slate-300 pointer-events-none"
                  : "border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Previous
            </Link>
            <Link
              href={buildHref({ page: page < totalPages ? page + 1 : totalPages })}
              aria-disabled={page >= totalPages}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                page >= totalPages
                  ? "border-slate-200 text-slate-300 pointer-events-none"
                  : "border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Next
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
