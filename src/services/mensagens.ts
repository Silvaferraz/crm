import { supabase } from '@/lib/supabase'
import type { MensagemTemplate, Notificacao } from '@/types'

export async function listarTemplates(tenantId: string) {
  const { data } = await supabase
    .from('mensagem_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('tipo')
  return (data ?? []) as MensagemTemplate[]
}

export async function salvarTemplate(t: Partial<MensagemTemplate> & { tenant_id: string }) {
  if (t.id) {
    const { data } = await supabase
      .from('mensagem_templates')
      .update(t)
      .eq('id', t.id)
      .select()
      .single()
    return data as MensagemTemplate
  }
  const { data } = await supabase
    .from('mensagem_templates')
    .insert(t)
    .select()
    .single()
  return data as MensagemTemplate
}

export async function excluirTemplate(id: string) {
  await supabase.from('mensagem_templates').delete().eq('id', id)
}

export async function listarNotificacoes(tenantId: string, status: string) {
  const { data } = await supabase
    .from('notificacoes')
    .select('*, clientes!inner(nome), agendamentos!left(inicio, profissional_id, profissionais!left(nome))')
    .eq('tenant_id', tenantId)
    .eq('status', status)
    .order('agendado_para', { ascending: status === 'pendente' })
    .limit(50)
  return (data ?? []) as any[]
}

export async function listarTodasNotificacoes(tenantId: string) {
  const { data } = await supabase
    .from('notificacoes')
    .select('*, clientes!inner(nome)')
    .eq('tenant_id', tenantId)
    .order('agendado_para', { ascending: false })
    .limit(100)
  return (data ?? []) as any[]
}

export async function marcarEnviada(id: string) {
  await supabase
    .from('notificacoes')
    .update({ status: 'enviada', enviado_em: new Date().toISOString() })
    .eq('id', id)
}

export async function cancelarNotificacao(id: string) {
  await supabase
    .from('notificacoes')
    .update({ status: 'cancelada' })
    .eq('id', id)
}

export async function gerarFila(tenantId: string) {
  const { data, error } = await supabase.rpc('gerar_fila_notificacoes', { p_tenant_id: tenantId })
  if (error) throw error
  return data as number
}
