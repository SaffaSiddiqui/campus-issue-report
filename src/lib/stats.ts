import { CATEGORIES, STATUSES } from "./constants";
import type { Issue } from "./types";

type Row = Pick<Issue, "category" | "status" | "priority" | "created_at" | "resolved_at">;

export function computeStats(issues: Row[]) {
  const total = issues.length;

  const byStatus = STATUSES.map((s) => ({
    ...s,
    count: issues.filter((i) => i.status === s.value).length,
  }));

  const byCategory = CATEGORIES.map((c) => ({
    ...c,
    count: issues.filter((i) => i.category === c.value).length,
    open: issues.filter((i) => i.category === c.value && i.status !== "resolved").length,
  }));

  const resolved = issues.filter((i) => i.status === "resolved" && i.resolved_at);
  const avgResolutionMs = resolved.length
    ? resolved.reduce((sum, i) => sum + (new Date(i.resolved_at!).getTime() - new Date(i.created_at).getTime()), 0) /
      resolved.length
    : null;

  const resolutionRate = total ? Math.round((issues.filter((i) => i.status === "resolved").length / total) * 100) : 0;
  const highOpen = issues.filter((i) => i.priority === "high" && i.status !== "resolved").length;

  // Reports per day for the last 14 days
  const days: { label: string; count: number }[] = [];
  for (let d = 13; d >= 0; d--) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - d);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    days.push({
      label: day.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      count: issues.filter((i) => {
        const t = new Date(i.created_at).getTime();
        return t >= day.getTime() && t < next.getTime();
      }).length,
    });
  }

  return { total, byStatus, byCategory, avgResolutionMs, resolutionRate, highOpen, days };
}
