// Tipos compartidos de usuario y perfil

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt: string
}

export interface Profile {
  id: string
  userId: string
  bio?: string
  avatar?: string
  preferences: UserPreferences
}

export interface UserPreferences {
  theme: "light" | "dark" | "system"
  notificationsEnabled: boolean
  reminderTime?: string // HH:mm
  weekStartsOn: 0 | 1 // 0=domingo, 1=lunes
}

export interface UpdateProfileDTO {
  name?: string
  bio?: string
  avatar?: string
  preferences?: Partial<UserPreferences>
}
