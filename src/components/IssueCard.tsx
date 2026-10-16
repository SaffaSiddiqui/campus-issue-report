import Link from "next/link";
import { categoryOf } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import type { Issue } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

export function IssueCard({ issue }: { issue: Issue }) {
  const cat = categoryOf(issue.category);
  return (
    <Link href={`/issues/${issue.id}`} className="card block transition hover:border-brand-500 hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-2xl">
          {cat?.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="truncate font-semibold">{issue.title}</h3>
            <StatusBadge status={issue.status} />
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{issue.description}</p>
          <p className="mt-2 text-xs text-slate-500">
            {cat?.label} · 📍 {issue.location} · {timeAgo(issue.created_at)}
            {issue.image_urls.length > 0 && ` · 🖼️ ${issue.image_urls.length}`}
          </p>
        </div>
      </div>
    </Link>
  );
}
