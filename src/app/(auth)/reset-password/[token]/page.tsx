import Link from "next/link";
import { resetPasswordAction } from "@/app/actions/auth";
import PasswordInput from "@/components/PasswordInput";
import SubmitButton from "@/components/SubmitButton";
import Toast from "@/components/Toast";
import { getUserByResetToken } from "@/lib/models";

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const user = await getUserByResetToken(token);
  // eslint-disable-next-line react-hooks/purity -- server-rendered, time-of-request check is intentional
  const nowTs = Date.now();
  const valid = !!user && !!user.reset_token_expires && user.reset_token_expires > nowTs;

  if (!valid) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Reset link invalid</h2>
        <p className="text-sm text-slate-500 mb-4">
          This password reset link is invalid or has expired.
        </p>
        <Link href="/forgot-password" className="text-sm text-slate-900 underline">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Choose a new password</h2>

      {query.error && <Toast key={query.error} type="error" message={query.error} />}

      <form action={resetPasswordAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">New password</label>
          <PasswordInput
            name="password"
            required
            minLength={8}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Confirm new password</label>
          <PasswordInput
            name="confirmPassword"
            required
            minLength={8}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        <SubmitButton
          pendingLabel="Resetting…"
          className="w-full bg-slate-900 text-white rounded-md py-2 text-sm font-medium hover:bg-slate-800 transition"
        >
          Reset password
        </SubmitButton>
      </form>
    </div>
  );
}
