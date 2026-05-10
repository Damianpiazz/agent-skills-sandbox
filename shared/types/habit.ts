// Tipos compartidos de habits

export type HabitFrequency = "daily" | "weekly" | "weekdays" | "weekends"

export interface Habit {
  id: string
  userId: string
  name: string
  description?: string
  frequency: HabitFrequency
  streak: number
  longestStreak: number
  totalCompletions: number
  createdAt: string
  updatedAt: string
}

export interface CreateHabitDTO {
  name: string
  description?: string
  frequency: HabitFrequency
}

export interface UpdateHabitDTO {
  name?: string
  description?: string
  frequency?: HabitFrequency
}

export interface HabitCompletion {
  id: string
  habitId: string
  completedAt: string
}

export interface StreakSummary {
  currentStreak: number
  longestStreak: number
  totalCompletions: number
  weeklyProgress: number // porcentaje 0-100
}
