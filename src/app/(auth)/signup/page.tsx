import Link from "next/link";
import { redirect } from "next/navigation";
import { signupAction } from "@/app/actions/auth";
import PasswordInput from "@/components/PasswordInput";
import { isFeatureEnabled } from "@/lib/features";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const orgDomains = process.env.ORG_EMAIL_DOMAINS?.trim();

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
      {params.error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm px-3 py-2">
          {params.error}
        </div>
      )}

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
          <input
            name="department"
            type="text"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
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
        <button
          type="submit"
          className="w-full bg-slate-900 text-white rounded-md py-2 text-sm font-medium hover:bg-slate-800 transition"
        >
          Create account
        </button>
      </form>

      <div className="text-center mt-4 text-sm">
        <Link href="/signin" className="text-slate-500 hover:text-slate-900">
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  );
}
