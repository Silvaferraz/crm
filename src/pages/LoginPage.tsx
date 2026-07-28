import { useState, useEffect } from 'react'
import { Login } from './Login'
import { TenantSelect } from './TenantSelect'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/TenantContext'
import { getTenantCookie, setTenantCookie } from '@/lib/cookies'
import { useNavigate } from 'react-router-dom'
import type { Tenant } from '@/types'

export function LoginPage() {
  const [step, setStep] = useState<'login' | 'select'>('login')
  const [tenants, setTenants] = useState<{ id: string; nome: string; slug: string }[]>([])
  const { setTenant } = useTenant()
  const navigate = useNavigate()

  useEffect(() => {
    const slug = getTenantCookie()
    if (slug) {
      supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setTenant(data as Tenant)
        })
    }
  }, [setTenant])

  async function handleTenantsFound(tenantsEncontrados: { id: string; nome: string; slug: string }[]) {
    setTenants(tenantsEncontrados)
    setStep('select')
  }

  async function handleTenantSelect(tenantId: string) {
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single()

    if (tenantData) {
      setTenant(tenantData as Tenant)
      setTenantCookie(tenantData.slug)
      navigate('/', { replace: true })
    }
  }

  if (step === 'select') {
    return <TenantSelect tenants={tenants} onSelect={handleTenantSelect} />
  }

  return <Login onTenantsFound={handleTenantsFound} />
}
