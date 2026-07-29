import Link from "next/link";
import { listAssets } from "@/lib/models";
import MaintenanceRequestForm from "@/components/MaintenanceRequestForm";
import Toast from "@/components/Toast";

export default async function NewAdminMaintenanceRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;
  const assets = await listAssets();

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 mb-1">Create Maintenance Request</h1>
          <p className="text-sm text-slate-500">Track an issue, its priority, and the asset it affects.</p>
        </div>
        <Link href="/admin/maintenance" className="text-sm text-slate-500 hover:text-slate-900 underline shrink-0">
          Back to Maintenance
        </Link>
      </div>

      {query.error && <Toast key={query.error} type="error" message={query.error} />}

      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <MaintenanceRequestForm assets={assets} basePath="/admin/maintenance" cancelHref="/admin/maintenance" />
      </div>
    </div>
  );
}
