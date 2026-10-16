import Link from "next/link";
import { CATEGORIES, STATUSES } from "@/lib/constants";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-700 px-6 py-12 text-white sm:px-12 sm:py-16">
        <h1 className="max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">
          Something broken on campus? Report it in under a minute.
        </h1>
        <p className="mt-4 max-w-xl text-blue-100 sm:text-lg">
          Snap a photo, describe the problem and follow the repair from Pending to Resolved.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/report" className="rounded-xl bg-white px-5 py-3 font-semibold text-brand-700 hover:bg-blue-50">
            Report an issue
          </Link>
          <Link href="/my-issues" className="rounded-xl border border-white/40 px-5 py-3 font-semibold hover:bg-white/10">
            Track my complaints
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">What can you report?</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((c) => (
            <Link key={c.value} href={`/report?category=${c.value}`} className="card text-center transition hover:border-brand-500">
              <div className="text-4xl">{c.icon}</div>
              <p className="mt-2 font-semibold">{c.label}</p>
              <p className="mt-1 text-xs text-slate-500">{c.hint}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {STATUSES.map((s, i) => (
          <div key={s.value} className="card">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${s.classes}`}>
              {i + 1}. {s.label}
            </span>
            <p className="mt-3 text-sm text-slate-600">
              {["Your report is logged and waiting for review.", "A technician is working on the fix.", "The issue is fixed and closed."][i]}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
