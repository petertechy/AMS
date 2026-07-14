import AssetForm from "@/components/AssetForm";
import { createAssetAction } from "@/app/actions/assets";
import { isFeatureEnabled } from "@/lib/features";

export default async function NewAssetPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const showValue = await isFeatureEnabled("asset_value_tracking");

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900 mb-6">Register new asset</h1>
      {params.error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm px-3 py-2">
          {params.error}
        </div>
      )}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <AssetForm action={createAssetAction} submitLabel="Register asset" showCondition showValue={showValue} />
      </div>
    </div>
  );
}
