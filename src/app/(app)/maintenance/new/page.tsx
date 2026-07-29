import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { listAssets, listAllocationsForUser } from "@/lib/models";
import { isFeatureEnabled } from "@/lib/features";
import MaintenanceRequestForm from "@/components/MaintenanceRequestForm";
import Toast from "@/components/Toast";

export default async function NewStaffMaintenanceRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/signin");
  if (!(await isFeatureEnabled("maintenance_tracking"))) redirect("/dashboard");

  const query = await searchParams;
  const [allAssets, myAllocations] = await Promise.all([listAssets(), listAllocationsForUser(session.userId)]);
  const myAssetIds = new Set(myAllocations.filter((a) => !a.returned_at).map((a) => a.asset_id));
  const assets = allAssets.filter((a) => a.status === "AVAILABLE" || myAssetIds.has(a.id));

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 mb-1">Create Maintenance Request</h1>
          <p className="text-sm text-slate-500">Track an issue, its priority, and the asset it affects.</p>
        </div>
        <Link href="/maintenance" className="text-sm text-slate-500 hover:text-slate-900 underline shrink-0">
          Back to Maintenance
        </Link>
      </div>

      {query.error && <Toast key={query.error} type="error" message={query.error} />}

      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <MaintenanceRequestForm assets={assets} basePath="/maintenance" cancelHref="/maintenance" />
      </div>
      {assets.length === 0 && (
        <p className="text-xs text-slate-400 mt-2">
          No assets are currently allocated to you or available. Contact an admin if you need to report an issue.
        </p>
      )}
    </div>
  );
}
