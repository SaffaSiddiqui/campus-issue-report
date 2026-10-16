type Item = { label: string; value: number; color?: string; icon?: string };

/** Horizontal bar chart in pure CSS — no chart library needed. */
export function HBarChart({ items }: { items: Item[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span>
              {i.icon} {i.label}
            </span>
            <span className="font-semibold">{i.value}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${i.color ?? "bg-brand-500"}`}
              style={{ width: `${(i.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Vertical column chart for time series. */
export function ColumnChart({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="flex h-40 items-end gap-1 sm:gap-2" role="img" aria-label="Reports per day">
      {items.map((i, idx) => (
        <div key={i.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${i.label}: ${i.value}`}>
          <span className="text-[10px] text-slate-500">{i.value || ""}</span>
          <div
            className="w-full rounded-t bg-brand-500"
            style={{ height: `${Math.max((i.value / max) * 100, i.value ? 4 : 1)}%`, opacity: i.value ? 1 : 0.25 }}
          />
          <span className="hidden text-[10px] text-slate-400 sm:block">{idx % 2 === 0 ? i.label.split(" ")[0] : ""}</span>
        </div>
      ))}
    </div>
  );
}
