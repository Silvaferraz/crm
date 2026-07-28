import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTenant } from '@/contexts/TenantContext'
import { listarProfissionais } from '@/services/profissionais'
import { listarServicos } from '@/services/servicos'
import { listarAgendamentos, obterAgendamento, salvarAgendamento, atualizarStatus, listarHorariosDisponiveis, contarAgendamentosPorDia } from '@/services/agenda'
import { cadastroRapido } from '@/services/clientes'
import type { Profissional, Servico } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export function Agenda() {
  const { tenant } = useTenant()
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth())
  const [diaSelecionado, setDiaSelecionado] = useState(hoje.getDate())
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [filtroProf, setFiltroProf] = useState('')
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [cargaMensal, setCargaMensal] = useState<Record<string, number>>({})
  const [showCriar, setShowCriar] = useState(false)

  const dataSelecionada = useMemo(() =>
    new Date(ano, mes, diaSelecionado), [ano, mes, diaSelecionado])

  const calendario = useMemo(() => {
    const primeiroDia = new Date(ano, mes, 1)
    const ultimoDia = new Date(ano, mes + 1, 0)
    const inicio = new Date(primeiroDia)
    inicio.setDate(inicio.getDate() - inicio.getDay())
    const celulas: { dia: number; outroMes: boolean }[] = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(inicio)
      d.setDate(inicio.getDate() + i)
      celulas.push({ dia: d.getDate(), outroMes: d.getMonth() !== mes })
    }
    return celulas
  }, [ano, mes])

  const carregarAgendamentos = useCallback(async () => {
    if (!tenant) return
    const inicioStr = new Date(Date.UTC(ano, mes, diaSelecionado, 0, 0, 0)).toISOString()
    const fimStr = new Date(Date.UTC(ano, mes, diaSelecionado, 23, 59, 59)).toISOString()
    setAgendamentos(await listarAgendamentos(tenant.id, inicioStr, fimStr, filtroProf || undefined))
  }, [tenant, ano, mes, diaSelecionado, filtroProf])

  useEffect(() => { if (tenant) listarProfissionais(tenant.id).then(setProfissionais) }, [tenant])
  useEffect(() => { carregarAgendamentos() }, [carregarAgendamentos])
  useEffect(() => {
    if (tenant) contarAgendamentosPorDia(tenant.id, ano, mes, filtroProf || undefined).then(setCargaMensal)
  }, [tenant, ano, mes, filtroProf])

  const agendamentosHoje = agendamentos as any[]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-marca">Agenda</h1>
        <button onClick={() => setShowCriar(true)}
          className="bg-marca text-fundo px-4 py-2 rounded-xl font-medium text-sm transition-transform active:scale-[0.975]">
          + Novo
        </button>
      </div>

      {/* Cabeçalho do mês */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => { if (mes === 0) { setAno(a => a - 1); setMes(11) } else setMes(m => m - 1) }}
          className="text-suave hover:text-marca p-2 transition-transform active:scale-[0.975]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span className="text-lg font-semibold text-marca">{MESES[mes]} {ano}</span>
        <button onClick={() => { if (mes === 11) { setAno(a => a + 1); setMes(0) } else setMes(m => m + 1) }}
          className="text-suave hover:text-marca p-2 transition-transform active:scale-[0.975]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      {/* Grid do calendário */}
      <div className="bg-card border border-borda rounded-2xl p-3 mb-4">
        <div className="grid grid-cols-7 mb-1">
          {DIAS_SEMANA.map(d => <div key={d} className="text-center text-xs text-tenue py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {calendario.map((c, i) => {
            const selecionado = c.dia === diaSelecionado && !c.outroMes
            const hojeCell = c.dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear()
            const carga = c.outroMes ? 0 : (cargaMensal[c.dia] ?? 0)

            return (
              <button
                key={i}
                onClick={() => { if (!c.outroMes) setDiaSelecionado(c.dia) }}
                className={`relative py-1.5 text-sm rounded-lg transition-colors active:scale-[0.975] ${
                  selecionado ? 'bg-marca text-fundo font-semibold' :
                  c.outroMes ? 'text-tenue' : 'text-marca hover:bg-elevado'
                }`}
              >
                {c.dia}
                {carga > 0 && !selecionado && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {Array.from({ length: Math.min(carga, 3) }).map((_, j) => (
                      <span key={j} className="w-1 h-1 rounded-full bg-marca" />
                    ))}
                  </span>
                )}
                {hojeCell && !selecionado && (
                  <span className="absolute inset-0 rounded-lg ring-1 ring-borda-forte" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Botão voltar hoje */}
      {(mes !== hoje.getMonth() || ano !== hoje.getFullYear()) && (
        <button onClick={() => { setAno(hoje.getFullYear()); setMes(hoje.getMonth()); setDiaSelecionado(hoje.getDate()) }}
          className="text-sm text-suave hover:text-marca mb-4 transition-colors">
          ← Voltar para hoje
        </button>
      )}

      {/* Filtro por profissional */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        <button onClick={() => setFiltroProf('')}
          className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm transition-colors ${
            !filtroProf ? 'bg-marca text-fundo' : 'bg-elevado text-suave hover:text-marca'
          }`}>
          Todos
        </button>
        {profissionais.map(p => (
          <button key={p.id} onClick={() => setFiltroProf(p.id)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm transition-colors ${
              filtroProf === p.id ? 'bg-marca text-fundo' : 'bg-elevado text-suave hover:text-marca'
            }`}>
            {p.nome}
          </button>
        ))}
      </div>

      {/* Lista de agendamentos do dia */}
      <div className="space-y-2">
        {agendamentosHoje.length === 0 && (
          <div className="border-2 border-dashed border-borda rounded-2xl p-8 text-center">
            <p className="text-suave text-sm">Nenhum agendamento para hoje</p>
          </div>
        )}

        {agendamentosHoje.map((ag: any) => (
          <AgendamentoCard
            key={ag.id}
            agendamento={ag}
            tenantId={tenant?.id}
            onUpdate={carregarAgendamentos}
          />
        ))}
      </div>

      {showCriar && tenant && (
        <CriarAgendamento
          tenantId={tenant.id}
          profissionais={profissionais}
          data={dataSelecionada}
          onClose={() => setShowCriar(false)}
          onCriado={() => { setShowCriar(false); carregarAgendamentos() }}
        />
      )}
    </div>
  )
}

