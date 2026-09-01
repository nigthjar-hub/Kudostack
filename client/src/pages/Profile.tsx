import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type PublicReadEvent, type PublicUser, type UserStats } from "../api";
import { useAuth } from "../context/AuthContext";
import { StarRating } from "../components/StarRating";
import { TagBadge } from "../components/TagBadge";
import { MiniSpine } from "../components/MiniSpine";

export function Profile() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [reviews, setReviews] = useState<PublicReadEvent[]>([]);
  const [reading, setReading] = useState<PublicReadEvent[]>([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const isSelf = currentUser?.username === username;

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    Promise.all([
      api.getUser(username),
      api.getUserStats(username),
      api.getUserReadEvents(username, { reviewed: true }),
      api.getUserReadEvents(username, { status: "READING" }),
      isSelf ? Promise.resolve({ following: false }) : api.followingStatus(username),
    ])
      .then(([p, s, rv, rd, f]) => {
        setProfile(p);
        setStats(s);
        setReviews(rv);
        setReading(rd);
        setFollowing(f.following);
      })
      .finally(() => setLoading(false));
  }, [username, isSelf]);

  async function toggleFollow() {
    if (!username) return;
    if (following) {
      await api.unfollow(username);
      setFollowing(false);
    } else {
      await api.follow(username);
      setFollowing(true);
    }
  }

  if (loading || !profile) {
    return <p className="text-ink-muted">Loading...</p>;
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="kudo-card overflow-hidden p-0">
        <div
          className="h-24 bg-gradient-to-br from-sandy to-paprika"
          style={
            profile.bannerUrl
              ? { backgroundImage: `url(${profile.bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : undefined
          }
        />
        <div className="flex items-end justify-between gap-3 px-5 pb-2 pt-0">
          <div
            className="-mt-8 flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-surface font-heading text-xl font-semibold text-white"
            style={{
              backgroundColor: profile.avatarColor,
              backgroundImage: profile.avatarUrl ? `url(${profile.avatarUrl})` : undefined,
              backgroundSize: "cover",
            }}
          >
            {!profile.avatarUrl && profile.username.slice(0, 1).toUpperCase()}
          </div>
          {isSelf ? (
            <Link
              to="/profile/edit"
              className="mt-2 rounded-full border border-paprika/30 px-4 py-1.5 text-sm font-semibold text-paprika"
            >
              Edit profile
            </Link>
          ) : (
            <button
              onClick={toggleFollow}
              className={`mt-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                following ? "border-paprika/30 bg-surface text-paprika" : "border-paprika bg-paprika text-white"
              }`}
            >
              {following ? "Following" : "Follow"}
            </button>
          )}
        </div>
        <div className="px-5 pb-4">
          <h1 className="font-heading text-xl font-semibold text-ink">{profile.displayName || profile.username}</h1>
          <p className="text-sm text-ink-muted">
            @{profile.username} · {profile.followerCount} followers · {profile.followingCount} following
          </p>
          {profile.bio && <p className="mt-2 text-sm text-ink">{profile.bio}</p>}
          {profile.socialLinks.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink-soft"
                >
                  {link.platform}
                </a>
              ))}
            </div>
          )}
          {isSelf && (
            <Link to="/settings" className="mt-3 inline-block text-xs font-semibold text-ink-dim underline">
              App settings
            </Link>
          )}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <StatTile label="Fics read" value={String(stats.ficsFinished)} />
          <StatTile label="Avg rating" value={stats.avgRating ? stats.avgRating.toFixed(1) : "—"} />
          <StatTile label="Streak" value={`${stats.readingStreak}d`} />
        </div>
      )}

      {profile.pinnedFics.length > 0 && (
        <section>
          <h2 className="mb-2 font-heading text-lg font-semibold text-ink">Top fics</h2>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
            {profile.pinnedFics.map((p) => (
              <MiniSpine key={p.id} ficId={p.fic.id} title={p.fic.title} fandom={p.fic.fandom} />
            ))}
          </div>
        </section>
      )}

      {profile.pinnedFandoms.length > 0 && (
        <section>
          <h2 className="mb-2 font-heading text-lg font-semibold text-ink">Top fandoms</h2>
          <div className="flex flex-wrap gap-2">
            {profile.pinnedFandoms.map((p) => (
              <span key={p.id} className="rounded-full bg-sandy/20 px-3 py-1 text-xs font-medium text-paprika">
                {p.fandom}
              </span>
            ))}
          </div>
        </section>
      )}

      {stats && stats.topTags.length > 0 && (
        <section>
          <h2 className="mb-2 font-heading text-lg font-semibold text-ink">Top tropes</h2>
          <div className="flex flex-wrap gap-2">
            {stats.topTags.map((t) => (
              <span key={t.name} className="rounded-full bg-sandy/20 px-3 py-1 text-xs font-medium text-paprika">
                {t.name} · {t.count}
              </span>
            ))}
          </div>
        </section>
      )}

      {reading.length > 0 && (
        <section>
          <h2 className="mb-2 font-heading text-lg font-semibold text-ink">Currently reading</h2>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
            {reading.map((e) => (
              <MiniSpine
                key={e.id}
                ficId={e.fic.id}
                title={e.fic.title}
                fandom={e.fic.fandom}
                progressPct={
                  e.fic.totalChapters && e.fic.totalChapters > 0
                    ? Math.min(100, Math.round(((e.chaptersRead ?? 0) / e.fic.totalChapters) * 100))
                    : null
                }
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-heading text-lg font-semibold text-ink">All reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-ink-muted">No reviews yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {reviews.map((e) => (
              <li key={e.id} className="kudo-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-heading text-base font-semibold text-ink">{e.fic.title}</p>
                    <p className="text-xs text-ink-muted">
                      {e.fic.fandom} · {e.fic.author}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {e.fic.tags.map((tag) => (
                        <TagBadge key={tag.id} tag={tag} />
                      ))}
                    </div>
                    {e.reviewText && <p className="mt-2 text-sm text-ink">{e.reviewText}</p>}
                  </div>
                  {e.rating != null && <StarRating value={e.rating} size={16} />}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="kudo-card flex flex-col items-center gap-1 p-4">
      <span className="font-heading text-2xl font-semibold text-paprika">{value}</span>
      <span className="text-xs text-ink-soft">{label}</span>
    </div>
  );
}
