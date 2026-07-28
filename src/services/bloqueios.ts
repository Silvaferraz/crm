import { supabase } from '@/lib/supabase'
import type { BloqueioAgenda } from '@/types'

export async function listarBloqueios(tenantId: string, profissionalId?: string) {
  let query = supabase
    .from('bloqueios_agenda')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('inicio', { ascending: false })

  if (profissionalId) {
    query = query.eq('profissional_id', profissionalId)
  }

  const { data } = await query
  return (data ?? []) as BloqueioAgenda[]
}

export async function salvarBloqueio(b: Partial<BloqueioAgenda> & { tenant_id: string }) {
  if (b.id) {
    await supabase.from('bloqueios_agenda').update(b).eq('id', b.id)
    return
  }
  await supabase.from('bloqueios_agenda').insert(b)
}

export async function excluirBloqueio(id: string) {
  await supabase.from('bloqueios_agenda').delete().eq('id', id)
}
