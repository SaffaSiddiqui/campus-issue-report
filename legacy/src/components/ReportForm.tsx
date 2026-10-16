'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CATEGORIES, IMAGE_TYPES, MAX_IMAGE_MB } from '@/lib/constants';
import type { Category } from '@/lib/types';

export default function ReportForm({ defaultCategory }: { defaultCategory?: Category }) {
  const router = useRouter();
  const [category, setCategory] = useState<Category | ''>(defaultCategory ?? '');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setError(null);

    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (!IMAGE_TYPES.includes(f.type)) {
      setError('Please choose a JPG, PNG, WebP or GIF image.');
      e.target.value = '';
      return;
    }
    if (f.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`Image must be smaller than ${MAX_IMAGE_MB} MB.`);
      e.target.value = '';
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function removeFile() {
    setFile(null);
    setPreview(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!category) {
      setError('Please choose what type of issue this is.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login?next=/report');
      return;
    }

    let image_url: string | null = null;

    if (file) {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
      const path = `${user.id}/${crypto.randomUUID()}.${ext || 'jpg'}`;
      const { error: uploadError } = await supabase.storage
        .from('complaint-images')
        .upload(path, file, { contentType: file.type });

      if (uploadError) {
        setError(`Image upload failed: ${uploadError.message}`);
        setLoading(false);
        return;
      }
      image_url = supabase.storage.from('complaint-images').getPublicUrl(path).data.publicUrl;
    }

    const { error: insertError } = await supabase.from('complaints').insert({
      user_id: user.id,
      category,
      title: title.trim(),
      location: location.trim(),
      description: description.trim(),
      image_url,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push('/my-complaints?submitted=1');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-6 p-5 sm:p-8">
      <fieldset>
        <legend className="label">What kind of issue is it?</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
          {CATEGORIES.map((c) => {
            const selected = category === c.value;
            return (
              <label
                key={c.value}
                className={`flex cursor-pointer flex-col items-center rounded-xl border p-3 text-center transition ${
                  selected
                    ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={c.value}
                  checked={selected}
                  onChange={() => setCategory(c.value)}
                  className="sr-only"
                />
                <span className="text-2xl">{c.icon}</span>
                <span className="mt-1 text-sm font-medium">{c.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="title" className="label">Short title</label>
          <input
            id="title"
            required
            minLength={3}
            maxLength={120}
            className="input"
            placeholder="e.g. Projector shows no signal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="location" className="label">Location</label>
          <input
            id="location"
            required
            minLength={2}
            maxLength={120}
            className="input"
            placeholder="e.g. Block B, Room 204"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="label">Description</label>
        <textarea
          id="description"
          required
          minLength={5}
          maxLength={2000}
          rows={5}
          className="input resize-y"
          placeholder="What is wrong? Since when? Anything we should know?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <span className="label">Photo (optional)</span>
        {preview ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Selected upload preview" className="h-48 max-w-full rounded-xl border border-slate-200 object-cover" />
            <button
              type="button"
              onClick={removeFile}
              className="absolute right-2 top-2 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-900"
            >
              Remove
            </button>
          </div>
        ) : (
          <label
            htmlFor="photo"
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center hover:border-indigo-400 hover:bg-indigo-50/40"
          >
            <span className="text-3xl">📷</span>
            <span className="mt-2 text-sm font-medium text-slate-700">Tap to take or choose a photo</span>
            <span className="text-xs text-slate-500">JPG, PNG, WebP or GIF, up to {MAX_IMAGE_MB} MB</span>
          </label>
        )}
        <input
          id="photo"
          type="file"
          accept={IMAGE_TYPES.join(',')}
          onChange={onFile}
          className={preview ? 'hidden' : 'sr-only'}
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={() => router.back()} className="btn-secondary" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit complaint'}
        </button>
      </div>
    </form>
  );
}
