import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTenant } from '@/contexts/TenantContext'
import { useAuth } from '@/contexts/AuthContext'
import { resumoFinanceiro, listarPagamentos, listarEntradasManuais, listarDespesas, salvarEntradaManual, excluirEntradaManual, salvarDespesa, excluirDespesa } from '@/services/financeiro'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

type Periodo = 'dia' | 'semana' | 'mes' | 'mes_fechado'

function periodoRange(periodo: Periodo, data: Date): { inicio: Date; fim: Date } {
  if (periodo === 'dia') {
    return { inicio: new Date(data.getFullYear(), data.getMonth(), data.getDate()), fim: new Date(data.getFullYear(), data.getMonth(), data.getDate() + 1) }
  }
  if (periodo === 'semana') {
    const d = new Date(data); const day = d.getDay(); d.setDate(d.getDate() - day)
    const fim = new Date(d); fim.setDate(fim.getDate() + 7)
    return { inicio: d, fim }
  }
  if (periodo === 'mes_fechado') {
    return { inicio: new Date(data.getFullYear(), data.getMonth(), data.getDate()), fim: new Date(data.getFullYear(), data.getMonth(), data.getDate() + 1) }
  }
  return { inicio: new Date(data.getFullYear(), data.getMonth(), 1), fim: new Date(data.getFullYear(), data.getMonth() + 1, 1) }
}

