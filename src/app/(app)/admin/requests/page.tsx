import Link from "next/link";
import { listReassignmentRequests, listUsers } from "@/lib/models";
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
  searchParams: Promise<{ resolved?: string; error?: string; q?: string; sort?: string }>;
}) {
  const query = await searchParams;
  const q = query.q || undefined;
  const sort = query.sort || "requested_desc";
  const pending = await listReassignmentRequests({ status: "PENDING", q, sort });
  const resolved = (await listReassignmentRequests({ q, sort })).filter((r) => r.status !== "PENDING");
  const users = await listUsers();

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 mb-1">Reassignment Requests</h1>
      <p className="text-sm text-slate-500 mb-6">
        Review staff requests to reassign an asset. Approving picks a new owner and moves the
        asset immediately &mdash; the current holder is automatically checked in first.
      </p>

      {query.error && <Toast key={query.error} type="error" message={query.error} />}
      {query.resolved && <Toast type="success" message="Request resolved." />}

      <form className="bg-white border border-slate-200 rounded-lg p-4 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
          <input
            name="q"
            defaultValue={q || ""}
            placeholder="Asset, requester or reason…"
            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Sort by</label>
          <select
            name="sort"
            defaultValue={sort}
            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm bg-white"
          >
            <option value="requested_desc">Submitted (newest first)</option>
            <option value="requested_asc">Submitted (oldest first)</option>
            <option value="asset_asc">Asset name (A–Z)</option>
            <option value="requester_asc">Requester name (A–Z)</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-slate-900 text-white rounded-md px-4 py-1.5 text-sm font-medium hover:bg-slate-800 transition"
          >
            Apply
          </button>
          {(q || query.sort) && (
            <Link href="/admin/requests" className="text-sm text-slate-500 hover:text-slate-900 self-center">
              Clear
            </Link>
          )}
        </div>
      </form>

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
              <th className="text-right px-5 py-2 font-medium">Reassign to / Decision</th>
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
                  {/* One form per row: the select is shared by both buttons, and each submit
                      button carries its own decision via name/value — Reject ignores newOwnerId,
                      Approve requires it (validated server-side in resolveReassignmentRequestAction). */}
                  <form action={resolveReassignmentRequestAction} className="flex flex-col items-end gap-1.5">
                    <input type="hidden" name="requestId" value={r.id} />
                    <select
                      name="newOwnerId"
                      defaultValue={r.new_owner_id ?? ""}
                      className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs bg-white"
                    >
                      <option value={r.new_owner_id ?? ""}>
                        {r.new_owner_name ? `Suggested: ${r.new_owner_name}` : "Choose new owner…"}
                      </option>
                      {users
                        .filter((u) => u.id !== r.new_owner_id)
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                    </select>
                    <div className="flex gap-2">
                      <SubmitButton
                        name="decision"
                        value="APPROVED"
                        pendingLabel="…"
                        className="text-emerald-700 border border-emerald-200 bg-emerald-50 rounded-md px-2.5 py-1 text-xs font-medium hover:bg-emerald-100"
                      >
                        Approve
                      </SubmitButton>
                      <SubmitButton
                        name="decision"
                        value="REJECTED"
                        pendingLabel="…"
                        className="text-red-700 border border-red-200 bg-red-50 rounded-md px-2.5 py-1 text-xs font-medium hover:bg-red-100"
                      >
                        Reject
                      </SubmitButton>
                    </div>
                  </form>
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
              <th className="text-left px-5 py-2 font-medium">Reassigned to</th>
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
                <td className="px-5 py-2.5 text-slate-600">
                  {r.status === "APPROVED" ? r.new_owner_name || "-" : "-"}
                </td>
                <td className="px-5 py-2.5 text-slate-500">{r.resolved_by_name || "-"}</td>
              </tr>
            ))}
            {resolved.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
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
