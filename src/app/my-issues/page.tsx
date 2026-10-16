import Link from "next/link";
import { IssueCard } from "@/components/IssueCard";
import { STATUSES } from "@/lib/constants";
import { createClient, requireUser } from "@/lib/supabase/server";
import type { Issue } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MyIssues({ searchParams }: { searchParams: { status?: string } }) {
  const { user } = await requireUser();
  const supabase = createClient();
  const { data } = await supabase
    .from("issues")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const all = (data ?? []) as Issue[];
  const filter = STATUSES.find((s) => s.value === searchParams.status)?.value;
  const issues = filter ? all.filter((i) => i.status === filter) : all;

  const tab = (active: boolean) =>
    `whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium ${
      active ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
    }`;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">My complaints</h1>
        <Link href="/report" className="btn">+ New report</Link>
      </div>

      <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link href="/my-issues" className={tab(!filter)}>All ({all.length})</Link>
        {STATUSES.map((s) => (
          <Link key={s.value} href={`/my-issues?status=${s.value}`} className={tab(filter === s.value)}>
            {s.label} ({all.filter((i) => i.status === s.value).length})
          </Link>
        ))}
      </div>

      {issues.length === 0 ? (
        <div className="card py-12 text-center text-slate-500">
          <p className="text-4xl">📭</p>
          <p className="mt-2">No complaints here yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {issues.map((i) => (
            <IssueCard key={i.id} issue={i} />
          ))}
        </div>
      )}
    </div>
  );
}
