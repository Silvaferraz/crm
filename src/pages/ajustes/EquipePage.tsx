import { useState, useEffect } from 'react'
import { useTenant } from '@/contexts/TenantContext'
import { listarProfissionais, salvarProfissional, excluirProfissional, listarUsuariosDisponiveis, listarServicosProfissional, salvarOverrideProfissionalServico, excluirOverrideProfissionalServico } from '@/services/profissionais'
import { listarHorarios, salvarHorario, excluirHorario, replicarDia, DIAS_SEMANA } from '@/services/horarios'
import { listarBloqueios, salvarBloqueio, excluirBloqueio } from '@/services/bloqueios'
import { listarServicos } from '@/services/servicos'
import type { Profissional, HorariosTrabalho, BloqueioAgenda, Servico, ProfissionalServico } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'

export function EquipePage() {
  const { tenant } = useTenant()
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [tab, setTab] = useState<'profissionais' | 'horarios' | 'bloqueios'>('profissionais')

  useEffect(() => {
    if (tenant) listarProfissionais(tenant.id).then(setProfissionais)
  }, [tenant])

  return (
    <div>
      <h1 className="text-2xl font-semibold text-marca mb-6">Equipe</h1>

      <div className="flex gap-1 bg-elevado rounded-xl p-1 mb-6 text-sm">
        {(['profissionais', 'horarios', 'bloqueios'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${tab === t ? 'bg-card text-marca' : 'text-tenue'}`}>
            {t === 'profissionais' ? 'Profissionais' : t === 'horarios' ? 'Horários' : 'Bloqueios'}
          </button>
        ))}
      </div>

      {tab === 'profissionais' && <ProfissionaisList tenantId={tenant?.id} profissionais={profissionais} setProfissionais={setProfissionais} />}
      {tab === 'horarios' && <HorariosList tenantId={tenant?.id} profissionais={profissionais} />}
      {tab === 'bloqueios' && <BloqueiosList tenantId={tenant?.id} profissionais={profissionais} />}
    </div>
  )
}

function ProfissionaisList({ tenantId, profissionais, setProfissionais }: { tenantId?: string; profissionais: Profissional[]; setProfissionais: (p: Profissional[]) => void }) {
  const [editando, setEditando] = useState<Partial<Profissional> | null>(null)
  const [excluirId, setExcluirId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [usuarios, setUsuarios] = useState<any[]>([])

  useEffect(() => {
    if (tenantId) listarUsuariosDisponiveis(tenantId).then(setUsuarios)
  }, [tenantId])

  async function handleSalvar() {
    if (!tenantId || !editando) return
    await salvarProfissional({ ...editando, tenant_id: tenantId })
    setShowForm(false)
    setEditando(null)
    setProfissionais(await listarProfissionais(tenantId))
  }

  async function handleExcluir() {
    if (!excluirId || !tenantId) return
    await excluirProfissional(excluirId)
    setExcluirId(null)
    setProfissionais(await listarProfissionais(tenantId))
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => { setEditando({ ativo: true, ordem: profissionais.length + 1, cor: '#6366f1' }); setShowForm(true) }}
          className="bg-marca text-fundo px-4 py-2 rounded-xl font-medium text-sm transition-transform active:scale-[0.975]">
          + Novo
        </button>
      </div>

      <div className="space-y-2">
        {profissionais.length === 0 && <EmptyState title="Nenhum profissional cadastrado" />}
        {profissionais.map(p => (
          <div key={p.id} className="bg-card border border-borda rounded-2xl px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: p.cor }}>
                {p.nome.charAt(0)}
              </div>
              <div>
                <p className="text-marca font-medium">{p.nome} {p.apelido && <span className="text-tenue text-xs">({p.apelido})</span>}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!p.ativo && <span className="text-xs text-perigo-claro bg-perigo/10 px-2 py-0.5 rounded-full">Inativo</span>}
              <button onClick={() => { setEditando(p); setShowForm(true) }} className="text-tenue hover:text-suave p-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              </button>
              <button onClick={() => { setEditando(p); setShowForm(true) }} className="text-tenue hover:text-suave p-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              </button>
              <button onClick={() => setExcluirId(p.id)} className="text-tenue hover:text-perigo p-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
              </button>
              <OverrideButton profissionalId={p.id} tenantId={tenantId} />
            </div>
          </div>
        ))}
      </div>

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditando(null) }} title={editando?.id ? 'Editar Profissional' : 'Novo Profissional'}>
        <div className="space-y-4">
          <Input label="Nome" value={editando?.nome ?? ''} onChange={v => setEditando(p => ({ ...p, nome: v }))} />
          <Input label="Apelido" value={editando?.apelido ?? ''} onChange={v => setEditando(p => ({ ...p, apelido: v }))} />
          <div className="flex gap-4 items-end">
            <Input label="Cor" type="color" value={editando?.cor ?? '#6366f1'} onChange={v => setEditando(p => ({ ...p, cor: v }))} />
            <Input label="Ordem" type="number" value={String(editando?.ordem ?? 0)} onChange={v => setEditando(p => ({ ...p, ordem: Number(v) }))} />
          </div>
          <div>
            <label className="text-xs text-tenue mb-1 block">Vincular usuário</label>
            <select value={editando?.usuario_id ?? ''} onChange={e => setEditando(p => ({ ...p, usuario_id: e.target.value || null }))}
              className="w-full bg-elevado border border-borda rounded-xl px-4 py-2.5 text-marca outline-none focus:border-borda-forte text-sm">
              <option value="">Sem usuário</option>
              {usuarios.map((u: any) => <option key={u.id} value={u.id}>{u.nome} ({u.usuario})</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-suave">
            <input type="checkbox" checked={editando?.ativo ?? true} onChange={e => setEditando(p => ({ ...p, ativo: e.target.checked }))} className="rounded border-borda bg-card" />
            Ativo
          </label>
          <button onClick={handleSalvar} className="w-full bg-marca text-fundo rounded-xl py-3 font-medium transition-transform active:scale-[0.975]">
            Salvar
          </button>
        </div>
      </Modal>

      <ConfirmDialog open={!!excluirId} onClose={() => setExcluirId(null)} onConfirm={handleExcluir} title="Excluir profissional" message="Tem certeza?" />
    </div>
  )
}

function HorariosList({ tenantId, profissionais }: { tenantId?: string; profissionais: Profissional[] }) {
  const [selectedProfId, setSelectedProfId] = useState('')
  const [horarios, setHorarios] = useState<HorariosTrabalho[]>([])
  const [editando, setEditando] = useState<Partial<HorariosTrabalho> | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (tenantId && selectedProfId) listarHorarios(tenantId, selectedProfId).then(setHorarios)
    else setHorarios([])
  }, [tenantId, selectedProfId])

  async function handleSalvar() {
    if (!tenantId || !editando) return
    await salvarHorario({ ...editando, tenant_id: tenantId, profissional_id: selectedProfId })
    setShowForm(false)
    setEditando(null)
    if (tenantId) setHorarios(await listarHorarios(tenantId, selectedProfId))
  }

  async function handleExcluir(id: string) {
    await excluirHorario(id)
    if (tenantId) setHorarios(await listarHorarios(tenantId, selectedProfId))
  }

  async function handleReplicar(origem: number) {
    if (!tenantId) return
    const destinos = [0, 1, 2, 3, 4, 5, 6].filter(d => d !== origem)
    await replicarDia(tenantId, selectedProfId, origem, destinos)
    setHorarios(await listarHorarios(tenantId, selectedProfId))
  }

  const horariosPorDia = new Map<number, HorariosTrabalho[]>()
  horarios.forEach(h => {
    const arr = horariosPorDia.get(h.dia_semana) ?? []
    arr.push(h)
    horariosPorDia.set(h.dia_semana, arr)
  })

  return (
    <div>
      <select value={selectedProfId} onChange={e => setSelectedProfId(e.target.value)}
        className="w-full bg-card border border-borda rounded-xl px-4 py-3 text-marca outline-none focus:border-borda-forte mb-6 text-sm">
        <option value="">Selecione um profissional</option>
        {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
      </select>

      {selectedProfId && (
        <div>
          <button onClick={() => { setEditando({ dia_semana: 1, hora_inicio: '09:00', hora_fim: '18:00' }); setShowForm(true) }}
            className="bg-marca text-fundo px-4 py-2 rounded-xl font-medium text-sm mb-4 transition-transform active:scale-[0.975]">
            + Novo Horário
          </button>

          {[0, 1, 2, 3, 4, 5, 6].map(dia => {
            const h = horariosPorDia.get(dia) ?? []
            return (
              <div key={dia} className="mb-4 bg-card border border-borda rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-marca">{DIAS_SEMANA[dia]}</span>
                  {h.length > 0 && (
                    <button onClick={() => handleReplicar(dia)} className="text-xs text-suave hover:text-marca transition-colors">
                      Replicar para outros dias
                    </button>
                  )}
                </div>
                {h.length === 0 && <p className="text-tenue text-xs">Sem horários</p>}
                {h.map(hor => (
                  <div key={hor.id} className="flex items-center justify-between py-1">
                    <span className="text-sm text-suave">{hor.hora_inicio.slice(0, 5)} — {hor.hora_fim.slice(0, 5)}</span>
                    <button onClick={() => handleExcluir(hor.id)} className="text-tenue hover:text-perigo p-1">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditando(null) }} title="Novo Horário">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-tenue mb-1 block">Dia da semana</label>
            <select value={editando?.dia_semana ?? 1} onChange={e => setEditando(p => ({ ...p, dia_semana: Number(e.target.value) }))}
              className="w-full bg-elevado border border-borda rounded-xl px-4 py-2.5 text-marca outline-none focus:border-borda-forte text-sm">
              {DIAS_SEMANA.map((nome, i) => <option key={i} value={i}>{nome}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Início" type="time" value={editando?.hora_inicio ?? '09:00'} onChange={v => setEditando(p => ({ ...p, hora_inicio: v }))} />
            <Input label="Fim" type="time" value={editando?.hora_fim ?? '18:00'} onChange={v => setEditando(p => ({ ...p, hora_fim: v }))} />
          </div>
          <button onClick={handleSalvar} className="w-full bg-marca text-fundo rounded-xl py-3 font-medium transition-transform active:scale-[0.975]">
            Salvar
          </button>
        </div>
      </Modal>
    </div>
  )
}

function BloqueiosList({ tenantId, profissionais }: { tenantId?: string; profissionais: Profissional[] }) {
  const [bloqueios, setBloqueios] = useState<BloqueioAgenda[]>([])
  const [filtroProf, setFiltroProf] = useState('')
  const [editando, setEditando] = useState<Partial<BloqueioAgenda> | null>(null)
  const [excluirId, setExcluirId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (tenantId) listarBloqueios(tenantId, filtroProf || undefined).then(setBloqueios)
  }, [tenantId, filtroProf])

  async function handleSalvar() {
    if (!tenantId || !editando) return
    await salvarBloqueio({ ...editando, tenant_id: tenantId })
    setShowForm(false)
    setEditando(null)
    setBloqueios(await listarBloqueios(tenantId, filtroProf || undefined))
  }

  async function handleExcluir() {
    if (!excluirId) return
    await excluirBloqueio(excluirId)
    setExcluirId(null)
    if (tenantId) setBloqueios(await listarBloqueios(tenantId, filtroProf || undefined))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <select value={filtroProf} onChange={e => setFiltroProf(e.target.value)}
          className="bg-card border border-borda rounded-xl px-4 py-2 text-marca outline-none text-sm flex-1 mr-3">
          <option value="">Todos os profissionais</option>
          <option value="__global__">Estabelecimento (todos)</option>
          {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
        <button onClick={() => { setEditando({ tipo: 'folga', inicio: new Date().toISOString().slice(0, 16), fim: new Date().toISOString().slice(0, 16) }); setShowForm(true) }}
          className="bg-marca text-fundo px-4 py-2 rounded-xl font-medium text-sm transition-transform active:scale-[0.975]">
          + Novo
        </button>
      </div>

      <div className="space-y-2">
        {bloqueios.length === 0 && <EmptyState title="Nenhum bloqueio cadastrado" />}
        {bloqueios.map(b => {
          const prof = profissionais.find(p => p.id === b.profissional_id)
          return (
            <div key={b.id} className="bg-card border border-borda rounded-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-marca font-medium">{b.motivo || b.tipo}</p>
                <p className="text-tenue text-xs">
                  {new Date(b.inicio).toLocaleDateString('pt-BR')} — {new Date(b.fim).toLocaleDateString('pt-BR')}
                  {prof ? ` · ${prof.nome}` : b.profissional_id === null ? ' · Estabelecimento' : ''}
                </p>
              </div>
              <button onClick={() => setExcluirId(b.id)} className="text-tenue hover:text-perigo p-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
              </button>
            </div>
          )
        })}
      </div>

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditando(null) }} title="Novo Bloqueio">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-tenue mb-1 block">Tipo</label>
            <select value={editando?.tipo ?? 'folga'} onChange={e => setEditando(p => ({ ...p, tipo: e.target.value as any }))}
              className="w-full bg-elevado border border-borda rounded-xl px-4 py-2.5 text-marca outline-none focus:border-borda-forte text-sm">
              <option value="folga">Folga</option>
              <option value="feriado">Feriado</option>
              <option value="pessoal">Pessoal</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-tenue mb-1 block">Profissional (opcional)</label>
            <select value={editando?.profissional_id ?? ''} onChange={e => setEditando(p => ({ ...p, profissional_id: e.target.value || null }))}
              className="w-full bg-elevado border border-borda rounded-xl px-4 py-2.5 text-marca outline-none focus:border-borda-forte text-sm">
              <option value="">Estabelecimento inteiro</option>
              {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <Input label="Início" type="datetime-local" value={editando?.inicio?.slice(0, 16) ?? ''} onChange={v => setEditando(p => ({ ...p, inicio: v }))} />
          <Input label="Fim" type="datetime-local" value={editando?.fim?.slice(0, 16) ?? ''} onChange={v => setEditando(p => ({ ...p, fim: v }))} />
          <Input label="Motivo" value={editando?.motivo ?? ''} onChange={v => setEditando(p => ({ ...p, motivo: v }))} />
          <button onClick={handleSalvar} className="w-full bg-marca text-fundo rounded-xl py-3 font-medium transition-transform active:scale-[0.975]">
            Salvar
          </button>
        </div>
      </Modal>

      <ConfirmDialog open={!!excluirId} onClose={() => setExcluirId(null)} onConfirm={handleExcluir} title="Excluir bloqueio" message="Tem certeza?" />
    </div>
  )
}

function OverrideButton({ profissionalId, tenantId }: { profissionalId: string; tenantId?: string }) {
  const [show, setShow] = useState(false)
  const [overrides, setOverrides] = useState<(ProfissionalServico & { servicos: { nome: string } })[]>([])
  const [servicos, setServicos] = useState<Servico[]>([])
  const [editando, setEditando] = useState<Partial<ProfissionalServico> | null>(null)

  useEffect(() => {
    if (!show || !tenantId) return
    listarServicosProfissional(tenantId, profissionalId).then(setOverrides)
    listarServicos(tenantId).then(setServicos)
  }, [show, tenantId, profissionalId])

  async function handleSalvar() {
    if (!tenantId || !editando) return
    await salvarOverrideProfissionalServico({ ...editando, tenant_id: tenantId, profissional_id: profissionalId })
    setEditando(null)
    setOverrides(await listarServicosProfissional(tenantId, profissionalId))
  }

  async function handleExcluir(id: string) {
    if (!tenantId) return
    await excluirOverrideProfissionalServico(id)
    setOverrides(await listarServicosProfissional(tenantId, profissionalId))
  }

  const overridenServicoIds = new Set(overrides.map(o => o.servico_id))
  const servicosSemOverride = servicos.filter(s => !overridenServicoIds.has(s.id))

  return (
    <>
      <button onClick={() => setShow(true)} className="text-xs text-suave hover:text-marca px-2 py-1 transition-colors">
        Preços
      </button>
      <Modal open={show} onClose={() => setShow(false)} title="Overrides de Preço/Duração">
        <div className="space-y-3">
          {overrides.map(o => (
            <div key={o.id} className="flex items-center justify-between bg-elevado rounded-xl px-4 py-3">
              <div>
                <p className="text-sm text-marca">{o.servicos.nome}</p>
                <p className="text-xs text-tenue">R$ {o.preco?.toFixed(2) ?? '—'} · {o.duracao_min ? `${o.duracao_min}min` : '—'}</p>
              </div>
              <button onClick={() => handleExcluir(o.id)} className="text-tenue hover:text-perigo p-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          ))}
          {overrides.length === 0 && <p className="text-tenue text-sm text-center">Nenhum override configurado</p>}

          <div className="border-t border-borda pt-3">
            {editando ? (
              <div className="space-y-2">
                <select value={editando.servico_id ?? ''} onChange={e => setEditando(p => ({ ...p, servico_id: e.target.value }))}
                  className="w-full bg-elevado border border-borda rounded-xl px-3 py-2 text-marca text-sm">
                  <option value="">Selecione</option>
                  {servicosSemOverride.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Preço" type="number" value={String(editando.preco ?? '')} onChange={v => setEditando(p => ({ ...p, preco: Number(v) || null }))} />
                  <Input label="Duração (min)" type="number" value={String(editando.duracao_min ?? '')} onChange={v => setEditando(p => ({ ...p, duracao_min: Number(v) || null }))} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditando(null)} className="flex-1 bg-elevado text-marca rounded-xl py-2 text-sm">Cancelar</button>
                  <button onClick={handleSalvar} className="flex-1 bg-marca text-fundo rounded-xl py-2 text-sm">Salvar</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setEditando({})} className="text-sm text-suave hover:text-marca transition-colors">
                + Adicionar override
              </button>
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs text-tenue mb-1 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-elevado border border-borda rounded-xl px-4 py-2.5 text-marca placeholder-suave outline-none focus:border-borda-forte transition-colors text-sm" />
    </div>
  )
}
