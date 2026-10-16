import { categoryMeta, formatDateTime } from '@/lib/constants';
import type { Complaint } from '@/lib/types';
import StatusBadge from './StatusBadge';
import StatusTracker from './StatusTracker';

export default function ComplaintCard({ complaint }: { complaint: Complaint }) {
  const cat = categoryMeta(complaint.category);

  return (
    <article className="card overflow-hidden">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
        {complaint.image_url && (
          <a
            href={complaint.image_url}
            target="_blank"
            rel="noreferrer"
            className="block shrink-0 sm:w-40"
            aria-label="Open photo in a new tab"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={complaint.image_url}
              alt={`Photo for ${complaint.title}`}
              loading="lazy"
              className="h-40 w-full rounded-xl border border-slate-200 object-cover sm:h-32"
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
            📍 {complaint.location} · Submitted {formatDateTime(complaint.created_at)}
          </p>
          <p className="mt-2 whitespace-pre-line break-words text-sm text-slate-700">{complaint.description}</p>

          {complaint.admin_note && (
            <div className="mt-3 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-900 ring-1 ring-inset ring-indigo-100">
              <span className="font-semibold">Admin note: </span>
              {complaint.admin_note}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">
        <StatusTracker status={complaint.status} />
        {complaint.resolved_at && (
          <p className="mt-2 text-xs text-slate-500">Resolved on {formatDateTime(complaint.resolved_at)}</p>
        )}
      </div>
    </article>
  );
}
