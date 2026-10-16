import { STATUSES } from '@/lib/constants';
import type { Status } from '@/lib/types';

/** Three-step progress indicator: Pending -> In Progress -> Resolved */
export default function StatusTracker({ status }: { status: Status }) {
  const current = STATUSES.findIndex((s) => s.value === status);

  return (
    <ol className="flex items-center gap-2" aria-label="Complaint progress">
      {STATUSES.map((s, i) => {
        const done = i <= current;
        return (
          <li key={s.value} className="flex flex-1 items-center gap-2 last:flex-none">
            <div className="flex items-center gap-1.5">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  done ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {done ? '✓' : i + 1}
              </span>
              <span className={`text-xs font-medium ${done ? 'text-slate-900' : 'text-slate-400'}`}>{s.label}</span>
            </div>
            {i < STATUSES.length - 1 && (
              <span className={`h-0.5 flex-1 rounded ${i < current ? 'bg-indigo-600' : 'bg-slate-200'}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
