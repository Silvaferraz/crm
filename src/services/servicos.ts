import { supabase } from '@/lib/supabase'
import type { Servico } from '@/types'

export async function listarServicos(tenantId: string) {
  const { data } = await supabase
    .from('servicos')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('nome')
  return (data ?? []) as Servico[]
}

export async function salvarServico(servico: Partial<Servico> & { tenant_id: string }) {
  if (servico.id) {
    const { data } = await supabase
      .from('servicos')
      .update(servico)
      .eq('id', servico.id)
      .select()
      .single()
    return data as Servico
  }
  const { data } = await supabase
    .from('servicos')
    .insert(servico)
    .select()
    .single()
  return data as Servico
}

export async function excluirServico(id: string) {
  await supabase.from('servicos').delete().eq('id', id)
}

export async function semearServicos(tenantId: string, servicos: { nome: string; preco: number; duracao_min: number }[]) {
  const existentes = await listarServicos(tenantId)
  const novos = servicos.filter(s => !existentes.some(e => e.nome === s.nome))
  if (novos.length === 0) return 0
  const { data } = await supabase
    .from('servicos')
    .insert(novos.map(s => ({ ...s, tenant_id: tenantId, cor: null, intervalo_pos_min: 0 })))
    .select()
  return (data ?? []).length
}
