import Link from "next/link";
import { getSession } from "@/lib/session";
import { listAllocationsForUser, listReassignmentRequests } from "@/lib/models";
import Badge from "@/components/Badge";

function formatDate(ts: number | null) {
  if (!ts) return "-";
  return new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const REQUEST_STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

export default async function MyAllocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const query = await searchParams;
  const q = query.q || undefined;
  const sort = query.sort || "allocated_desc";

  const allocations = await listAllocationsForUser(session.userId, { q, sort });
  const active = allocations.filter((a) => !a.returned_at);
  const past = allocations.filter((a) => a.returned_at);
  const myRequests = await listReassignmentRequests({ requestedBy: session.userId });

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 mb-1">My Allocations</h1>
      <p className="text-sm text-slate-500 mb-6">Assets currently assigned to you and your allocation history.</p>

      <form className="bg-white border border-slate-200 rounded-lg p-4 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-500 mb-1">Search by asset</label>
          <input
            name="q"
            defaultValue={q || ""}
            placeholder="Asset name…"
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
            <option value="allocated_desc">Allocated (newest first)</option>
            <option value="allocated_asc">Allocated (oldest first)</option>
            <option value="asset_asc">Asset name (A–Z)</option>
            <option value="asset_desc">Asset name (Z–A)</option>
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
            <Link href="/allocations" className="text-sm text-slate-500 hover:text-slate-900 self-center">
              Clear
            </Link>
          )}
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-6">
        <h2 className="text-sm font-semibold text-slate-900 px-5 py-3 border-b border-slate-200">
          Currently allocated ({active.length})
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-2 font-medium">Asset</th>
              <th className="text-left px-5 py-2 font-medium">Allocated on</th>
              <th className="text-left px-5 py-2 font-medium hidden sm:table-cell">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {active.map((a) => (
              <tr key={a.id}>
                <td className="px-5 py-2.5">
                  <Link href={`/assets/${a.asset_id}`} className="text-slate-900 font-medium hover:underline">
                    {a.asset_name}
                  </Link>
                </td>
                <td className="px-5 py-2.5 text-slate-500">{formatDate(a.allocated_at)}</td>
                <td className="px-5 py-2.5 text-slate-500 hidden sm:table-cell">{a.notes || "-"}</td>
              </tr>
            ))}
            {active.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-6 text-center text-slate-400">
                  No assets currently allocated to you.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-6">
        <h2 className="text-sm font-semibold text-slate-900 px-5 py-3 border-b border-slate-200">
          Allocation history
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-2 font-medium">Asset</th>
              <th className="text-left px-5 py-2 font-medium">Allocated</th>
              <th className="text-left px-5 py-2 font-medium">Returned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {past.map((a) => (
              <tr key={a.id}>
                <td className="px-5 py-2.5">
                  <Link href={`/assets/${a.asset_id}`} className="text-slate-900 hover:underline">
                    {a.asset_name}
                  </Link>
                </td>
                <td className="px-5 py-2.5 text-slate-500">{formatDate(a.allocated_at)}</td>
                <td className="px-5 py-2.5 text-slate-500">{formatDate(a.returned_at)}</td>
              </tr>
            ))}
            {past.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-6 text-center text-slate-400">
                  No past allocations.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <h2 className="text-sm font-semibold text-slate-900 px-5 py-3 border-b border-slate-200">
          My reassignment requests
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-2 font-medium">Asset</th>
              <th className="text-left px-5 py-2 font-medium">Reason</th>
              <th className="text-left px-5 py-2 font-medium">Status</th>
              <th className="text-left px-5 py-2 font-medium">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {myRequests.map((r) => (
              <tr key={r.id}>
                <td className="px-5 py-2.5">
                  <Link href={`/assets/${r.asset_id}`} className="text-slate-900 hover:underline">
                    {r.asset_name}
                  </Link>
                </td>
                <td className="px-5 py-2.5 text-slate-500 max-w-xs truncate">{r.reason}</td>
                <td className="px-5 py-2.5">
                  <Badge className={REQUEST_STATUS_BADGE[r.status]}>{r.status}</Badge>
                </td>
                <td className="px-5 py-2.5 text-slate-500">{formatDate(r.requested_at)}</td>
              </tr>
            ))}
            {myRequests.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-center text-slate-400">
                  You haven&apos;t submitted any reassignment requests.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
