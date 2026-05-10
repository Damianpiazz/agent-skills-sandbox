import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production"

export interface AuthRequest extends Request {
  userId?: string
  userEmail?: string
}

export function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "7d" })
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "No token provided" })
    return
  }

  const token = header.slice(7)

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string }
    req.userId = payload.userId
    req.userEmail = payload.email
    next()
  } catch {
    res.status(401).json({ success: false, error: "Invalid or expired token" })
  }
}
