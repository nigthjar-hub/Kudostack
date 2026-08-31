import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth } from "../auth";
import { filterTagsForVisibility } from "../tagVisibility";

const router = Router();

// Friends-only activity feed: ratings/reviews and recommendations from people
// the current user follows. Intentionally never global/algorithmic.
router.get("/", requireAuth, async (req, res) => {
  const following = await prisma.follow.findMany({
    where: { followerId: req.user!.userId },
    select: { followingId: true },
  });
  const followingIds = following.map((f) => f.followingId);

  if (followingIds.length === 0) {
    return res.json([]);
  }

  const [readEvents, recs] = await Promise.all([
    prisma.readEvent.findMany({
      where: {
        userId: { in: followingIds },
        status: { in: ["FINISHED", "READING"] },
      },
      orderBy: { updatedAt: "desc" },
      take: 40,
      include: {
        fic: { include: { tags: { include: { tag: true } } } },
        user: { select: { username: true, avatarColor: true } },
      },
    }),
    prisma.recommendation.findMany({
      where: { senderId: { in: followingIds } },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        fic: true,
        sender: { select: { username: true, avatarColor: true } },
      },
    }),
  ]);

  const readItems = readEvents.map((e) => {
    const visibleTags = filterTagsForVisibility(e.fic.tags, e.showContentWarnings, e.showSpiceTags);
    return {
      kind: "read_event" as const,
      id: e.id,
      at: e.updatedAt,
      user: e.user,
      fic: {
        id: e.fic.id,
        title: e.fic.title,
        fandom: e.fic.fandom,
        author: e.fic.author,
        tags: visibleTags.map((t) => t.tag),
      },
      status: e.status,
      rating: e.rating,
      reviewText: e.reviewText,
      type: e.type,
    };
  });

  const recItems = recs.map((r) => ({
    kind: "recommendation" as const,
    id: r.id,
    at: r.createdAt,
    user: r.sender,
    fic: { id: r.fic.id, title: r.fic.title, fandom: r.fic.fandom, author: r.fic.author },
    note: r.note,
  }));

  const items = [...readItems, ...recItems].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );

  res.json(items.slice(0, 50));
});

export default router;
