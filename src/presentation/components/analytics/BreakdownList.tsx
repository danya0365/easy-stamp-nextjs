interface BreakdownRow {
  name: string;
  stamps: number;
  redemptions: number;
}

/**
 * A compact breakdown (by stamp type or branch): one row each with a
 * proportional bar of stamps issued + the redemption count. Server-rendered
 * (plain CSS bar, no chart lib needed for this simple view).
 */
export function BreakdownList({ rows }: { rows: BreakdownRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.stamps));
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r, i) => (
        <li key={`${r.name}-${i}`} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-foreground">{r.name}</span>
            <span className="shrink-0 text-muted">
              {r.stamps} แสตมป์ · {r.redemptions} แลก
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted-surface">
            <div
              className="h-full rounded-full bg-brand-500"
              style={{ width: `${Math.round((r.stamps / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
