import { useState, useEffect, useCallback } from 'react'
import { useTenant } from '@/contexts/TenantContext'
import { useAuth } from '@/contexts/AuthContext'
import { useTerminologia } from '@/hooks/useTerminologia'
import { supabase } from '@/lib/supabase'
import { listarClientes, salvarCliente, obterCliente, listarNotas, salvarNota, excluirNota, listarTagsDoCliente, vincularTag, desvincularTag, cadastroRapido } from '@/services/clientes'
import { listarTags } from '@/services/tags'
import type { Cliente, Tag, ClienteNota } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'

export function Clientes() {
  const { tenant } = useTenant()
  const { t } = useTerminologia()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busca, setBusca] = useState('')
  const [detalheId, setDetalheId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Partial<Cliente> | null>(null)

  const carregar = useCallback(async () => {
    if (!tenant) return
    setClientes(await listarClientes(tenant.id, busca || undefined))
  }, [tenant, busca])

  useEffect(() => { carregar() }, [carregar])

  async function handleSalvar() {
    if (!tenant || !editando) return
    await salvarCliente({ ...editando, tenant_id: tenant.id })
    setShowForm(false)
    setEditando(null)
    carregar()
  }

  async function handleCadastroRapido() {
    if (!tenant) return
    const c = await cadastroRapido(tenant.id, editando?.nome ?? '', editando?.telefone ?? '')
    setShowForm(false)
    setEditando(null)
    setDetalheId(c.id)
    carregar()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-marca">{t('cliente', true)}</h1>
        <button onClick={() => { setEditando({}); setShowForm(true) }}
          className="bg-marca text-fundo px-4 py-2 rounded-xl font-medium text-sm transition-transform active:scale-[0.975]">
          + Novo
        </button>
      </div>

      <input
        type="text"
        placeholder={`Buscar ${t('cliente').toLowerCase()}...`}
        value={busca}
        onChange={e => setBusca(e.target.value)}
        className="w-full bg-card border border-borda rounded-xl px-4 py-3 text-marca placeholder-suave outline-none focus:border-borda-forte transition-colors mb-4"
      />

      <div className="space-y-2">
        {clientes.length === 0 && <EmptyState title={`Nenhum ${t('cliente').toLowerCase()} encontrado`} />}

        {clientes.map(c => {
          const diasDesdeUltima = c.ultima_visita ? Math.floor((Date.now() - new Date(c.ultima_visita).getTime()) / 86400000) : null
          return (
            <button
              key={c.id}
              onClick={() => setDetalheId(c.id)}
              className="w-full bg-card border border-borda rounded-2xl px-5 py-4 text-left hover:bg-elevado transition-colors active:scale-[0.975]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-marca font-medium">{c.nome}</p>
                  <p className="text-tenue text-xs">{c.telefone ?? ''}{c.email ? ` · ${c.email}` : ''}</p>
                </div>
                <div className="text-right">
                  {diasDesdeUltima !== null && (
                    <p className={`text-xs ${diasDesdeUltima > 60 ? 'text-perigo-claro' : 'text-tenue'}`}>
                      {diasDesdeUltima}d
                    </p>
                  )}
                  <p className="text-xs text-tenue">{c.quantidade_visitas} visitas</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {detalheId && (
        <FichaCliente
          clienteId={detalheId}
          onClose={() => setDetalheId(null)}
        />
      )}

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditando(null) }} title="Novo Cliente">
        <div className="space-y-4">
          <Input label="Nome" value={editando?.nome ?? ''} onChange={v => setEditando(p => ({ ...p, nome: v }))} />
          <Input label="Telefone" value={editando?.telefone ?? ''} onChange={v => setEditando(p => ({ ...p, telefone: v }))} />
          <Input label="E-mail" value={editando?.email ?? ''} onChange={v => setEditando(p => ({ ...p, email: v }))} />
          <Input label="Data de nascimento" type="date" value={editando?.data_nascimento ?? ''} onChange={v => setEditando(p => ({ ...p, data_nascimento: v }))} />
          <Input label="Origem" value={editando?.origem ?? ''} onChange={v => setEditando(p => ({ ...p, origem: v }))} />
          <div>
            <label className="text-xs text-tenue mb-1 block">Observações</label>
            <textarea value={editando?.observacoes ?? ''} onChange={e => setEditando(p => ({ ...p, observacoes: e.target.value }))}
              className="w-full bg-elevado border border-borda rounded-xl px-4 py-2.5 text-marca outline-none focus:border-borda-forte text-sm resize-none h-20" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCadastroRapido} className="flex-1 bg-elevado text-marca rounded-xl py-3 text-sm font-medium transition-transform active:scale-[0.975]">
              Cadastro Rápido
            </button>
            <button onClick={handleSalvar} className="flex-1 bg-marca text-fundo rounded-xl py-3 text-sm font-medium transition-transform active:scale-[0.975]">
              Salvar Completo
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function FichaCliente({ clienteId, onClose }: { clienteId: string; onClose: () => void }) {
  const { tenant: t } = useTenant()
  const { user } = useAuth()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [notas, setNotas] = useState<(ClienteNota & { usuarios: { nome: string } })[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [todasTags, setTodasTags] = useState<Tag[]>([])
  const [novaNota, setNovaNota] = useState('')
  const [historico, setHistorico] = useState<{ tipo: string; data: string; descricao: string; valor: string }[]>([])

  useEffect(() => {
    if (!t) return
    obterCliente(clienteId).then(setCliente)
    listarNotas(t.id, clienteId).then(setNotas)
    listarTagsDoCliente(t.id, clienteId).then(setTags)
    listarTags(t.id).then(setTodasTags)
    carregarHistorico(t.id, clienteId)
  }, [t, clienteId])

  async function carregarHistorico(tenantId: string, cliId: string) {
    const [vendas, agendamentos] = await Promise.all([
      supabase.from('pagamentos').select('data_hora, valor_total, forma_pagamento').eq('tenant_id', tenantId).eq('cliente_id', cliId),
      supabase.from('agendamentos').select('inicio, status, profissional_id').eq('tenant_id', tenantId).eq('cliente_id', cliId),
    ])

    const items: typeof historico = []
    for (const v of vendas.data ?? []) {
      if (!agendamentos.data?.some(a => a.status === 'concluido' && Math.abs(new Date(a.inicio).getTime() - new Date(v.data_hora).getTime()) < 60000)) {
        items.push({ tipo: 'venda', data: v.data_hora, descricao: `Venda - ${v.forma_pagamento}`, valor: `R$ ${Number(v.valor_total).toFixed(2)}` })
      }
    }
    for (const a of agendamentos.data ?? []) {
      const jaVirouVenda = items.some(i => i.tipo === 'venda' && Math.abs(new Date(i.data).getTime() - new Date(a.inicio).getTime()) < 60000)
      if (!jaVirouVenda) {
        items.push({ tipo: 'agendamento', data: a.inicio, descricao: `${a.status}`, valor: '' })
      }
    }
    items.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    setHistorico(items.slice(0, 20))
  }

  if (!t || !cliente) return null
  const tenant = t

  const diasDesdeUltima = cliente.ultima_visita
    ? Math.floor((Date.now() - new Date(cliente.ultima_visita).getTime()) / 86400000)
    : null
  const fazAniversario = cliente.data_nascimento
    ? new Date(cliente.data_nascimento).getMonth() === new Date().getMonth()
    : false

  async function handleAddNota() {
    if (!novaNota.trim() || !user) return
    await salvarNota({ tenant_id: tenant.id, cliente_id: clienteId, usuario_id: user.id, corpo: novaNota, fixada: false })
    setNovaNota('')
    setNotas(await listarNotas(tenant.id, clienteId))
  }

  async function handleToggleFixar(nota: ClienteNota) {
    await salvarNota({ ...nota, fixada: !nota.fixada, tenant_id: tenant.id })
    setNotas(await listarNotas(tenant.id, clienteId))
  }

  async function handleExcluirNota(id: string) {
    await excluirNota(id)
    setNotas(await listarNotas(tenant.id, clienteId))
  }

  async function handleAddTag(tagId: string) {
    await vincularTag(tenant.id, clienteId, tagId)
    setTags(await listarTagsDoCliente(tenant.id, clienteId))
  }

  async function handleRemoveTag(tagId: string) {
    await desvincularTag(clienteId, tagId)
    setTags(await listarTagsDoCliente(tenant.id, clienteId))
  }

  const tagsDisponiveis = todasTags.filter(t => !tags.some(tt => tt.id === t.id))

  return (
    <Modal open={true} onClose={onClose} title={cliente.nome}>
      <div className="space-y-5">
        {/* Ações rápidas */}
        <div className="flex gap-2">
          {cliente.telefone_e164 && (
            <a href={`https://wa.me/${cliente.telefone_e164}`} target="_blank" rel="noopener noreferrer"
              className="flex-1 bg-sucesso/20 text-sucesso-claro text-center rounded-xl py-2 text-sm font-medium">
              WhatsApp
            </a>
          )}
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-elevado rounded-xl p-3 text-center">
            <p className="text-lg font-semibold text-marca tabular-nums">R$ {cliente.total_gasto.toFixed(2)}</p>
            <p className="text-xs text-tenue">Total gasto</p>
          </div>
          <div className="bg-elevado rounded-xl p-3 text-center">
            <p className="text-lg font-semibold text-marca tabular-nums">{cliente.quantidade_visitas}</p>
            <p className="text-xs text-tenue">Visitas</p>
          </div>
          {diasDesdeUltima !== null && (
            <div className={`bg-elevado rounded-xl p-3 text-center ${diasDesdeUltima > 60 ? 'ring-1 ring-perigo/30' : ''}`}>
              <p className="text-lg font-semibold text-marca tabular-nums">{diasDesdeUltima}</p>
              <p className="text-xs text-tenue">Dias desde última</p>
            </div>
          )}
          {fazAniversario && (
            <div className="bg-elevado rounded-xl p-3 text-center ring-1 ring-alerta/30">
              <p className="text-lg font-semibold text-alerta-claro">🎂</p>
              <p className="text-xs text-tenue">Aniversário este mês</p>
            </div>
          )}
        </div>

        {/* Dados de contato */}
        <div className="text-sm space-y-1">
          {cliente.telefone && <p className="text-suave">📞 {cliente.telefone}</p>}
          {cliente.email && <p className="text-suave">✉️ {cliente.email}</p>}
          {cliente.data_nascimento && <p className="text-tenue">🎂 {new Date(cliente.data_nascimento).toLocaleDateString('pt-BR')}</p>}
          {cliente.origem && <p className="text-tenue">Origem: {cliente.origem}</p>}
          {cliente.observacoes && <p className="text-tenue mt-2">{cliente.observacoes}</p>}
        </div>

        {/* Tags */}
        <div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map(t => (
              <span key={t.id} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: t.cor + '20', color: t.cor }}>
                {t.nome}
                <button onClick={() => handleRemoveTag(t.id)} className="hover:opacity-70">&times;</button>
              </span>
            ))}
          </div>
          {tagsDisponiveis.length > 0 && (
            <select onChange={e => { if (e.target.value) handleAddTag(e.target.value); e.target.value = '' }}
              className="w-full bg-elevado border border-borda rounded-xl px-3 py-2 text-sm text-marca outline-none">
              <option value="">+ Adicionar etiqueta</option>
              {tagsDisponiveis.map(t => <option key={t.id} value={t.id} style={{ color: t.cor }}>{t.nome}</option>)}
            </select>
          )}
        </div>

        {/* Histórico */}
        <div>
          <p className="text-sm font-medium text-marca mb-2">Histórico</p>
          <div className="space-y-1">
            {historico.length === 0 && <p className="text-tenue text-xs">Nenhum registro</p>}
            {historico.map((h, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-borda/50">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${h.tipo === 'venda' ? 'bg-sucesso' : 'bg-suave'}`} />
                  <p className="text-sm text-suave">{h.descricao}</p>
                </div>
                <div className="text-right">
                  {h.valor && <p className="text-sm text-marca tabular-nums">{h.valor}</p>}
                  <p className="text-xs text-tenue">{new Date(h.data).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notas */}
        <div>
          <p className="text-sm font-medium text-marca mb-2">Notas</p>
          <div className="space-y-2 mb-3">
            {notas.map(n => (
              <div key={n.id} className={`bg-elevado rounded-xl p-3 ${n.fixada ? 'ring-1 ring-alerta/30' : ''}`}>
                <div className="flex items-start justify-between">
                  <p className="text-sm text-suave flex-1">{n.corpo}</p>
                  <div className="flex gap-1 ml-2">
                    <button onClick={() => handleToggleFixar(n)} className="text-xs text-tenue hover:text-alerta-claro">
                      {n.fixada ? '📌' : '📍'}
                    </button>
                    <button onClick={() => handleExcluirNota(n.id)} className="text-xs text-tenue hover:text-perigo-claro">✕</button>
                  </div>
                </div>
                <p className="text-xs text-tenue mt-1">{n.usuarios.nome}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={novaNota} onChange={e => setNovaNota(e.target.value)} placeholder="Nova nota..."
              className="flex-1 bg-elevado border border-borda rounded-xl px-3 py-2 text-sm text-marca outline-none focus:border-borda-forte"
              onKeyDown={e => { if (e.key === 'Enter') handleAddNota() }} />
            <button onClick={handleAddNota} className="bg-marca text-fundo px-4 rounded-xl text-sm font-medium transition-transform active:scale-[0.975]">
              OK
            </button>
          </div>
        </div>
      </div>
    </Modal>
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
