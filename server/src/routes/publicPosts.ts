import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth } from "../auth";

const router = Router();

// A true platform-wide feed: any logged-in user can browse every public post,
// not just those from people they follow. This is intentionally distinct from
// the friends-only activity feed in routes/feed.ts.
router.get("/", requireAuth, async (req, res) => {
  const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
  const posts = await prisma.publicPost.findMany({
    take: 30,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      fic: true,
      author: { select: { username: true, displayName: true, avatarColor: true, avatarUrl: true } },
    },
  });
  res.json({
    posts,
    nextCursor: posts.length === 30 ? posts[posts.length - 1].id : null,
  });
});

const createSchema = z.object({
  ficId: z.string(),
  note: z.string().min(1).max(500),
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const fic = await prisma.fic.findUnique({ where: { id: parsed.data.ficId } });
  if (!fic) return res.status(404).json({ error: "Fic not found" });

  const post = await prisma.publicPost.create({
    data: { authorId: req.user!.userId, ficId: parsed.data.ficId, note: parsed.data.note },
    include: {
      fic: true,
      author: { select: { username: true, displayName: true, avatarColor: true, avatarUrl: true } },
    },
  });
  res.status(201).json(post);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const post = await prisma.publicPost.findUnique({ where: { id: req.params.id } });
  if (!post || post.authorId !== req.user!.userId) {
    return res.status(404).json({ error: "Post not found" });
  }
  await prisma.publicPost.delete({ where: { id: post.id } });
  res.json({ ok: true });
});

export default router;
