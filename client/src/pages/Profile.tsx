import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, type PublicReadEvent, type PublicUser, type UserStats } from "../api";
import { useAuth } from "../context/AuthContext";
import { StarRating } from "../components/StarRating";
import { TagBadge } from "../components/TagBadge";

export function Profile() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recent, setRecent] = useState<PublicReadEvent[]>([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const isSelf = currentUser?.username === username;

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    Promise.all([
      api.getUser(username),
      api.getUserStats(username),
      api.getUserReadEvents(username),
      isSelf ? Promise.resolve({ following: false }) : api.followingStatus(username),
    ])
      .then(([p, s, r, f]) => {
        setProfile(p);
        setStats(s);
        setRecent(r);
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
    return <p className="text-ink-soft">Loading...</p>;
  }

  return (
    <div>
      <div className="kudo-card flex items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full font-heading text-xl font-semibold text-white"
            style={{ backgroundColor: profile.avatarColor }}
          >
            {profile.username.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h1 className="font-heading text-2xl font-semibold text-ink">{profile.username}</h1>
            <p className="text-sm text-ink-soft">
              {profile.followerCount} followers · {profile.followingCount} following
            </p>
          </div>
        </div>
        {!isSelf && (
          <button
            onClick={toggleFollow}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              following ? "bg-white text-paprika border border-paprika/30" : "bg-sandy text-white"
            }`}
          >
            {following ? "Following" : "Follow"}
          </button>
        )}
      </div>

      {stats && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <StatTile label="Fics read" value={String(stats.ficsFinished)} />
          <StatTile label="Avg rating" value={stats.avgRating ? stats.avgRating.toFixed(1) : "—"} />
          <StatTile label="Streak" value={`${stats.readingStreak}d`} />
        </div>
      )}

      {stats && stats.topTags.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-2 text-sm font-semibold text-ink">Top tropes</h2>
          <div className="flex flex-wrap gap-2">
            {stats.topTags.map((t) => (
              <span key={t.name} className="rounded-full bg-sandy/20 px-3 py-1 text-xs font-medium text-paprika">
                {t.name} · {t.count}
              </span>
            ))}
          </div>
        </div>
      )}

      <h2 className="mt-6 mb-2 text-sm font-semibold text-ink">Recent ratings</h2>
      {recent.length === 0 ? (
        <p className="text-ink-soft">No finished fics yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {recent.map((e) => (
            <li key={e.id} className="kudo-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-heading text-base font-semibold text-ink">{e.fic.title}</p>
                  <p className="text-xs text-ink-soft">
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

      {isSelf && (
        <button
          onClick={async () => {
            await logout();
            navigate("/login");
          }}
          className="mt-6 w-full rounded-full border border-paprika/20 py-2.5 text-sm font-semibold text-paprika"
        >
          Log out
        </button>
      )}
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
