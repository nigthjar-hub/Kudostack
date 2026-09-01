import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../prisma";
import { COOKIE_NAME, COOKIE_OPTIONS as cookieOptions, requireAuth, signToken } from "../auth";

const router = Router();

function serializeCurrentUser(user: {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarColor: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  defaultShowContentWarnings: boolean;
  defaultShowSpiceTags: boolean;
}) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarColor: user.avatarColor,
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl,
    defaultShowContentWarnings: user.defaultShowContentWarnings,
    defaultShowSpiceTags: user.defaultShowSpiceTags,
  };
}

const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscores only"),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(8),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const { username, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return res.status(409).json({ error: "Username already taken" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, email: email || null, passwordHash },
  });

  const token = signToken({ userId: user.id, username: user.username });
  res.cookie(COOKIE_NAME, token, cookieOptions);
  res.status(201).json(serializeCurrentUser(user));
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }
  const { username, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return res.status(401).json({ error: "Invalid username or password" });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = signToken({ userId: user.id, username: user.username });
  res.cookie(COOKIE_NAME, token, cookieOptions);
  res.json(serializeCurrentUser(user));
});

router.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(serializeCurrentUser(user));
});

const passwordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

router.patch("/password", requireAuth, async (req, res) => {
  const parsed = passwordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) return res.status(404).json({ error: "User not found" });

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Current password is incorrect" });

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  res.json({ ok: true });
});

const deleteSchema = z.object({
  password: z.string(),
});

router.delete("/me", requireAuth, async (req, res) => {
  const parsed = deleteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Password confirmation required" });
  }
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) return res.status(404).json({ error: "User not found" });

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Password is incorrect" });

  await prisma.user.delete({ where: { id: user.id } });
  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.json({ ok: true });
});

export default router;
