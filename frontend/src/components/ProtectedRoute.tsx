
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Skeleton } from '../components/ui'
import { canAccessRoute } from '../config/permissions'

interface ProtectedRouteProps {
  path?: string
}

export default function ProtectedRoute({ path }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7f6]">
        <div className="w-64 space-y-3">
          <Skeleton className="h-8 w-40 mx-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (path && !canAccessRoute(user?.role, path)) {
    const canAccessDashboard = canAccessRoute(
      user?.role,
      '/dashboard'
    )

    return (
      <Navigate
        to={canAccessDashboard ? '/dashboard' : '/'}
        replace
      />
    )
  }

  return <Outlet />
}
