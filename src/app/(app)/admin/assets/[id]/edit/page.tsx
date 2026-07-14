import { notFound } from "next/navigation";
import AssetForm from "@/components/AssetForm";
import { updateAssetDetailsAction } from "@/app/actions/assets";
import { getAssetById } from "@/lib/models";
import { isFeatureEnabled } from "@/lib/features";

export default async function EditAssetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const asset = await getAssetById(Number(id));
  if (!asset) notFound();
  const showValue = await isFeatureEnabled("asset_value_tracking");

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900 mb-6">Edit asset</h1>
      {query.error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm px-3 py-2">
          {query.error}
        </div>
      )}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <AssetForm action={updateAssetDetailsAction} asset={asset} submitLabel="Save changes" showValue={showValue} />
      </div>
    </div>
  );
}
