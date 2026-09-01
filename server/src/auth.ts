import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
export const COOKIE_NAME = "kudostack_token";

const isProd = process.env.NODE_ENV === "production";
export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProd,
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

export interface AuthPayload {
  userId: string;
  username: string;
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function attachUser(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (token) {
    const payload = verifyToken(token);
    if (payload) req.user = payload;
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}
