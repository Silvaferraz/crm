import { supabase } from '@/lib/supabase'
import type { Pagamento } from '@/types'

export async function listarProdutos(tenantId: string) {
  const { data } = await supabase
    .from('produtos')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('ativo', true)
    .order('nome')
  return data ?? []
}

export async function listarIntegracoes(tenantId: string) {
  const { data } = await supabase
    .from('tenant_integracoes')
    .select('*')
    .eq('tenant_id', tenantId)
    .single()
  return data as any
}

export async function registrarPagamento(p: {
  tenant_id: string
  cliente_id?: string | null
  agendamento_id?: string | null
  valor_total: number
  forma_pagamento: string
  profissional_id?: string | null
  servicos?: { servico_id: string; preco: number }[]
  produtos?: { produto_id: string; preco: number }[]
}) {
  const { data, error } = await supabase.rpc('registrar_pagamento', {
    p_tenant_id: p.tenant_id,
    p_cliente_id: p.cliente_id ?? null,
    p_agendamento_id: p.agendamento_id ?? null,
    p_valor_total: p.valor_total,
    p_forma_pagamento: p.forma_pagamento,
    p_profissional_id: p.profissional_id ?? null,
    p_servicos: p.servicos?.length ? JSON.stringify(p.servicos) : null,
    p_produtos: p.produtos?.length ? JSON.stringify(p.produtos) : null,
  })

  if (error) throw new Error(error.message)
  return data as any
}

export async function confirmarPix(pagamentoId: string) {
  const { data, error } = await supabase.rpc('confirmar_pix', {
    p_pagamento_id: pagamentoId,
    p_tenant_id: undefined
  })

  if (error) throw new Error(error.message)
  return data
}
