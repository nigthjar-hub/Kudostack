import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { COOKIE_NAME, COOKIE_OPTIONS, requireAuth, signToken } from "../auth";
import { filterTagsForVisibility } from "../tagVisibility";

const router = Router();

const updateMeSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscores only")
    .optional(),
  displayName: z.string().max(60).nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  bannerUrl: z.string().nullable().optional(),
  defaultShowContentWarnings: z.boolean().optional(),
  defaultShowSpiceTags: z.boolean().optional(),
});

router.patch("/me", requireAuth, async (req, res) => {
  const parsed = updateMeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const data = parsed.data;

  if (data.username) {
    const existing = await prisma.user.findUnique({ where: { username: data.username } });
    if (existing && existing.id !== req.user!.userId) {
      return res.status(409).json({ error: "Username already taken" });
    }
  }

  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: {
      ...(data.username !== undefined ? { username: data.username } : {}),
      ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
      ...(data.bio !== undefined ? { bio: data.bio } : {}),
      ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      ...(data.bannerUrl !== undefined ? { bannerUrl: data.bannerUrl } : {}),
      ...(data.defaultShowContentWarnings !== undefined
        ? { defaultShowContentWarnings: data.defaultShowContentWarnings }
        : {}),
      ...(data.defaultShowSpiceTags !== undefined ? { defaultShowSpiceTags: data.defaultShowSpiceTags } : {}),
    },
  });

  // Username is embedded in the session token, so re-issue it on change.
  if (data.username) {
    const token = signToken({ userId: user.id, username: user.username });
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
  }

  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarColor: user.avatarColor,
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl,
    defaultShowContentWarnings: user.defaultShowContentWarnings,
    defaultShowSpiceTags: user.defaultShowSpiceTags,
  });
});

const MAX_PINS = 5;

const pinnedFicSchema = z.object({ ficId: z.string() });

router.post("/me/pinned-fics", requireAuth, async (req, res) => {
  const parsed = pinnedFicSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const fic = await prisma.fic.findUnique({ where: { id: parsed.data.ficId } });
  if (!fic) return res.status(404).json({ error: "Fic not found" });

  const count = await prisma.pinnedFic.count({ where: { userId: req.user!.userId } });
  if (count >= MAX_PINS) {
    return res.status(400).json({ error: `You can only pin up to ${MAX_PINS} fics` });
  }

  const pin = await prisma.pinnedFic
    .create({
      data: { userId: req.user!.userId, ficId: parsed.data.ficId, order: count },
      include: { fic: { include: { tags: { include: { tag: true } } } } },
    })
    .catch(() => null);
  if (!pin) return res.status(409).json({ error: "That fic is already pinned" });

  res.status(201).json({ id: pin.id, fic: pin.fic });
});

router.delete("/me/pinned-fics/:id", requireAuth, async (req, res) => {
  const pin = await prisma.pinnedFic.findUnique({ where: { id: req.params.id } });
  if (!pin || pin.userId !== req.user!.userId) return res.status(404).json({ error: "Pin not found" });
  await prisma.pinnedFic.delete({ where: { id: pin.id } });
  res.json({ ok: true });
});

const pinnedFandomSchema = z.object({ fandom: z.string().min(1).max(120) });

router.post("/me/pinned-fandoms", requireAuth, async (req, res) => {
  const parsed = pinnedFandomSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const count = await prisma.pinnedFandom.count({ where: { userId: req.user!.userId } });
  if (count >= MAX_PINS) {
    return res.status(400).json({ error: `You can only pin up to ${MAX_PINS} fandoms` });
  }

  const pin = await prisma.pinnedFandom
    .create({ data: { userId: req.user!.userId, fandom: parsed.data.fandom.trim(), order: count } })
    .catch(() => null);
  if (!pin) return res.status(409).json({ error: "That fandom is already pinned" });

  res.status(201).json({ id: pin.id, fandom: pin.fandom });
});

router.delete("/me/pinned-fandoms/:id", requireAuth, async (req, res) => {
  const pin = await prisma.pinnedFandom.findUnique({ where: { id: req.params.id } });
  if (!pin || pin.userId !== req.user!.userId) return res.status(404).json({ error: "Pin not found" });
  await prisma.pinnedFandom.delete({ where: { id: pin.id } });
  res.json({ ok: true });
});

const socialLinkSchema = z.object({
  platform: z.string().min(1).max(40),
  url: z.string().url(),
});

router.post("/me/social-links", requireAuth, async (req, res) => {
  const parsed = socialLinkSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });

  const count = await prisma.socialLink.count({ where: { userId: req.user!.userId } });
  if (count >= 8) {
    return res.status(400).json({ error: "You can only add up to 8 links" });
  }

  const link = await prisma.socialLink.create({
    data: { userId: req.user!.userId, platform: parsed.data.platform.trim(), url: parsed.data.url, order: count },
  });
  res.status(201).json(link);
});

router.delete("/me/social-links/:id", requireAuth, async (req, res) => {
  const link = await prisma.socialLink.findUnique({ where: { id: req.params.id } });
  if (!link || link.userId !== req.user!.userId) return res.status(404).json({ error: "Link not found" });
  await prisma.socialLink.delete({ where: { id: link.id } });
  res.json({ ok: true });
});

router.get("/search", requireAuth, async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!q) return res.json([]);
  const users = await prisma.user.findMany({
    where: { username: { contains: q } },
    take: 10,
    select: { id: true, username: true, avatarColor: true, bio: true },
  });
  res.json(users);
});

