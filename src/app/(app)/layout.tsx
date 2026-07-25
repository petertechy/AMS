import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { isFeatureEnabled } from "@/lib/features";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/signin");
  }

  const showRequests = await isFeatureEnabled("reassignment_requests");
  const showMaintenance = await isFeatureEnabled("maintenance_tracking");
  const showCheckout = await isFeatureEnabled("self_service_checkout");

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <input type="checkbox" id="sidebar-toggle" className="peer hidden" />

      <Sidebar
        session={session!}
        showRequests={showRequests}
        showMaintenance={showMaintenance}
        showCheckout={showCheckout}
      />

      <label
        htmlFor="sidebar-toggle"
        className="hidden peer-checked:block fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
        aria-hidden
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar session={session!} />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
