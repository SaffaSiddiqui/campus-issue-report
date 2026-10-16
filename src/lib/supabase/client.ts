import { createBrowserClient } from "@supabase/ssr";
import { DB_SCHEMA } from "../constants";

// All app tables live in the isolated `campus_issues` schema (see supabase/schema.sql).
export function createClient() {
  return createBrowserClient<any, "campus_issues">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: DB_SCHEMA } }
  );
}
