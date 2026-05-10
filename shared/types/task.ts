// Tipos compartidos de tareas

export type Priority = "low" | "medium" | "high"

export type TaskStatus = "pending" | "completed" | "cancelled"

export interface Task {
  id: string
  userId: string
  title: string
  description?: string
  priority: Priority
  status: TaskStatus
  category?: string
  dueDate?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateTaskDTO {
  title: string
  description?: string
  priority: Priority
  category?: string
  dueDate?: string
}

export interface UpdateTaskDTO {
  title?: string
  description?: string
  priority?: Priority
  category?: string
  dueDate?: string
  status?: TaskStatus
}
