"use server";

import { revalidatePath } from "next/cache";
import { PRIORITIES, STATUSES } from "@/lib/constants";
import { createClient, requireAdmin } from "@/lib/supabase/server";

export async function updateIssue(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  const priority = String(formData.get("priority"));
  const note = String(formData.get("admin_note") ?? "").trim();

  if (!STATUSES.some((s) => s.value === status) || !PRIORITIES.some((p) => p.value === priority)) {
    throw new Error("Invalid status or priority");
  }

  // RLS also guarantees only admins can update.
  const { error } = await createClient()
    .from("issues")
    .update({ status, priority, admin_note: note || null })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/issues/${id}`);
  revalidatePath("/admin");
  revalidatePath("/my-issues");
}

export async function deleteIssue(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const { error } = await createClient().from("issues").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}
