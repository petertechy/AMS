import Link from "next/link";
import { signoutAction } from "@/app/actions/auth";
import SubmitButton from "@/components/SubmitButton";
import type { SessionPayload } from "@/lib/auth";
import {
  IconGrid,
  IconClipboard,
  IconBox,
  IconSwap,
  IconInbox,
  IconUsers,
  IconSettings,
  IconLogout,
  IconClose,
  IconBuilding,
  IconHistory,
  IconWrench,
  IconArrowsRightLeft,
} from "@/components/icons";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
    >
      {children}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 mt-6 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
      {children}
    </p>
  );
}

export default function Sidebar({
  session,
  showRequests,
  showMaintenance,
  showCheckout,
}: {
  session: SessionPayload;
  showRequests: boolean;
  showMaintenance: boolean;
  showCheckout: boolean;
}) {
  const isAdmin = session.role === "ADMIN";

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 -translate-x-full peer-checked:translate-x-0 lg:translate-x-0 lg:static transition-transform duration-200 bg-slate-900 flex flex-col">
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-2 text-white font-semibold text-lg">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500 text-sm">
            A
          </span>
          AMS
        </Link>
        <label htmlFor="sidebar-toggle" className="lg:hidden text-slate-400 hover:text-white cursor-pointer">
          <IconClose />
        </label>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <SectionLabel>Overview</SectionLabel>
        <div className="space-y-1">
          <NavLink href="/dashboard">
            <IconGrid /> Assets
          </NavLink>
          <NavLink href="/allocations">
            <IconClipboard /> My Allocations
          </NavLink>
          {showCheckout && (
            <NavLink href="/checkout">
              <IconArrowsRightLeft /> Check-in/Check-out
            </NavLink>
          )}
          {showMaintenance && (
            <NavLink href="/maintenance">
              <IconWrench /> My Maintenance Requests
            </NavLink>
          )}
        </div>

        {isAdmin && (
          <>
            <SectionLabel>Administration</SectionLabel>
            <div className="space-y-1">
              <NavLink href="/admin/assets">
                <IconBox /> Manage Assets
              </NavLink>
              <NavLink href="/admin/allocations">
                <IconSwap /> Allocations
              </NavLink>
              {showRequests && (
                <NavLink href="/admin/requests">
                  <IconInbox /> Requests
                </NavLink>
              )}
              {showMaintenance && (
                <NavLink href="/admin/maintenance">
                  <IconWrench /> Maintenance
                </NavLink>
              )}
              <NavLink href="/admin/departments">
                <IconBuilding /> Departments
              </NavLink>
              <NavLink href="/admin/accounts">
                <IconUsers /> Manage Accounts
              </NavLink>
              <NavLink href="/admin/audit-logs">
                <IconHistory /> Audit Logs
              </NavLink>
              <NavLink href="/admin/settings">
                <IconSettings /> Settings
              </NavLink>
            </div>
          </>
        )}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-sm font-medium text-white">
            {session.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{session.name}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wide">{session.role}</p>
          </div>
        </div>
        <form action={signoutAction} className="mt-1">
          <SubmitButton
            pendingLabel="Signing out…"
            className="w-full !justify-start !gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <IconLogout /> Sign out
          </SubmitButton>
        </form>
      </div>
    </aside>
  );
}
