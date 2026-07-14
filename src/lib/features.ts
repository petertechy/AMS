import { getAllSettings, setSetting } from "@/lib/models";

export interface FeatureDef {
  id: string;
  label: string;
  description: string;
  defaultEnabled: boolean;
}

/** The full set of whole-app features that can be switched on/off by an admin.
 *  Add new entries here as the app grows. */
export const FEATURES: FeatureDef[] = [
  {
    id: "reassignment_requests",
    label: "Reassignment requests",
    description:
      "Lets staff submit a request to reassign an asset, and admins review/approve or reject it. Turning this off hides the request form and the Requests page for everyone.",
    defaultEnabled: true,
  },
  {
    id: "public_signup",
    label: "Public sign-up",
    description:
      "Allows anyone with an allowed email domain to create their own account from the sign-in page. Turning this off hides the sign-up page — new accounts must then be created by an admin from Manage Accounts.",
    defaultEnabled: true,
  },
  {
    id: "asset_value_tracking",
    label: "Asset value / cost tracking",
    description:
      "Shows a monetary value field on assets (registration form and asset detail page). Turning this off hides cost information app-wide.",
    defaultEnabled: true,
  },
];

const settingKey = (id: string) => `feature:${id}`;

/** Returns a map of featureId -> enabled, applying defaults for anything not yet set. */
export async function getFeatureFlags(): Promise<Record<string, boolean>> {
  const stored = await getAllSettings();
  const flags: Record<string, boolean> = {};
  for (const feature of FEATURES) {
    const raw = stored[settingKey(feature.id)];
    flags[feature.id] = raw === undefined ? feature.defaultEnabled : raw === "true";
  }
  return flags;
}

export async function isFeatureEnabled(id: string): Promise<boolean> {
  const flags = await getFeatureFlags();
  return flags[id] ?? true;
}

export async function setFeatureEnabled(id: string, enabled: boolean): Promise<void> {
  await setSetting(settingKey(id), enabled ? "true" : "false");
}
