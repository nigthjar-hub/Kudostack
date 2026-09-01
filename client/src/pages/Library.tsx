import { useEffect, useState } from "react";
import { api, type ReadEvent, type ReadStatus } from "../api";
import { StarRating } from "../components/StarRating";
import { TagBadge } from "../components/TagBadge";
import { SpineCard } from "../components/SpineCard";

const FILTERS: { value: ReadStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Books" },
  { value: "READING", label: "Reading" },
  { value: "WANT_TO_READ", label: "Want to Read" },
  { value: "FINISHED", label: "Finished" },
  { value: "DNF", label: "DNF" },
];

export function Library() {
  const [events, setEvents] = useState<ReadEvent[]>([]);
  const [filter, setFilter] = useState<ReadStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setSelectedId(null);
    api
      .myReadEvents(filter === "ALL" ? undefined : filter)
      .then(setEvents)
      .finally(() => setLoading(false));
  }, [filter]);

  const selected = events.find((e) => e.id === selectedId) ?? null;

  return (
    <div>
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              filter === f.value
                ? "border-paprika bg-paprika text-white"
                : "border-paprika/25 bg-surface text-ink-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-8 text-ink-muted">Loading...</p>
      ) : events.length === 0 ? (
        <p className="mt-8 text-ink-muted">Nothing here yet. Go log a fic!</p>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {events.map((event) => (
              <SpineCard
                key={event.id}
                event={event}
                active={selectedId === event.id}
                onClick={() => setSelectedId((id) => (id === event.id ? null : event.id))}
              />
            ))}
          </div>

          {selected && <DetailPanel event={selected} onClose={() => setSelectedId(null)} />}
        </>
      )}
    </div>
  );
}

function DetailPanel({ event, onClose }: { event: ReadEvent; onClose: () => void }) {
  const pct =
    event.fic.totalChapters && event.fic.totalChapters > 0
      ? Math.min(100, Math.round(((event.chaptersRead ?? 0) / event.fic.totalChapters) * 100))
      : null;

  return (
    <div className="kudo-card mt-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-heading text-lg font-semibold text-ink">{event.fic.title}</p>
          <p className="text-sm text-ink-muted">
            {event.fic.fandom} · {event.fic.author}
          </p>
        </div>
        <button onClick={onClose} aria-label="Close" className="text-ink-dim">
          ✕
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {event.fic.tags.map((t) => (
          <TagBadge key={t.tag.id} tag={t.tag} />
        ))}
      </div>

      {event.status === "FINISHED" && event.rating != null && (
        <div className="mt-3">
          <StarRating value={event.rating} size={18} />
        </div>
      )}

      {event.status === "READING" && pct != null && (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-paper">
            <div className="h-full rounded-full bg-sandy" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-ink-muted">
            chapter {event.chaptersRead ?? 0} of {event.fic.totalChapters}
          </p>
        </div>
      )}

      {event.reviewText && <p className="mt-3 text-sm text-ink">{event.reviewText}</p>}

      <StatusPill status={event.status} />
    </div>
  );
}

function StatusPill({ status }: { status: ReadStatus }) {
  const labels: Record<ReadStatus, string> = {
    READING: "Reading",
    FINISHED: "Finished",
    WANT_TO_READ: "Want to read",
    DNF: "DNF",
  };
  const styles: Record<ReadStatus, string> = {
    READING: "bg-royal/15 text-royal",
    FINISHED: "bg-sandy/25 text-paprika",
    WANT_TO_READ: "bg-lime/60 text-ink",
    DNF: "bg-ink/10 text-ink-soft",
  };
  return (
    <span className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
