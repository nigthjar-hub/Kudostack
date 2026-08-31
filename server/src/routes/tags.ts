import { Router } from "express";
import { prisma } from "../prisma";

const router = Router();

router.get("/", async (_req, res) => {
  const tags = await prisma.tag.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] });
  res.json(tags);
});

export default router;
