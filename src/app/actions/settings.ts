"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { FEATURES, setFeatureEnabled } from "@/lib/features";

export async function updateSettingsAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  for (const feature of FEATURES) {
    const enabled = formData.get(feature.id) === "on";
    await setFeatureEnabled(feature.id, enabled);
  }

  revalidatePath("/admin/settings");
  revalidatePath("/dashboard");
  revalidatePath("/signin");
  revalidatePath("/signup");
  redirect("/admin/settings?saved=1");
}
