import AssetForm from "@/components/AssetForm";
import Toast from "@/components/Toast";
import { createAssetAction } from "@/app/actions/assets";
import { isFeatureEnabled } from "@/lib/features";
import { listDepartments } from "@/lib/models";

export default async function NewAssetPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const showValue = await isFeatureEnabled("asset_value_tracking");
  const departments = (await listDepartments()).map((d) => d.name);

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900 mb-6">Register new asset</h1>
      {params.error && <Toast key={params.error} type="error" message={params.error} />}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <AssetForm
          action={createAssetAction}
          submitLabel="Register asset"
          showCondition
          showValue={showValue}
          departments={departments}
        />
      </div>
    </div>
  );
}
