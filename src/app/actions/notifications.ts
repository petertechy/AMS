"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { markAllNotificationsRead } from "@/lib/models";

export async function markNotificationsReadAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/signin");

  const returnTo = String(formData.get("returnTo") || "/dashboard");

  await markAllNotificationsRead(session!.userId);

  revalidatePath(returnTo);
  redirect(returnTo);
}
