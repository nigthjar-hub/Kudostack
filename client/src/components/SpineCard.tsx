import type { ReadEvent, ReadStatus } from "../api";
import { StarRating } from "./StarRating";
import { spineFor } from "../lib/spineColor";

const STATUS_LABEL: Record<ReadStatus, string> = {
  READING: "Reading",
  FINISHED: "Finished",
  WANT_TO_READ: "Want to read",
  DNF: "DNF",
};

export function SpineCard({
  event,
  active,
  onClick,
}: {
  event: ReadEvent;
  active?: boolean;
  onClick?: () => void;
}) {
  const [from, to] = spineFor(event.fic.id);
  const pct =
    event.fic.totalChapters && event.fic.totalChapters > 0
      ? Math.min(100, Math.round(((event.chaptersRead ?? 0) / event.fic.totalChapters) * 100))
      : null;

  return (
    <button
      onClick={onClick}
      className={`kudo-card flex aspect-[2/3] w-full flex-col overflow-hidden p-0 text-left transition ${
        active ? "ring-2 ring-paprika" : ""
      }`}
    >
      <div
        className="relative flex flex-1 items-center justify-center p-3"
        style={{ background: `linear-gradient(155deg, ${from}, ${to})` }}
      >
        <p className="line-clamp-4 text-center font-heading text-sm font-semibold leading-snug text-[#fffaf1]">
          {event.fic.title}
        </p>
        {event.status === "READING" && pct != null && (
          <div className="absolute inset-x-3 bottom-2 h-1 overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-white/90" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 px-2.5 py-2">
        <p className="truncate text-[11px] font-medium text-ink-muted">{event.fic.fandom}</p>
        {event.status === "FINISHED" && event.rating != null ? (
          <StarRating value={event.rating} size={12} />
        ) : (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-dim">
            {STATUS_LABEL[event.status]}
          </span>
        )}
      </div>
    </button>
  );
}
