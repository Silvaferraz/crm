import { supabase } from '@/lib/supabase'
import type { Agendamento, AgendamentoServico, Profissional, HorariosTrabalho, BloqueioAgenda, Servico } from '@/types'

export async function contarAgendamentosPorDia(tenantId: string, ano: number, mes: number, profissionalId?: string) {
  const inicio = new Date(Date.UTC(ano, mes, 1, 0, 0, 0)).toISOString()
  const fim = new Date(Date.UTC(ano, mes + 1, 1, 0, 0, 0)).toISOString()
  let query = supabase
    .from('agendamentos')
    .select('inicio')
    .eq('tenant_id', tenantId)
    .not('status', 'in', '("cancelado","falta")')
    .gte('inicio', inicio)
    .lt('inicio', fim)
  if (profissionalId) query = query.eq('profissional_id', profissionalId)
  const { data } = await query
  const map: Record<string, number> = {}
  if (data) {
    for (const a of data) {
      const dia = new Date(a.inicio).getUTCDate()
      map[dia] = (map[dia] ?? 0) + 1
    }
  }
  return map
}

export async function listarAgendamentos(tenantId: string, inicio: string, fim: string, profissionalId?: string) {
  let query = supabase
    .from('agendamentos')
    .select('*, clientes!left(nome, telefone), profissionais!left(nome, cor)')
    .eq('tenant_id', tenantId)
    .gte('inicio', inicio)
    .lt('inicio', fim)

  if (profissionalId) query = query.eq('profissional_id', profissionalId)

  const { data } = await query.order('inicio')
  return data ?? []
}

export async function obterAgendamento(id: string) {
  const { data } = await supabase
    .from('agendamentos')
    .select('*, clientes!left(*), profissionais!left(*), agendamento_servicos(*, servicos!left(nome))')
    .eq('id', id)
    .single()
  return data as any
}

export async function salvarAgendamento(a: {
  tenant_id: string
  cliente_id?: string | null
  profissional_id: string
  inicio: string
  fim: string
  status?: string
  origem?: string
  observacoes?: string | null
  servicos?: { servico_id: string; preco: number; duracao: number }[]
}) {
  const { servicos, ...dados } = a

  const { data, error } = await supabase.rpc('criar_agendamento', {
    p_tenant_id: dados.tenant_id,
    p_cliente_id: dados.cliente_id ?? null,
    p_profissional_id: dados.profissional_id,
    p_inicio: dados.inicio,
    p_fim: dados.fim,
    p_observacoes: dados.observacoes ?? null,
    p_servicos: servicos ? JSON.stringify(servicos) : null,
  })

  if (error) throw new Error(error.message)
  return data
}

export async function atualizarStatus(id: string, status: string, motivo?: string) {
  const update: any = { status }
  if (status === 'cancelado') {
    update.cancelado_em = new Date().toISOString()
    update.cancelado_motivo = motivo ?? null
  }
  await supabase.from('agendamentos').update(update).eq('id', id)
}

export async function listarHorariosDisponiveis(
  tenantId: string,
  profissionalId: string,
  data: string,
  duracaoMin: number
): Promise<string[]> {
  const dataInicio = `${data}T00:00:00Z`
  const dataFim = `${data}T23:59:59Z`

  const [horarios, bloqueios, agendamentos] = await Promise.all([
    supabase.from('horarios_trabalho')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('profissional_id', profissionalId)
      .eq('dia_semana', new Date(data).getDay()),
    supabase.from('bloqueios_agenda')
      .select('*')
      .eq('tenant_id', tenantId)
      .or(`profissional_id.eq.${profissionalId},profissional_id.is.null`)
      .lte('inicio', dataFim)
      .gte('fim', dataInicio),
    supabase.from('agendamentos')
      .select('inicio, fim')
      .eq('tenant_id', tenantId)
      .eq('profissional_id', profissionalId)
      .not('status', 'in', '("cancelado","falta")')
      .gte('inicio', dataInicio)
      .lt('inicio', dataFim),
  ])

  const h = (horarios.data ?? []) as HorariosTrabalho[]
  const b = (bloqueios.data ?? []) as BloqueioAgenda[]
  const a = (agendamentos.data ?? []) as { inicio: string; fim: string }[]

  if (h.length === 0) return []

  const slots: string[] = []
  for (const faixa of h) {
    const inicioMin = toMinutos(faixa.hora_inicio)
    const fimMin = toMinutos(faixa.hora_fim)
    for (let m = inicioMin; m + duracaoMin <= fimMin; m += 15) {
      const slotInicio = `${data}T${pad(m / 60)}:${pad(m % 60)}:00Z`
      const slotFim = `${data}T${pad((m + duracaoMin) / 60)}:${pad((m + duracaoMin) % 60)}:00Z`

      const conflitaBloqueio = b.some(bl =>
        slotInicio < bl.fim && slotFim > bl.inicio
      )
      if (conflitaBloqueio) continue

      const conflitaAgendamento = a.some(ag =>
        slotInicio < ag.fim && slotFim > ag.inicio
      )
      if (conflitaAgendamento) continue

      slots.push(slotInicio)
    }
  }

  return slots
}

function toMinutos(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function pad(n: number) {
  return String(Math.floor(n)).padStart(2, '0')
}
