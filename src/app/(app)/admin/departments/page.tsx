import { listDepartments, countDepartmentUsage } from "@/lib/models";
import {
  createDepartmentAction,
  renameDepartmentAction,
  deleteDepartmentAction,
} from "@/app/actions/departments";
import SubmitButton from "@/components/SubmitButton";
import Toast from "@/components/Toast";

export default async function DepartmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string; updated?: string; deleted?: string }>;
}) {
  const query = await searchParams;
  const departments = await listDepartments();
  const usage = await Promise.all(departments.map((d) => countDepartmentUsage(d.name)));

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-slate-900 mb-1">Departments</h1>
      <p className="text-sm text-slate-500 mb-6">
        Manage the departments assets and accounts can be assigned to.
      </p>

      {query.error && <Toast key={query.error} type="error" message={query.error} />}
      {query.created && <Toast type="success" message="Department added." />}
      {query.updated && <Toast type="success" message="Department renamed." />}
      {query.deleted && <Toast type="success" message="Department deleted." />}

      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Add a department</h2>
        <form action={createDepartmentAction} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
            <input
              name="name"
              required
              className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
            />
          </div>
          <SubmitButton
            pendingLabel="Adding…"
            className="bg-slate-900 text-white rounded-md px-4 py-1.5 text-sm font-medium hover:bg-slate-800 transition"
          >
            Add
          </SubmitButton>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Name</th>
              <th className="text-left px-4 py-2 font-medium">Assets</th>
              <th className="text-left px-4 py-2 font-medium">Accounts</th>
              <th className="text-right px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {departments.map((d, i) => {
              const inUse = usage[i].assets > 0 || usage[i].users > 0;
              return (
                <tr key={d.id}>
                  <td className="px-4 py-3">
                    <form action={renameDepartmentAction} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={d.id} />
                      <input
                        type="text"
                        name="name"
                        defaultValue={d.name}
                        className="w-40 rounded-md border border-slate-300 px-2 py-1 text-sm"
                      />
                      <SubmitButton pendingLabel="…" className="text-slate-500 hover:text-slate-900 underline text-xs">
                        Save
                      </SubmitButton>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{usage[i].assets}</td>
                  <td className="px-4 py-3 text-slate-600">{usage[i].users}</td>
                  <td className="px-4 py-3 text-right">
                    {inUse ? (
                      <span className="text-xs text-slate-400" title="In use by an asset or account">
                        In use
                      </span>
                    ) : (
                      <form action={deleteDepartmentAction}>
                        <input type="hidden" name="id" value={d.id} />
                        <SubmitButton pendingLabel="…" className="text-red-600 hover:text-red-800 underline text-xs">
                          Delete
                        </SubmitButton>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
            {departments.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  No departments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
