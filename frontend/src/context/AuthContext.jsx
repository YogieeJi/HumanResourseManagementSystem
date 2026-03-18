import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('hrms_user')
    const token = localStorage.getItem('hrms_token')
    if (saved && token) {
      setUser(JSON.parse(saved))
      // Refresh from server
      api.get('/auth/me')
        .then(r => { setUser(r.data.user); localStorage.setItem('hrms_user', JSON.stringify(r.data.user)) })
        .catch(() => logout())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const r = await api.post('/auth/login', { email, password })
    const { token, user } = r.data
    localStorage.setItem('hrms_token', token)
    localStorage.setItem('hrms_user', JSON.stringify(user))
    setUser(user)
    return user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('hrms_token')
    localStorage.removeItem('hrms_user')
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const r = await api.get('/auth/me')
    setUser(r.data.user)
    localStorage.setItem('hrms_user', JSON.stringify(r.data.user))
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser,
      isAdmin: user?.role === 'admin',
      isManager: user?.role === 'manager',
      isEmployee: user?.role === 'employee',
      canManage: ['admin','manager'].includes(user?.role) }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
