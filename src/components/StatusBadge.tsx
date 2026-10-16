import { priorityOf, statusOf } from "@/lib/constants";

export function StatusBadge({ status }: { status: string }) {
  const s = statusOf(status);
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${s.classes}`}>
      {s.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const p = priorityOf(priority);
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.classes}`}>{p.label}</span>;
}
