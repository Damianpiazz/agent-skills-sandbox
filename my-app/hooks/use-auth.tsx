import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { api, setToken, clearToken, getToken } from "@/lib/api"
import type { Session, UserDTO, LoginDTO, RegisterDTO } from "@/shared/types/auth"

interface AuthContextType {
  user: UserDTO | null
  loading: boolean
  login: (dto: LoginDTO) => Promise<string | null>
  register: (dto: RegisterDTO) => Promise<string | null>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null)
  const [loading, setLoading] = useState(true)

  const checkSession = useCallback(async () => {
    if (!getToken()) {
      setLoading(false)
      return
    }

    const res = await api.get<{ user: UserDTO }>("/auth/session")
    if (res.success && res.data) {
      setUser(res.data.user)
    } else {
      clearToken()
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  const login = useCallback(async (dto: LoginDTO): Promise<string | null> => {
    const res = await api.post<{ session: Session }>("/auth/login", dto)
    if (res.success && res.data) {
      setToken(res.data.session.token)
      setUser(res.data.session.user)
      return null
    }
    return res.error || "Login failed"
  }, [])

  const register = useCallback(async (dto: RegisterDTO): Promise<string | null> => {
    const res = await api.post<{ session: Session }>("/auth/register", dto)
    if (res.success && res.data) {
      setToken(res.data.session.token)
      setUser(res.data.session.user)
      return null
    }
    return res.error || "Registration failed"
  }, [])

  const logout = useCallback(async () => {
    await api.post("/auth/logout", {})
    clearToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
