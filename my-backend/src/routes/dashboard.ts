import { Router, Response } from "express"
import { getDb } from "../db/connection.js"
import { requireAuth, AuthRequest } from "../middleware/auth.js"

const router = Router()

router.use(requireAuth)

router.get("/", (req: AuthRequest, res: Response) => {
  try {
    const db = getDb()
    const today = new Date().toISOString().slice(0, 10)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const habits = db
      .prepare(
        `SELECT h.*,
          (SELECT COUNT(*) FROM habit_completions hc WHERE hc.habit_id = h.id) as total_completions
        FROM habits h WHERE h.user_id = ?`,
      )
      .all(req.userId) as any[]

    const todayHabits = habits.filter((h: any) => {
      const completed = db
        .prepare("SELECT id FROM habit_completions WHERE habit_id = ? AND date(completed_at) = ?")
        .get(h.id, today)
      return !completed
    })

    const completedToday = habits.filter((h: any) => {
      const completed = db
        .prepare("SELECT id FROM habit_completions WHERE habit_id = ? AND date(completed_at) = ?")
        .get(h.id, today)
      return completed
    })

    const totalHabits = habits.length
    const completedHabitsCount = completedToday.length

    const pendingTasks = db
      .prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = 'pending'")
      .get(req.userId) as { count: number }

    const completedTasks = db
      .prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = 'completed'")
      .get(req.userId) as { count: number }

    const tasksDueToday = db
      .prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = 'pending' AND due_date = ?")
      .get(req.userId, today) as { count: number }

    const totalTasks = db
      .prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ?")
      .get(req.userId) as { count: number }

    const weeklyProgress = db
      .prepare(
        `SELECT date(completed_at) as day, COUNT(DISTINCT habit_id) as count
        FROM habit_completions hc
        JOIN habits h ON h.id = hc.habit_id
        WHERE h.user_id = ? AND date(hc.completed_at) >= ?
        GROUP BY date(completed_at)
        ORDER BY day`,
      )
      .all(req.userId, weekAgo) as { day: string; count: number }[]

    const weeklyTaskProgress = db
      .prepare(
        `SELECT date(completed_at) as day, COUNT(*) as count
        FROM tasks
        WHERE user_id = ? AND status = 'completed' AND date(completed_at) >= ?
        GROUP BY date(completed_at)
        ORDER BY day`,
      )
      .all(req.userId, weekAgo) as { day: string; count: number }[]

    const user = db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(req.userId) as any

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        habits: {
          total: totalHabits,
          completedToday: completedHabitsCount,
          pending: todayHabits.length,
          todayHabits: todayHabits.map((h: any) => ({
            id: h.id,
            name: h.name,
            frequency: h.frequency,
          })),
          completedTodayHabits: completedToday.map((h: any) => ({
            id: h.id,
            name: h.name,
            frequency: h.frequency,
          })),
          weeklyProgress,
        },
        tasks: {
          total: totalTasks.count,
          pending: pendingTasks.count,
          completed: completedTasks.count,
          dueToday: tasksDueToday.count,
          weeklyProgress: weeklyTaskProgress,
        },
        streakSummary: habits.map((h: any) => {
          const completions = db
            .prepare("SELECT completed_at FROM habit_completions WHERE habit_id = ? ORDER BY completed_at DESC")
            .all(h.id) as { completed_at: string }[]

          const sorted = completions
            .map((c) => new Date(c.completed_at.slice(0, 10)))
            .sort((a, b) => b.getTime() - a.getTime())

          let streak = 0
          const today2 = new Date()
          today2.setHours(0, 0, 0, 0)
          let expectedDate = today2

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

          return { habitId: h.id, habitName: h.name, currentStreak: streak }
        }),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    res.status(500).json({ success: false, error: message })
  }
})

export default router
