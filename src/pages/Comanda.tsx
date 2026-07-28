import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTenant } from '@/contexts/TenantContext'
import { listarServicos } from '@/services/servicos'
import { listarProdutos } from '@/services/pagamentos'
import { listarProfissionais } from '@/services/profissionais'
import { cadastroRapido } from '@/services/clientes'
import { obterAgendamento } from '@/services/agenda'
import { registrarPagamento, listarIntegracoes } from '@/services/pagamentos'
import { supabase } from '@/lib/supabase'
import type { Servico, Profissional } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface ItemComanda {
  id: string
  tipo: 'servico' | 'produto'
  nome: string
  preco: number
}

export function Comanda() {
  const { tenant } = useTenant()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const agendamentoId = searchParams.get('agendamento')

  const [servicos, setServicos] = useState<Servico[]>([])
  const [produtos, setProdutos] = useState<any[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [itens, setItens] = useState<ItemComanda[]>([])
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [clienteNome, setClienteNome] = useState('')
  const [profissionalId, setProfissionalId] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('')
  const [desconto, setDesconto] = useState(0)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [integracaoPix, setIntegracaoPix] = useState<any>(null)
  const [agPreCarregado, setAgPreCarregado] = useState(false)

  useEffect(() => {
    if (!tenant) return
    listarServicos(tenant.id).then(setServicos)
    listarProdutos(tenant.id).then(setProdutos)
    listarProfissionais(tenant.id).then(setProfissionais)
    listarIntegracoes(tenant.id).then(setIntegracaoPix)
  }, [tenant])

  useEffect(() => {
    if (!tenant || !agendamentoId || agPreCarregado) return
    obterAgendamento(agendamentoId).then(ag => {
      if (!ag) return
      setClienteId(ag.cliente_id)
      setProfissionalId(ag.profissional_id)
      if (ag.agendamento_servicos?.length) {
        setItens(ag.agendamento_servicos.map((s: any) => ({
          id: s.servico_id,
          tipo: 'servico' as const,
          nome: s.servicos?.nome ?? 'Serviço',
          preco: Number(s.preco_no_momento),
        })))
      }
      setAgPreCarregado(true)
    })
  }, [tenant, agendamentoId, agPreCarregado])

  const toggleItem = useCallback((item: ItemComanda) => {
    setItens(prev => {
      const exists = prev.find(i => i.id === item.id && i.tipo === item.tipo)
      return exists ? prev.filter(i => i.id !== item.id || i.tipo !== item.tipo) : [...prev, item]
    })
  }, [])

  const isSelected = useCallback((id: string, tipo: string) => {
    return itens.some(i => i.id === id && i.tipo === tipo)
  }, [itens])

  const subtotal = useMemo(() => itens.reduce((acc, i) => acc + i.preco, 0), [itens])
  const total = useMemo(() => Math.max(0, subtotal - desconto), [subtotal, desconto])

  const agruparItens = useCallback(() => {
    const servicos: { servico_id: string; preco: number }[] = []
    const produtos: { produto_id: string; preco: number }[] = []
    itens.forEach(i => {
      if (i.tipo === 'servico') servicos.push({ servico_id: i.id, preco: i.preco })
      else produtos.push({ produto_id: i.id, preco: i.preco })
    })
    return { servicos, produtos }
  }, [itens])

  async function handleFinalizar() {
    if (!tenant || !formaPagamento || itens.length === 0) return
    setLoading(true)
    setErro('')

    try {
      let cId = clienteId
      if (!cId && clienteNome) {
        const c = await cadastroRapido(tenant.id, clienteNome, '')
        cId = c.id
      }

      const { servicos: servicosItens, produtos: produtosItens } = agruparItens()

      await registrarPagamento({
        tenant_id: tenant.id,
        cliente_id: cId,
        agendamento_id: agendamentoId || null,
        valor_total: total,
        forma_pagamento: formaPagamento,
        profissional_id: profissionalId || null,
        servicos: servicosItens,
        produtos: produtosItens,
      })

      setShowConfirm(false)
      setItens([])
      setClienteId(null)
      setClienteNome('')
      setProfissionalId('')
      setFormaPagamento('')
      setDesconto(0)
      navigate('/')
    } catch (e: any) {
      setErro(e.message || 'Erro ao registrar pagamento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-marca">Comanda</h1>
        {itens.length > 0 && (
          <button onClick={() => setItens([])} className="text-xs text-tenue hover:text-perigo transition-colors">
            Limpar
          </button>
        )}
      </div>

      {/* Grade de Serviços */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-suave mb-2">Serviços</h2>
        <div className="grid grid-cols-2 gap-2">
          {servicos.filter(s => s.ativo).map(s => {
            const ativo = isSelected(s.id, 'servico')
            return (
              <button key={s.id} onClick={() => toggleItem({ id: s.id, tipo: 'servico', nome: s.nome, preco: Number(s.preco) })}
                className={`relative text-left px-4 py-3 rounded-2xl border transition-all active:scale-[0.975] ${
                  ativo ? 'bg-marca/10 border-marca' : 'bg-card border-borda hover:bg-elevado'
                }`}>
                {ativo && <span className="absolute top-2 right-2 text-marca text-xs">✓</span>}
                <p className="text-sm font-medium text-marca">{s.nome}</p>
                <p className="text-xs text-tenue tabular-nums">R$ {Number(s.preco).toFixed(2)}</p>
                <p className="text-[10px] text-tenue">{s.duracao_min}min</p>
              </button>
            )
          })}
        </div>
      </section>

      {/* Grade de Produtos */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-suave mb-2">Produtos</h2>
        <div className="grid grid-cols-2 gap-2">
          {produtos.filter(p => p.ativo).map(p => {
            const ativo = isSelected(p.id, 'produto')
            return (
              <button key={p.id} onClick={() => toggleItem({ id: p.id, tipo: 'produto', nome: p.nome, preco: Number(p.preco) })}
                className={`relative text-left px-4 py-3 rounded-2xl border transition-all active:scale-[0.975] ${
                  ativo ? 'bg-marca/10 border-marca' : 'bg-card border-borda hover:bg-elevado'
                }`}>
                {ativo && <span className="absolute top-2 right-2 text-marca text-xs">✓</span>}
                <p className="text-sm font-medium text-marca">{p.nome}</p>
                <p className="text-xs text-tenue tabular-nums">R$ {Number(p.preco).toFixed(2)}</p>
              </button>
            )
          })}
        </div>
      </section>

      {/* Itens na comanda */}
      {itens.length > 0 && (
        <section className="bg-card border border-borda rounded-2xl p-4 mb-6">
          <h2 className="text-sm font-medium text-marca mb-3">Itens na comanda</h2>
          <div className="space-y-2 mb-3">
            {itens.map((item, i) => (
              <div key={`${item.tipo}-${item.id}-${i}`} className="flex items-center justify-between text-sm">
                <span className="text-suave">{item.nome}</span>
                <div className="flex items-center gap-2">
                  <span className="tabular-nums text-marca">R$ {item.preco.toFixed(2)}</span>
                  <button onClick={() => setItens(prev => prev.filter((_, j) => j !== i))}
                    className="text-tenue hover:text-perigo p-0.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cliente */}
          <div className="mb-3">
            <label className="text-xs text-tenue mb-1 block">Cliente</label>
            <ClienteSelect tenantId={tenant?.id} value={clienteId} nome={clienteNome} onSelect={setClienteId} onNomeChange={setClienteNome} />
          </div>

          {/* Profissional */}
          <div className="mb-3">
            <label className="text-xs text-tenue mb-1 block">Atendido por</label>
            <select value={profissionalId} onChange={e => setProfissionalId(e.target.value)}
              className="w-full bg-elevado border border-borda rounded-xl px-3 py-2 text-marca text-sm outline-none">
              <option value="">Selecione</option>
              {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>

          {/* Desconto */}
          <div className="mb-3">
            <label className="text-xs text-tenue mb-1 block">Desconto (R$)</label>
            <input type="number" min="0" max={subtotal} value={desconto || ''} onChange={e => setDesconto(Number(e.target.value) || 0)}
              className="w-full bg-elevado border border-borda rounded-xl px-3 py-2 text-marca text-sm outline-none" />
          </div>

          {/* Total */}
          <div className="border-t border-borda pt-3 mb-4">
            <div className="flex justify-between text-sm text-tenue"><span>Subtotal</span><span className="tabular-nums">R$ {subtotal.toFixed(2)}</span></div>
            {desconto > 0 && <div className="flex justify-between text-sm text-sucesso"><span>Desconto</span><span className="tabular-nums">-R$ {desconto.toFixed(2)}</span></div>}
            <div className="flex justify-between text-base font-semibold text-marca mt-1"><span>Total</span><span className="tabular-nums">R$ {total.toFixed(2)}</span></div>
          </div>

          {/* Formas de Pagamento */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <PagamentoBtn label="Dinheiro" icon="money" ativo={formaPagamento === 'dinheiro'} onClick={() => setFormaPagamento('dinheiro')} />
            <PagamentoBtn label="Maquininha" icon="card" ativo={formaPagamento === 'maquininha'} onClick={() => setFormaPagamento('maquininha')} />
            <PagamentoBtn label="Pix" icon="pix" ativo={formaPagamento === 'pix'} onClick={() => {
              if (!integracaoPix?.ativo) return
              setFormaPagamento('pix')
            }} disabled={!integracaoPix?.ativo} />
          </div>
          {formaPagamento === 'pix' && !integracaoPix?.ativo && (
            <p className="text-xs text-perigo text-center mb-3">Pix disponível apenas com integração validada</p>
          )}

          {erro && <p className="text-perigo text-sm text-center mb-3">{erro}</p>}

          <button onClick={() => setShowConfirm(true)}
            disabled={!formaPagamento || itens.length === 0}
            className="w-full bg-marca text-fundo rounded-xl py-3 font-medium transition-transform active:scale-[0.975] disabled:opacity-50">
            Finalizar — R$ {total.toFixed(2)}
          </button>
        </section>
      )}

      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleFinalizar}
        title="Confirmar pagamento"
        message={`Confirmar ${formaPagamento === 'pix' ? 'cobrança Pix' : 'pagamento'} de R$ ${total.toFixed(2)}${clienteNome ? ` para ${clienteNome}` : ''}?`}
        confirmText={loading ? 'Processando...' : 'Confirmar'}
      />
    </div>
  )
}

function PagamentoBtn({ label, icon, ativo, onClick, disabled }: { label: string; icon: string; ativo: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl border text-sm transition-all active:scale-[0.975] ${
        ativo ? 'bg-marca/10 border-marca text-marca' :
        disabled ? 'bg-elevado/50 border-borda text-tenue cursor-not-allowed' :
        'bg-card border-borda text-suave hover:bg-elevado'
      }`}>
      {icon === 'money' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10" /><path d="M12 6v12M6 12h12" /></svg>}
      {icon === 'card' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>}
      {icon === 'pix' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>}
      <span>{label}</span>
    </button>
  )
}

function ClienteSelect({ tenantId, value, nome, onSelect, onNomeChange }: {
  tenantId?: string; value: string | null; nome: string; onSelect: (id: string | null) => void; onNomeChange: (n: string) => void
}) {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState<any[]>([])
  const [mostrar, setMostrar] = useState(false)
  const [rapido, setRapido] = useState(false)

  useEffect(() => {
    if (!busca || busca.length < 2 || !tenantId) { setResultados([]); return }
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
  }, [busca, tenantId])

  if (value) {
    const nomeCliente = nome || resultados.find(r => r.id === value)?.nome || ''
    return (
      <div className="flex items-center justify-between bg-elevado rounded-xl px-3 py-2">
        <span className="text-sm text-marca">{nomeCliente}</span>
        <button onClick={() => { onSelect(null); onNomeChange('') }} className="text-tenue text-xs">✕</button>
      </div>
    )
  }

  return (
    <div>
      {rapido ? (
        <div className="flex gap-2">
          <input value={nome} onChange={e => onNomeChange(e.target.value)} placeholder="Nome do cliente"
            className="flex-1 bg-elevado border border-borda rounded-xl px-3 py-2 text-marca text-sm outline-none" />
          <button onClick={() => setRapido(false)} className="text-xs text-tenue">Voltar</button>
        </div>
      ) : (
        <>
          <input value={busca} onChange={e => { setBusca(e.target.value); setMostrar(true) }}
            onFocus={() => setMostrar(true)} placeholder="Buscar cliente..."
            className="w-full bg-elevado border border-borda rounded-xl px-3 py-2 text-marca text-sm outline-none" />
          {mostrar && resultados.length > 0 && (
            <div className="mt-1 bg-card border border-borda rounded-xl overflow-hidden">
              {resultados.map(c => (
                <button key={c.id} onClick={() => { onSelect(c.id); onNomeChange(c.nome); setMostrar(false); setBusca('') }}
                  className="w-full text-left px-3 py-2 text-sm text-marca hover:bg-elevado">
                  {c.nome} {c.telefone && <span className="text-tenue">— {c.telefone}</span>}
                </button>
              ))}
            </div>
          )}
          <button onClick={() => setRapido(true)} className="text-xs text-tenue hover:text-marca mt-1">
            + Novo cliente
          </button>
        </>
      )}
    </div>
  )
}
