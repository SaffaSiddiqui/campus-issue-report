export const CATEGORIES = [
  { value: "computer", label: "Computer", icon: "💻", hint: "Lab PCs, keyboards, monitors" },
  { value: "projector", label: "Projector", icon: "📽️", hint: "Classroom or hall projectors" },
  { value: "fan", label: "Fan", icon: "🌀", hint: "Ceiling, wall or exhaust fans" },
  { value: "light", label: "Light", icon: "💡", hint: "Tube lights, bulbs, switches" },
  { value: "wifi", label: "Wi-Fi", icon: "📶", hint: "No signal, slow or dropping" },
] as const;

export type Category = (typeof CATEGORIES)[number]["value"];

export const STATUSES = [
  { value: "pending", label: "Pending", classes: "bg-amber-100 text-amber-800 ring-amber-200", bar: "bg-amber-500" },
  { value: "in_progress", label: "In Progress", classes: "bg-blue-100 text-blue-800 ring-blue-200", bar: "bg-blue-500" },
  { value: "resolved", label: "Resolved", classes: "bg-emerald-100 text-emerald-800 ring-emerald-200", bar: "bg-emerald-500" },
] as const;

export type Status = (typeof STATUSES)[number]["value"];

export const PRIORITIES = [
  { value: "low", label: "Low", classes: "bg-slate-100 text-slate-700" },
  { value: "medium", label: "Medium", classes: "bg-orange-100 text-orange-800" },
  { value: "high", label: "High", classes: "bg-red-100 text-red-800" },
] as const;

export type Priority = (typeof PRIORITIES)[number]["value"];

// Isolated Postgres schema + storage bucket (see supabase/schema-isolated.sql)
export const DB_SCHEMA = "campus_issues";
export const STORAGE_BUCKET = "campus-issue-images";

export const MAX_IMAGES = 3;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const categoryOf = (v: string) => CATEGORIES.find((c) => c.value === v);
export const statusOf = (v: string) => STATUSES.find((s) => s.value === v) ?? STATUSES[0];
export const priorityOf = (v: string) => PRIORITIES.find((p) => p.value === v) ?? PRIORITIES[1];
