import { supabase } from '@/lib/supabase'

export async function resumoFinanceiro(tenantId: string, inicio: string, fim: string) {
  const { data, error } = await supabase.rpc('resumo_financeiro', {
    p_tenant_id: tenantId,
    p_inicio: inicio,
    p_fim: fim,
  })
  if (error) throw new Error(error.message)
  return data as any
}

export async function listarPagamentos(tenantId: string, inicio: string, fim: string) {
  const { data } = await supabase
    .from('pagamentos')
    .select('*, clientes!left(nome), profissionais!barbeiro_id(nome), pagamento_servicos(*, servicos!left(nome))')
    .eq('tenant_id', tenantId)
    .gte('data_hora', inicio)
    .lt('data_hora', fim)
    .order('data_hora', { ascending: false })
  return data ?? []
}

export async function listarEntradasManuais(tenantId: string, inicio: string, fim: string) {
  const { data } = await supabase
    .from('entradas_manuais')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('criado_em', inicio)
    .lt('criado_em', fim)
    .order('criado_em', { ascending: false })
  return data ?? []
}

export async function listarDespesas(tenantId: string, inicio: string, fim: string) {
  const { data } = await supabase
    .from('despesas')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('criado_em', inicio)
    .lt('criado_em', fim)
    .order('criado_em', { ascending: false })
  return data ?? []
}

export async function salvarEntradaManual(e: { tenant_id: string; valor: number; descricao: string }) {
  const { data } = await supabase.from('entradas_manuais').insert(e).select().single()
  return data as any
}

export async function excluirEntradaManual(id: string) {
  await supabase.from('entradas_manuais').delete().eq('id', id)
}

export async function salvarDespesa(d: { tenant_id: string; valor: number; descricao: string }) {
  const { data } = await supabase.from('despesas').insert(d).select().single()
  return data as any
}

export async function excluirDespesa(id: string) {
  await supabase.from('despesas').delete().eq('id', id)
}
