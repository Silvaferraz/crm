import { supabase } from '@/lib/supabase'
import type { HorariosTrabalho } from '@/types'

const DIAS_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

export { DIAS_SEMANA }

export async function listarHorarios(tenantId: string, profissionalId: string) {
  const { data } = await supabase
    .from('horarios_trabalho')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('profissional_id', profissionalId)
    .order('dia_semana')
    .order('hora_inicio')
  return (data ?? []) as HorariosTrabalho[]
}

export async function salvarHorario(h: Partial<HorariosTrabalho> & { tenant_id: string }) {
  if (h.id) {
    await supabase.from('horarios_trabalho').update(h).eq('id', h.id)
    return
  }
  await supabase.from('horarios_trabalho').insert(h)
}

export async function excluirHorario(id: string) {
  await supabase.from('horarios_trabalho').delete().eq('id', id)
}

export async function replicarDia(tenantId: string, profissionalId: string, origem: number, destinos: number[]) {
  const { data: horarios } = await supabase
    .from('horarios_trabalho')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('profissional_id', profissionalId)
    .eq('dia_semana', origem)

  if (!horarios?.length) return

  const inserts = destinos.flatMap(dia =>
    horarios.map(h => ({
      tenant_id: tenantId,
      profissional_id: profissionalId,
      dia_semana: dia,
      hora_inicio: h.hora_inicio,
      hora_fim: h.hora_fim,
      vigencia_inicio: h.vigencia_inicio,
      vigencia_fim: h.vigencia_fim,
    }))
  )

  await supabase.from('horarios_trabalho').insert(inserts)
}
