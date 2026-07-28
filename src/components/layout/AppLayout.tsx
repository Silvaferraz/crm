import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { useTenant } from '@/contexts/TenantContext'
import { useEffect } from 'react'

export function AppLayout() {
  const { user } = useAuth()
  const { tenant } = useTenant()
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'

  useEffect(() => {
    if (!tenant) return

    const root = document.documentElement
    root.style.setProperty('--tenant-primaria', tenant.cor_primaria || '#ffffff')
    root.style.setProperty('--tenant-fundo', tenant.cor_fundo || '#0c0c0c')
    root.style.setProperty('--tenant-card', tenant.cor_card || '#1a1a1a')
  }, [tenant])

  if (isLoginPage) {
    return <Outlet />
  }

  return (
    <div className="min-h-screen bg-fundo">
      <Sidebar />
      <main className="md:ml-60 pb-20 md:pb-0">
        <div className="max-w-[48rem] mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>
      <BottomNav papel={user?.papel} isSuperAdmin={user?.super_admin} />
    </div>
  )
}
