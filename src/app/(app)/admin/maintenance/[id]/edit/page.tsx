import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getMaintenanceRequestById } from "@/lib/models";
import { MAINTENANCE_PRIORITIES, MAINTENANCE_PRIORITY_LABELS } from "@/lib/constants";
import SubmitButton from "@/components/SubmitButton";
import Toast from "@/components/Toast";
import { updateMaintenanceRequestAction } from "@/app/actions/maintenance";

export default async function EditAdminMaintenanceRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const requestId = Number(id);

  const request = await getMaintenanceRequestById(requestId);
  if (!request) notFound();
  if (request.status !== "OPEN") {
    redirect(
      `/admin/maintenance/${requestId}?error=${encodeURIComponent("Only an open request can be edited.")}`
    );
  }

  const returnTo = `/admin/maintenance/${requestId}`;

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 mb-1">Edit Maintenance Request</h1>
          <p className="text-sm text-slate-500">{request.asset_name}</p>
        </div>
        <Link href={returnTo} className="text-sm text-slate-500 hover:text-slate-900 underline shrink-0">
          Back to Request
        </Link>
      </div>

      {query.error && <Toast key={query.error} type="error" message={query.error} />}

      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <form action={updateMaintenanceRequestAction} className="space-y-5">
          <input type="hidden" name="id" value={request.id} />
          <input type="hidden" name="returnTo" value={returnTo} />

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
              <input
                name="title"
                required
                defaultValue={request.title}
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Issue Type</label>
              <input
                name="issueType"
                defaultValue={request.issue_type ?? ""}
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Priority</label>
            <select
              name="priority"
              defaultValue={request.priority}
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
              defaultValue={request.description}
              className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
            <textarea
              name="notes"
              rows={3}
              defaultValue={request.notes ?? ""}
              className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
            />
          </div>

          <div className="flex gap-2">
            <SubmitButton
              pendingLabel="Saving…"
              className="bg-indigo-600 text-white rounded-md px-4 py-1.5 text-sm font-medium hover:bg-indigo-700 transition"
            >
              Save Changes
            </SubmitButton>
            <Link
              href={returnTo}
              className="bg-white border border-slate-300 text-slate-700 rounded-md px-4 py-1.5 text-sm font-medium hover:bg-slate-50 transition inline-flex items-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
