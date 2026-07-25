import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { listAssets, listAllocationsForUser } from "@/lib/models";
import { checkOutAssetAction, checkInAssetAction } from "@/app/actions/checkout";
import { isFeatureEnabled } from "@/lib/features";
import SubmitButton from "@/components/SubmitButton";
import Toast from "@/components/Toast";

function formatDate(ts: number | null) {
  if (!ts) return "-";
  return new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; checkedOut?: string; checkedIn?: string }>;
}) {
  const query = await searchParams;
  const session = await getSession();
  if (!session) redirect("/signin");

  if (!(await isFeatureEnabled("self_service_checkout"))) redirect("/dashboard");

  const availableAssets = await listAssets({ status: "AVAILABLE" });
  const allocations = await listAllocationsForUser(session.userId);
  const active = allocations.filter((a) => !a.returned_at);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 mb-1">Check-in / Check-out</h1>
      <p className="text-sm text-slate-500 mb-6">
        Instantly check out an available asset to yourself, and check it back in when you&apos;re done.
      </p>

      {query.error && <Toast key={query.error} type="error" message={query.error} />}
      {query.checkedOut && <Toast type="success" message="Asset checked out to you." />}
      {query.checkedIn && <Toast type="success" message="Asset checked in." />}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-6">
        <h2 className="text-sm font-semibold text-slate-900 px-5 py-3 border-b border-slate-200">
          Currently checked out to you ({active.length})
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-2 font-medium">Asset</th>
              <th className="text-left px-5 py-2 font-medium">Checked out</th>
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
                <td className="px-5 py-2.5 text-slate-500">{formatDate(a.allocated_at)}</td>
                <td className="px-5 py-2.5 text-right">
                  <form action={checkInAssetAction}>
                    <input type="hidden" name="assetId" value={a.asset_id} />
                    <input type="hidden" name="returnTo" value="/checkout" />
                    <SubmitButton pendingLabel="…" className="text-slate-500 hover:text-slate-900 underline">
                      Check in
                    </SubmitButton>
                  </form>
                </td>
              </tr>
            ))}
            {active.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-6 text-center text-slate-400">
                  Nothing checked out to you right now.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <h2 className="text-sm font-semibold text-slate-900 px-5 py-3 border-b border-slate-200">
          Available to check out ({availableAssets.length})
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-2 font-medium">Asset</th>
              <th className="text-left px-5 py-2 font-medium hidden sm:table-cell">Department</th>
              <th className="text-right px-5 py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {availableAssets.map((a) => (
              <tr key={a.id}>
                <td className="px-5 py-2.5">
                  <Link href={`/assets/${a.id}`} className="text-slate-900 font-medium hover:underline">
                    {a.name}
                  </Link>
                </td>
                <td className="px-5 py-2.5 text-slate-600 hidden sm:table-cell">{a.department}</td>
                <td className="px-5 py-2.5 text-right">
                  <form action={checkOutAssetAction}>
                    <input type="hidden" name="assetId" value={a.id} />
                    <input type="hidden" name="returnTo" value="/checkout" />
                    <SubmitButton
                      pendingLabel="…"
                      className="bg-slate-900 text-white rounded-md px-3 py-1 text-xs font-medium hover:bg-slate-800 transition"
                    >
                      Check out
                    </SubmitButton>
                  </form>
                </td>
              </tr>
            ))}
            {availableAssets.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-6 text-center text-slate-400">
                  No assets are currently available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
