import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/dashboard?error=" + encodeURIComponent("You do not have permission to view that page."));
  }
  return <>{children}</>;
}
