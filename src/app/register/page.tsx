"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    const { data, error } = await createClient().auth.signUp({
      email: String(f.get("email")),
      password: String(f.get("password")),
      options: { data: { full_name: String(f.get("name")) } },
    });
    setLoading(false);
    if (error) return setError(error.message);
    if (data.session) {
      router.replace("/my-issues");
      router.refresh();
    } else {
      setNotice("Account created. Check your email to confirm your address, then log in.");
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={onSubmit} className="card space-y-4">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input id="name" name="name" required className="input" autoComplete="name" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required className="input" autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required minLength={8} className="input" autoComplete="new-password" />
          <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
        <button className="btn w-full" disabled={loading}>{loading ? "Creating…" : "Sign up"}</button>
        <p className="text-center text-sm text-slate-600">
          Already registered? <Link href="/login" className="font-semibold text-brand-600">Log in</Link>
        </p>
      </form>
    </div>
  );
}
