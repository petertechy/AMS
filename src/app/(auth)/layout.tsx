import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Asset Management System</h1>
          <p className="text-sm text-slate-500 mt-1">Centralised tracking, allocation &amp; lifecycle management</p>
        </div>
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-8">{children}</div>
      </div>
    </div>
  );
}
