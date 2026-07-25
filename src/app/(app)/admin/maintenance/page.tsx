import Link from "next/link";
import { listOpenMaintenanceRecords, listMaintenanceHistory, listAssets } from "@/lib/models";
import { openMaintenanceAction, completeMaintenanceAction } from "@/app/actions/maintenance";
import { isFeatureEnabled } from "@/lib/features";
import SubmitButton from "@/components/SubmitButton";
import Toast from "@/components/Toast";

function formatDate(ts: number | null) {
  if (!ts) return "-";
  return new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; opened?: string; completed?: string }>;
}) {
  const query = await searchParams;
  const open = await listOpenMaintenanceRecords();
  const history = await listMaintenanceHistory();
  const availableAssets = await listAssets({ status: "AVAILABLE" });
  const showValue = await isFeatureEnabled("asset_value_tracking");

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 mb-1">Maintenance</h1>
      <p className="text-sm text-slate-500 mb-6">Schedule and track maintenance work on available assets.</p>

      {query.error && <Toast key={query.error} type="error" message={query.error} />}
      {query.opened && <Toast type="success" message="Maintenance record opened." />}
      {query.completed && <Toast type="success" message="Maintenance marked complete." />}

      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Open a maintenance record</h2>
        <form action={openMaintenanceAction} className="grid sm:grid-cols-4 gap-3 items-end">
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
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
            <input
              name="description"
              required
              placeholder="What needs doing?"
              className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
            />
          </div>
          <div className="sm:col-span-4">
            <SubmitButton
              pendingLabel="Opening…"
              className="bg-slate-900 text-white rounded-md px-4 py-1.5 text-sm font-medium hover:bg-slate-800 transition"
            >
              Open record
            </SubmitButton>
          </div>
        </form>
        {availableAssets.length === 0 && (
          <p className="text-xs text-slate-400 mt-2">No assets are currently available to send for maintenance.</p>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-6">
        <h2 className="text-sm font-semibold text-slate-900 px-5 py-3 border-b border-slate-200">
          Open ({open.length})
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-2 font-medium">Asset</th>
              <th className="text-left px-5 py-2 font-medium">Description</th>
              <th className="text-left px-5 py-2 font-medium">Opened</th>
              <th className="text-right px-5 py-2 font-medium">Complete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {open.map((m) => (
              <tr key={m.id}>
                <td className="px-5 py-2.5">
                  <Link href={`/assets/${m.asset_id}`} className="text-slate-900 font-medium hover:underline">
                    {m.asset_name}
                  </Link>
                </td>
                <td className="px-5 py-2.5 text-slate-600 max-w-xs truncate">{m.description}</td>
                <td className="px-5 py-2.5 text-slate-500">{formatDate(m.opened_at)}</td>
                <td className="px-5 py-2.5">
                  <form action={completeMaintenanceAction} className="flex items-center gap-2 justify-end">
                    <input type="hidden" name="id" value={m.id} />
                    <input
                      type="text"
                      name="notes"
                      placeholder="Notes"
                      className="hidden md:block w-32 rounded-md border border-slate-300 px-2 py-1 text-xs"
                    />
                    {showValue && (
                      <input
                        type="number"
                        step="0.01"
                        name="cost"
                        placeholder="Cost £"
                        className="hidden lg:block w-20 rounded-md border border-slate-300 px-2 py-1 text-xs"
                      />
                    )}
                    <SubmitButton
                      pendingLabel="…"
                      className="text-emerald-700 border border-emerald-200 bg-emerald-50 rounded-md px-2.5 py-1 text-xs font-medium hover:bg-emerald-100"
                    >
                      Mark complete
                    </SubmitButton>
                  </form>
                </td>
              </tr>
            ))}
            {open.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                  No open maintenance records.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <h2 className="text-sm font-semibold text-slate-900 px-5 py-3 border-b border-slate-200">History</h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-2 font-medium">Asset</th>
              <th className="text-left px-5 py-2 font-medium">Description</th>
              <th className="text-left px-5 py-2 font-medium">Completed</th>
              {showValue && <th className="text-left px-5 py-2 font-medium">Cost</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {history.map((m) => (
              <tr key={m.id}>
                <td className="px-5 py-2.5">
                  <Link href={`/assets/${m.asset_id}`} className="text-slate-900 hover:underline">
                    {m.asset_name}
                  </Link>
                </td>
                <td className="px-5 py-2.5 text-slate-600 max-w-xs truncate">{m.description}</td>
                <td className="px-5 py-2.5 text-slate-500">{formatDate(m.completed_at)}</td>
                {showValue && (
                  <td className="px-5 py-2.5 text-slate-500">{m.cost != null ? `£${m.cost.toFixed(2)}` : "-"}</td>
                )}
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan={showValue ? 4 : 3} className="px-5 py-8 text-center text-slate-400">
                  No completed maintenance yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
