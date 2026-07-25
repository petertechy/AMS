"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { markNotificationsReadAction } from "@/app/actions/notifications";
import SubmitButton from "@/components/SubmitButton";
import { IconBell } from "@/components/icons";
import type { NotificationRow } from "@/lib/models";

function formatRelative(ts: number) {
  const diffMs = Date.now() - ts;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: NotificationRow[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const returnTo = usePathname() || "/dashboard";

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative inline-flex items-center justify-center rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      >
        <IconBell />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white border border-slate-200 rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            {unreadCount > 0 && (
              <form action={markNotificationsReadAction}>
                <input type="hidden" name="returnTo" value={returnTo} />
                <SubmitButton pendingLabel="…" className="text-xs text-slate-500 hover:text-slate-900 underline">
                  Mark all as read
                </SubmitButton>
              </form>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-400">You&apos;re all caught up.</p>
            )}
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={n.link ?? "#"}
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-sm hover:bg-slate-50"
              >
                <p className={n.read_at ? "text-slate-500" : "text-slate-900 font-medium"}>{n.message}</p>
                <p className="text-xs text-slate-400 mt-0.5">{formatRelative(n.created_at)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
