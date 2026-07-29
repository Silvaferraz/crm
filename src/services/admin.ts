import { supabase } from '@/lib/supabase'

export async function listarTenantsMetricas() {
  const { data } = await supabase.rpc('admin_tenants_metricas')
  return data ?? []
}

export async function setTenantAtivo(tenantId: string, ativo: boolean) {
  await supabase.rpc('admin_set_tenant_ativo', { p_tenant_id: tenantId, p_ativo: ativo })
}

export async function gerarCobrancas(mesReferencia: string) {
  const { data } = await supabase.rpc('admin_gerar_cobrancas', { p_mes_referencia: mesReferencia })
  return data as number
}

export async function marcarPago(id: string) {
  await supabase.rpc('admin_marcar_pago', { p_id: id })
}

export async function listarCobrancas(tenantId: string) {
  const { data } = await supabase
    .from('pagamentos_saas')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('mes_referencia', { ascending: false })
  return data ?? []
}

export async function listarLogs() {
  const { data } = await supabase
    .from('logs_auditoria')
    .select('*')
    .order('criado_em', { ascending: false })
    .limit(100)
  return data ?? []
}

export async function atualizarTenant(id: string, campos: Record<string, unknown>) {
  const { data } = await supabase.from('tenants').update(campos).eq('id', id).select().single()
  return data
}

export async function criarTenant(campos: Record<string, unknown>) {
  const { data } = await supabase.from('tenants').insert(campos).select().single()
  return data
}
