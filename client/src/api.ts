export interface Tag {
  id: string;
  name: string;
  category: "TROPE" | "WARNING" | "SPICE" | "OTHER";
}

export interface Fic {
  id: string;
  title: string;
  fandom: string;
  author: string;
  status: "ONGOING" | "COMPLETE";
  totalChapters: number | null;
  wordCount: number | null;
  ao3Url: string | null;
  createdAt: string;
  tags: { tag: Tag }[];
}

export type ReadType = "FIRST_READ" | "REREAD";
export type ReadStatus = "READING" | "FINISHED" | "WANT_TO_READ" | "DNF";

export interface ReadEvent {
  id: string;
  userId: string;
  ficId: string;
  type: ReadType;
  status: ReadStatus;
  rating: number | null;
  reviewText: string | null;
  chaptersRead: number | null;
  startedDate: string | null;
  finishedDate: string | null;
  showContentWarnings: boolean;
  showSpiceTags: boolean;
  createdAt: string;
  updatedAt: string;
  fic: Fic;
}

export interface CurrentUser {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarColor: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  defaultShowContentWarnings: boolean;
  defaultShowSpiceTags: boolean;
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  order: number;
}

export interface PinnedFic {
  id: string;
  fic: Fic;
}

export interface PinnedFandom {
  id: string;
  fandom: string;
}

export interface PublicUser {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarColor: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  createdAt: string;
  followerCount: number;
  followingCount: number;
  socialLinks: SocialLink[];
  pinnedFics: PinnedFic[];
  pinnedFandoms: PinnedFandom[];
}

export interface PublicReadEvent {
  id: string;
  ficId: string;
  status: ReadStatus;
  rating: number | null;
  reviewText: string | null;
  chaptersRead: number | null;
  finishedDate: string | null;
  fic: {
    id: string;
    title: string;
    fandom: string;
    author: string;
    totalChapters: number | null;
    tags: Tag[];
  };
}

export interface UserStats {
  ficsFinished: number;
  avgRating: number | null;
  totalWordsRead: number;
  longestFic: { title: string; wordCount: number } | null;
  topTags: { name: string; category: string; count: number }[];
  readingStreak: number;
  ratingBreakdown: { stars: number; count: number }[];
}

export interface FeedItem {
  kind: "read_event" | "recommendation";
  id: string;
  at: string;
  user: { username: string; avatarColor: string };
  fic: { id: string; title: string; fandom: string; author: string; tags?: Tag[] };
  status?: ReadStatus;
  rating?: number | null;
  reviewText?: string | null;
  type?: ReadType;
  note?: string | null;
}

export interface PublicPost {
  id: string;
  authorId: string;
  ficId: string;
  note: string;
  createdAt: string;
  fic: { id: string; title: string; fandom: string; author: string };
  author: { username: string; displayName: string | null; avatarColor: string; avatarUrl: string | null };
}

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function uploadImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch("/api/uploads/image", {
    credentials: "include",
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message);
  }
  return res.json();
}

