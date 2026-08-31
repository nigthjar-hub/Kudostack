import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth } from "../auth";
import { READ_STATUSES, READ_TYPES } from "../constants";

const router = Router();

router.get("/mine", requireAuth, async (req, res) => {
  const statusFilter = typeof req.query.status === "string" ? req.query.status : undefined;
  const readEvents = await prisma.readEvent.findMany({
    where: {
      userId: req.user!.userId,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: { fic: { include: { tags: { include: { tag: true } } } } },
  });
  res.json(readEvents);
});

const createSchema = z.object({
  ficId: z.string(),
  type: z.enum(READ_TYPES).default("FIRST_READ"),
  status: z.enum(READ_STATUSES).default("WANT_TO_READ"),
  rating: z.number().min(0.5).max(5).multipleOf(0.5).nullable().optional(),
  reviewText: z.string().nullable().optional(),
  chaptersRead: z.number().int().min(0).nullable().optional(),
  startedDate: z.string().datetime().nullable().optional(),
  finishedDate: z.string().datetime().nullable().optional(),
  showContentWarnings: z.boolean().optional(),
  showSpiceTags: z.boolean().optional(),
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const data = parsed.data;

  const fic = await prisma.fic.findUnique({ where: { id: data.ficId } });
  if (!fic) return res.status(404).json({ error: "Fic not found" });

  const readEvent = await prisma.readEvent.create({
    data: {
      userId: req.user!.userId,
      ficId: data.ficId,
      type: data.type,
      status: data.status,
      rating: data.rating ?? null,
      reviewText: data.reviewText ?? null,
      chaptersRead: data.chaptersRead ?? null,
      startedDate: data.startedDate ? new Date(data.startedDate) : null,
      finishedDate: data.finishedDate ? new Date(data.finishedDate) : null,
      showContentWarnings: data.showContentWarnings ?? false,
      showSpiceTags: data.showSpiceTags ?? false,
    },
    include: { fic: { include: { tags: { include: { tag: true } } } } },
  });
  res.status(201).json(readEvent);
});

const updateSchema = createSchema.partial().omit({ ficId: true });

router.patch("/:id", requireAuth, async (req, res) => {
  const existing = await prisma.readEvent.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.userId !== req.user!.userId) {
    return res.status(404).json({ error: "Read event not found" });
  }
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const data = parsed.data;

  const readEvent = await prisma.readEvent.update({
    where: { id: req.params.id },
    data: {
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.rating !== undefined ? { rating: data.rating } : {}),
      ...(data.reviewText !== undefined ? { reviewText: data.reviewText } : {}),
      ...(data.chaptersRead !== undefined ? { chaptersRead: data.chaptersRead } : {}),
      ...(data.startedDate !== undefined
        ? { startedDate: data.startedDate ? new Date(data.startedDate) : null }
        : {}),
      ...(data.finishedDate !== undefined
        ? { finishedDate: data.finishedDate ? new Date(data.finishedDate) : null }
        : {}),
      ...(data.showContentWarnings !== undefined ? { showContentWarnings: data.showContentWarnings } : {}),
      ...(data.showSpiceTags !== undefined ? { showSpiceTags: data.showSpiceTags } : {}),
    },
    include: { fic: { include: { tags: { include: { tag: true } } } } },
  });
  res.json(readEvent);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const existing = await prisma.readEvent.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.userId !== req.user!.userId) {
    return res.status(404).json({ error: "Read event not found" });
  }
  await prisma.readEvent.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
