import type { SessionPayload } from "@/lib/auth";
import { IconMenu } from "@/components/icons";

export default function TopBar({ session }: { session: SessionPayload }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-slate-200 lg:hidden">
      <label
        htmlFor="sidebar-toggle"
        className="inline-flex items-center justify-center rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
      >
        <IconMenu />
      </label>
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-medium text-white">
          {session.name.charAt(0).toUpperCase()}
        </span>
      </div>
    </header>
  );
}
