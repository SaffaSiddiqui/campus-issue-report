import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getSessionProfile();

  if (!user) redirect('/login?next=/admin');
  if (profile?.role !== 'admin') {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <div className="text-4xl">🔒</div>
        <h1 className="mt-3 text-xl font-bold">Admins only</h1>
        <p className="mt-2 text-sm text-slate-600">Your account does not have access to the admin dashboard.</p>
        <Link href="/" className="btn-primary mt-6">
          Back to home
        </Link>
      </div>
    );
  }

  const tab = 'rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-900';

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-indigo-100 px-2 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700">
            Admin
          </span>
          <nav className="flex gap-1 rounded-xl bg-slate-100 p-1">
            <Link href="/admin" className={tab}>
              Dashboard
            </Link>
            <Link href="/admin/complaints" className={tab}>
              Complaints
            </Link>
          </nav>
        </div>
        <a href="/admin/export" className="btn-secondary !py-2">
          ⬇ Export CSV
        </a>
      </div>
      {children}
    </div>
  );
}
