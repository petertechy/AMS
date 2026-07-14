import { FEATURES, getFeatureFlags } from "@/lib/features";
import { updateSettingsAction } from "@/app/actions/settings";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const query = await searchParams;
  const flags = await getFeatureFlags();

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900 mb-1">Settings</h1>
      <p className="text-sm text-slate-500 mb-6">
        Turn whole features on or off for everyone in your organisation.
      </p>

      {query.saved && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 text-green-800 text-sm px-3 py-2">
          Settings saved.
        </div>
      )}

      <form action={updateSettingsAction}>
        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
          {FEATURES.map((feature) => (
            <label
              key={feature.id}
              htmlFor={feature.id}
              className="flex items-start gap-4 p-5 cursor-pointer hover:bg-slate-50"
            >
              <input
                type="checkbox"
                id={feature.id}
                name={feature.id}
                defaultChecked={flags[feature.id]}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <p className="text-sm font-medium text-slate-900">{feature.label}</p>
                <p className="text-sm text-slate-500 mt-0.5">{feature.description}</p>
              </div>
            </label>
          ))}
        </div>

        <button
          type="submit"
          className="mt-5 bg-slate-900 text-white rounded-md px-5 py-2 text-sm font-medium hover:bg-slate-800 transition"
        >
          Save settings
        </button>
      </form>
    </div>
  );
}
