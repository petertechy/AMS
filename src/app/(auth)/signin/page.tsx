import Link from "next/link";
import { signinAction } from "@/app/actions/auth";
import PasswordInput from "@/components/PasswordInput";
import { isFeatureEnabled } from "@/lib/features";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string }>;
}) {
  const params = await searchParams;
  const signupEnabled = await isFeatureEnabled("public_signup");

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Sign in</h2>

      {params.reset && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 text-green-800 text-sm px-3 py-2">
          Your password has been reset. Please sign in.
        </div>
      )}
      {params.error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm px-3 py-2">
          {params.error}
        </div>
      )}

      <form action={signinAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <PasswordInput
            name="password"
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-slate-900 text-white rounded-md py-2 text-sm font-medium hover:bg-slate-800 transition"
        >
          Sign in
        </button>
      </form>

      <div className="flex items-center justify-between mt-4 text-sm">
        <Link href="/forgot-password" className="text-slate-500 hover:text-slate-900">
          Forgot password?
        </Link>
        {signupEnabled && (
          <Link href="/signup" className="text-slate-500 hover:text-slate-900">
            Create account
          </Link>
        )}
      </div>
    </div>
  );
}
