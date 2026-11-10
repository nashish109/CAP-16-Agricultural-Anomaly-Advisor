import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authService } from '../services'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    fullName: string
    email: string
    phone: string
    password: string
    location: string
  }) => Promise<void>
  updateUser: (patch: Partial<User>) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('agrisense_token')
    const savedUser = localStorage.getItem('agrisense_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem('agrisense_token')
        localStorage.removeItem('agrisense_user')
      }
    }
    setIsLoading(false)
  }, [])

  const persist = (newToken: string, newUser: User) => {
    localStorage.setItem('agrisense_token', newToken)
    localStorage.setItem('agrisense_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login(email, password)
    persist(res.token, res.user)
  }, [])

  const register = useCallback(
    async (data: {
      fullName: string
      email: string
      phone: string
      password: string
      location: string
    }) => {
      const res = await authService.register(data)
      persist(res.token, res.user)
    },
    []
  )

  const logout = useCallback(() => {
    localStorage.removeItem('agrisense_token')
    localStorage.removeItem('agrisense_user')
    setToken(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...patch }
      localStorage.setItem('agrisense_user', JSON.stringify(next))
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      isLoading,
      login,
      register,
      updateUser,
      logout,
    }),
    [user, token, isLoading, login, register, updateUser, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
