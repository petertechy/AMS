import Link from "next/link";
import { listAllAllocations, listAssets, listUsers } from "@/lib/models";
import { allocateAssetAction, returnAllocationAction } from "@/app/actions/allocations";
import SubmitButton from "@/components/SubmitButton";
import Toast from "@/components/Toast";

function formatDate(ts: number | null) {
  if (!ts) return "-";
  return new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function AdminAllocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; allocated?: string; returned?: string }>;
}) {
  const query = await searchParams;
  const allocations = await listAllAllocations();
  const active = allocations.filter((a) => !a.returned_at);
  const availableAssets = await listAssets({ status: "AVAILABLE" });
  const users = await listUsers();

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 mb-1">Allocations</h1>
      <p className="text-sm text-slate-500 mb-6">Assign assets to staff and track availability.</p>

      {query.error && <Toast key={query.error} type="error" message={query.error} />}
      {query.allocated && <Toast type="success" message="Asset allocated." />}
      {query.returned && (
        <Toast type="success" message="Asset marked as returned and made available." />
      )}

      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Allocate an asset</h2>
        <form action={allocateAssetAction} className="grid sm:grid-cols-4 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Available asset</label>
            <select
              name="assetId"
              required
              className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm bg-white"
            >
              {availableAssets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.department})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Assign to</label>
            <select
              name="userId"
              required
              className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm bg-white"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <SubmitButton
              pendingLabel="Allocating…"
              className="w-full bg-slate-900 text-white rounded-md px-4 py-1.5 text-sm font-medium hover:bg-slate-800 transition"
            >
              Allocate
            </SubmitButton>
          </div>
          <div className="sm:col-span-4">
            <label className="block text-xs font-medium text-slate-500 mb-1">Notes (optional)</label>
            <input
              name="notes"
              className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
            />
          </div>
        </form>
        {availableAssets.length === 0 && (
          <p className="text-xs text-slate-400 mt-2">No assets are currently available to allocate.</p>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <h2 className="text-sm font-semibold text-slate-900 px-5 py-3 border-b border-slate-200">
          Active allocations ({active.length})
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-2 font-medium">Asset</th>
              <th className="text-left px-5 py-2 font-medium">Holder</th>
              <th className="text-left px-5 py-2 font-medium">Since</th>
              <th className="text-right px-5 py-2 font-medium">Action</th>
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
                <td className="px-5 py-2.5 text-slate-600">
                  {a.user_name} <span className="text-slate-400">({a.user_email})</span>
                </td>
                <td className="px-5 py-2.5 text-slate-500">{formatDate(a.allocated_at)}</td>
                <td className="px-5 py-2.5 text-right">
                  <form action={returnAllocationAction}>
                    <input type="hidden" name="allocationId" value={a.id} />
                    <input type="hidden" name="assetId" value={a.asset_id} />
                    <SubmitButton pendingLabel="…" className="text-slate-500 hover:text-slate-900 underline">
                      Mark returned
                    </SubmitButton>
                  </form>
                </td>
              </tr>
            ))}
            {active.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                  No active allocations.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
