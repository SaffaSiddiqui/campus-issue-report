import { NextResponse, type NextRequest } from "next/server";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import type { Issue } from "@/lib/types";

export const dynamic = "force-dynamic";

// Guard against CSV/Excel formula injection and escape quotes.
const cell = (v: unknown) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(request: NextRequest) {
  const { user, profile } = await getCurrentUser();
  if (!user || profile?.role !== "admin") return new NextResponse("Forbidden", { status: 403 });

  const sp = request.nextUrl.searchParams;
  let query = createClient()
    .from("issues")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false });
  if (sp.get("status")) query = query.eq("status", sp.get("status")!);
  if (sp.get("category")) query = query.eq("category", sp.get("category")!);

  const { data, error } = await query;
  if (error) return new NextResponse(error.message, { status: 500 });

  const header = ["ID", "Category", "Title", "Location", "Reporter", "Priority", "Status", "Reported", "Resolved", "Admin note"];
  const lines = (data as Issue[]).map((i) =>
    [i.id, i.category, i.title, i.location, i.profiles?.full_name, i.priority, i.status, i.created_at, i.resolved_at, i.admin_note]
      .map(cell)
      .join(",")
  );

  return new NextResponse("﻿" + [header.map(cell).join(","), ...lines].join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="issues-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
