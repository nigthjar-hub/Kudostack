import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type FeedItem } from "../api";
import { StarRating } from "../components/StarRating";
import { TagBadge } from "../components/TagBadge";

interface UserSearchResult {
  id: string;
  username: string;
  avatarColor: string;
  bio: string | null;
}

export function Friends() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [followedUsernames, setFollowedUsernames] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFeed();
  }, []);

  function loadFeed() {
    setLoading(true);
    api
      .feed()
      .then(setFeed)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      api.searchUsers(trimmed).then(setResults);
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  async function handleFollow(username: string) {
    await api.follow(username);
    setFollowedUsernames((prev) => new Set(prev).add(username));
    loadFeed();
  }

  return (
    <div>
      <div className="kudo-card p-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-ink-soft">
          Find friends by username
          <input
            className="rounded-xl border border-paprika/15 bg-white px-3 py-2 outline-none focus:border-sandy"
            placeholder="Search usernames..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {results.length > 0 && (
          <ul className="mt-3 flex flex-col gap-2">
            {results.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 rounded-xl bg-honeydew p-2.5">
                <Link to={`/u/${u.username}`} className="flex items-center gap-2">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full font-heading text-xs font-semibold text-white"
                    style={{ backgroundColor: u.avatarColor }}
                  >
                    {u.username.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-ink">{u.username}</span>
                </Link>
                <button
                  onClick={() => handleFollow(u.username)}
                  disabled={followedUsernames.has(u.username)}
                  className="rounded-full bg-sandy px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {followedUsernames.has(u.username) ? "Following" : "Follow"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <h2 className="mt-6 mb-3 text-sm font-semibold text-ink">Activity</h2>
      {loading ? (
        <p className="text-ink-soft">Loading...</p>
      ) : feed.length === 0 ? (
        <p className="text-ink-soft">
          Follow some friends to see their ratings, reviews, and recommendations here.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {feed.map((item) => (
            <FeedRow key={`${item.kind}-${item.id}`} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}

function FeedRow({ item }: { item: FeedItem }) {
  return (
    <li className="kudo-card p-4">
      <div className="flex items-start gap-3">
        <Link to={`/u/${item.user.username}`}>
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-heading text-sm font-semibold text-white"
            style={{ backgroundColor: item.user.avatarColor }}
          >
            {item.user.username.slice(0, 1).toUpperCase()}
          </div>
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink-soft">
            <Link to={`/u/${item.user.username}`} className="font-medium text-ink">
              {item.user.username}
            </Link>{" "}
            {item.kind === "recommendation" ? "recommended" : item.status === "READING" ? "is reading" : "finished"}
          </p>
          <p className="font-heading text-lg font-semibold text-ink">{item.fic.title}</p>
          <p className="text-xs text-ink-soft">
            {item.fic.fandom} · {item.fic.author}
          </p>
          {item.fic.tags && item.fic.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {item.fic.tags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} />
              ))}
            </div>
          )}
          {item.kind === "read_event" && item.rating != null && (
            <div className="mt-2">
              <StarRating value={item.rating} size={16} />
            </div>
          )}
          {item.kind === "read_event" && item.reviewText && (
            <p className="mt-2 text-sm text-ink">{item.reviewText}</p>
          )}
          {item.kind === "recommendation" && item.note && (
            <p className="mt-2 text-sm italic text-ink">&ldquo;{item.note}&rdquo;</p>
          )}
        </div>
      </div>
    </li>
  );
}
