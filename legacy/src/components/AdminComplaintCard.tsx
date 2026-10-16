'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { STATUSES, categoryMeta, formatDateTime } from '@/lib/constants';
import type { AdminComplaint, Status } from '@/lib/types';
import StatusBadge from './StatusBadge';

export default function AdminComplaintCard({ complaint }: { complaint: AdminComplaint }) {
  const router = useRouter();
  const cat = categoryMeta(complaint.category);
  const [status, setStatus] = useState<Status>(complaint.status);
  const [note, setNote] = useState(complaint.admin_note ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const dirty = status !== complaint.status || note.trim() !== (complaint.admin_note ?? '');
  const reporter = complaint.profiles;

  async function save() {
    setSaving(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase
      .from('complaints')
      .update({ status, admin_note: note.trim() || null })
      .eq('id', complaint.id);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'ok', text: 'Saved' });
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <article className="card overflow-hidden">
      <div className="flex flex-col gap-4 p-4 sm:p-5 md:flex-row">
        {complaint.image_url && (
          <a href={complaint.image_url} target="_blank" rel="noreferrer" className="block shrink-0 md:w-44" aria-label="Open photo in a new tab">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={complaint.image_url}
              alt={`Photo for ${complaint.title}`}
              loading="lazy"
              className="h-44 w-full rounded-xl border border-slate-200 object-cover md:h-36"
            />
          </a>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
              <span aria-hidden>{cat.icon}</span>
              {cat.label}
            </span>
            <StatusBadge status={complaint.status} />
          </div>
          <h2 className="mt-2 break-words text-base font-semibold sm:text-lg">{complaint.title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            📍 {complaint.location} · {formatDateTime(complaint.created_at)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            👤 {reporter?.full_name || 'Unknown'}
            {reporter?.email ? ` · ${reporter.email}` : ''}
          </p>
          <p className="mt-2 whitespace-pre-line break-words text-sm text-slate-700">{complaint.description}</p>
        </div>
      </div>

      <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5">
        <div>
          <span className="label">Update status</span>
          <div className="grid grid-cols-3 gap-2">
            {STATUSES.map((s) => {
              const selected = status === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value)}
                  aria-pressed={selected}
                  className={`rounded-lg border px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                    selected
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor={`note-${complaint.id}`} className="label">
            Note for the reporter (optional)
          </label>
          <textarea
            id={`note-${complaint.id}`}
            rows={2}
            maxLength={500}
            className="input resize-y"
            placeholder="e.g. Technician assigned, replacement bulb arriving tomorrow"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {message && (
            <span role="status" className={`text-sm ${message.type === 'ok' ? 'text-emerald-700' : 'text-red-700'}`}>
              {message.type === 'ok' ? '✓ ' : ''}
              {message.text}
            </span>
          )}
          <button type="button" onClick={save} disabled={!dirty || saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </article>
  );
}
