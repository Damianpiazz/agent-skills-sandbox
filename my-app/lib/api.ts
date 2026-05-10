import { Platform } from "react-native"

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api"

let _token: string | null = null

function getStorage(): { getItem: (k: string) => string | null; setItem: (k: string, v: string) => void; removeItem: (k: string) => void } | null {
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      return localStorage
    }
  } catch {}
  return null
}

export function getToken(): string | null {
  const storage = getStorage()
  if (storage) return storage.getItem("auth_token")
  return _token
}

export function setToken(token: string): void {
  _token = token
  const storage = getStorage()
  if (storage) storage.setItem("auth_token", token)
}

export function clearToken(): void {
  _token = null
  const storage = getStorage()
  if (storage) storage.removeItem("auth_token")
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  const token = getToken()
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  try {
    const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers })
    const json = await res.json()

    if (!res.ok) {
      return { success: false, error: json.error || `HTTP ${res.status}` }
    }

    return { success: true, data: json.data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    }
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: "DELETE" }),
}

export type { ApiResponse }
