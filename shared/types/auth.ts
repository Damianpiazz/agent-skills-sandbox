// Tipos compartidos de autenticación

export interface RegisterDTO {
  name: string
  email: string
  password: string
}

export interface LoginDTO {
  email: string
  password: string
}

export interface Session {
  token: string
  user: UserDTO
}

export interface UserDTO {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface TokenPayload {
  userId: string
  email: string
}
