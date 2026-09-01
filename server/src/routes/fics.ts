import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth } from "../auth";
import { FIC_STATUSES } from "../constants";

const router = Router();

router.get("/", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const where = q
    ? {
        OR: [
          { title: { contains: q } },
          { fandom: { contains: q } },
          { author: { contains: q } },
        ],
      }
    : {};
  const fics = await prisma.fic.findMany({
    where,
    take: 20,
    orderBy: { createdAt: "desc" },
    include: { tags: { include: { tag: true } } },
  });
  res.json(fics);
});

// Registered before "/:id" — otherwise the dynamic id route would swallow this path.
router.get("/fandoms", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const rows = await prisma.fic.findMany({
    where: q ? { fandom: { contains: q } } : {},
    select: { fandom: true },
    distinct: ["fandom"],
    take: 15,
    orderBy: { fandom: "asc" },
  });
  res.json(rows.map((r) => r.fandom));
});

router.get("/:id", async (req, res) => {
  const fic = await prisma.fic.findUnique({
    where: { id: req.params.id },
    include: { tags: { include: { tag: true } } },
  });
  if (!fic) return res.status(404).json({ error: "Fic not found" });
  res.json(fic);
});

const ficSchema = z.object({
  title: z.string().min(1),
  fandom: z.string().min(1),
  author: z.string().min(1),
  status: z.enum(FIC_STATUSES).default("ONGOING"),
  totalChapters: z.number().int().positive().nullable().optional(),
  wordCount: z.number().int().positive().nullable().optional(),
  ao3Url: z.string().url().nullable().optional().or(z.literal("")),
  tagIds: z.array(z.string()).default([]),
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = ficSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const { title, fandom, author, status, totalChapters, wordCount, ao3Url, tagIds } = parsed.data;

  // Reuse an existing fic if one already matches title+fandom+author to avoid duplicates.
  let fic = await prisma.fic.findFirst({
    where: { title, fandom, author },
  });

  if (!fic) {
    fic = await prisma.fic.create({
      data: {
        title,
        fandom,
        author,
        status,
        totalChapters: totalChapters ?? null,
        wordCount: wordCount ?? null,
        ao3Url: ao3Url || null,
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
      },
    });
  }

  const full = await prisma.fic.findUnique({
    where: { id: fic.id },
    include: { tags: { include: { tag: true } } },
  });
  res.status(201).json(full);
});

export default router;
