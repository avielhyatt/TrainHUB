import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, TOKEN_KEY } from '../api/client'
import type { AuthResponse, User } from '../api/types'

const USER_KEY = 'trainhub_user'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (phone_number: string, password: string) => Promise<User>
  register: (payload: Record<string, unknown>) => Promise<User>
  logout: () => void
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem(USER_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  function persist(auth: AuthResponse) {
    localStorage.setItem(TOKEN_KEY, auth.access_token)
    localStorage.setItem(USER_KEY, JSON.stringify(auth.user))
    setUser(auth.user)
    return auth.user
  }

  async function login(phone_number: string, password: string) {
    const { data } = await api.post<AuthResponse>('/auth/login', { phone_number, password })
    return persist(data)
  }

  async function register(payload: Record<string, unknown>) {
    const { data } = await api.post<AuthResponse>('/auth/register', payload)
    return persist(data)
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  function updateUser(u: User) {
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setUser(u)
  }

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout, setUser: updateUser }),
    [user, isLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
