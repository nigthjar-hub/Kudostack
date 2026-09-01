import { Router } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { requireAuth } from "../auth";

const MIME_TO_EXT: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, "..", "..", "uploads"),
    // Never trust the client-supplied filename or extension: generate a random
    // name and derive the extension from the validated mimetype instead.
    filename: (_req, file, cb) => {
      cb(null, `${crypto.randomUUID()}${MIME_TO_EXT[file.mimetype]}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!MIME_TO_EXT[file.mimetype]) {
      cb(new Error("Only PNG, JPEG, WEBP, or GIF images are allowed"));
      return;
    }
    cb(null, true);
  },
});

const router = Router();

router.post("/image", requireAuth, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded" });
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

router.use((err: unknown, _req: import("express").Request, res: import("express").Response, _next: import("express").NextFunction) => {
  if (err instanceof multer.MulterError || err instanceof Error) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: "Upload failed" });
});

export default router;
