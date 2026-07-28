import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Tenant } from '@/types'

interface TenantContextValue {
  tenant: Tenant | null
  setTenant: (t: Tenant | null) => void
}

const TenantContext = createContext<TenantContextValue | null>(null)

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null)

  return (
    <TenantContext.Provider value={{ tenant, setTenant }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenant must be used within TenantProvider')
  return ctx
}

export function useApplyTenantTheme(tenant: Tenant | null) {
  return useCallback(() => {
    if (!tenant) return

    const root = document.documentElement
    root.style.setProperty('--tenant-primaria', tenant.cor_primaria || '#ffffff')
    root.style.setProperty('--tenant-fundo', tenant.cor_fundo || '#0c0c0c')
    root.style.setProperty('--tenant-card', tenant.cor_card || '#1a1a1a')
  }, [tenant])
}
