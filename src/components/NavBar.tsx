import Link from "next/link";
import { signoutAction } from "@/app/actions/auth";
import type { SessionPayload } from "@/lib/auth";

export default function NavBar({ session }: { session: SessionPayload }) {
  const isAdmin = session.role === "ADMIN";

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-semibold text-slate-900">
            AMS
          </Link>
          <nav className="hidden sm:flex items-center gap-4 text-sm text-slate-600">
            <Link href="/dashboard" className="hover:text-slate-900">
              Assets
            </Link>
            <Link href="/allocations" className="hover:text-slate-900">
              My Allocations
            </Link>
            {isAdmin && (
              <>
                <Link href="/admin/assets" className="hover:text-slate-900">
                  Manage Assets
                </Link>
                <Link href="/admin/allocations" className="hover:text-slate-900">
                  Allocations
                </Link>
                <Link href="/admin/requests" className="hover:text-slate-900">
                  Requests
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-500 hidden sm:inline">
            {session.name} <span className="text-slate-300">&middot;</span>{" "}
            <span className="uppercase text-xs tracking-wide text-slate-400">{session.role}</span>
          </span>
          <form action={signoutAction}>
            <button type="submit" className="text-slate-500 hover:text-slate-900 underline">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
