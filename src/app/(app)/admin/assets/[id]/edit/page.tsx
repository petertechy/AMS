import { notFound } from "next/navigation";
import AssetForm from "@/components/AssetForm";
import Toast from "@/components/Toast";
import { updateAssetDetailsAction } from "@/app/actions/assets";
import { getAssetById, listDepartments } from "@/lib/models";
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
  const departments = (await listDepartments()).map((d) => d.name);

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900 mb-6">Edit asset</h1>
      {query.error && <Toast key={query.error} type="error" message={query.error} />}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <AssetForm
          action={updateAssetDetailsAction}
          asset={asset}
          submitLabel="Save changes"
          showValue={showValue}
          departments={departments}
        />
      </div>
    </div>
  );
}
