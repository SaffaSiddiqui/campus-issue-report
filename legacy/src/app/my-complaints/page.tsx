import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ComplaintCard from '@/components/ComplaintCard';
import { STATUSES, isStatus } from '@/lib/constants';
import type { Complaint } from '@/lib/types';

export const metadata = { title: 'My complaints - Campus Fix' };

export default async function MyComplaintsPage({
  searchParams,
}: {
  searchParams: { status?: string; submitted?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/my-complaints');

  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const all = (data ?? []) as Complaint[];
  const active = isStatus(searchParams.status) ? searchParams.status : undefined;
  const complaints = active ? all.filter((c) => c.status === active) : all;

  const counts = {
    all: all.length,
    pending: all.filter((c) => c.status === 'pending').length,
    in_progress: all.filter((c) => c.status === 'in_progress').length,
    resolved: all.filter((c) => c.status === 'resolved').length,
  };

  const tabs = [{ value: undefined, label: 'All', count: counts.all }, ...STATUSES.map((s) => ({ value: s.value, label: s.label, count: counts[s.value] }))];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">My complaints</h1>
          <p className="mt-1 text-sm text-slate-600">Follow each issue from Pending to Resolved.</p>
        </div>
        <Link href="/report" className="btn-primary">
          + New complaint
        </Link>
      </div>

      {searchParams.submitted && (
        <p role="status" className="mt-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-200">
          ✅ Complaint submitted. It is now Pending and an admin will review it soon.
        </p>
      )}

      <div className="-mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <nav className="flex min-w-max gap-2" aria-label="Filter by status">
          {tabs.map((t) => {
            const selected = t.value === active;
            return (
              <Link
                key={t.label}
                href={t.value ? `/my-complaints?status=${t.value}` : '/my-complaints'}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 ring-inset transition ${
                  selected ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.label} <span className={selected ? 'text-indigo-100' : 'text-slate-400'}>{t.count}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {error && (
        <p role="alert" className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          Could not load your complaints: {error.message}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {complaints.length === 0 && !error ? (
          <div className="card px-6 py-12 text-center">
            <div className="text-4xl">🎉</div>
            <p className="mt-3 font-semibold">{all.length === 0 ? 'No complaints yet' : 'Nothing here'}</p>
            <p className="mt-1 text-sm text-slate-600">
              {all.length === 0 ? 'Spotted something broken? Let us know.' : 'No complaints with this status.'}
            </p>
            {all.length === 0 && (
              <Link href="/report" className="btn-primary mt-5">
                Report an issue
              </Link>
            )}
          </div>
        ) : (
          complaints.map((c) => <ComplaintCard key={c.id} complaint={c} />)
        )}
      </div>
    </div>
  );
}
