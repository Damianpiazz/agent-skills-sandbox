import { Router, Response } from "express"
import { z } from "zod"
import { getDb } from "../db/connection.js"
import { requireAuth, AuthRequest } from "../middleware/auth.js"
import { validate } from "../middleware/validate.js"

const router = Router()

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  description: z.string().max(1000).optional().default(""),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  category: z.string().max(100).optional().default(""),
  dueDate: z.string().optional(),
})

const updateTaskSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(1000).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  category: z.string().max(100).optional(),
  dueDate: z.string().optional().nullable(),
  status: z.enum(["pending", "completed", "cancelled"]).optional(),
})

router.use(requireAuth)

router.get("/", (req: AuthRequest, res: Response) => {
  try {
    const db = getDb()
    const { status, priority, category } = req.query

    let sql = "SELECT * FROM tasks WHERE user_id = ?"
    const params: any[] = [req.userId]

    if (status && typeof status === "string") {
      sql += " AND status = ?"
      params.push(status)
    }
    if (priority && typeof priority === "string") {
      sql += " AND priority = ?"
      params.push(priority)
    }
    if (category && typeof category === "string") {
      sql += " AND category = ?"
      params.push(category)
    }

    sql += " ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END, created_at DESC"

    const tasks = db.prepare(sql).all(...params) as any[]

    const result = tasks.map((t) => ({
      id: t.id,
      userId: t.user_id,
      title: t.title,
      description: t.description || undefined,
      priority: t.priority,
      status: t.status,
      category: t.category || undefined,
      dueDate: t.due_date || undefined,
      completedAt: t.completed_at || undefined,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }))

    res.json({ success: true, data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    res.status(500).json({ success: false, error: message })
  }
})

router.get("/:id", (req: AuthRequest, res: Response) => {
  try {
    const db = getDb()
    const task = db.prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?").get(req.params.id, req.userId) as any

    if (!task) {
      res.status(404).json({ success: false, error: "Task not found" })
      return
    }

    res.json({
      success: true,
      data: {
        id: task.id,
        userId: task.user_id,
        title: task.title,
        description: task.description || undefined,
        priority: task.priority,
        status: task.status,
        category: task.category || undefined,
        dueDate: task.due_date || undefined,
        completedAt: task.completed_at || undefined,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    res.status(500).json({ success: false, error: message })
  }
})

router.post("/", validate(createTaskSchema), (req: AuthRequest, res: Response) => {
  try {
    const { title, description, priority, category, dueDate } = req.body
    const db = getDb()
    const id = crypto.randomUUID()

    db.prepare(
      "INSERT INTO tasks (id, user_id, title, description, priority, category, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run(id, req.userId, title, description, priority, category, dueDate || null)

    res.status(201).json({
      success: true,
      data: {
        id,
        userId: req.userId,
        title,
        description,
        priority,
        status: "pending",
        category: category || undefined,
        dueDate: dueDate || undefined,
        completedAt: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    res.status(500).json({ success: false, error: message })
  }
})

router.patch("/:id", validate(updateTaskSchema), (req: AuthRequest, res: Response) => {
  try {
    const { title, description, priority, category, dueDate, status } = req.body
    const db = getDb()

    const existing = db.prepare("SELECT id FROM tasks WHERE id = ? AND user_id = ?").get(req.params.id, req.userId)
    if (!existing) {
      res.status(404).json({ success: false, error: "Task not found" })
      return
    }

    const updates: string[] = []
    const params: any[] = []

    if (title !== undefined) {
      updates.push("title = ?")
      params.push(title)
    }
    if (description !== undefined) {
      updates.push("description = ?")
      params.push(description)
    }
    if (priority !== undefined) {
      updates.push("priority = ?")
      params.push(priority)
    }
    if (category !== undefined) {
      updates.push("category = ?")
      params.push(category)
    }
    if (dueDate !== undefined) {
      updates.push("due_date = ?")
      params.push(dueDate || null)
    }
    if (status !== undefined) {
      updates.push("status = ?")
      params.push(status)
      if (status === "completed") {
        updates.push("completed_at = datetime('now')")
      } else {
        updates.push("completed_at = NULL")
      }
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')")
      params.push(req.params.id)
      db.prepare(`UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`).run(...params)
    }

    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id) as any
    res.json({
      success: true,
      data: {
        id: task.id,
        userId: task.user_id,
        title: task.title,
        description: task.description || undefined,
        priority: task.priority,
        status: task.status,
        category: task.category || undefined,
        dueDate: task.due_date || undefined,
        completedAt: task.completed_at || undefined,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
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
    const result = db.prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?").run(req.params.id, req.userId)

    if (result.changes === 0) {
      res.status(404).json({ success: false, error: "Task not found" })
      return
    }

    res.json({ success: true, data: { message: "Task deleted" } })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    res.status(500).json({ success: false, error: message })
  }
})

export default router
