import { useState, useEffect, useCallback } from 'react'
import { useTenant } from '@/contexts/TenantContext'
import { useAuth } from '@/contexts/AuthContext'
import {
  listarNotificacoes, listarTodasNotificacoes,
  marcarEnviada, cancelarNotificacao, gerarFila,
  listarTemplates, salvarTemplate, excluirTemplate,
} from '@/services/mensagens'
import type { MensagemTemplate } from '@/types'
import { Modal } from '@/components/ui/Modal'

type Aba = 'enviar' | 'fila' | 'enviadas' | 'templates'

const tipoMeta: Record<string, { label: string; cor: string }> = {
  lembrete_24h: { label: 'Lembrete', cor: '#3b82f6' },
  aniversario: { label: 'Aniversário', cor: '#ec4899' },
  retorno: { label: 'Retorno', cor: '#f59e0b' },
  pos_atendimento: { label: 'Pós-atendimento', cor: '#10b981' },
}

export function Mensagens() {
  const { tenant } = useTenant()
  const { user } = useAuth()
  const isAdmin = user?.papel === 'owner' || user?.papel === 'admin'
  const [aba, setAba] = useState<Aba>('enviar')
  const [pendentes, setPendentes] = useState<any[]>([])
  const [fila, setFila] = useState<any[]>([])
  const [enviadas, setEnviadas] = useState<any[]>([])
  const [templates, setTemplates] = useState<MensagemTemplate[]>([])
  const [gerando, setGerando] = useState(false)
  const [editando, setEditando] = useState<Partial<MensagemTemplate> | null>(null)
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [mensagem, setMensagem] = useState('')

  const carregar = useCallback(async () => {
    if (!tenant) return
    setPendentes(await listarNotificacoes(tenant.id, 'pendente'))
    setFila(await listarNotificacoes(tenant.id, 'pendente'))
    setEnviadas(await listarNotificacoes(tenant.id, 'enviada'))
    setTemplates(await listarTemplates(tenant.id))
  }, [tenant])

  useEffect(() => { carregar() }, [carregar])

  async function handleGerar() {
    if (!tenant) return
    setGerando(true)
    try {
      const qtd = await gerarFila(tenant.id)
      setMensagem(`${qtd} notificações geradas`)
      carregar()
    } catch {
      setMensagem('Erro ao gerar fila')
    }
    setGerando(false)
  }

  async function handleEnviar(n: any) {
    await marcarEnviada(n.id)
    carregar()
  }

  async function handleSalvarTemplate() {
    if (!tenant || !editando) return
    await salvarTemplate({ ...editando, tenant_id: tenant.id })
    setShowTemplateForm(false)
    setEditando(null)
    carregar()
  }

  async function handleExcluirTemplate(id: string) {
    await excluirTemplate(id)
    carregar()
  }

  const abas = [
    { key: 'enviar', label: 'Para enviar' },
    { key: 'fila', label: 'Na fila' },
    { key: 'enviadas', label: 'Enviadas' },
    ...(isAdmin ? [{ key: 'templates', label: 'Modelos' }] : []),
  ] as { key: Aba; label: string }[]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-marca">Mensagens</h1>
        <button onClick={handleGerar} disabled={gerando}
          className="bg-marca text-fundo px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 transition-transform active:scale-[0.975]">
          {gerando ? 'Gerando...' : 'Gerar agora'}
        </button>
      </div>

      {mensagem && (
        <p className="text-sm text-sucesso-claro mb-3">{mensagem}</p>
      )}

      <div className="flex gap-1 mb-4 bg-elevado rounded-xl p-1 overflow-x-auto">
        {abas.map(a => (
          <button key={a.key} onClick={() => setAba(a.key)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              aba === a.key ? 'bg-card text-marca shadow-sm' : 'text-tenue'
            }`}>
            {a.label}
          </button>
        ))}
      </div>

      {aba === 'templates' && (
        <div className="space-y-2">
          {templates.length === 0 && (
            <div className="bg-card border border-borda border-dashed rounded-2xl p-8 text-center">
              <p className="text-tenue text-sm">Nenhum modelo de mensagem</p>
              <p className="text-tenue text-xs mt-1">Crie modelos para gerar lembretes automaticamente</p>
            </div>
          )}
          {templates.map(t => {
            const meta = tipoMeta[t.tipo] ?? { label: t.tipo, cor: '#888' }
            return (
              <div key={t.id} className="bg-card border border-borda rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.cor }} />
                    <span className="text-sm font-medium text-marca">{meta.label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.ativo ? 'bg-sucesso/20 text-sucesso-claro' : 'bg-elevado text-tenue'}`}>
                      {t.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditando(t); setShowTemplateForm(true) }}
                      className="text-xs text-tenue hover:text-marca">Editar</button>
                    <button onClick={() => handleExcluirTemplate(t.id)}
                      className="text-xs text-tenue hover:text-perigo-claro">Excluir</button>
                  </div>
                </div>
                <p className="text-xs text-tenue mb-1">Antecedência: {t.antecedencia}h</p>
                <p className="text-sm text-suave whitespace-pre-wrap line-clamp-2">{t.corpo}</p>
              </div>
            )
          })}
          <button onClick={() => { setEditando({ ativo: false, canal: 'whatsapp_link', antecedencia: 24 }); setShowTemplateForm(true) }}
            className="w-full border-2 border-dashed border-borda rounded-2xl py-4 text-tenue hover:text-marca hover:border-borda-forte transition-colors text-sm">
            + Novo modelo
          </button>
        </div>
      )}

      {(aba === 'enviar' || aba === 'fila') && (
        <div className="space-y-2">
          {(aba === 'enviar' ? pendentes.filter(n => n.status === 'pendente') : fila.filter(n => n.status === 'pendente' && new Date(n.agendado_para) > new Date())).length === 0 && (
            <div className="bg-card border border-borda border-dashed rounded-2xl p-8 text-center">
              <p className="text-tenue text-sm">Nenhuma mensagem {aba === 'enviar' ? 'para enviar' : 'na fila'}</p>
            </div>
          )}
          {(aba === 'enviar' ? pendentes.filter(n => n.status === 'pendente') : fila.filter(n => n.status === 'pendente' && new Date(n.agendado_para) > new Date())).map(n => {
            const meta = tipoMeta[n.tipo] ?? { label: n.tipo, cor: '#888' }
            return (
              <div key={n.id} className="bg-card border border-borda rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.cor }} />
                  <span className="text-xs font-medium" style={{ color: meta.cor }}>{meta.label}</span>
                  {n.agendamentos?.profissionais && (
                    <span className="text-xs text-tenue">— {n.agendamentos.profissionais.nome}</span>
                  )}
                </div>
                <p className="text-sm text-marca font-medium mb-1">{n.clientes?.nome}</p>
                <p className="text-sm text-suave whitespace-pre-wrap mb-3">{n.corpo_renderizado}</p>
                <div className="flex gap-2">
                  {n.destino_e164 && (
                    <a href={`https://wa.me/${n.destino_e164}?text=${encodeURIComponent(n.corpo_renderizado)}`}
                      target="_blank" rel="noopener noreferrer"
                      onClick={() => {
                        const body = JSON.stringify({ p_id: n.id })
                        navigator.sendBeacon(
                          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/marcar_notificacao_enviada`,
                          body
                        )
                        handleEnviar(n)
                      }}
                      className="flex-1 bg-sucesso/20 text-sucesso-claro text-center rounded-xl py-2 text-sm font-medium transition-transform active:scale-[0.975]">
                      Enviar WhatsApp
                    </a>
                  )}
                  <button onClick={() => cancelarNotificacao(n.id).then(carregar)}
                    className="flex-1 bg-perigo/20 text-perigo-claro rounded-xl py-2 text-sm font-medium transition-transform active:scale-[0.975]">
                    Cancelar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {aba === 'enviadas' && (
        <div className="space-y-2">
          {enviadas.length === 0 && (
            <div className="bg-card border border-borda border-dashed rounded-2xl p-8 text-center">
              <p className="text-tenue text-sm">Nenhuma mensagem enviada</p>
            </div>
          )}
          {enviadas.map(n => {
            const meta = tipoMeta[n.tipo] ?? { label: n.tipo, cor: '#888' }
            return (
              <div key={n.id} className="bg-card border border-borda rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.cor }} />
                  <span className="text-xs font-medium" style={{ color: meta.cor }}>{meta.label}</span>
                  <span className="text-xs text-tenue ml-auto">
                    {n.enviado_em ? new Date(n.enviado_em).toLocaleString('pt-BR') : ''}
                  </span>
                </div>
                <p className="text-sm text-marca font-medium">{n.clientes?.nome}</p>
                <p className="text-sm text-suave whitespace-pre-wrap line-clamp-2">{n.corpo_renderizado}</p>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={showTemplateForm} onClose={() => { setShowTemplateForm(false); setEditando(null) }} title="Modelo de mensagem">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-tenue mb-1 block">Tipo</label>
            <select value={editando?.tipo ?? ''} onChange={e => setEditando(p => ({ ...p, tipo: e.target.value }))}
              className="w-full bg-elevado border border-borda rounded-xl px-4 py-2.5 text-marca outline-none text-sm">
              <option value="">Selecionar...</option>
              <option value="lembrete_24h">Lembrete 24h</option>
              <option value="aniversario">Aniversário</option>
              <option value="retorno">Retorno</option>
              <option value="pos_atendimento">Pós-atendimento</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-tenue mb-1 block">Título (uso interno)</label>
            <input value={editando?.titulo ?? ''} onChange={e => setEditando(p => ({ ...p, titulo: e.target.value }))}
              className="w-full bg-elevado border border-borda rounded-xl px-4 py-2.5 text-marca outline-none focus:border-borda-forte text-sm" />
          </div>
          <div>
            <label className="text-xs text-tenue mb-1 block">
              Corpo da mensagem
              <span className="text-tenue ml-2">
                {'{cliente_nome}'} {'{profissional_nome}'} {'{servico_nome}'} {'{data_hora}'} {'{estabelecimento}'}
              </span>
            </label>
            <textarea value={editando?.corpo ?? ''} onChange={e => setEditando(p => ({ ...p, corpo: e.target.value }))}
              className="w-full bg-elevado border border-borda rounded-xl px-4 py-2.5 text-marca outline-none focus:border-borda-forte text-sm resize-none h-32" />
          </div>
          <div>
            <label className="text-xs text-tenue mb-1 block">Antecedência (horas para lembrete/pós, dias para retorno)</label>
            <input type="number" value={editando?.antecedencia ?? 24} onChange={e => setEditando(p => ({ ...p, antecedencia: Number(e.target.value) }))}
              className="w-full bg-elevado border border-borda rounded-xl px-4 py-2.5 text-marca outline-none focus:border-borda-forte text-sm" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={editando?.ativo ?? false} onChange={e => setEditando(p => ({ ...p, ativo: e.target.checked }))}
              className="accent-marca" />
            <span className="text-sm text-suave">Ativo</span>
          </label>
          <button onClick={handleSalvarTemplate}
            className="w-full bg-marca text-fundo rounded-xl py-3 text-sm font-medium transition-transform active:scale-[0.975]">
            Salvar
          </button>
        </div>
      </Modal>
    </div>
  )
}