export const api = {
  register: (username: string, password: string) =>
    request<CurrentUser>("/auth/register", { method: "POST", body: JSON.stringify({ username, password }) }),
  login: (username: string, password: string) =>
    request<CurrentUser>("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  me: () => request<CurrentUser>("/auth/me"),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: boolean }>("/auth/password", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  deleteAccount: (password: string) =>
    request<{ ok: boolean }>("/auth/me", { method: "DELETE", body: JSON.stringify({ password }) }),

  updateProfile: (data: Partial<{
    username: string;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    bannerUrl: string | null;
    defaultShowContentWarnings: boolean;
    defaultShowSpiceTags: boolean;
  }>) => request<CurrentUser>("/users/me", { method: "PATCH", body: JSON.stringify(data) }),
  uploadImage,

  tags: () => request<Tag[]>("/tags"),
  fandomAutocomplete: (q: string) => request<string[]>(`/fics/fandoms?q=${encodeURIComponent(q)}`),

  searchFics: (q: string) => request<Fic[]>(`/fics?q=${encodeURIComponent(q)}`),
  createFic: (data: {
    title: string;
    fandom: string;
    author: string;
    status: string;
    totalChapters?: number | null;
    wordCount?: number | null;
    ao3Url?: string | null;
    tagIds: string[];
  }) => request<Fic>("/fics", { method: "POST", body: JSON.stringify(data) }),

  myReadEvents: (status?: string) =>
    request<ReadEvent[]>(`/read-events/mine${status ? `?status=${status}` : ""}`),
  createReadEvent: (data: Partial<ReadEvent> & { ficId: string }) =>
    request<ReadEvent>("/read-events", { method: "POST", body: JSON.stringify(data) }),
  updateReadEvent: (id: string, data: Partial<ReadEvent>) =>
    request<ReadEvent>(`/read-events/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteReadEvent: (id: string) => request<{ ok: boolean }>(`/read-events/${id}`, { method: "DELETE" }),

  getUser: (username: string) => request<PublicUser>(`/users/${username}`),
  getUserStats: (username: string) => request<UserStats>(`/users/${username}/stats`),
  getUserReadEvents: (username: string, params?: { status?: ReadStatus; reviewed?: boolean }) => {
    const search = new URLSearchParams();
    if (params?.status) search.set("status", params.status);
    if (params?.reviewed) search.set("reviewed", "true");
    const qs = search.toString();
    return request<PublicReadEvent[]>(`/users/${username}/read-events${qs ? `?${qs}` : ""}`);
  },
  searchUsers: (q: string) =>
    request<{ id: string; username: string; avatarColor: string; bio: string | null }[]>(
      `/users/search?q=${encodeURIComponent(q)}`
    ),
  follow: (username: string) => request<{ ok: boolean }>(`/users/${username}/follow`, { method: "POST" }),
  unfollow: (username: string) => request<{ ok: boolean }>(`/users/${username}/follow`, { method: "DELETE" }),
  followingStatus: (username: string) =>
    request<{ following: boolean }>(`/users/${username}/following-status`),

  pinFic: (ficId: string) =>
    request<PinnedFic>("/users/me/pinned-fics", { method: "POST", body: JSON.stringify({ ficId }) }),
  unpinFic: (id: string) => request<{ ok: boolean }>(`/users/me/pinned-fics/${id}`, { method: "DELETE" }),
  pinFandom: (fandom: string) =>
    request<PinnedFandom>("/users/me/pinned-fandoms", { method: "POST", body: JSON.stringify({ fandom }) }),
  unpinFandom: (id: string) => request<{ ok: boolean }>(`/users/me/pinned-fandoms/${id}`, { method: "DELETE" }),
  addSocialLink: (platform: string, url: string) =>
    request<SocialLink>("/users/me/social-links", { method: "POST", body: JSON.stringify({ platform, url }) }),
  removeSocialLink: (id: string) =>
    request<{ ok: boolean }>(`/users/me/social-links/${id}`, { method: "DELETE" }),

  feed: () => request<FeedItem[]>("/feed"),

  publicFeed: (cursor?: string) =>
    request<{ posts: PublicPost[]; nextCursor: string | null }>(
      `/public-posts${cursor ? `?cursor=${cursor}` : ""}`
    ),
  createPublicPost: (ficId: string, note: string) =>
    request<PublicPost>("/public-posts", { method: "POST", body: JSON.stringify({ ficId, note }) }),
  deletePublicPost: (id: string) => request<{ ok: boolean }>(`/public-posts/${id}`, { method: "DELETE" }),

  sendRecommendation: (data: { recipientUsername: string; ficId: string; note?: string | null }) =>
    request("/recommendations", { method: "POST", body: JSON.stringify(data) }),
  receivedRecommendations: () => request("/recommendations/received"),
};

export { ApiError };
