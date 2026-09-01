import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError, type ReadStatus, type Tag } from "../api";
import { StarRating } from "../components/StarRating";
import { TagBadge } from "../components/TagBadge";

const CATEGORY_LABELS: Record<Tag["category"], string> = {
  TROPE: "Tropes",
  WARNING: "Content warnings",
  SPICE: "Spice level",
  OTHER: "Other",
};

const STATUS_OPTIONS: { value: ReadStatus; label: string }[] = [
  { value: "WANT_TO_READ", label: "Want to read" },
  { value: "READING", label: "Reading" },
  { value: "FINISHED", label: "Finished" },
  { value: "DNF", label: "Did not finish" },
];

export function AddFic() {
  const navigate = useNavigate();
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());

  const [title, setTitle] = useState("");
  const [fandom, setFandom] = useState("");
  const [author, setAuthor] = useState("");
  const [ficStatus, setFicStatus] = useState<"ONGOING" | "COMPLETE">("ONGOING");
  const [totalChapters, setTotalChapters] = useState("");
  const [wordCount, setWordCount] = useState("");
  const [ao3Url, setAo3Url] = useState("");

  const [readStatus, setReadStatus] = useState<ReadStatus>("WANT_TO_READ");
  const [rating, setRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [chaptersRead, setChaptersRead] = useState("");
  const [showContentWarnings, setShowContentWarnings] = useState(false);
  const [showSpiceTags, setShowSpiceTags] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.tags().then(setTags).catch(() => setTags([]));
  }, []);

  const tagsByCategory = useMemo(() => {
    const groups: Record<string, Tag[]> = {};
    for (const tag of tags) {
      (groups[tag.category] ??= []).push(tag);
    }
    return groups;
  }, [tags]);

  function toggleTag(id: string) {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const hasWarningOrSpiceTags = tags.some(
    (t) => selectedTagIds.has(t.id) && (t.category === "WARNING" || t.category === "SPICE")
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const fic = await api.createFic({
        title: title.trim(),
        fandom: fandom.trim(),
        author: author.trim(),
        status: ficStatus,
        totalChapters: totalChapters ? Number(totalChapters) : null,
        wordCount: wordCount ? Number(wordCount) : null,
        ao3Url: ao3Url.trim() || null,
        tagIds: [...selectedTagIds],
      });

      await api.createReadEvent({
        ficId: fic.id,
        status: readStatus,
        rating: readStatus === "FINISHED" ? rating : null,
        reviewText: reviewText.trim() || null,
        chaptersRead: chaptersRead ? Number(chaptersRead) : null,
        finishedDate: readStatus === "FINISHED" ? new Date().toISOString() : null,
        startedDate: readStatus !== "WANT_TO_READ" ? new Date().toISOString() : null,
        showContentWarnings,
        showSpiceTags,
      });

      setSuccess(true);
      setTimeout(() => navigate("/library"), 700);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="kudo-card flex flex-col gap-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-ink-soft sm:col-span-2">
            Title
            <input
              className="rounded-xl border border-paprika/15 bg-white px-3 py-2 outline-none focus:border-sandy"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-ink-soft">
            Fandom
            <input
              className="rounded-xl border border-paprika/15 bg-white px-3 py-2 outline-none focus:border-sandy"
              value={fandom}
              onChange={(e) => setFandom(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-ink-soft">
            Author
            <input
              className="rounded-xl border border-paprika/15 bg-white px-3 py-2 outline-none focus:border-sandy"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-ink-soft">
            Fic status
            <select
              className="rounded-xl border border-paprika/15 bg-white px-3 py-2 outline-none focus:border-sandy"
              value={ficStatus}
              onChange={(e) => setFicStatus(e.target.value as "ONGOING" | "COMPLETE")}
            >
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETE">Complete</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-ink-soft">
            Total chapters
            <input
              type="number"
              min={1}
              className="rounded-xl border border-paprika/15 bg-white px-3 py-2 outline-none focus:border-sandy"
              value={totalChapters}
              onChange={(e) => setTotalChapters(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-ink-soft">
            Word count (optional)
            <input
              type="number"
              min={1}
              className="rounded-xl border border-paprika/15 bg-white px-3 py-2 outline-none focus:border-sandy"
              value={wordCount}
              onChange={(e) => setWordCount(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-ink-soft">
            AO3 link (optional)
            <input
              type="url"
              placeholder="https://archiveofourown.org/works/..."
              className="rounded-xl border border-paprika/15 bg-white px-3 py-2 outline-none focus:border-sandy"
              value={ao3Url}
              onChange={(e) => setAo3Url(e.target.value)}
            />
          </label>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ink">Tags</h2>
          <div className="mt-2 flex flex-col gap-3">
            {(["TROPE", "WARNING", "SPICE", "OTHER"] as const).map((category) =>
              tagsByCategory[category]?.length ? (
                <div key={category}>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-soft">
                    {CATEGORY_LABELS[category]}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tagsByCategory[category].map((tag) => {
                      const active = selectedTagIds.has(tag.id);
                      return (
                        <button
                          type="button"
                          key={tag.id}
                          onClick={() => toggleTag(tag.id)}
                          className={active ? "ring-2 ring-paprika/60 rounded-full" : "rounded-full"}
                        >
                          <TagBadge tag={tag} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null
            )}
          </div>
        </div>

        <div className="border-t border-paprika/10 pt-5">
          <h2 className="text-sm font-semibold text-ink">Your read status</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setReadStatus(opt.value)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  readStatus === opt.value ? "bg-sandy text-white" : "bg-white text-ink-soft border border-paprika/15"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {readStatus === "FINISHED" && (
            <div className="mt-4">
              <p className="mb-1 text-sm font-medium text-ink-soft">Your rating</p>
              <StarRating value={rating} onChange={setRating} size={28} />
            </div>
          )}

          {(readStatus === "READING" || readStatus === "DNF") && (
            <label className="mt-4 flex max-w-[200px] flex-col gap-1 text-sm font-medium text-ink-soft">
              Chapters read
              <input
                type="number"
                min={0}
                className="rounded-xl border border-paprika/15 bg-white px-3 py-2 outline-none focus:border-sandy"
                value={chaptersRead}
                onChange={(e) => setChaptersRead(e.target.value)}
              />
            </label>
          )}

          <label className="mt-4 flex flex-col gap-1 text-sm font-medium text-ink-soft">
            Review (optional)
            <textarea
              rows={3}
              className="rounded-xl border border-paprika/15 bg-white px-3 py-2 outline-none focus:border-sandy"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
          </label>

          {hasWarningOrSpiceTags && (
            <div className="mt-4 flex flex-col gap-2 rounded-xl bg-royal/5 p-3 text-sm text-ink-soft">
              <p className="font-medium text-ink">Visibility for warnings &amp; spice tags</p>
              <p>These are private by default. Choose what friends can see on your activity.</p>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showContentWarnings}
                  onChange={(e) => setShowContentWarnings(e.target.checked)}
                />
                Show content warning tags on my activity
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showSpiceTags}
                  onChange={(e) => setShowSpiceTags(e.target.checked)}
                />
                Show spice-level tags on my activity
              </label>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-paprika">{error}</p>}
        {success && <p className="text-sm text-royal">Saved! Redirecting to your library...</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-paprika px-4 py-2.5 font-heading font-semibold text-white transition hover:brightness-105 disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Log this fic"}
        </button>
      </form>
    </div>
  );
}
