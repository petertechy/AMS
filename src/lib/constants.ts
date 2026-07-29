export const ASSET_CATEGORIES = [
  "Equipment",
  "IT Device",
  "Machinery",
  "Vehicle",
  "Tool",
  "Digital License",
  "Other",
] as const;

export const ASSET_CONDITIONS = ["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"] as const;

export const ASSET_STATUSES = ["AVAILABLE", "ALLOCATED", "IN_MAINTENANCE", "RETIRED"] as const;

export const CONDITION_LABELS: Record<string, string> = {
  NEW: "New",
  GOOD: "Good",
  FAIR: "Fair",
  POOR: "Poor",
  DAMAGED: "Damaged",
};

export const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  ALLOCATED: "Allocated",
  IN_MAINTENANCE: "In Maintenance",
  RETIRED: "Retired",
};

export const CONDITION_BADGE_CLASSES: Record<string, string> = {
  NEW: "bg-emerald-50 text-emerald-700 border-emerald-200",
  GOOD: "bg-sky-50 text-sky-700 border-sky-200",
  FAIR: "bg-amber-50 text-amber-700 border-amber-200",
  POOR: "bg-orange-50 text-orange-700 border-orange-200",
  DAMAGED: "bg-red-50 text-red-700 border-red-200",
};

export const STATUS_BADGE_CLASSES: Record<string, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ALLOCATED: "bg-slate-100 text-slate-700 border-slate-200",
  IN_MAINTENANCE: "bg-amber-50 text-amber-700 border-amber-200",
  RETIRED: "bg-red-50 text-red-700 border-red-200",
};

export const MAINTENANCE_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export const MAINTENANCE_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "CANCELLED"] as const;

export const MAINTENANCE_PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const MAINTENANCE_STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

export const MAINTENANCE_PRIORITY_BADGE_CLASSES: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-700 border-slate-200",
  MEDIUM: "bg-sky-50 text-sky-700 border-sky-200",
  HIGH: "bg-orange-50 text-orange-700 border-orange-200",
  CRITICAL: "bg-red-50 text-red-700 border-red-200",
};

export const MAINTENANCE_STATUS_BADGE_CLASSES: Record<string, string> = {
  OPEN: "bg-sky-50 text-sky-700 border-sky-200",
  IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CLOSED: "bg-slate-100 text-slate-700 border-slate-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};
