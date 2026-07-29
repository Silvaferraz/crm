import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function AdminRoute() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user?.super_admin) return <Navigate to="/404" replace />
  return <Outlet />
}
