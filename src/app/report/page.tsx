"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CATEGORIES, MAX_IMAGES, MAX_IMAGE_BYTES, PRIORITIES, type Category } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

function ReportForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = CATEGORIES.find((c) => c.value === params.get("category"))?.value ?? null;

  const [category, setCategory] = useState<Category | null>(initial);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    const bad = picked.find((f) => !f.type.startsWith("image/") || f.size > MAX_IMAGE_BYTES);
    if (bad) return setError(`"${bad.name}" must be an image under ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`);
    const next = [...files, ...picked].slice(0, MAX_IMAGES);
    if (files.length + picked.length > MAX_IMAGES) setError(`You can attach up to ${MAX_IMAGES} photos.`);
    else setError(null);
    setFiles(next);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!category) return setError("Please choose what kind of issue this is.");
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return router.replace("/login?next=/report");

    try {
      const urls: string[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("campus-issue-images").upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        urls.push(supabase.storage.from("campus-issue-images").getPublicUrl(path).data.publicUrl);
      }

      const { data, error: insErr } = await supabase
        .from("issues")
        .insert({
          user_id: user.id,
          category,
          title: String(form.get("title")).trim(),
          description: String(form.get("description")).trim(),
          location: String(form.get("location")).trim(),
          priority: String(form.get("priority")),
          image_urls: urls,
        })
        .select("id")
        .single();
      if (insErr) throw insErr;

      router.push(`/issues/${data.id}?submitted=1`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">Report an issue</h1>
      <p className="mb-6 text-slate-600">Tell us what&apos;s wrong and where. Photos help technicians fix it faster.</p>

      <form onSubmit={onSubmit} className="space-y-6">
        <fieldset className="card">
          <legend className="label !mb-3 px-1">1. What is the issue about?</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {CATEGORIES.map((c) => (
              <button
                type="button"
                key={c.value}
                onClick={() => setCategory(c.value)}
                aria-pressed={category === c.value}
                className={`rounded-xl border-2 p-3 text-center transition ${
                  category === c.value ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="text-3xl">{c.icon}</div>
                <div className="mt-1 text-sm font-medium">{c.label}</div>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="card space-y-4">
          <h2 className="font-semibold">2. Details</h2>
          <div>
            <label className="label" htmlFor="title">Short title</label>
            <input id="title" name="title" required minLength={3} maxLength={120} placeholder="e.g. Projector not turning on" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="location">Location</label>
            <input id="location" name="location" required placeholder="e.g. Block B, Room 204" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="description">Description</label>
            <textarea id="description" name="description" required minLength={5} maxLength={2000} rows={4} className="input" placeholder="What happened? Since when?" />
          </div>
          <div>
            <label className="label" htmlFor="priority">Urgency</label>
            <select id="priority" name="priority" defaultValue="medium" className="input">
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-3 font-semibold">3. Photos (optional)</h2>
          <div className="flex flex-wrap gap-3">
            {previews.map((src, i) => (
              <div key={src} className="relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200">
                <img src={src} alt={`Attachment ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label={`Remove photo ${i + 1}`}
                  onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                >
                  ✕
                </button>
              </div>
            ))}
            {files.length < MAX_IMAGES && (
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-brand-500 hover:text-brand-600">
                <span className="text-2xl">📷</span>
                <span className="text-xs">Add photo</span>
                <input type="file" accept="image/*" multiple className="sr-only" onChange={onPick} />
              </label>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">Up to {MAX_IMAGES} images, 5 MB each.</p>
        </div>

        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button className="btn w-full !py-3 sm:w-auto" disabled={loading}>
          {loading ? "Submitting…" : "Submit complaint"}
        </button>
      </form>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense>
      <ReportForm />
    </Suspense>
  );
}
