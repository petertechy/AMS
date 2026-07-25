import Link from "next/link";
import { listReassignmentRequests } from "@/lib/models";
import { resolveReassignmentRequestAction } from "@/app/actions/allocations";
import Badge from "@/components/Badge";
import SubmitButton from "@/components/SubmitButton";
import Toast from "@/components/Toast";

function formatDate(ts: number | null) {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const REQUEST_STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ resolved?: string }>;
}) {
  const query = await searchParams;
  const pending = await listReassignmentRequests({ status: "PENDING" });
  const resolved = (await listReassignmentRequests()).filter((r) => r.status !== "PENDING");

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 mb-1">Reassignment Requests</h1>
      <p className="text-sm text-slate-500 mb-6">Review and resolve staff requests to reassign assets.</p>

      {query.resolved && <Toast type="success" message="Request resolved." />}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-6">
        <h2 className="text-sm font-semibold text-slate-900 px-5 py-3 border-b border-slate-200">
          Pending ({pending.length})
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-2 font-medium">Asset</th>
              <th className="text-left px-5 py-2 font-medium">Requested by</th>
              <th className="text-left px-5 py-2 font-medium">Reason</th>
              <th className="text-left px-5 py-2 font-medium">Submitted</th>
              <th className="text-right px-5 py-2 font-medium">Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pending.map((r) => (
              <tr key={r.id}>
                <td className="px-5 py-2.5">
                  <Link href={`/assets/${r.asset_id}`} className="text-slate-900 font-medium hover:underline">
                    {r.asset_name}
                  </Link>
                </td>
                <td className="px-5 py-2.5 text-slate-600">{r.requested_by_name}</td>
                <td className="px-5 py-2.5 text-slate-600 max-w-xs">{r.reason}</td>
                <td className="px-5 py-2.5 text-slate-500">{formatDate(r.requested_at)}</td>
                <td className="px-5 py-2.5">
                  <div className="flex gap-2 justify-end">
                    <form action={resolveReassignmentRequestAction}>
                      <input type="hidden" name="requestId" value={r.id} />
                      <input type="hidden" name="decision" value="APPROVED" />
                      <SubmitButton
                        pendingLabel="…"
                        className="text-emerald-700 border border-emerald-200 bg-emerald-50 rounded-md px-2.5 py-1 text-xs font-medium hover:bg-emerald-100"
                      >
                        Approve
                      </SubmitButton>
                    </form>
                    <form action={resolveReassignmentRequestAction}>
                      <input type="hidden" name="requestId" value={r.id} />
                      <input type="hidden" name="decision" value="REJECTED" />
                      <SubmitButton
                        pendingLabel="…"
                        className="text-red-700 border border-red-200 bg-red-50 rounded-md px-2.5 py-1 text-xs font-medium hover:bg-red-100"
                      >
                        Reject
                      </SubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {pending.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                  No pending requests.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <h2 className="text-sm font-semibold text-slate-900 px-5 py-3 border-b border-slate-200">
          Resolved
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-2 font-medium">Asset</th>
              <th className="text-left px-5 py-2 font-medium">Requested by</th>
              <th className="text-left px-5 py-2 font-medium">Status</th>
              <th className="text-left px-5 py-2 font-medium">Resolved by</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {resolved.map((r) => (
              <tr key={r.id}>
                <td className="px-5 py-2.5">
                  <Link href={`/assets/${r.asset_id}`} className="text-slate-900 hover:underline">
                    {r.asset_name}
                  </Link>
                </td>
                <td className="px-5 py-2.5 text-slate-600">{r.requested_by_name}</td>
                <td className="px-5 py-2.5">
                  <Badge className={REQUEST_STATUS_BADGE[r.status]}>{r.status}</Badge>
                </td>
                <td className="px-5 py-2.5 text-slate-500">{r.resolved_by_name || "-"}</td>
              </tr>
            ))}
            {resolved.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                  No resolved requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
