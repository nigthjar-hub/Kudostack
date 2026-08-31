import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth } from "../auth";
import { filterTagsForVisibility } from "../tagVisibility";

const router = Router();

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
    select: { id: true, username: true, bio: true, avatarColor: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ error: "User not found" });

  const [followerCount, followingCount] = await Promise.all([
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
  ]);

  res.json({ ...user, followerCount, followingCount });
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

  res.json({
    ficsFinished: finished.length,
    avgRating,
    totalWordsRead,
    longestFic,
    topTags,
    readingStreak: streak,
  });
});

router.get("/:username/read-events", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!user) return res.status(404).json({ error: "User not found" });

  const isOwner = req.user?.userId === user.id;
  const events = await prisma.readEvent.findMany({
    where: { userId: user.id, status: "FINISHED" },
    orderBy: { finishedDate: "desc" },
    take: 20,
    include: { fic: { include: { tags: { include: { tag: true } } } } },
  });

  const result = events.map((e) => ({
    id: e.id,
    ficId: e.ficId,
    status: e.status,
    rating: e.rating,
    reviewText: e.reviewText,
    finishedDate: e.finishedDate,
    fic: {
      id: e.fic.id,
      title: e.fic.title,
      fandom: e.fic.fandom,
      author: e.fic.author,
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
