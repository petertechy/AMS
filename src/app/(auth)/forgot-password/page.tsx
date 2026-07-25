import Link from "next/link";
import { forgotPasswordAction } from "@/app/actions/auth";
import SubmitButton from "@/components/SubmitButton";
import Toast from "@/components/Toast";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; devLink?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Reset your password</h2>

      {params.error && <Toast key={params.error} type="error" message={params.error} />}

      {params.sent ? (
        <div className="space-y-4">
          <div className="rounded-md bg-green-50 border border-green-200 text-green-800 text-sm px-3 py-2">
            If an account exists for that email, a reset link has been generated.
          </div>
          {params.devLink && (
            <div className="rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-sm px-3 py-2">
              <p className="font-medium mb-1">No email service is configured for this demo.</p>
              <p>
                Use this link to reset your password:{" "}
                <Link href={params.devLink} className="underline break-all">
                  {params.devLink}
                </Link>
              </p>
            </div>
          )}
          <Link href="/signin" className="text-sm text-slate-500 hover:text-slate-900">
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-4">
            Enter your account email and we&apos;ll generate a password reset link.
          </p>
          <form action={forgotPasswordAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <SubmitButton
              pendingLabel="Sending…"
              className="w-full bg-slate-900 text-white rounded-md py-2 text-sm font-medium hover:bg-slate-800 transition"
            >
              Send reset link
            </SubmitButton>
          </form>
          <div className="text-center mt-4 text-sm">
            <Link href="/signin" className="text-slate-500 hover:text-slate-900">
              Back to sign in
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
