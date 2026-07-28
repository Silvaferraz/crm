import { supabase } from '@/lib/supabase'
import type { Cliente, ClienteNota, Tag } from '@/types'

export async function listarClientes(tenantId: string, busca?: string) {
  let query = supabase
    .from('clientes')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('nome')

  if (busca) {
    query = query.or(`nome.ilike.%${busca}%,telefone.ilike.%${busca}%`)
  }

  const { data } = await query
  return (data ?? []) as Cliente[]
}

export async function salvarCliente(c: Partial<Cliente> & { tenant_id: string }) {
  if (c.id) {
    const { data } = await supabase
      .from('clientes')
      .update(c)
      .eq('id', c.id)
      .select()
      .single()
    return data as Cliente
  }
  const { data } = await supabase
    .from('clientes')
    .insert(c)
    .select()
    .single()
  return data as Cliente
}

export async function cadastroRapido(tenantId: string, nome: string, telefone: string) {
  const e164 = telefone.replace(/\D/g, '')
  const { data } = await supabase
    .from('clientes')
    .insert({ tenant_id: tenantId, nome, telefone, telefone_e164: e164 })
    .select()
    .single()
  return data as Cliente
}

export async function obterCliente(id: string) {
  const { data } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single()
  return data as Cliente | null
}

export async function listarNotas(tenantId: string, clienteId: string) {
  const { data } = await supabase
    .from('cliente_notas')
    .select('*, usuarios!inner(nome)')
    .eq('tenant_id', tenantId)
    .eq('cliente_id', clienteId)
    .order('fixada', { ascending: false })
    .order('created_at', { ascending: false })
  return (data ?? []) as (ClienteNota & { usuarios: { nome: string } })[]
}

export async function salvarNota(n: Partial<ClienteNota> & { tenant_id: string }) {
  if (n.id) {
    await supabase.from('cliente_notas').update(n).eq('id', n.id)
    return
  }
  await supabase.from('cliente_notas').insert(n)
}

export async function excluirNota(id: string) {
  await supabase.from('cliente_notas').delete().eq('id', id)
}

export async function listarTagsDoCliente(tenantId: string, clienteId: string) {
  const { data } = await supabase
    .from('cliente_tag')
    .select('tag_id, tags!inner(*)')
    .eq('tenant_id', tenantId)
    .eq('cliente_id', clienteId)
  return (data ?? []).map((d: any) => d.tags as Tag)
}

export async function vincularTag(tenantId: string, clienteId: string, tagId: string) {
  await supabase
    .from('cliente_tag')
    .insert({ tenant_id: tenantId, cliente_id: clienteId, tag_id: tagId })
}

export async function desvincularTag(clienteId: string, tagId: string) {
  await supabase
    .from('cliente_tag')
    .delete()
    .eq('cliente_id', clienteId)
    .eq('tag_id', tagId)
}
