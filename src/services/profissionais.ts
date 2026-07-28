import { supabase } from '@/lib/supabase'
import type { Profissional, ProfissionalServico } from '@/types'

export async function listarProfissionais(tenantId: string) {
  const { data } = await supabase
    .from('profissionais')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('ordem')
  return (data ?? []) as Profissional[]
}

export async function salvarProfissional(p: Partial<Profissional> & { tenant_id: string }) {
  if (p.id) {
    const { data } = await supabase
      .from('profissionais')
      .update(p)
      .eq('id', p.id)
      .select()
      .single()
    return data as Profissional
  }
  const { data } = await supabase
    .from('profissionais')
    .insert(p)
    .select()
    .single()
  return data as Profissional
}

export async function excluirProfissional(id: string) {
  await supabase.from('profissionais').delete().eq('id', id)
}

export async function listarUsuariosDisponiveis(tenantId: string) {
  const { data } = await supabase
    .from('usuarios')
    .select('id, nome, usuario')
    .eq('tenant_id', tenantId)
  return data ?? []
}

export async function listarServicosProfissional(tenantId: string, profissionalId: string) {
  const { data } = await supabase
    .from('profissional_servico')
    .select('*, servicos!inner(*)')
    .eq('tenant_id', tenantId)
    .eq('profissional_id', profissionalId)
  return (data ?? []) as (ProfissionalServico & { servicos: { nome: string } })[]
}

export async function salvarOverrideProfissionalServico(override: Partial<ProfissionalServico> & { tenant_id: string }) {
  if (override.id) {
    await supabase.from('profissional_servico').update(override).eq('id', override.id)
    return
  }
  await supabase.from('profissional_servico').insert(override)
}

export async function excluirOverrideProfissionalServico(id: string) {
  await supabase.from('profissional_servico').delete().eq('id', id)
}
