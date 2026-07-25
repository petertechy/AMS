import Link from "next/link";
import { redirect } from "next/navigation";
import { signupAction } from "@/app/actions/auth";
import PasswordInput from "@/components/PasswordInput";
import SubmitButton from "@/components/SubmitButton";
import Toast from "@/components/Toast";
import { isFeatureEnabled } from "@/lib/features";
import { listDepartments } from "@/lib/models";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const orgDomains = process.env.ORG_EMAIL_DOMAINS?.trim();
  const departments = (await listDepartments()).map((d) => d.name);

  if (!(await isFeatureEnabled("public_signup"))) {
    redirect("/signin");
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Create your account</h2>

      {orgDomains && (
        <div className="mb-4 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-sm px-3 py-2">
          Sign-up is restricted to organisational email addresses ({orgDomains}).
        </div>
      )}
      {params.error && <Toast key={params.error} type="error" message={params.error} />}

      <form action={signupAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
          <input
            name="name"
            type="text"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Organisational email</label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Department (optional)</label>
          <select
            name="department"
            defaultValue=""
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
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
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <PasswordInput
            name="password"
            required
            minLength={8}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Confirm password</label>
          <PasswordInput
            name="confirmPassword"
            required
            minLength={8}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <SubmitButton
          pendingLabel="Creating account…"
          className="w-full bg-slate-900 text-white rounded-md py-2 text-sm font-medium hover:bg-slate-800 transition"
        >
          Create account
        </SubmitButton>
      </form>

      <div className="text-center mt-4 text-sm">
        <Link href="/signin" className="text-slate-500 hover:text-slate-900">
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  );
}
