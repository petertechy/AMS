import Link from "next/link";
import { listAssets } from "@/lib/models";
import { CONDITION_BADGE_CLASSES, STATUS_BADGE_CLASSES, CONDITION_LABELS, STATUS_LABELS } from "@/lib/constants";
import Badge from "@/components/Badge";

export default async function AdminAssetsPage() {
  const assets = await listAssets();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Manage Assets</h1>
          <p className="text-sm text-slate-500 mt-1">Register new assets and edit existing records.</p>
        </div>
        <Link
          href="/admin/assets/new"
          className="bg-slate-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-800 transition"
        >
          + Register asset
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Asset</th>
              <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">Department</th>
              <th className="text-left px-4 py-2 font-medium">Condition</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-right px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assets.map((asset) => (
              <tr key={asset.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/assets/${asset.id}`} className="font-medium text-slate-900 hover:underline">
                    {asset.name}
                  </Link>
                  <div className="text-xs text-slate-400">{asset.category}</div>
                </td>
                <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{asset.department}</td>
                <td className="px-4 py-3">
                  <Badge className={CONDITION_BADGE_CLASSES[asset.condition]}>
                    {CONDITION_LABELS[asset.condition]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge className={STATUS_BADGE_CLASSES[asset.status]}>{STATUS_LABELS[asset.status]}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/assets/${asset.id}/edit`} className="text-slate-500 hover:text-slate-900 underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {assets.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No assets registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
