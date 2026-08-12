import Link from "next/link";
import {
  listAssets,
  distinctAssetValues,
  type AssetFilters,
} from "@/lib/models";
import {
  ASSET_CATEGORIES,
  ASSET_CONDITIONS,
  ASSET_STATUSES,
  CONDITION_LABELS,
  STATUS_LABELS,
  CONDITION_BADGE_CLASSES,
  STATUS_BADGE_CLASSES,
} from "@/lib/constants";
import Badge from "@/components/Badge";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters: AssetFilters = {
    department: sp.department || undefined,
    category: sp.category || undefined,
    condition: sp.condition || undefined,
    status: sp.status || undefined,
    location: sp.location || undefined,
    q: sp.q || undefined,
    sort: sp.sort || undefined,
  };

  const assets = await listAssets(filters);
  const departments = await distinctAssetValues("department");
  const locations = await distinctAssetValues("location");
  const allAssets = await listAssets({});

  const stats = [
    { label: "Total assets", value: allAssets.length, accent: "text-slate-900" },
    {
      label: "Available",
      value: allAssets.filter((a) => a.status === "AVAILABLE").length,
      accent: "text-emerald-600",
    },
    {
      label: "Allocated",
      value: allAssets.filter((a) => a.status === "ALLOCATED").length,
      accent: "text-slate-600",
    },
    {
      label: "In maintenance",
      value: allAssets.filter((a) => a.status === "IN_MAINTENANCE").length,
      accent: "text-amber-600",
    },
  ];

  const hasFilters = [filters.department, filters.category, filters.condition, filters.status, filters.location, filters.q].some(
    Boolean
  );

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-semibold mt-1 ${s.accent}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Assets</h1>
          <p className="text-sm text-slate-500 mt-1">
            {assets.length} asset{assets.length === 1 ? "" : "s"}
            {hasFilters ? " matching your filters" : " registered"}
          </p>
        </div>
      </div>

      <form className="bg-white border border-slate-200 rounded-lg p-4 mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="col-span-2 sm:col-span-3 lg:col-span-2">
          <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Name, serial, spec..."
            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Department</label>
          <select
            name="department"
            defaultValue={filters.department || ""}
            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm bg-white"
          >
            <option value="">All</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
          <select
            name="category"
            defaultValue={filters.category || ""}
            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm bg-white"
          >
            <option value="">All</option>
            {ASSET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Condition</label>
          <select
            name="condition"
            defaultValue={filters.condition || ""}
            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm bg-white"
          >
            <option value="">All</option>
            {ASSET_CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {CONDITION_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
          <select
            name="status"
            defaultValue={filters.status || ""}
            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm bg-white"
          >
            <option value="">All</option>
            {ASSET_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Location</label>
          <select
            name="location"
            defaultValue={filters.location || ""}
            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm bg-white"
          >
            <option value="">All</option>
            {locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Sort by</label>
          <select
            name="sort"
            defaultValue={filters.sort || "name_asc"}
            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm bg-white"
          >
            <option value="name_asc">Name (A–Z)</option>
            <option value="name_desc">Name (Z–A)</option>
            <option value="department_asc">Department (A–Z)</option>
            <option value="condition_asc">Condition</option>
            <option value="status_asc">Status</option>
          </select>
        </div>
        <div className="col-span-2 sm:col-span-3 lg:col-span-6 flex gap-2 justify-end">
          {hasFilters && (
            <Link
              href="/dashboard"
              className="text-sm text-slate-500 hover:text-slate-900 self-center"
            >
              Clear filters
            </Link>
          )}
          <button
            type="submit"
            className="bg-slate-900 text-white rounded-md px-4 py-1.5 text-sm font-medium hover:bg-slate-800 transition"
          >
            Apply filters
          </button>
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Asset</th>
              <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">Department</th>
              <th className="text-left px-4 py-2 font-medium hidden md:table-cell">Location</th>
              <th className="text-left px-4 py-2 font-medium">Condition</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
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
                <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{asset.location}</td>
                <td className="px-4 py-3">
                  <Badge className={CONDITION_BADGE_CLASSES[asset.condition]}>
                    {CONDITION_LABELS[asset.condition]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge className={STATUS_BADGE_CLASSES[asset.status]}>
                    {STATUS_LABELS[asset.status]}
                  </Badge>
                </td>
              </tr>
            ))}
            {assets.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No assets match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
