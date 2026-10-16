import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/server";

export async function Navbar() {
  const { user, profile } = await getCurrentUser();
  const link = "rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">🛠️</span>
          <span>Campus Fix</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-1">
          {user ? (
            <>
              <Link href="/report" className={link}>Report</Link>
              <Link href="/my-issues" className={link}>My issues</Link>
              {profile?.role === "admin" && <Link href="/admin" className={link}>Dashboard</Link>}
              <form action="/auth/signout" method="post">
                <button className={link} type="submit">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={link}>Log in</Link>
              <Link href="/register" className="btn !py-2">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
