import Link from "next/link";
import { signinAction } from "@/app/actions/auth";
import PasswordInput from "@/components/PasswordInput";
import SubmitButton from "@/components/SubmitButton";
import Toast from "@/components/Toast";
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

      {params.reset && <Toast type="success" message="Your password has been reset. Please sign in." />}
      {params.error && <Toast key={params.error} type="error" message={params.error} />}

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
        <SubmitButton
          pendingLabel="Signing in…"
          className="w-full bg-slate-900 text-white rounded-md py-2 text-sm font-medium hover:bg-slate-800 transition"
        >
          Sign in
        </SubmitButton>
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
