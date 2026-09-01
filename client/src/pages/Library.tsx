import { useEffect, useState } from "react";
import { api, type ReadEvent, type ReadStatus } from "../api";
import { StarRating } from "../components/StarRating";
import { TagBadge } from "../components/TagBadge";

const FILTERS: { value: ReadStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "READING", label: "Reading" },
  { value: "FINISHED", label: "Finished" },
  { value: "WANT_TO_READ", label: "Want to read" },
  { value: "DNF", label: "DNF" },
];

export function Library() {
  const [events, setEvents] = useState<ReadEvent[]>([]);
  const [filter, setFilter] = useState<ReadStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .myReadEvents(filter === "ALL" ? undefined : filter)
      .then(setEvents)
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === f.value ? "bg-sandy text-white" : "kudo-card text-ink-soft"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-8 text-ink-soft">Loading...</p>
      ) : events.length === 0 ? (
        <p className="mt-8 text-ink-soft">Nothing here yet. Go log a fic!</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {events.map((event) => {
            const pct =
              event.fic.totalChapters && event.fic.totalChapters > 0
                ? Math.min(100, Math.round(((event.chaptersRead ?? 0) / event.fic.totalChapters) * 100))
                : null;
            return (
              <li key={event.id} className="kudo-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-heading text-lg font-semibold text-ink">{event.fic.title}</p>
                    <p className="text-sm text-ink-muted">
                      {event.fic.fandom} · {event.fic.author}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {event.fic.tags.map((t) => (
                        <TagBadge key={t.tag.id} tag={t.tag} />
                      ))}
                    </div>
                    {event.reviewText && <p className="mt-2 text-sm text-ink">{event.reviewText}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {event.status === "FINISHED" && event.rating != null && (
                      <StarRating value={event.rating} size={16} />
                    )}
                  </div>
                </div>

                {event.status === "READING" && pct != null && (
                  <div className="mt-3">
                    <div className="h-1.5 overflow-hidden rounded-full bg-honeydew">
                      <div className="h-full rounded-full bg-sandy" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-ink-muted">
                      chapter {event.chaptersRead ?? 0} of {event.fic.totalChapters}
                    </p>
                  </div>
                )}

                <StatusPill status={event.status} />
              </li>
            );
          })}
        </ul>
      )}
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
