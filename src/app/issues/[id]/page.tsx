import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadge";
import { PRIORITIES, STATUSES, categoryOf, statusOf } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { createClient, requireUser } from "@/lib/supabase/server";
import type { Issue, IssueUpdate } from "@/lib/types";
import { deleteIssue, updateIssue } from "./actions";

export const dynamic = "force-dynamic";

export default async function IssueDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { submitted?: string };
}) {
  const { profile } = await requireUser();
  const isAdmin = profile?.role === "admin";
  const supabase = createClient();

  const { data } = await supabase
    .from("issues")
    .select("*, profiles(full_name)")
    .eq("id", params.id)
    .maybeSingle();
  if (!data) notFound();
  const issue = data as Issue;

  const { data: updates } = await supabase
    .from("issue_updates")
    .select("*")
    .eq("issue_id", issue.id)
    .order("created_at", { ascending: true });
  const history = (updates ?? []) as IssueUpdate[];

  const cat = categoryOf(issue.category);
  const stepIndex = STATUSES.findIndex((s) => s.value === issue.status);

  async function remove(fd: FormData) {
    "use server";
    await deleteIssue(fd);
    redirect("/admin");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href={isAdmin ? "/admin" : "/my-issues"} className="text-sm text-slate-500 hover:text-slate-800">
        ← Back
      </Link>

      {searchParams.submitted && (
        <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
          ✅ Complaint submitted. You can follow its progress on this page.
        </p>
      )}

      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">{cat?.icon} {cat?.label}</p>
            <h1 className="text-2xl font-bold">{issue.title}</h1>
          </div>
          <div className="flex gap-2">
            <PriorityBadge priority={issue.priority} />
            <StatusBadge status={issue.status} />
          </div>
        </div>

        {/* Progress tracker */}
        <ol className="my-6 grid grid-cols-3 gap-2" aria-label="Progress">
          {STATUSES.map((s, i) => (
            <li key={s.value}>
              <div className={`h-2 rounded-full ${i <= stepIndex ? s.bar : "bg-slate-200"}`} />
              <p className={`mt-1 text-xs ${i <= stepIndex ? "font-semibold text-slate-800" : "text-slate-400"}`}>{s.label}</p>
            </li>
          ))}
        </ol>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-slate-500">Location</dt><dd className="font-medium">📍 {issue.location}</dd></div>
          <div><dt className="text-slate-500">Reported</dt><dd className="font-medium">{formatDate(issue.created_at)}</dd></div>
          {isAdmin && (
            <div><dt className="text-slate-500">Reported by</dt><dd className="font-medium">{issue.profiles?.full_name ?? "—"}</dd></div>
          )}
          {issue.resolved_at && (
            <div><dt className="text-slate-500">Resolved</dt><dd className="font-medium">{formatDate(issue.resolved_at)}</dd></div>
          )}
        </dl>

        <h2 className="mb-1 mt-5 text-sm font-semibold text-slate-500">Description</h2>
        <p className="whitespace-pre-wrap">{issue.description}</p>

        {issue.image_urls.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {issue.image_urls.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-slate-200">
                <img src={url} alt="Issue attachment" className="aspect-square w-full object-cover" />
              </a>
            ))}
          </div>
        )}

        {issue.admin_note && (
          <div className="mt-5 rounded-xl bg-brand-50 p-4 text-sm">
            <p className="font-semibold text-brand-700">Note from maintenance</p>
            <p className="mt-1 whitespace-pre-wrap">{issue.admin_note}</p>
          </div>
        )}
      </div>

      {isAdmin && (
        <form action={updateIssue} className="card space-y-4 border-brand-500">
          <h2 className="font-semibold">Manage complaint</h2>
          <input type="hidden" name="id" value={issue.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="status">Status</label>
              <select id="status" name="status" defaultValue={issue.status} className="input">
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="priority">Priority</label>
              <select id="priority" name="priority" defaultValue={issue.priority} className="input">
                {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="admin_note">Note to the reporter</label>
            <textarea id="admin_note" name="admin_note" rows={3} defaultValue={issue.admin_note ?? ""} className="input" placeholder="e.g. Technician assigned, parts ordered…" />
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="btn">Save changes</button>
            <button formAction={remove} className="btn-secondary !text-red-600">Delete</button>
          </div>
        </form>
      )}

      <div className="card">
        <h2 className="mb-4 font-semibold">Activity</h2>
        <ol className="space-y-4 border-l-2 border-slate-200 pl-5">
          {history.map((u) => (
            <li key={u.id} className="relative">
              <span className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${statusOf(u.status).bar}`} />
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={u.status} />
                <span className="text-xs text-slate-500">{formatDate(u.created_at)}</span>
              </div>
              {u.note && <p className="mt-1 text-sm text-slate-700">{u.note}</p>}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
