import { spineFor } from "../lib/spineColor";

export function MiniSpine({
  ficId,
  title,
  fandom,
  progressPct,
}: {
  ficId: string;
  title: string;
  fandom: string;
  progressPct?: number | null;
}) {
  const [from, to] = spineFor(ficId);
  return (
    <div className="flex aspect-[2/3] w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-ink/[0.06] shadow-sm">
      <div
        className="relative flex flex-1 items-center justify-center p-2.5"
        style={{ background: `linear-gradient(155deg, ${from}, ${to})` }}
      >
        <p className="line-clamp-4 text-center font-heading text-xs font-semibold leading-snug text-[#fffaf1]">
          {title}
        </p>
        {progressPct != null && (
          <div className="absolute inset-x-2.5 bottom-2 h-1 overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-white/90" style={{ width: `${progressPct}%` }} />
          </div>
        )}
      </div>
      <div className="bg-surface px-2 py-1.5">
        <p className="truncate text-[10px] font-medium text-ink-muted">{fandom}</p>
      </div>
    </div>
  );
}
