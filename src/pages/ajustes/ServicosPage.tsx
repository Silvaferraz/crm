import { useState, useEffect } from 'react'
import { useTenant } from '@/contexts/TenantContext'
import { useTerminologia } from '@/hooks/useTerminologia'
import { listarServicos, salvarServico, excluirServico, semearServicos } from '@/services/servicos'
import type { Servico } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'

export function ServicosPage() {
  const { tenant } = useTenant()
  const { t, servicosSugeridos } = useTerminologia()
  const [servicos, setServicos] = useState<Servico[]>([])
  const [editando, setEditando] = useState<Partial<Servico> | null>(null)
  const [excluirId, setExcluirId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (tenant) listarServicos(tenant.id).then(setServicos)
  }, [tenant])

  async function handleSalvar() {
    if (!tenant || !editando) return
    await salvarServico({ ...editando, tenant_id: tenant.id })
    setShowForm(false)
    setEditando(null)
    const atualizados = await listarServicos(tenant.id)
    setServicos(atualizados)
  }

  async function handleExcluir() {
    if (!excluirId) return
    await excluirServico(excluirId)
    setExcluirId(null)
    if (tenant) setServicos(await listarServicos(tenant.id))
  }

  async function handleSemear() {
    if (!tenant) return
    const qtd = await semearServicos(tenant.id, servicosSugeridos)
    if (qtd > 0) setServicos(await listarServicos(tenant.id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-marca">{t('servico', true)}</h1>
        <button onClick={() => { setEditando({ ativo: true, preco: 0, duracao_min: 30, intervalo_pos_min: 0 }); setShowForm(true) }}
          className="bg-marca text-fundo px-4 py-2 rounded-xl font-medium text-sm transition-transform active:scale-[0.975]">
          + Novo
        </button>
      </div>

      {servicosSugeridos.length > 0 && (
        <button onClick={handleSemear} className="text-xs text-suave mb-4 hover:text-marca transition-colors">
          + Semear {servicosSugeridos.length} {t('servico', true).toLowerCase()} sugeridos
        </button>
      )}

      <div className="space-y-2">
        {servicos.length === 0 && <EmptyState title={`Nenhum ${t('servico').toLowerCase()} cadastrado`} description={t('servico', true)} />}

        {servicos.map(s => (
          <div key={s.id} className="bg-card border border-borda rounded-2xl px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {s.cor && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.cor }} />}
              <div>
                <p className="text-marca font-medium">{s.nome}</p>
                <p className="text-tenue text-xs">R$ {s.preco.toFixed(2)} · {s.duracao_min}min{s.intervalo_pos_min > 0 ? ` · ${s.intervalo_pos_min}min folga` : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!s.ativo && <span className="text-xs text-perigo-claro bg-perigo/10 px-2 py-0.5 rounded-full">Inativo</span>}
              <button onClick={() => { setEditando(s); setShowForm(true) }} className="text-tenue hover:text-suave p-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              </button>
              <button onClick={() => setExcluirId(s.id)} className="text-tenue hover:text-perigo p-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditando(null) }} title={editando?.id ? 'Editar Serviço' : 'Novo Serviço'}>
        <div className="space-y-4">
          <Input label="Nome" value={editando?.nome ?? ''} onChange={v => setEditando(p => ({ ...p, nome: v }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Preço (R$)" type="number" value={String(editando?.preco ?? 0)} onChange={v => setEditando(p => ({ ...p, preco: Number(v) }))} />
            <Input label="Duração (min)" type="number" value={String(editando?.duracao_min ?? 30)} onChange={v => setEditando(p => ({ ...p, duracao_min: Number(v) }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Cor" type="color" value={editando?.cor ?? '#6366f1'} onChange={v => setEditando(p => ({ ...p, cor: v }))} />
            <Input label="Folga pós (min)" type="number" value={String(editando?.intervalo_pos_min ?? 0)} onChange={v => setEditando(p => ({ ...p, intervalo_pos_min: Number(v) }))} />
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

      <ConfirmDialog
        open={!!excluirId}
        onClose={() => setExcluirId(null)}
        onConfirm={handleExcluir}
        title="Excluir serviço"
        message="Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita."
      />
    </div>
  )
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs text-tenue mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-elevado border border-borda rounded-xl px-4 py-2.5 text-marca placeholder-suave outline-none focus:border-borda-forte transition-colors text-sm"
      />
    </div>
  )
}
