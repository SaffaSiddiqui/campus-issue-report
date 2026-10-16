import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Profile } from "../types";

export function createClient() {
  const cookieStore = cookies();
  return createServerClient<any, "campus_issues">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: "campus_issues" },
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(list: { name: string; value: string; options: any }[]) {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // called from a Server Component — middleware refreshes the session instead
          }
        },
      },
    }
  );
}

export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null as Profile | null };
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();
  return { user, profile: (profile as Profile | null) ?? null };
}

export async function requireUser() {
  const { user, profile } = await getCurrentUser();
  if (!user) redirect("/login");
  return { user, profile };
}

export async function requireAdmin() {
  const { user, profile } = await requireUser();
  if (profile?.role !== "admin") redirect("/my-issues");
  return { user, profile };
}
