import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError, type Fic, type FeedItem, type PublicPost } from "../api";
import { useAuth } from "../context/AuthContext";
import { StarRating } from "../components/StarRating";
import { TagBadge } from "../components/TagBadge";

interface UserSearchResult {
  id: string;
  username: string;
  avatarColor: string;
  bio: string | null;
}

type Tab = "public" | "friends";

export function Friends() {
  const [tab, setTab] = useState<Tab>("public");

  return (
    <div>
      <div className="kudo-segmented flex p-1">
        <button
          onClick={() => setTab("public")}
          className={`flex-1 rounded-full py-1.5 text-sm font-semibold transition ${
            tab === "public" ? "bg-paprika text-white" : "text-ink-muted"
          }`}
        >
          Public
        </button>
        <button
          onClick={() => setTab("friends")}
          className={`flex-1 rounded-full py-1.5 text-sm font-semibold transition ${
            tab === "friends" ? "bg-paprika text-white" : "text-ink-muted"
          }`}
        >
          Friends
        </button>
      </div>

      {tab === "public" ? <PublicFeedTab /> : <FriendsFeedTab />}
    </div>
  );
}

function PublicFeedTab() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [ficQuery, setFicQuery] = useState("");
  const [ficResults, setFicResults] = useState<Fic[]>([]);
  const [selectedFic, setSelectedFic] = useState<Fic | null>(null);
  const [note, setNote] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  function loadFeed() {
    setLoading(true);
    api
      .publicFeed()
      .then((r) => {
        setPosts(r.posts);
        setNextCursor(r.nextCursor);
      })
      .finally(() => setLoading(false));
  }

  useEffect(loadFeed, []);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const r = await api.publicFeed(nextCursor);
      setPosts((prev) => [...prev, ...r.posts]);
      setNextCursor(r.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    const q = ficQuery.trim();
    if (!q) {
      setFicResults([]);
      return;
    }
    const handle = setTimeout(() => api.searchFics(q).then(setFicResults), 250);
    return () => clearTimeout(handle);
  }, [ficQuery]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFic) return;
    setPostError(null);
    setPosting(true);
    try {
      const post = await api.createPublicPost(selectedFic.id, note.trim());
      setPosts((prev) => [post, ...prev]);
      setSelectedFic(null);
      setFicQuery("");
      setNote("");
    } catch (err) {
      setPostError(err instanceof ApiError ? err.message : "Couldn't post");
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(id: string) {
    await api.deletePublicPost(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="mt-4">
      <form onSubmit={handlePost} className="kudo-card p-4">
        <p className="text-sm font-semibold text-ink">Share a fic with a recommendation</p>
        {selectedFic ? (
          <div className="mt-2 flex items-center justify-between rounded-xl bg-paper px-3 py-2">
            <span className="text-sm text-ink">
              {selectedFic.title} <span className="text-ink-muted">· {selectedFic.fandom}</span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedFic(null)}
              className="text-ink-dim"
              aria-label="Clear selected fic"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="relative mt-2">
            <input
              placeholder="Search for a fic to share..."
              className="w-full rounded-xl border border-paprika/15 bg-surface px-3 py-2 text-sm outline-none focus:border-sandy"
              value={ficQuery}
              onChange={(e) => setFicQuery(e.target.value)}
            />
            {ficResults.length > 0 && (
              <ul className="kudo-card absolute z-10 mt-1 max-h-52 w-full overflow-y-auto p-1">
                {ficResults.map((f) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFic(f);
                        setFicResults([]);
                      }}
                      className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-ink hover:bg-paper"
                    >
                      {f.title} <span className="text-ink-muted">· {f.fandom}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <textarea
          placeholder="Why should people read it?"
          rows={2}
          maxLength={500}
          className="mt-2 w-full rounded-xl border border-paprika/15 bg-surface px-3 py-2 text-sm outline-none focus:border-sandy"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {postError && <p className="mt-2 text-sm text-paprika">{postError}</p>}
        <button
          type="submit"
          disabled={!selectedFic || !note.trim() || posting}
          className="mt-2 rounded-full bg-paprika px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {posting ? "Posting..." : "Post"}
        </button>
      </form>

      <h2 className="mb-3 mt-6 font-heading text-lg font-semibold text-ink">Public posts</h2>
      {loading ? (
        <p className="text-ink-muted">Loading...</p>
      ) : posts.length === 0 ? (
        <p className="text-ink-muted">Nobody has posted yet — be the first to share a rec!</p>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {posts.map((post) => (
              <li key={post.id} className="kudo-card p-4">
                <div className="flex items-start gap-3">
                  <Link to={`/u/${post.author.username}`}>
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full font-heading text-sm font-semibold text-white"
                      style={{
                        backgroundColor: post.author.avatarColor,
                        backgroundImage: post.author.avatarUrl ? `url(${post.author.avatarUrl})` : undefined,
                        backgroundSize: "cover",
                      }}
                    >
                      {!post.author.avatarUrl && post.author.username.slice(0, 1).toUpperCase()}
                    </div>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink-muted">
                      <Link to={`/u/${post.author.username}`} className="font-medium text-ink">
                        {post.author.displayName || post.author.username}
                      </Link>{" "}
                      recommends
                    </p>
                    <p className="font-heading text-lg font-semibold text-ink">{post.fic.title}</p>
                    <p className="text-xs text-ink-muted">
                      {post.fic.fandom} · {post.fic.author}
                    </p>
                    <p className="mt-2 text-sm text-ink">{post.note}</p>
                  </div>
                  {user?.username === post.author.username && (
                    <button onClick={() => handleDelete(post.id)} className="text-ink-dim" aria-label="Delete post">
                      ✕
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {nextCursor && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="mt-3 w-full rounded-full border border-paprika/25 bg-surface py-2 text-sm font-semibold text-ink-muted"
            >
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function FriendsFeedTab() {
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
    <div className="mt-4">
      <div className="kudo-card p-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-ink-soft">
          Find friends by username
          <input
            className="rounded-xl border border-paprika/15 bg-surface px-3 py-2 outline-none focus:border-sandy"
            placeholder="Search usernames..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {results.length > 0 && (
          <ul className="mt-3 flex flex-col gap-2">
            {results.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 rounded-xl bg-paper p-2.5">
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
                  className="rounded-full bg-paprika px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {followedUsernames.has(u.username) ? "Following" : "Follow"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <h2 className="mt-6 mb-3 font-heading text-lg font-semibold text-ink">Activity</h2>
      {loading ? (
        <p className="text-ink-muted">Loading...</p>
      ) : feed.length === 0 ? (
        <p className="text-ink-muted">
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
          <p className="text-sm text-ink-muted">
            <Link to={`/u/${item.user.username}`} className="font-medium text-ink">
              {item.user.username}
            </Link>{" "}
            {item.kind === "recommendation" ? "recommended" : item.status === "READING" ? "is reading" : "finished"}
          </p>
          <p className="font-heading text-lg font-semibold text-ink">{item.fic.title}</p>
          <p className="text-xs text-ink-muted">
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
