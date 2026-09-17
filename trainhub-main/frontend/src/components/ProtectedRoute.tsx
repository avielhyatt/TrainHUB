import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../api/types'
import Spinner from './ui/Spinner'

export default function ProtectedRoute({ role }: { role?: UserRole }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <Spinner className="min-h-screen" />
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'trainer' ? '/trainer/dashboard' : '/trainee/trainers'} replace />
  }
  return <Outlet />
}