export function Caixa() {
  const { tenant } = useTenant()
  const { user } = useAuth()
  const [periodo, setPeriodo] = useState<Periodo>('dia')
  const [dataRef, setDataRef] = useState(new Date())
  const [resumo, setResumo] = useState<any>(null)
  const [pagamentos, setPagamentos] = useState<any[]>([])
  const [entradas, setEntradas] = useState<any[]>([])
  const [despesas, setDespesas] = useState<any[]>([])
  const [abaDetalhe, setAbaDetalhe] = useState<'vendas' | 'lancamentos'>('vendas')
  const [showLancamento, setShowLancamento] = useState<'entrada' | 'despesa' | null>(null)
  const [excluirId, setExcluirId] = useState<string | null>(null)
  const [excluirTipo, setExcluirTipo] = useState<'entrada' | 'despesa' | ''>('')
  const [formLancamento, setFormLancamento] = useState({ descricao: '', valor: '' })
  const [loadingLancamento, setLoadingLancamento] = useState(false)

  const range = useMemo(() => periodoRange(periodo, dataRef), [periodo, dataRef])

  const carregar = useCallback(async () => {
    if (!tenant) return
    const ini = range.inicio.toISOString()
    const fim = range.fim.toISOString()
    try {
      const [r, p, e, d] = await Promise.all([
        resumoFinanceiro(tenant.id, ini, fim),
        listarPagamentos(tenant.id, ini, fim),
        listarEntradasManuais(tenant.id, ini, fim),
        listarDespesas(tenant.id, ini, fim),
      ])
      setResumo(r); setPagamentos(p); setEntradas(e); setDespesas(d)
    } catch { /* ignore */ }
  }, [tenant, range])

  useEffect(() => { carregar() }, [carregar])

  async function handleSalvarLancamento() {
    if (!tenant || !formLancamento.descricao || !formLancamento.valor) return
    setLoadingLancamento(true)
    const valor = Math.abs(Number(formLancamento.valor))
    try {
      if (showLancamento === 'entrada') await salvarEntradaManual({ tenant_id: tenant.id, valor, descricao: formLancamento.descricao })
      else await salvarDespesa({ tenant_id: tenant.id, valor, descricao: formLancamento.descricao })
      setShowLancamento(null)
      setFormLancamento({ descricao: '', valor: '' })
      carregar()
    } finally { setLoadingLancamento(false) }
  }

  async function handleExcluirLancamento() {
    if (!excluirId) return
    try {
      if (excluirTipo === 'entrada') await excluirEntradaManual(excluirId)
      else await excluirDespesa(excluirId)
      carregar()
    } finally { setExcluirId(null); setExcluirTipo('') }
  }

  const maxBar = useMemo(() => {
    if (!resumo?.serie_diaria?.length) return 0
    return Math.max(...resumo.serie_diaria.map((s: any) => s.total), 1)
  }, [resumo])

  const labelPeriodo = periodo === 'dia' ? dataRef.toLocaleDateString('pt-BR') :
    periodo === 'semana' ? `${range.inicio.toLocaleDateString('pt-BR')} — ${new Date(range.fim.getTime() - 86400000).toLocaleDateString('pt-BR')}` :
    periodo === 'mes' ? dataRef.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) :
    dataRef.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  if (user?.papel !== 'owner' && user?.papel !== 'admin') {
    return (
      <div className="border-2 border-dashed border-borda rounded-2xl p-12 text-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-tenue mx-auto mb-3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        <p className="text-suave font-medium mb-1">Acesso restrito</p>
        <p className="text-tenue text-sm">Apenas proprietários e administradores podem acessar o financeiro.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-marca">Caixa</h1>
        <button onClick={() => {
          const ini = range.inicio.toISOString()
          const fim = range.fim.toISOString()
          const nome = encodeURIComponent(tenant?.nome ?? '')
          const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/relatorio-pdf?tenant_id=${tenant?.id}&inicio=${ini}&fim=${fim}&nome=${nome}`
          window.open(url, '_blank')
        }} className="bg-elevado text-suave hover:text-marca px-3 py-1.5 rounded-xl text-sm transition-colors">
          Exportar PDF
        </button>
      </div>

      {/* Abas de período */}
      <div className="flex gap-1 bg-elevado rounded-xl p-1 mb-5 text-sm overflow-x-auto scrollbar-none">
        {(['dia', 'semana', 'mes', 'mes_fechado'] as Periodo[]).map(p => (
          <button key={p} onClick={() => { setPeriodo(p); setDataRef(new Date()) }}
            className={`whitespace-nowrap flex-1 py-2 rounded-lg font-medium transition-colors ${periodo === p ? 'bg-card text-marca' : 'text-tenue'}`}>
            {p === 'dia' ? 'Dia' : p === 'semana' ? 'Semana' : p === 'mes' ? 'Mês' : 'Mês Fechado'}
          </button>
        ))}
      </div>

      {/* Navegação período */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => {
          const d = new Date(dataRef)
          if (periodo === 'dia') d.setDate(d.getDate() - 1)
          else if (periodo === 'semana') d.setDate(d.getDate() - 7)
          else d.setMonth(d.getMonth() - 1)
          setDataRef(d)
        }} className="text-suave hover:text-marca p-2 transition-transform active:scale-[0.975]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span className="text-sm font-medium text-marca capitalize">{labelPeriodo}</span>
        <button onClick={() => {
          const d = new Date(dataRef)
          if (periodo === 'dia') d.setDate(d.getDate() + 1)
          else if (periodo === 'semana') d.setDate(d.getDate() + 7)
          else d.setMonth(d.getMonth() + 1)
          setDataRef(d)
        }} className="text-suave hover:text-marca p-2 transition-transform active:scale-[0.975]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      {resumo && (
        <>
          {/* Cartões de resumo */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <Card valor={resumo.total_vendas} label="Vendas" cor="text-marca" />
            <Card valor={resumo.qtd_atendimentos} label="Atendimentos" cor="text-marca" prefixo="" />
            <Card valor={resumo.ticket_medio} label="Ticket médio" cor="text-marca" />
            <Card valor={resumo.saldo} label="Saldo" cor={resumo.saldo >= 0 ? 'text-sucesso' : 'text-perigo'} />
          </div>

          {resumo.pix_pendente > 0 && (
            <div className="bg-alerta/10 border border-alerta/30 rounded-2xl px-4 py-3 mb-5 flex items-center justify-between">
              <span className="text-sm text-alerta font-medium">Pix pendente</span>
              <span className="text-sm text-alerta font-semibold tabular-nums">R$ {Number(resumo.pix_pendente).toFixed(2)}</span>
            </div>
          )}

          {/* Por forma de pagamento */}
          <div className="bg-card border border-borda rounded-2xl p-4 mb-5">
            <h3 className="text-xs text-tenue mb-3 uppercase tracking-wide">Por forma</h3>
            <div className="space-y-2">
              {['dinheiro', 'maquininha', 'pix'].map(forma => {
                const item = resumo.por_forma?.find((f: any) => f.forma === forma)
                return (
                  <div key={forma} className="flex items-center justify-between text-sm">
                    <span className="text-suave">{forma === 'dinheiro' ? 'Dinheiro' : forma === 'maquininha' ? 'Maquininha' : 'Pix'}</span>
                    <span className="tabular-nums font-medium text-marca">R$ {item ? Number(item.total).toFixed(2) : '0,00'}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Gráfico de barras (série diária) */}
          {resumo.serie_diaria?.length > 1 && (
            <div className="bg-card border border-borda rounded-2xl p-4 mb-5">
              <h3 className="text-xs text-tenue mb-3 uppercase tracking-wide">Série diária</h3>
              <div className="flex items-end gap-1.5 h-24">
                {resumo.serie_diaria.map((s: any) => (
                  <div key={s.dia} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-tenue tabular-nums">R${Number(s.total).toFixed(0)}</span>
                    <div className="w-full bg-marca/20 rounded-t-sm" style={{ height: `${(s.total / maxBar) * 100}%`, minHeight: s.total > 0 ? '4px' : '0' }} />
                    <span className="text-[8px] text-tenue">{new Date(s.dia + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rankings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {resumo.ranking_servicos?.length > 0 && (
              <div className="bg-card border border-borda rounded-2xl p-4">
                <h3 className="text-xs text-tenue mb-3 uppercase tracking-wide">Serviços</h3>
                <div className="space-y-1.5">
                  {resumo.ranking_servicos.slice(0, 5).map((s: any) => (
                    <div key={s.servico} className="flex items-center justify-between text-sm">
                      <span className="text-suave">{s.servico} <span className="text-tenue text-xs">×{s.qtd}</span></span>
                      <span className="tabular-nums text-marca">R$ {Number(s.total).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {resumo.ranking_profissionais?.length > 0 && (
              <div className="bg-card border border-borda rounded-2xl p-4">
                <h3 className="text-xs text-tenue mb-3 uppercase tracking-wide">Profissionais</h3>
                <div className="space-y-1.5">
                  {resumo.ranking_profissionais.slice(0, 5).map((p: any) => (
                    <div key={p.profissional} className="flex items-center justify-between text-sm">
                      <span className="text-suave">{p.profissional} <span className="text-tenue text-xs">×{p.qtd}</span></span>
                      <span className="tabular-nums text-marca">R$ {Number(p.total).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Aba detalhe: Vendas / Lançamentos */}
          <div className="flex gap-1 bg-elevado rounded-xl p-1 mb-4 text-sm">
            {(['vendas', 'lancamentos'] as const).map(a => (
              <button key={a} onClick={() => setAbaDetalhe(a)}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${abaDetalhe === a ? 'bg-card text-marca' : 'text-tenue'}`}>
                {a === 'vendas' ? 'Vendas' : 'Lançamentos'}
              </button>
            ))}
          </div>

          {abaDetalhe === 'vendas' && (
            <div className="space-y-2 mb-6">
              {pagamentos.length === 0 && <p className="text-center text-tenue text-sm py-8">Nenhuma venda no período</p>}
              {pagamentos.map((p: any) => (
                <div key={p.id} className="bg-card border border-borda rounded-2xl px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-marca">{p.clientes?.nome ?? 'Anônimo'}</span>
                    <span className="text-sm font-semibold tabular-nums text-marca">R$ {Number(p.valor_total).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-tenue">
                    <span>{new Date(p.data_hora).toLocaleString('pt-BR')}</span>
                    <span className="capitalize">{p.forma_pagamento}</span>
                    {p.forma_pagamento === 'pix' && p.status_pix === 'pendente' && <span className="text-alerta">Pendente</span>}
                    {p.profissionais?.nome && <span>• {p.profissionais.nome}</span>}
                  </div>
                  {p.pagamento_servicos?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {p.pagamento_servicos.map((ps: any) => (
                        <span key={ps.id} className="text-[10px] bg-elevado px-2 py-0.5 rounded-full text-tenue">{ps.servicos?.nome}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {abaDetalhe === 'lancamentos' && (
            <div className="mb-6">
              <div className="flex gap-2 mb-4">
                <button onClick={() => { setFormLancamento({ descricao: '', valor: '' }); setShowLancamento('entrada') }}
                  className="flex-1 bg-sucesso/20 text-sucesso px-4 py-2 rounded-xl text-sm font-medium transition-transform active:scale-[0.975]">
                  + Entrada
                </button>
                <button onClick={() => { setFormLancamento({ descricao: '', valor: '' }); setShowLancamento('despesa') }}
                  className="flex-1 bg-perigo/20 text-perigo px-4 py-2 rounded-xl text-sm font-medium transition-transform active:scale-[0.975]">
                  + Despesa
                </button>
              </div>

              {entradas.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs text-sucesso font-medium mb-2">Entradas manuais</h4>
                  {entradas.map(e => (
                    <div key={e.id} className="flex items-center justify-between bg-card border border-borda rounded-xl px-4 py-2.5 mb-1.5">
                      <div>
                        <p className="text-sm text-marca">{e.descricao}</p>
                        <p className="text-xs text-tenue">{new Date(e.criado_em).toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-sucesso tabular-nums">R$ {Number(e.valor).toFixed(2)}</span>
                        <button onClick={() => { setExcluirId(e.id); setExcluirTipo('entrada') }} className="text-tenue hover:text-perigo p-1">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {despesas.length > 0 && (
                <div>
                  <h4 className="text-xs text-perigo font-medium mb-2">Despesas</h4>
                  {despesas.map(d => (
                    <div key={d.id} className="flex items-center justify-between bg-card border border-borda rounded-xl px-4 py-2.5 mb-1.5">
                      <div>
                        <p className="text-sm text-marca">{d.descricao}</p>
                        <p className="text-xs text-tenue">{new Date(d.criado_em).toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-perigo tabular-nums">R$ {Number(d.valor).toFixed(2)}</span>
                        <button onClick={() => { setExcluirId(d.id); setExcluirTipo('despesa') }} className="text-tenue hover:text-perigo p-1">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {entradas.length === 0 && despesas.length === 0 && (
                <p className="text-center text-tenue text-sm py-8">Nenhum lançamento no período</p>
              )}
            </div>
          )}
        </>
      )}

      {!resumo && (
        <div className="border-2 border-dashed border-borda rounded-2xl p-12 text-center">
          <p className="text-suave text-sm">Carregando...</p>
        </div>
      )}

      <Modal open={showLancamento !== null} onClose={() => setShowLancamento(null)}
        title={showLancamento === 'entrada' ? 'Nova entrada' : 'Nova despesa'}>
        <div className="space-y-4">
          <input value={formLancamento.descricao} onChange={e => setFormLancamento(p => ({ ...p, descricao: e.target.value }))} placeholder="Descrição"
            className="w-full bg-elevado border border-borda rounded-xl px-4 py-2.5 text-marca text-sm outline-none" />
          <input value={formLancamento.valor} onChange={e => setFormLancamento(p => ({ ...p, valor: e.target.value }))} placeholder="Valor" type="number" step="0.01" min="0"
            className="w-full bg-elevado border border-borda rounded-xl px-4 py-2.5 text-marca text-sm outline-none" />
          <button onClick={handleSalvarLancamento} disabled={loadingLancamento || !formLancamento.descricao || !formLancamento.valor}
            className="w-full bg-marca text-fundo rounded-xl py-3 font-medium transition-transform active:scale-[0.975] disabled:opacity-50">
            {loadingLancamento ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog open={!!excluirId} onClose={() => { setExcluirId(null); setExcluirTipo('') }}
        onConfirm={handleExcluirLancamento} title="Excluir" message="Tem certeza?" confirmText="Excluir" />
    </div>
  )
}

function Card({ valor, label, cor, prefixo = 'R$' }: { valor: number; label: string; cor: string; prefixo?: string }) {
  return (
    <div className="bg-card border border-borda rounded-2xl p-4">
      <p className="text-xs text-tenue mb-1">{label}</p>
      <p className={`text-xl font-semibold tabular-nums ${cor}`}>{prefixo && `${prefixo} `}{typeof valor === 'number' ? valor.toFixed(2) : valor}</p>
    </div>
  )
}
