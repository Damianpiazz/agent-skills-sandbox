import { Router, Response } from "express"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { getDb } from "../db/connection.js"
import { generateToken, requireAuth, AuthRequest } from "../middleware/auth.js"
import { validate } from "../middleware/validate.js"

const router = Router()

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
})

router.post("/register", validate(registerSchema), async (req, res: Response) => {
  try {
    const { name, email, password } = req.body
    const db = getDb()

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email)
    if (existing) {
      res.status(409).json({ success: false, error: "Email already registered" })
      return
    }

    const id = crypto.randomUUID()
    const passwordHash = await bcrypt.hash(password, 10)

    db.prepare("INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)").run(
      id,
      name,
      email,
      passwordHash,
    )

    db.prepare("INSERT INTO profiles (id, user_id) VALUES (?, ?)").run(crypto.randomUUID(), id)

    const token = generateToken(id, email)

    res.status(201).json({
      success: true,
      data: { session: { token, user: { id, name, email } } },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    res.status(500).json({ success: false, error: message })
  }
})

router.post("/login", validate(loginSchema), async (req, res: Response) => {
  try {
    const { email, password } = req.body
    const db = getDb()

    const user = db.prepare("SELECT id, name, email, password_hash FROM users WHERE email = ?").get(email) as
      | { id: string; name: string; email: string; password_hash: string }
      | undefined

    if (!user) {
      res.status(401).json({ success: false, error: "Invalid email or password" })
      return
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      res.status(401).json({ success: false, error: "Invalid email or password" })
      return
    }

    const token = generateToken(user.id, user.email)

    res.json({
      success: true,
      data: { session: { token, user: { id: user.id, name: user.name, email: user.email } } },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    res.status(500).json({ success: false, error: message })
  }
})

router.get("/session", requireAuth, (req: AuthRequest, res: Response) => {
  const db = getDb()
  const user = db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(req.userId) as
    | { id: string; name: string; email: string }
    | undefined

  if (!user) {
    res.status(404).json({ success: false, error: "User not found" })
    return
  }

  res.json({ success: true, data: { user } })
})

router.post("/logout", (_req, res: Response) => {
  res.json({ success: true, data: { message: "Logged out" } })
})

export default router
