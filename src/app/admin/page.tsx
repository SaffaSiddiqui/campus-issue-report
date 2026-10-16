import Link from "next/link";
import { ColumnChart, HBarChart } from "@/components/BarChart";
import { StatCard } from "@/components/StatCard";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadge";
import { CATEGORIES, STATUSES, categoryOf } from "@/lib/constants";
import { formatDuration, timeAgo } from "@/lib/format";
import { computeStats } from "@/lib/stats";
import { createClient, requireAdmin } from "@/lib/supabase/server";
import type { Issue } from "@/lib/types";

export const dynamic = "force-dynamic";

type SP = { status?: string; category?: string; q?: string };

export default async function AdminDashboard({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const supabase = createClient();

  const { data } = await supabase
    .from("issues")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false });
  const all = (data ?? []) as Issue[];
  const stats = computeStats(all);

  const status = STATUSES.find((s) => s.value === searchParams.status)?.value;
  const category = CATEGORIES.find((c) => c.value === searchParams.category)?.value;
  const q = (searchParams.q ?? "").trim().toLowerCase();

  const rows = all.filter(
    (i) =>
      (!status || i.status === status) &&
      (!category || i.category === category) &&
      (!q || `${i.title} ${i.location} ${i.description}`.toLowerCase().includes(q))
  );

  const exportQs = new URLSearchParams();
  if (status) exportQs.set("status", status);
  if (category) exportQs.set("category", category);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Admin dashboard</h1>
        <a href={`/admin/export?${exportQs}`} className="btn-secondary">⬇ Export CSV report</a>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total complaints" value={stats.total} />
        <StatCard
          label="Pending"
          value={stats.byStatus[0].count}
          accent="text-amber-600"
          sub={stats.highOpen ? `${stats.highOpen} high-priority open` : "No high-priority open"}
        />
        <StatCard label="In progress" value={stats.byStatus[1].count} accent="text-blue-600" />
        <StatCard
          label="Resolved"
          value={stats.byStatus[2].count}
          accent="text-emerald-600"
          sub={`${stats.resolutionRate}% rate · avg ${stats.avgResolutionMs ? formatDuration(stats.avgResolutionMs) : "—"}`}
        />
      </section>

      {/* Charts */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card">
          <h2 className="mb-4 font-semibold">By status</h2>
          <HBarChart items={stats.byStatus.map((s) => ({ label: s.label, value: s.count, color: s.bar }))} />
        </div>
        <div className="card">
          <h2 className="mb-4 font-semibold">By category</h2>
          <HBarChart items={stats.byCategory.map((c) => ({ label: c.label, icon: c.icon, value: c.count }))} />
        </div>
        <div className="card">
          <h2 className="mb-4 font-semibold">Reports, last 14 days</h2>
          <ColumnChart items={stats.days.map((d) => ({ label: d.label, value: d.count }))} />
        </div>
      </section>

      {/* Management table */}
      <section className="card !p-0 overflow-hidden">
        <form className="flex flex-wrap gap-2 border-b border-slate-200 p-4" method="get">
          <input name="q" defaultValue={searchParams.q} placeholder="Search title, location…" className="input min-w-0 flex-1 basis-48" />
          <select name="status" defaultValue={status ?? ""} className="input !w-auto">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select name="category" defaultValue={category ?? ""} className="input !w-auto">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <button className="btn">Filter</button>
          {(status || category || q) && <Link href="/admin" className="btn-secondary">Clear</Link>}
        </form>

        {rows.length === 0 ? (
          <p className="p-10 text-center text-slate-500">No complaints match.</p>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden w-full text-left text-sm md:table">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Issue</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Reporter</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Age</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/issues/${i.id}`} className="font-medium text-brand-700 hover:underline">
                        {categoryOf(i.category)?.icon} {i.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{i.location}</td>
                    <td className="px-4 py-3 text-slate-600">{i.profiles?.full_name ?? "—"}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={i.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                    <td className="px-4 py-3 text-slate-500">{timeAgo(i.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile list */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {rows.map((i) => (
                <li key={i.id}>
                  <Link href={`/issues/${i.id}`} className="block p-4 hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium">{categoryOf(i.category)?.icon} {i.title}</span>
                      <StatusBadge status={i.status} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      📍 {i.location} · {i.profiles?.full_name ?? "—"} · {timeAgo(i.created_at)}
                    </p>
                    <div className="mt-2"><PriorityBadge priority={i.priority} /></div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
