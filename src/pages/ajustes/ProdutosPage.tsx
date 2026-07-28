import { useState, useEffect } from 'react'
import { useTenant } from '@/contexts/TenantContext'
import { listarProdutos, salvarProduto, excluirProduto } from '@/services/produtos'
import type { Produto } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'

export function ProdutosPage() {
  const { tenant } = useTenant()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [editando, setEditando] = useState<Partial<Produto> | null>(null)
  const [excluirId, setExcluirId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (tenant) listarProdutos(tenant.id).then(setProdutos)
  }, [tenant])

  async function handleSalvar() {
    if (!tenant || !editando) return
    await salvarProduto({ ...editando, tenant_id: tenant.id })
    setShowForm(false)
    setEditando(null)
    setProdutos(await listarProdutos(tenant.id))
  }

  async function handleExcluir() {
    if (!excluirId) return
    await excluirProduto(excluirId)
    setExcluirId(null)
    if (tenant) setProdutos(await listarProdutos(tenant.id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-marca">Produtos</h1>
        <button onClick={() => { setEditando({ ativo: true, preco: 0 }); setShowForm(true) }}
          className="bg-marca text-fundo px-4 py-2 rounded-xl font-medium text-sm transition-transform active:scale-[0.975]">
          + Novo
        </button>
      </div>

      <div className="space-y-2">
        {produtos.length === 0 && <EmptyState title="Nenhum produto cadastrado" description="Produtos aparecerão aqui" />}

        {produtos.map(p => (
          <div key={p.id} className="bg-card border border-borda rounded-2xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-marca font-medium">{p.nome}</p>
              <p className="text-tenue text-xs">R$ {p.preco.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
              {!p.ativo && <span className="text-xs text-perigo-claro bg-perigo/10 px-2 py-0.5 rounded-full">Inativo</span>}
              <button onClick={() => { setEditando(p); setShowForm(true) }} className="text-tenue hover:text-suave p-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              </button>
              <button onClick={() => setExcluirId(p.id)} className="text-tenue hover:text-perigo p-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditando(null) }} title={editando?.id ? 'Editar Produto' : 'Novo Produto'}>
        <div className="space-y-4">
          <Input label="Nome" value={editando?.nome ?? ''} onChange={v => setEditando(p => ({ ...p, nome: v }))} />
          <Input label="Preço (R$)" type="number" value={String(editando?.preco ?? 0)} onChange={v => setEditando(p => ({ ...p, preco: Number(v) }))} />
          <label className="flex items-center gap-2 text-sm text-suave">
            <input type="checkbox" checked={editando?.ativo ?? true} onChange={e => setEditando(p => ({ ...p, ativo: e.target.checked }))} className="rounded border-borda bg-card" />
            Ativo
          </label>
          <button onClick={handleSalvar} className="w-full bg-marca text-fundo rounded-xl py-3 font-medium transition-transform active:scale-[0.975]">
            Salvar
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!excluirId}
        onClose={() => setExcluirId(null)}
        onConfirm={handleExcluir}
        title="Excluir produto"
        message="Tem certeza que deseja excluir este produto?"
      />
    </div>
  )
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs text-tenue mb-1 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-elevado border border-borda rounded-xl px-4 py-2.5 text-marca placeholder-suave outline-none focus:border-borda-forte transition-colors text-sm" />
    </div>
  )
}
