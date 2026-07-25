import Link from "next/link";
import { getSession } from "@/lib/session";
import { listUsers, listDepartments } from "@/lib/models";
import { createUserAction, updateUserAction, sendResetLinkAction } from "@/app/actions/users";
import SubmitButton from "@/components/SubmitButton";
import Toast from "@/components/Toast";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function ManageAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string; updated?: string; linkSent?: string; devLink?: string }>;
}) {
  const query = await searchParams;
  const session = await getSession();
  const users = await listUsers();
  const departments = (await listDepartments()).map((d) => d.name);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 mb-1">Manage Accounts</h1>
      <p className="text-sm text-slate-500 mb-6">
        Create staff accounts, change roles, and send password reset links.
      </p>

      {query.error && <Toast key={query.error} type="error" message={query.error} />}
      {query.updated && <Toast type="success" message="Account updated." />}
      {(query.created || query.linkSent) && (
        <Toast
          type="success"
          message={query.created ? "Account created." : "Password reset link generated."}
        />
      )}
      {query.devLink && (
        <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-sm px-3 py-2">
          <p className="font-medium mb-1">
            No email service is configured, so the link isn&apos;t being emailed automatically.
          </p>
          <p>
            Share this link with the user so they can set their password:{" "}
            <Link href={query.devLink} className="underline break-all">
              {query.devLink}
            </Link>
          </p>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Create a new account</h2>
        <form action={createUserAction} className="grid sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Full name</label>
            <input
              name="name"
              required
              className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Department</label>
            <select
              name="department"
              defaultValue=""
              className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm bg-white"
            >
              <option value="">None</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Role</label>
            <select name="role" defaultValue="STAFF" className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm bg-white">
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="sm:col-span-4">
            <SubmitButton
              pendingLabel="Creating…"
              className="bg-slate-900 text-white rounded-md px-4 py-1.5 text-sm font-medium hover:bg-slate-800 transition"
            >
              Create account
            </SubmitButton>
          </div>
        </form>
        <p className="text-xs text-slate-400 mt-2">
          The new user gets a password-reset link to set their own password &mdash; no password is set by you.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Name</th>
              <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">Email</th>
              <th className="text-left px-4 py-2 font-medium">Role</th>
              <th className="text-left px-4 py-2 font-medium hidden md:table-cell">Department</th>
              <th className="text-left px-4 py-2 font-medium hidden lg:table-cell">Joined</th>
              <th className="text-right px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 text-slate-900 font-medium">
                  {u.name}
                  {u.id === session?.userId && <span className="text-xs text-slate-400 ml-1">(you)</span>}
                </td>
                <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{u.email}</td>
                <td className="px-4 py-3">
                  <form action={updateUserAction} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={u.id} />
                    <select
                      name="role"
                      defaultValue={u.role}
                      disabled={u.id === session?.userId}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs bg-white disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="STAFF">Staff</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <select
                      name="department"
                      defaultValue={u.department ?? ""}
                      className="hidden md:block w-28 rounded-md border border-slate-300 px-2 py-1 text-xs bg-white"
                    >
                      <option value="">None</option>
                      {(u.department && !departments.includes(u.department)
                        ? [...departments, u.department]
                        : departments
                      ).map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <SubmitButton
                      pendingLabel="…"
                      className="text-slate-500 hover:text-slate-900 underline text-xs whitespace-nowrap"
                    >
                      Save
                    </SubmitButton>
                  </form>
                </td>
                <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{u.department || "-"}</td>
                <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{formatDate(u.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <form action={sendResetLinkAction}>
                    <input type="hidden" name="userId" value={u.id} />
                    <SubmitButton pendingLabel="…" className="text-slate-500 hover:text-slate-900 underline text-xs">
                      Send reset link
                    </SubmitButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
