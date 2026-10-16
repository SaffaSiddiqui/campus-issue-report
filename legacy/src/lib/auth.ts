import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';

/** Returns the signed-in user and their profile (or nulls when signed out). */
export async function getSessionProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null as Profile | null };

  const { data } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  return { user, profile: (data as Profile | null) ?? null };
}
