import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api, type UserStats } from "../api";

export function Stats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    if (!user) return;
    api.getUserStats(user.username).then(setStats);
  }, [user]);

  if (!stats || !user) {
    return <p className="text-ink-soft">Loading...</p>;
  }

  return (
    <div>
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-sandy to-paprika p-6 text-white shadow-lg">
        <p className="font-heading text-sm uppercase tracking-widest opacity-80">Kudostack</p>
        <h2 className="mt-1 font-heading text-3xl font-bold">{user.username}'s reading recap</h2>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <RecapTile value={stats.ficsFinished} label="Fics finished" />
          <RecapTile value={formatWords(stats.totalWordsRead)} label="Words read" />
          <RecapTile value={stats.avgRating ? stats.avgRating.toFixed(1) : "—"} label="Avg rating" />
          <RecapTile value={`${stats.readingStreak}d`} label="Current streak" />
        </div>

        {stats.longestFic && (
          <div className="mt-6 rounded-2xl bg-white/15 p-4">
            <p className="text-xs uppercase tracking-wide opacity-80">Longest fic finished</p>
            <p className="mt-1 font-heading text-lg font-semibold">{stats.longestFic.title}</p>
            <p className="text-sm opacity-90">{formatWords(stats.longestFic.wordCount)} words</p>
          </div>
        )}

        {stats.topTags.length > 0 && (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-wide opacity-80">Top tropes</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {stats.topTags.map((t) => (
                <span key={t.name} className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium">
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {stats.ficsFinished > 0 && (
        <>
          <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Rating breakdown
          </p>
          <div className="kudo-card divide-y divide-paprika/10">
            {stats.ratingBreakdown.map((row) => (
              <div key={row.stars} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-royal">{"★".repeat(row.stars)}{"☆".repeat(5 - row.stars)}</span>
                <span className="text-sm text-ink-muted">{row.count} fics</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RecapTile({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-2xl bg-white/15 p-4 text-center">
      <p className="font-heading text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-85">{label}</p>
    </div>
  );
}

function formatWords(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
