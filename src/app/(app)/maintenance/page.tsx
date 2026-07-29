import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { listMaintenanceRequestsReportedBy, listMaintenanceRequestsForUserAssets, type MaintenanceRequestWithNames } from "@/lib/models";
import {
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_STATUS_BADGE_CLASSES,
  MAINTENANCE_PRIORITY_BADGE_CLASSES,
} from "@/lib/constants";
import { isFeatureEnabled } from "@/lib/features";
import Badge from "@/components/Badge";
import Toast from "@/components/Toast";

function formatDate(ts: number | null) {
  if (!ts) return "-";
  return new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function RequestsTable({ rows, emptyMessage }: { rows: MaintenanceRequestWithNames[]; emptyMessage: string }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200">
        <tr>
          <th className="text-left px-5 py-2 font-medium">Asset</th>
          <th className="text-left px-5 py-2 font-medium">Title</th>
          <th className="text-left px-5 py-2 font-medium">Priority</th>
          <th className="text-left px-5 py-2 font-medium">Status</th>
          <th className="text-left px-5 py-2 font-medium">Opened</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((r) => (
          <tr key={r.id}>
            <td className="px-5 py-2.5">
              <Link href={`/maintenance/${r.id}`} className="text-slate-900 font-medium hover:underline">
                {r.asset_name}
              </Link>
            </td>
            <td className="px-5 py-2.5 text-slate-600 max-w-xs truncate">{r.title}</td>
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
            <td className="px-5 py-2.5 text-slate-500">{formatDate(r.opened_at)}</td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
              {emptyMessage}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

export default async function StaffMaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string; cancelled?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/signin");
  if (!(await isFeatureEnabled("maintenance_tracking"))) redirect("/dashboard");

  const query = await searchParams;
  const [myRequests, assetHistory] = await Promise.all([
    listMaintenanceRequestsReportedBy(session.userId),
    listMaintenanceRequestsForUserAssets(session.userId),
  ]);

  return (
    <div>
      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 mb-1">My Maintenance Requests</h1>
          <p className="text-sm text-slate-500">Report an issue, track its status, and see the maintenance history of your assets.</p>
        </div>
        <Link
          href="/maintenance/new"
          className="shrink-0 bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition"
        >
          Create Request
        </Link>
      </div>

      {query.error && <Toast key={query.error} type="error" message={query.error} />}
      {query.created && <Toast type="success" message="Maintenance request submitted." />}
      {query.cancelled && <Toast type="success" message="Request cancelled." />}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-6">
        <h2 className="text-sm font-semibold text-slate-900 px-5 py-3 border-b border-slate-200">
          Requests I Reported ({myRequests.length})
        </h2>
        <RequestsTable rows={myRequests} emptyMessage="You haven't reported any maintenance requests yet." />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <h2 className="text-sm font-semibold text-slate-900 px-5 py-3 border-b border-slate-200">
          History For My Assets ({assetHistory.length})
        </h2>
        <RequestsTable rows={assetHistory} emptyMessage="No maintenance history for assets currently allocated to you." />
      </div>
    </div>
  );
}
