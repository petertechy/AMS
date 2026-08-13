import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  getAssetById,
  getActiveAllocationForAsset,
  listAllocationsForAsset,
  getUserById,
  listUsers,
  listMaintenanceRequests,
} from "@/lib/models";
import {
  ASSET_CONDITIONS,
  CONDITION_LABELS,
  STATUS_LABELS,
  CONDITION_BADGE_CLASSES,
  STATUS_BADGE_CLASSES,
  MAINTENANCE_STATUSES,
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_PRIORITY_BADGE_CLASSES,
  MAINTENANCE_STATUS_BADGE_CLASSES,
} from "@/lib/constants";
import Badge from "@/components/Badge";
import SubmitButton from "@/components/SubmitButton";
import Toast from "@/components/Toast";
import { updateConditionAction } from "@/app/actions/assets";
import { createReassignmentRequestAction } from "@/app/actions/allocations";
import { checkOutAssetAction, checkInAssetAction } from "@/app/actions/checkout";
import { isFeatureEnabled } from "@/lib/features";

function formatDate(ts: number | null) {
  if (!ts) return "-";
  return new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function AssetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    updated?: string;
    requested?: string;
    created?: string;
    checkedOut?: string;
    checkedIn?: string;
    mQ?: string;
    mStatus?: string;
    mPriority?: string;
  }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const assetId = Number(id);
  const session = await getSession();
  const asset = await getAssetById(assetId);
  if (!asset || !session) notFound();

  const activeAllocation = await getActiveAllocationForAsset(assetId);
  const holder = activeAllocation ? await getUserById(activeAllocation.user_id) : null;
  const history = await listAllocationsForAsset(assetId);
  const { rows: maintenanceHistory } = await listMaintenanceRequests(
    {
      assetId,
      q: query.mQ || undefined,
      status: query.mStatus || undefined,
      priority: query.mPriority || undefined,
    },
    { limit: 50, offset: 0 }
  );

  const isAdmin = session.role === "ADMIN";
  const isCurrentHolder = activeAllocation?.user_id === session.userId;
  const canUpdateCondition = isAdmin || isCurrentHolder;
  const reassignmentEnabled = await isFeatureEnabled("reassignment_requests");
  const reassignmentCandidates = reassignmentEnabled
    ? (await listUsers()).filter((u) => u.id !== activeAllocation?.user_id)
    : [];
  const valueTrackingEnabled = await isFeatureEnabled("asset_value_tracking");
  const selfServiceEnabled = await isFeatureEnabled("self_service_checkout");
  const maintenanceEnabled = await isFeatureEnabled("maintenance_tracking");
  const returnTo = `/assets/${assetId}`;

  return (
    <div className="max-w-3xl">
      <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-900">
        &larr; Back to assets
      </Link>

      <div className="flex items-start justify-between mt-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{asset.name}</h1>
          <p className="text-sm text-slate-500">{asset.category}</p>
        </div>
        {isAdmin && (
          <Link
            href={`/admin/assets/${asset.id}/edit`}
            className="text-sm text-slate-500 hover:text-slate-900 underline"
          >
            Edit details
          </Link>
        )}
      </div>

      {query.error && <Toast key={query.error} type="error" message={query.error} />}
      {query.updated && <Toast type="success" message="Changes saved." />}
      {query.created && <Toast type="success" message="Asset registered successfully." />}
      {query.requested && (
        <Toast type="success" message="Reassignment request submitted. An administrator will review it." />
      )}
      {query.checkedOut && <Toast type="success" message="Checked out to you." />}
      {query.checkedIn && <Toast type="success" message="Checked in." />}

      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
        <div className="flex gap-2 mb-4">
          <Badge className={CONDITION_BADGE_CLASSES[asset.condition]}>
            {CONDITION_LABELS[asset.condition]}
          </Badge>
          <Badge className={STATUS_BADGE_CLASSES[asset.status]}>{STATUS_LABELS[asset.status]}</Badge>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-400">Department</dt>
            <dd className="text-slate-800">{asset.department}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Location</dt>
            <dd className="text-slate-800">{asset.location}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Serial number</dt>
            <dd className="text-slate-800">{asset.serial_number || "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Purchase date</dt>
            <dd className="text-slate-800">{asset.purchase_date || "-"}</dd>
          </div>
          {valueTrackingEnabled && (
            <div>
              <dt className="text-slate-400">Value</dt>
              <dd className="text-slate-800">{asset.value != null ? `£${asset.value.toFixed(2)}` : "-"}</dd>
            </div>
          )}
          <div>
            <dt className="text-slate-400">Current owner</dt>
            <dd className="text-slate-800">{holder ? `${holder.name} (${holder.email})` : "Unassigned"}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-slate-400">Specifications</dt>
            <dd className="text-slate-800 whitespace-pre-wrap">{asset.specifications || "-"}</dd>
          </div>
        </dl>
      </div>

      {selfServiceEnabled && (asset.status === "AVAILABLE" || isCurrentHolder) && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
          {asset.status === "AVAILABLE" ? (
            <>
              <h2 className="text-sm font-semibold text-slate-900 mb-1">Check out this asset</h2>
              <p className="text-sm text-slate-500 mb-3">
                Instantly check it out to yourself &mdash; no admin approval needed.
              </p>
              <form action={checkOutAssetAction}>
                <input type="hidden" name="assetId" value={asset.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <SubmitButton
                  pendingLabel="Checking out…"
                  className="bg-slate-900 text-white rounded-md px-4 py-1.5 text-sm font-medium hover:bg-slate-800 transition"
                >
                  Check out this asset
                </SubmitButton>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-sm font-semibold text-slate-900 mb-1">Check in this asset</h2>
              <p className="text-sm text-slate-500 mb-3">You currently have this asset checked out.</p>
              <form action={checkInAssetAction}>
                <input type="hidden" name="assetId" value={asset.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <SubmitButton
                  pendingLabel="Checking in…"
                  className="bg-white border border-slate-300 text-slate-700 rounded-md px-4 py-1.5 text-sm font-medium hover:bg-slate-50 transition"
                >
                  Check in this asset
                </SubmitButton>
              </form>
            </>
          )}
        </div>
      )}

      <div className={`grid gap-6 mb-6 ${reassignmentEnabled ? "sm:grid-cols-2" : ""}`}>
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Update condition</h2>
          {canUpdateCondition ? (
            <form action={updateConditionAction} className="space-y-3">
              <input type="hidden" name="assetId" value={asset.id} />
              <select
                name="condition"
                defaultValue={asset.condition}
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm bg-white"
              >
                {ASSET_CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {CONDITION_LABELS[c]}
                  </option>
                ))}
              </select>
              <SubmitButton
                pendingLabel="Saving…"
                className="bg-slate-900 text-white rounded-md px-4 py-1.5 text-sm font-medium hover:bg-slate-800 transition"
              >
                Save condition
              </SubmitButton>
            </form>
          ) : (
            <p className="text-sm text-slate-400">
              Only the current holder or an administrator can update this asset&apos;s condition.
            </p>
          )}
        </div>

        {reassignmentEnabled && (
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Request reassignment</h2>
            <form action={createReassignmentRequestAction} className="space-y-3">
              <input type="hidden" name="assetId" value={asset.id} />
              <textarea
                name="reason"
                required
                rows={3}
                placeholder="Why does this asset need to be reassigned?"
                className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Reassign to (optional)
                </label>
                <select
                  name="newOwnerId"
                  defaultValue=""
                  className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm bg-white"
                >
                  <option value="">No preference &mdash; let admin choose</option>
                  {reassignmentCandidates.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  Your suggestion still needs admin approval before the asset moves.
                </p>
              </div>
              <SubmitButton
                pendingLabel="Submitting…"
                className="bg-white border border-slate-300 text-slate-700 rounded-md px-4 py-1.5 text-sm font-medium hover:bg-slate-50 transition"
              >
                Submit request
              </SubmitButton>
            </form>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <h2 className="text-sm font-semibold text-slate-900 px-5 py-3 border-b border-slate-200">
          Allocation history
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-2 font-medium">Holder</th>
              <th className="text-left px-5 py-2 font-medium">Allocated</th>
              <th className="text-left px-5 py-2 font-medium">Returned</th>
              <th className="text-left px-5 py-2 font-medium hidden sm:table-cell">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {history.map((h) => (
              <tr key={h.id}>
                <td className="px-5 py-2.5">{h.user_name}</td>
                <td className="px-5 py-2.5 text-slate-500">{formatDate(h.allocated_at)}</td>
                <td className="px-5 py-2.5 text-slate-500">
                  {h.returned_at ? formatDate(h.returned_at) : <span className="text-emerald-600">Active</span>}
                </td>
                <td className="px-5 py-2.5 text-slate-500 hidden sm:table-cell">{h.notes || "-"}</td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-center text-slate-400">
                  No allocation history yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {maintenanceEnabled && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mt-6">
          <h2 className="text-sm font-semibold text-slate-900 px-5 py-3 border-b border-slate-200">
            Maintenance history
          </h2>
          <form action={`/assets/${assetId}`} method="get" className="grid sm:grid-cols-4 gap-3 p-5 border-b border-slate-200">
            <input
              name="mQ"
              defaultValue={query.mQ}
              placeholder="Search title or description"
              className="sm:col-span-2 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
            />
            <select name="mStatus" defaultValue={query.mStatus ?? ""} className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm bg-white">
              <option value="">All Statuses</option>
              {MAINTENANCE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {MAINTENANCE_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <select name="mPriority" defaultValue={query.mPriority ?? ""} className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm bg-white">
              <option value="">All Priorities</option>
              {MAINTENANCE_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {MAINTENANCE_PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
            <div className="sm:col-span-4 flex gap-2">
              <button type="submit" className="bg-slate-900 text-white rounded-md px-3 py-1.5 text-xs font-medium hover:bg-slate-800">
                Apply
              </button>
              <Link href={`/assets/${assetId}`} className="bg-white border border-slate-300 text-slate-700 rounded-md px-3 py-1.5 text-xs font-medium hover:bg-slate-50">
                Reset
              </Link>
            </div>
          </form>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-2 font-medium">Title</th>
                <th className="text-left px-5 py-2 font-medium">Priority</th>
                <th className="text-left px-5 py-2 font-medium">Status</th>
                <th className="text-left px-5 py-2 font-medium">Opened</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {maintenanceHistory.map((m) => (
                <tr key={m.id}>
                  <td className="px-5 py-2.5">
                    <Link href={`/maintenance/${m.id}`} className="text-slate-900 hover:underline">
                      {m.title}
                    </Link>
                  </td>
                  <td className="px-5 py-2.5">
                    <Badge className={MAINTENANCE_PRIORITY_BADGE_CLASSES[m.priority]}>
                      {MAINTENANCE_PRIORITY_LABELS[m.priority]}
                    </Badge>
                  </td>
                  <td className="px-5 py-2.5">
                    <Badge className={MAINTENANCE_STATUS_BADGE_CLASSES[m.status]}>
                      {MAINTENANCE_STATUS_LABELS[m.status]}
                    </Badge>
                  </td>
                  <td className="px-5 py-2.5 text-slate-500">{formatDate(m.opened_at)}</td>
                </tr>
              ))}
              {maintenanceHistory.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-slate-400">
                    {query.mQ || query.mStatus || query.mPriority
                      ? "No maintenance requests match these filters."
                      : "No maintenance history yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