router.get("/:username", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { username: req.params.username },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatarColor: true,
      avatarUrl: true,
      bannerUrl: true,
      createdAt: true,
    },
  });
  if (!user) return res.status(404).json({ error: "User not found" });

  const [followerCount, followingCount, socialLinks, pinnedFics, pinnedFandoms] = await Promise.all([
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
    prisma.socialLink.findMany({ where: { userId: user.id }, orderBy: { order: "asc" } }),
    prisma.pinnedFic.findMany({
      where: { userId: user.id },
      orderBy: { order: "asc" },
      include: { fic: { include: { tags: { include: { tag: true } } } } },
    }),
    prisma.pinnedFandom.findMany({ where: { userId: user.id }, orderBy: { order: "asc" } }),
  ]);

  res.json({
    ...user,
    followerCount,
    followingCount,
    socialLinks,
    pinnedFics: pinnedFics.map((p) => ({ id: p.id, fic: p.fic })),
    pinnedFandoms: pinnedFandoms.map((p) => ({ id: p.id, fandom: p.fandom })),
  });
});

router.get("/:username/stats", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!user) return res.status(404).json({ error: "User not found" });

  const finished = await prisma.readEvent.findMany({
    where: { userId: user.id, status: "FINISHED" },
    include: { fic: { include: { tags: { include: { tag: true } } } } },
    orderBy: { finishedDate: "asc" },
  });

  const ratedEvents = finished.filter((e) => e.rating != null);
  const avgRating =
    ratedEvents.length > 0
      ? ratedEvents.reduce((sum, e) => sum + (e.rating ?? 0), 0) / ratedEvents.length
      : null;

  const totalWordsRead = finished.reduce((sum, e) => sum + (e.fic.wordCount ?? 0), 0);

  let longestFic: { title: string; wordCount: number } | null = null;
  for (const e of finished) {
    if (e.fic.wordCount != null && (!longestFic || e.fic.wordCount > longestFic.wordCount)) {
      longestFic = { title: e.fic.title, wordCount: e.fic.wordCount };
    }
  }

  const tagCounts = new Map<string, { name: string; category: string; count: number }>();
  for (const e of finished) {
    for (const ft of e.fic.tags) {
      const key = ft.tag.id;
      const entry = tagCounts.get(key) ?? { name: ft.tag.name, category: ft.tag.category, count: 0 };
      entry.count += 1;
      tagCounts.set(key, entry);
    }
  }
  const topTags = [...tagCounts.values()]
    .filter((t) => t.category === "TROPE")
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Reading streak: consecutive days (including today) with at least one finished read event.
  const finishedDates = new Set(
    finished
      .filter((e) => e.finishedDate)
      .map((e) => new Date(e.finishedDate as Date).toISOString().slice(0, 10))
  );
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (finishedDates.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  const ratingBreakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: ratedEvents.filter((e) => Math.round(e.rating as number) === stars).length,
  }));

  res.json({
    ficsFinished: finished.length,
    avgRating,
    totalWordsRead,
    longestFic,
    topTags,
    readingStreak: streak,
    ratingBreakdown,
  });
});

router.get("/:username/read-events", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!user) return res.status(404).json({ error: "User not found" });

  const isOwner = req.user?.userId === user.id;
  const statusFilter = typeof req.query.status === "string" ? req.query.status : undefined;
  const reviewedOnly = req.query.reviewed === "true";

  const events = await prisma.readEvent.findMany({
    where: {
      userId: user.id,
      ...(statusFilter ? { status: statusFilter } : reviewedOnly ? {} : { status: "FINISHED" }),
      ...(reviewedOnly ? { reviewText: { not: null } } : {}),
    },
    orderBy: reviewedOnly ? { updatedAt: "desc" } : statusFilter ? { updatedAt: "desc" } : { finishedDate: "desc" },
    take: 40,
    include: { fic: { include: { tags: { include: { tag: true } } } } },
  });

  const result = events.map((e) => ({
    id: e.id,
    ficId: e.ficId,
    status: e.status,
    rating: e.rating,
    reviewText: e.reviewText,
    chaptersRead: e.chaptersRead,
    finishedDate: e.finishedDate,
    fic: {
      id: e.fic.id,
      title: e.fic.title,
      fandom: e.fic.fandom,
      author: e.fic.author,
      totalChapters: e.fic.totalChapters,
      tags: (isOwner
        ? e.fic.tags
        : filterTagsForVisibility(e.fic.tags, e.showContentWarnings, e.showSpiceTags)
      ).map((t) => t.tag),
    },
  }));

  res.json(result);
});

router.post("/:username/follow", requireAuth, async (req, res) => {
  const target = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!target) return res.status(404).json({ error: "User not found" });
  if (target.id === req.user!.userId) {
    return res.status(400).json({ error: "Cannot follow yourself" });
  }
  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: req.user!.userId, followingId: target.id } },
    create: { followerId: req.user!.userId, followingId: target.id },
    update: {},
  });
  res.status(201).json({ ok: true });
});

router.delete("/:username/follow", requireAuth, async (req, res) => {
  const target = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!target) return res.status(404).json({ error: "User not found" });
  await prisma.follow.deleteMany({
    where: { followerId: req.user!.userId, followingId: target.id },
  });
  res.json({ ok: true });
});

router.get("/:username/following-status", requireAuth, async (req, res) => {
  const target = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!target) return res.status(404).json({ error: "User not found" });
  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: req.user!.userId, followingId: target.id } },
  });
  res.json({ following: !!follow });
});

export default router;
