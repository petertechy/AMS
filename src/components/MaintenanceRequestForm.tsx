import Link from "next/link";
import { createMaintenanceRequestAction } from "@/app/actions/maintenance";
import { MAINTENANCE_PRIORITIES, MAINTENANCE_PRIORITY_LABELS } from "@/lib/constants";
import SubmitButton from "@/components/SubmitButton";
import type { AssetRow } from "@/lib/models";

export default function MaintenanceRequestForm({
  assets,
  basePath,
  cancelHref,
}: {
  assets: AssetRow[];
  basePath: string;
  cancelHref: string;
}) {
  return (
    <form action={createMaintenanceRequestAction} className="space-y-5">
      <input type="hidden" name="basePath" value={basePath} />

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Asset</label>
        <select
          name="assetId"
          required
          defaultValue=""
          className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm bg-white"
        >
          <option value="" disabled>
            Select an asset
          </option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.department})
            </option>
          ))}
        </select>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
          <input
            name="title"
            required
            placeholder="Short summary of the issue"
            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Issue Type</label>
          <input
            name="issueType"
            placeholder="e.g. Hardware fault, Preventive"
            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Priority</label>
        <select
          name="priority"
          defaultValue="MEDIUM"
          className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm bg-white"
        >
          {MAINTENANCE_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {MAINTENANCE_PRIORITY_LABELS[p]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
        <textarea
          name="description"
          required
          rows={4}
          placeholder="What's wrong, and what needs doing?"
          className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
        <textarea
          name="notes"
          rows={3}
          placeholder="Optional additional context"
          className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
        />
      </div>

      <div className="flex gap-2">
        <SubmitButton
          pendingLabel="Creating…"
          className="bg-indigo-600 text-white rounded-md px-4 py-1.5 text-sm font-medium hover:bg-indigo-700 transition"
        >
          Create Request
        </SubmitButton>
        <Link
          href={cancelHref}
          className="bg-white border border-slate-300 text-slate-700 rounded-md px-4 py-1.5 text-sm font-medium hover:bg-slate-50 transition inline-flex items-center"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
