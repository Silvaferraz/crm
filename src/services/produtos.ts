import { supabase } from '@/lib/supabase'
import type { Produto } from '@/types'

export async function listarProdutos(tenantId: string) {
  const { data } = await supabase
    .from('produtos')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('nome')
  return (data ?? []) as Produto[]
}

export async function salvarProduto(produto: Partial<Produto> & { tenant_id: string }) {
  if (produto.id) {
    const { data } = await supabase
      .from('produtos')
      .update(produto)
      .eq('id', produto.id)
      .select()
      .single()
    return data as Produto
  }
  const { data } = await supabase
    .from('produtos')
    .insert(produto)
    .select()
    .single()
  return data as Produto
}

export async function excluirProduto(id: string) {
  await supabase.from('produtos').delete().eq('id', id)
}
