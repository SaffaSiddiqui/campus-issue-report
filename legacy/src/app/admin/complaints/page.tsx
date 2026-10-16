import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import AdminComplaintCard from '@/components/AdminComplaintCard';
import { CATEGORIES, STATUSES, isCategory, isStatus } from '@/lib/constants';
import type { AdminComplaint } from '@/lib/types';

export const metadata = { title: 'Manage complaints - Campus Fix' };

export default async function AdminComplaintsPage({
  searchParams,
}: {
  searchParams: { status?: string; category?: string; q?: string };
}) {
  const supabase = createClient();

  const status = isStatus(searchParams.status) ? searchParams.status : '';
  const category = isCategory(searchParams.category) ? searchParams.category : '';
  const q = (searchParams.q ?? '').trim().slice(0, 80);

  let query = supabase
    .from('complaints')
    .select('*, profiles(full_name, email)')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (category) query = query.eq('category', category);
  if (q) {
    // strip characters that have meaning inside a PostgREST or() filter
    const safe = q.replace(/[,()%*\\]/g, ' ').trim();
    if (safe) query = query.or(`title.ilike.%${safe}%,location.ilike.%${safe}%,description.ilike.%${safe}%`);
  }

  const { data, error } = await query;
  const complaints = (data ?? []) as unknown as AdminComplaint[];
  const filtered = Boolean(status || category || q);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Manage complaints</h1>
        <p className="mt-1 text-sm text-slate-600">Review, update status and leave notes for reporters.</p>
      </div>

      <form method="get" className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_12rem_12rem_auto]">
        <div>
          <label htmlFor="q" className="sr-only">Search</label>
          <input id="q" name="q" defaultValue={q} placeholder="Search title, location or description" className="input" />
        </div>
        <div>
          <label htmlFor="status" className="sr-only">Status</label>
          <select id="status" name="status" defaultValue={status} className="input">
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="category" className="sr-only">Category</label>
          <select id="category" name="category" defaultValue={category} className="input">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary flex-1">Filter</button>
          {filtered && (
            <Link href="/admin/complaints" className="btn-secondary">Clear</Link>
          )}
        </div>
      </form>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          Could not load complaints: {error.message}
        </p>
      )}

      <p className="text-sm text-slate-500">
        {complaints.length} complaint{complaints.length === 1 ? '' : 's'}
        {filtered ? ' match your filters' : ''}
      </p>

      <div className="space-y-4">
        {complaints.length === 0 && !error ? (
          <div className="card px-6 py-12 text-center">
            <div className="text-4xl">🗂️</div>
            <p className="mt-3 font-semibold">No complaints found</p>
            <p className="mt-1 text-sm text-slate-600">
              {filtered ? 'Try a different filter.' : 'New complaints will show up here.'}
            </p>
          </div>
        ) : (
          complaints.map((c) => <AdminComplaintCard key={c.id} complaint={c} />)
        )}
      </div>
    </div>
  );
}
