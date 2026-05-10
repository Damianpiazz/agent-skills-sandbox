import { Router, Response } from "express"
import { z } from "zod"
import { getDb } from "../db/connection.js"
import { requireAuth, AuthRequest } from "../middleware/auth.js"
import { validate } from "../middleware/validate.js"

const router = Router()

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().max(500).optional(),
  preferences: z
    .object({
      theme: z.enum(["light", "dark", "system"]).optional(),
      notificationsEnabled: z.boolean().optional(),
      reminderTime: z.string().optional(),
      weekStartsOn: z.union([z.literal(0), z.literal(1)]).optional(),
    })
    .optional(),
})

router.use(requireAuth)

router.get("/", (req: AuthRequest, res: Response) => {
  try {
    const db = getDb()
    const user = db.prepare("SELECT id, name, email, created_at FROM users WHERE id = ?").get(req.userId) as any

    if (!user) {
      res.status(404).json({ success: false, error: "User not found" })
      return
    }

    const profile = db.prepare("SELECT * FROM profiles WHERE user_id = ?").get(req.userId) as any

    let preferences = { theme: "system" as const, notificationsEnabled: true, weekStartsOn: 1 as const }
    if (profile?.preferences) {
      try {
        preferences = { ...preferences, ...JSON.parse(profile.preferences) }
      } catch {}
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: profile?.avatar || undefined,
        bio: profile?.bio || undefined,
        preferences,
        createdAt: user.created_at,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    res.status(500).json({ success: false, error: message })
  }
})

router.patch("/", validate(updateProfileSchema), (req: AuthRequest, res: Response) => {
  try {
    const { name, bio, avatar, preferences } = req.body
    const db = getDb()

    if (name) {
      db.prepare("UPDATE users SET name = ?, updated_at = datetime('now') WHERE id = ?").run(name, req.userId)
    }

    const existingProfile = db.prepare("SELECT id, preferences FROM profiles WHERE user_id = ?").get(req.userId) as any

    if (existingProfile) {
      const profileUpdates: string[] = []
      const profileParams: any[] = []

      if (bio !== undefined) {
        profileUpdates.push("bio = ?")
        profileParams.push(bio)
      }
      if (avatar !== undefined) {
        profileUpdates.push("avatar = ?")
        profileParams.push(avatar)
      }
      if (preferences) {
        let currentPrefs = {}
        try {
          currentPrefs = JSON.parse(existingProfile.preferences || "{}")
        } catch {}
        const merged = { ...currentPrefs, ...preferences }
        profileUpdates.push("preferences = ?")
        profileParams.push(JSON.stringify(merged))
      }

      if (profileUpdates.length > 0) {
        profileParams.push(req.userId)
        db.prepare(`UPDATE profiles SET ${profileUpdates.join(", ")} WHERE user_id = ?`).run(...profileParams)
      }
    }

    const user = db.prepare("SELECT id, name, email, created_at FROM users WHERE id = ?").get(req.userId) as any
    const profile = db.prepare("SELECT * FROM profiles WHERE user_id = ?").get(req.userId) as any

    let prefs = { theme: "system" as const, notificationsEnabled: true, weekStartsOn: 1 as const }
    if (profile?.preferences) {
      try {
        prefs = { ...prefs, ...JSON.parse(profile.preferences) }
      } catch {}
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        bio: profile?.bio || undefined,
        avatar: profile?.avatar || undefined,
        preferences: prefs,
        createdAt: user.created_at,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    res.status(500).json({ success: false, error: message })
  }
})

export default router