function AgendamentoCard({ agendamento, tenantId, onUpdate }: { agendamento: any; tenantId?: string; onUpdate: () => void }) {
  const [showDetalhe, setShowDetalhe] = useState(false)
  const inicio = new Date(agendamento.inicio)
  const fim = new Date(agendamento.fim)
  const nomesStatus: Record<string, string> = {
    agendado: 'Agendado', confirmado: 'Confirmado', em_atendimento: 'Em atendimento',
    concluido: 'Concluído', cancelado: 'Cancelado', falta: 'Falta',
  }
  const coresStatus: Record<string, string> = {
    agendado: 'bg-suave', confirmado: 'bg-sucesso', em_atendimento: 'bg-alerta',
    concluido: 'bg-sucesso/50', cancelado: 'bg-perigo/50', falta: 'bg-perigo',
  }

  return (
    <>
      <button onClick={() => setShowDetalhe(true)}
        className="w-full bg-card border border-borda rounded-2xl px-4 py-3 text-left hover:bg-elevado transition-colors active:scale-[0.975]">
        <div className="flex items-center gap-3">
          <div className="text-right flex-shrink-0 w-14">
            <p className="text-sm font-medium text-marca tabular-nums">
              {inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xs text-tenue">
              {fim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-marca truncate">
              {agendamento.clientes?.nome ?? 'Anônimo'}
            </p>
            <p className="text-xs text-tenue">{agendamento.profissionais?.nome}</p>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full text-white ${coresStatus[agendamento.status] ?? 'bg-suave'}`}>
            {nomesStatus[agendamento.status] ?? agendamento.status}
          </span>
        </div>
      </button>

      {showDetalhe && tenantId && (
        <DetalheAgendamento
          agendamentoId={agendamento.id}
          tenantId={tenantId}
          onClose={() => setShowDetalhe(false)}
          onUpdate={onUpdate}
        />
      )}
    </>
  )
}

function DetalheAgendamento({ agendamentoId, tenantId, onClose, onUpdate }: { agendamentoId: string; tenantId: string; onClose: () => void; onUpdate: () => void }) {
  const navigate = useNavigate()
  const [ag, setAg] = useState<any>(null)

  useEffect(() => { obterAgendamento(agendamentoId).then(setAg) }, [agendamentoId])

  async function handleStatus(status: string, motivo?: string) {
    await atualizarStatus(agendamentoId, status, motivo)
    setAg(await obterAgendamento(agendamentoId))
    onUpdate()
  }

  if (!ag) return null

  return (
    <Modal open={true} onClose={onClose} title="Detalhe do Agendamento">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-tenue text-xs">Cliente</p><p className="text-marca">{ag.clientes?.nome ?? 'Anônimo'}</p></div>
          <div><p className="text-tenue text-xs">Profissional</p><p className="text-marca">{ag.profissionais?.nome}</p></div>
          <div><p className="text-tenue text-xs">Início</p><p className="text-marca">{new Date(ag.inicio).toLocaleString('pt-BR')}</p></div>
          <div><p className="text-tenue text-xs">Fim</p><p className="text-marca">{new Date(ag.fim).toLocaleString('pt-BR')}</p></div>
          <div><p className="text-tenue text-xs">Status</p><p className="text-marca">{ag.status}</p></div>
          {ag.observacoes && <div className="col-span-2"><p className="text-tenue text-xs">Obs</p><p className="text-marca">{ag.observacoes}</p></div>}
        </div>

        {ag.agendamento_servicos?.length > 0 && (
          <div>
            <p className="text-xs text-tenue mb-1">Serviços</p>
            {ag.agendamento_servicos.map((s: any) => (
              <div key={s.id} className="flex justify-between text-sm text-suave py-1">
                <span>{s.servicos?.nome ?? 'Serviço'}</span>
                <span className="tabular-nums">R$ {Number(s.preco_no_momento).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Ações */}
        <div className="flex flex-wrap gap-2">
          {ag.status !== 'concluido' && ag.status !== 'cancelado' && ag.status !== 'falta' && (
            <>
              {ag.status === 'agendado' && <AcaoStatus cor="bg-sucesso" label="Confirmar" onClick={() => handleStatus('confirmado')} />}
              {ag.status === 'confirmado' && <AcaoStatus cor="bg-alerta" label="Iniciar" onClick={() => handleStatus('em_atendimento')} />}
              {ag.status === 'em_atendimento' && <AcaoStatus cor="bg-sucesso" label="Concluir" onClick={() => handleStatus('concluido')} />}
              <AcaoStatus cor="bg-perigo" label="Cancelar" onClick={() => {
                const motivo = prompt('Motivo do cancelamento:')
                if (motivo !== null) handleStatus('cancelado', motivo || undefined)
              }} />
              <AcaoStatus cor="bg-perigo/50" label="Falta" onClick={() => handleStatus('falta')} />
            </>
          )}
          <button onClick={() => navigate(`/comanda?agendamento=${agendamentoId}`)}
            className="bg-elevado text-marca px-4 py-2 rounded-xl text-sm font-medium transition-transform active:scale-[0.975]">
            Ir para comanda
          </button>
        </div>
      </div>
    </Modal>
  )
}

function AcaoStatus({ cor, label, onClick }: { cor: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`${cor} text-white px-4 py-2 rounded-xl text-sm font-medium transition-transform active:scale-[0.975]`}>
      {label}
    </button>
  )
}

function CriarAgendamento({ tenantId, profissionais, data, onClose, onCriado }: {
  tenantId: string; profissionais: Profissional[]; data: Date; onClose: () => void; onCriado: () => void
}) {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [profissionalId, setProfissionalId] = useState('')
  const [clienteNome, setClienteNome] = useState('')
  const [clienteTel, setClienteTel] = useState('')
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [servicosSelecionados, setServicosSelecionados] = useState<string[]>([])
  const [slots, setSlots] = useState<string[]>([])
  const [slotSelecionado, setSlotSelecionado] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { listarServicos(tenantId).then(setServicos) }, [tenantId])

  const duracaoTotal = useMemo(() => {
    if (servicosSelecionados.length === 0) return 0
    return servicosSelecionados.reduce((acc, id) => {
      const s = servicos.find(sv => sv.id === id)
      return acc + (s?.duracao_min ?? 0)
    }, 0)
  }, [servicosSelecionados, servicos])

  const toggleServico = (id: string) => {
    setServicosSelecionados(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  useEffect(() => {
    if (!profissionalId || servicosSelecionados.length === 0) { setSlots([]); return }
    const dataStr = data.toISOString().slice(0, 10)
    listarHorariosDisponiveis(tenantId, profissionalId, dataStr, duracaoTotal).then(setSlots)
  }, [profissionalId, servicosSelecionados, tenantId, data, duracaoTotal])

  async function handleCriar() {
    if (!profissionalId || servicosSelecionados.length === 0 || !slotSelecionado) return
    setLoading(true)
    setErro('')

    try {
      let cId = clienteId

      if (!cId && clienteNome && clienteTel) {
        const c = await cadastroRapido(tenantId, clienteNome, clienteTel)
        cId = c.id
      }

      const slotFim = new Date(new Date(slotSelecionado).getTime() + duracaoTotal * 60000).toISOString()

      await salvarAgendamento({
        tenant_id: tenantId,
        cliente_id: cId,
        profissional_id: profissionalId,
        inicio: slotSelecionado,
        fim: slotFim,
        observacoes: observacoes || null,
        servicos: servicosSelecionados.map(id => {
          const s = servicos.find(sv => sv.id === id)!
          return { servico_id: id, preco: s.preco, duracao: s.duracao_min }
        }),
      })

      onCriado()
    } catch (e: any) {
      setErro(e.message || 'Erro ao criar agendamento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={true} onClose={onClose} title="Novo Agendamento">
      <div className="space-y-4">
        <div>
          <label className="text-xs text-tenue mb-1 block">Cliente</label>
          <ClienteSearch tenantId={tenantId} onSelect={setClienteId} onNomeChange={setClienteNome} onTelChange={setClienteTel} />
        </div>

        <div>
          <label className="text-xs text-tenue mb-1 block">Profissional</label>
          <select value={profissionalId} onChange={e => setProfissionalId(e.target.value)}
            className="w-full bg-elevado border border-borda rounded-xl px-4 py-2.5 text-marca text-sm outline-none">
            <option value="">Selecione</option>
            {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-tenue mb-1 block">Serviços (toque para selecionar)</label>
          <div className="flex flex-wrap gap-1.5">
            {servicos.map(s => {
              const ativo = servicosSelecionados.includes(s.id)
              return (
                <button key={s.id} onClick={() => toggleServico(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-sm transition-all active:scale-[0.975] ${
                    ativo ? 'bg-marca text-fundo' : 'bg-elevado text-suave hover:text-marca'
                  }`}>
                  {s.nome} {ativo && '✓'}
                </button>
              )
            })}
          </div>
          {duracaoTotal > 0 && (
            <p className="text-xs text-tenue mt-1">Duração total: {duracaoTotal}min</p>
          )}
        </div>

        {slots.length > 0 && (
          <div>
            <label className="text-xs text-tenue mb-1 block">Horário</label>
            <div className="grid grid-cols-4 gap-1.5">
              {slots.map(s => {
                const h = new Date(s).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                return (
                  <button key={s} onClick={() => setSlotSelecionado(s)}
                    className={`text-sm py-2 rounded-xl transition-all active:scale-[0.975] ${
                      slotSelecionado === s ? 'bg-marca text-fundo' : 'bg-elevado text-suave hover:text-marca'
                    }`}>
                    {h}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <input value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Observações"
          className="w-full bg-elevado border border-borda rounded-xl px-4 py-2.5 text-marca text-sm outline-none" />

        {erro && <p className="text-perigo text-sm">{erro}</p>}

        <button onClick={handleCriar} disabled={loading || !slotSelecionado || servicosSelecionados.length === 0}
          className="w-full bg-marca text-fundo rounded-xl py-3 font-medium transition-transform active:scale-[0.975] disabled:opacity-50">
          {loading ? 'Criando...' : 'Agendar'}
        </button>
      </div>
    </Modal>
  )
}

function ClienteSearch({ tenantId, onSelect, onNomeChange, onTelChange }: {
  tenantId: string; onSelect: (id: string | null) => void; onNomeChange: (n: string) => void; onTelChange: (t: string) => void
}) {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState<any[]>([])
  const [selecionado, setSelecionado] = useState<any>(null)
  const [modoRapido, setModoRapido] = useState(false)

  useEffect(() => {
    if (!busca || busca.length < 2 || selecionado) { setResultados([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('clientes')
        .select('id, nome, telefone')
        .eq('tenant_id', tenantId)
        .or(`nome.ilike.%${busca}%,telefone.ilike.%${busca}%`)
        .limit(5)
      setResultados(data ?? [])
    }, 300)
    return () => clearTimeout(timer)
  }, [busca, tenantId, selecionado])

  if (selecionado) {
    return (
      <div className="flex items-center justify-between bg-elevado rounded-xl px-4 py-2.5">
        <span className="text-sm text-marca">{selecionado.nome}</span>
        <button onClick={() => { setSelecionado(null); onSelect(null) }} className="text-tenue text-sm">✕</button>
      </div>
    )
  }

  return (
    <div>
      {!modoRapido ? (
        <div>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar cliente..."
            className="w-full bg-elevado border border-borda rounded-xl px-4 py-2.5 text-marca text-sm outline-none mb-1" />
          {resultados.map((c: any) => (
            <button key={c.id} onClick={() => { setSelecionado(c); onSelect(c.id) }}
              className="w-full text-left px-3 py-2 text-sm text-marca hover:bg-elevado rounded-lg">
              {c.nome} {c.telefone && <span className="text-tenue">— {c.telefone}</span>}
            </button>
          ))}
          <button onClick={() => setModoRapido(true)} className="text-xs text-tenue hover:text-marca mt-1">
            + Cadastro rápido
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input onChange={e => onNomeChange(e.target.value)} placeholder="Nome"
            className="flex-1 bg-elevado border border-borda rounded-xl px-3 py-2 text-sm text-marca outline-none" />
          <input onChange={e => onTelChange(e.target.value)} placeholder="WhatsApp"
            className="flex-1 bg-elevado border border-borda rounded-xl px-3 py-2 text-sm text-marca outline-none" />
          <button onClick={() => setModoRapido(false)} className="text-xs text-tenue">Voltar</button>
        </div>
      )}
    </div>
  )
}
