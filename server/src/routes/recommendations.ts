import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth } from "../auth";

const router = Router();

const recSchema = z.object({
  recipientUsername: z.string(),
  ficId: z.string(),
  note: z.string().max(500).nullable().optional(),
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = recSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const { recipientUsername, ficId, note } = parsed.data;

  const recipient = await prisma.user.findUnique({ where: { username: recipientUsername } });
  if (!recipient) return res.status(404).json({ error: "Recipient not found" });
  const fic = await prisma.fic.findUnique({ where: { id: ficId } });
  if (!fic) return res.status(404).json({ error: "Fic not found" });

  const rec = await prisma.recommendation.create({
    data: { senderId: req.user!.userId, recipientId: recipient.id, ficId, note: note ?? null },
    include: { fic: true, sender: { select: { username: true, avatarColor: true } } },
  });
  res.status(201).json(rec);
});

router.get("/received", requireAuth, async (req, res) => {
  const recs = await prisma.recommendation.findMany({
    where: { recipientId: req.user!.userId },
    orderBy: { createdAt: "desc" },
    include: { fic: true, sender: { select: { username: true, avatarColor: true } } },
  });
  res.json(recs);
});

export default router;
