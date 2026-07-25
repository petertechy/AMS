import { ASSET_CATEGORIES, ASSET_CONDITIONS, CONDITION_LABELS } from "@/lib/constants";
import type { AssetRow } from "@/lib/models";
import SubmitButton from "@/components/SubmitButton";

export default function AssetForm({
  action,
  asset,
  submitLabel,
  showCondition,
  showValue = true,
  departments,
}: {
  action: (formData: FormData) => Promise<void>;
  asset?: AssetRow;
  submitLabel: string;
  showCondition?: boolean;
  showValue?: boolean;
  departments: string[];
}) {
  const departmentOptions =
    asset?.department && !departments.includes(asset.department)
      ? [...departments, asset.department]
      : departments;

  return (
    <form action={action} className="space-y-4">
      {asset && <input type="hidden" name="assetId" value={asset.id} />}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
          <input
            name="name"
            defaultValue={asset?.name}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
          <select
            name="category"
            defaultValue={asset?.category ?? ASSET_CATEGORIES[0]}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            {ASSET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
          <select
            name="department"
            defaultValue={asset?.department ?? ""}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
          >
            <option value="" disabled>
              Select a department
            </option>
            {departmentOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
          <input
            name="location"
            defaultValue={asset?.location}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Serial number</label>
          <input
            name="serialNumber"
            defaultValue={asset?.serial_number ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Purchase date</label>
          <input
            type="date"
            name="purchaseDate"
            defaultValue={asset?.purchase_date ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        {showValue && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Value (£)</label>
            <input
              type="number"
              step="0.01"
              name="value"
              defaultValue={asset?.value ?? ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        )}
        {showCondition && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Initial condition</label>
            <select
              name="condition"
              defaultValue="GOOD"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
            >
              {ASSET_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {CONDITION_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Specifications</label>
        <textarea
          name="specifications"
          defaultValue={asset?.specifications ?? ""}
          rows={3}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>
      <SubmitButton
        pendingLabel="Saving…"
        className="bg-slate-900 text-white rounded-md px-5 py-2 text-sm font-medium hover:bg-slate-800 transition"
      >
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
