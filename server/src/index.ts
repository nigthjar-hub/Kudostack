import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { attachUser } from "./auth";
import authRoutes from "./routes/auth";
import ficRoutes from "./routes/fics";
import tagRoutes from "./routes/tags";
import readEventRoutes from "./routes/readEvents";
import userRoutes from "./routes/users";
import feedRoutes from "./routes/feed";
import recommendationRoutes from "./routes/recommendations";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(attachUser);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/fics", ficRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/read-events", readEventRoutes);
app.use("/api/users", userRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/recommendations", recommendationRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Kudostack server listening on http://localhost:${PORT}`);
});
