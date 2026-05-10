import { Router, Response } from "express"
import { z } from "zod"
import { getDb } from "../db/connection.js"
import { requireAuth, AuthRequest } from "../middleware/auth.js"
import { validate } from "../middleware/validate.js"

const router = Router()

const createHabitSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(500).optional().default(""),
  frequency: z.enum(["daily", "weekly", "weekdays", "weekends"]).default("daily"),
})

const updateHabitSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  frequency: z.enum(["daily", "weekly", "weekdays", "weekends"]).optional(),
})

router.use(requireAuth)

router.get("/", (req: AuthRequest, res: Response) => {
  try {
    const db = getDb()
    const habits = db
      .prepare(
        `SELECT h.*,
          (SELECT COUNT(*) FROM habit_completions hc WHERE hc.habit_id = h.id) as total_completions
        FROM habits h WHERE h.user_id = ? ORDER BY h.created_at DESC`,
      )
      .all(req.userId) as any[]

    const result = habits.map((h) => {
      const completions = db
        .prepare("SELECT completed_at FROM habit_completions WHERE habit_id = ? ORDER BY completed_at DESC")
        .all(h.id) as { completed_at: string }[]

      const streak = calculateStreak(h.frequency, completions.map((c) => c.completed_at))
      const longestStreak = calculateLongestStreak(h.frequency, completions.map((c) => c.completed_at))

      return {
        id: h.id,
        userId: h.user_id,
        name: h.name,
        description: h.description || undefined,
        frequency: h.frequency as string,
        streak,
        longestStreak,
        totalCompletions: h.total_completions,
        createdAt: h.created_at,
        updatedAt: h.updated_at,
      }
    })

    res.json({ success: true, data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    res.status(500).json({ success: false, error: message })
  }
})

router.get("/:id", (req: AuthRequest, res: Response) => {
  try {
    const db = getDb()
    const habit = db.prepare("SELECT * FROM habits WHERE id = ? AND user_id = ?").get(req.params.id, req.userId) as any

    if (!habit) {
      res.status(404).json({ success: false, error: "Habit not found" })
      return
    }

    const completions = db
      .prepare("SELECT id, completed_at FROM habit_completions WHERE habit_id = ? ORDER BY completed_at DESC")
      .all(habit.id) as { id: string; completed_at: string }[]

    const dates = completions.map((c) => c.completed_at)
    const streak = calculateStreak(habit.frequency, dates)
    const longestStreak = calculateLongestStreak(habit.frequency, dates)

    res.json({
      success: true,
      data: {
        id: habit.id,
        userId: habit.user_id,
        name: habit.name,
        description: habit.description || undefined,
        frequency: habit.frequency,
        streak,
        longestStreak,
        totalCompletions: completions.length,
        completions: completions.map((c) => ({ id: c.id, completedAt: c.completed_at })),
        createdAt: habit.created_at,
        updatedAt: habit.updated_at,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    res.status(500).json({ success: false, error: message })
  }
})

router.post("/", validate(createHabitSchema), (req: AuthRequest, res: Response) => {
  try {
    const { name, description, frequency } = req.body
    const db = getDb()
    const id = crypto.randomUUID()

    db.prepare("INSERT INTO habits (id, user_id, name, description, frequency) VALUES (?, ?, ?, ?, ?)").run(
      id,
      req.userId,
      name,
      description,
      frequency,
    )

    res.status(201).json({
      success: true,
      data: {
        id,
        userId: req.userId,
        name,
        description,
        frequency,
        streak: 0,
        longestStreak: 0,
        totalCompletions: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    res.status(500).json({ success: false, error: message })
  }
})

router.patch("/:id", validate(updateHabitSchema), (req: AuthRequest, res: Response) => {
  try {
    const { name, description, frequency } = req.body
    const db = getDb()

    const existing = db.prepare("SELECT id FROM habits WHERE id = ? AND user_id = ?").get(req.params.id, req.userId)
    if (!existing) {
      res.status(404).json({ success: false, error: "Habit not found" })
      return
    }

    const updates: string[] = []
    const params: any[] = []
    if (name !== undefined) {
      updates.push("name = ?")
      params.push(name)
    }
    if (description !== undefined) {
      updates.push("description = ?")
      params.push(description)
    }
    if (frequency !== undefined) {
      updates.push("frequency = ?")
      params.push(frequency)
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')")
      params.push(req.params.id)
      db.prepare(`UPDATE habits SET ${updates.join(", ")} WHERE id = ?`).run(...params)
    }

    const habit = db.prepare("SELECT * FROM habits WHERE id = ?").get(req.params.id) as any
    res.json({
      success: true,
      data: {
        id: habit.id,
        userId: habit.user_id,
        name: habit.name,
        description: habit.description || undefined,
        frequency: habit.frequency,
        createdAt: habit.created_at,
        updatedAt: habit.updated_at,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    res.status(500).json({ success: false, error: message })
  }
})

router.delete("/:id", (req: AuthRequest, res: Response) => {
  try {
    const db = getDb()
    const result = db.prepare("DELETE FROM habits WHERE id = ? AND user_id = ?").run(req.params.id, req.userId)

    if (result.changes === 0) {
      res.status(404).json({ success: false, error: "Habit not found" })
      return
    }

    res.json({ success: true, data: { message: "Habit deleted" } })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    res.status(500).json({ success: false, error: message })
  }
})

router.post("/:id/complete", (req: AuthRequest, res: Response) => {
  try {
    const db = getDb()
    const habit = db.prepare("SELECT id, frequency FROM habits WHERE id = ? AND user_id = ?").get(
      req.params.id,
      req.userId,
    ) as any

    if (!habit) {
      res.status(404).json({ success: false, error: "Habit not found" })
      return
    }

    const today = new Date().toISOString().slice(0, 10)

    const alreadyCompleted = db
      .prepare("SELECT id FROM habit_completions WHERE habit_id = ? AND date(completed_at) = ?")
      .get(habit.id, today) as { id: string } | undefined

    if (alreadyCompleted) {
      res.json({ success: true, data: { message: "Already completed today", id: alreadyCompleted.id } })
      return
    }

    const id = crypto.randomUUID()
    db.prepare("INSERT INTO habit_completions (id, habit_id) VALUES (?, ?)").run(id, habit.id)

    res.status(201).json({ success: true, data: { id, habitId: habit.id, completedAt: new Date().toISOString() } })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    res.status(500).json({ success: false, error: message })
  }
})

router.delete("/:id/complete", (req: AuthRequest, res: Response) => {
  try {
    const db = getDb()
    const habit = db.prepare("SELECT id FROM habits WHERE id = ? AND user_id = ?").get(req.params.id, req.userId) as any

    if (!habit) {
      res.status(404).json({ success: false, error: "Habit not found" })
      return
    }

    const today = new Date().toISOString().slice(0, 10)
    const result = db
      .prepare("DELETE FROM habit_completions WHERE habit_id = ? AND date(completed_at) = ?")
      .run(habit.id, today)

    if (result.changes === 0) {
      res.status(404).json({ success: false, error: "No completion found for today" })
      return
    }

    res.json({ success: true, data: { message: "Completion removed" } })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    res.status(500).json({ success: false, error: message })
  }
})

function calculateStreak(frequency: string, dates: string[]): number {
  if (dates.length === 0) return 0

  const sorted = dates.map((d) => new Date(d.slice(0, 10))).sort((a, b) => b.getTime() - a.getTime())
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let expectedDate = today

  for (let i = 0; i < sorted.length; i++) {
    const diff = Math.round((expectedDate.getTime() - sorted[i].getTime()) / (1000 * 60 * 60 * 24))

    if (diff === 0) {
      streak++
      expectedDate = new Date(expectedDate.getTime() - 24 * 60 * 60 * 1000)
    } else if (diff === 1 && i === 0) {
      streak++
      expectedDate = new Date(expectedDate.getTime() - 24 * 60 * 60 * 1000)
    } else {
      break
    }
  }

  return streak
}

function calculateLongestStreak(frequency: string, dates: string[]): number {
  if (dates.length === 0) return 0

  const sorted = dates
    .map((d) => new Date(d.slice(0, 10)))
    .sort((a, b) => a.getTime() - b.getTime())

  let maxStreak = 1
  let currentStreak = 1

  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round((sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24))

    if (diff === 1) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else if (diff > 1) {
      currentStreak = 1
    }
  }

  return maxStreak
}

export default router
