import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { listarCobrancas, gerarCobrancas, marcarPago, atualizarTenant } from '@/services/admin'
import type { Tenant } from '@/types'

export function AdminTenantPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [cobrancas, setCobrancas] = useState<any[]>([])
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState('')

  const carregar = useCallback(async () => {
    if (!id) return
    const { data } = await supabase.from('tenants').select('*').eq('id', id).single()
    setTenant(data)
    setCobrancas(await listarCobrancas(id))
  }, [id])

  useEffect(() => { carregar() }, [carregar])

  if (!tenant) return null

  async function handleSalvar() {
    if (!id) return
    await atualizarTenant(id, { categoria: form.categoria, valor_mensal: Number(form.valor_mensal), vencimento: Number(form.vencimento) })
    setEditando(false)
    carregar()
    setMsg('Salvo!')
  }

  async function handleGerarCobranca() {
    if (!id) return
    const mes = new Date().toISOString().slice(0, 7)
    const qtd = await gerarCobrancas(mes)
    setMsg(`${qtd} cobrança(s) gerada(s) para ${mes}`)
    carregar()
  }

  async function handleMarcarPago(cobrancaId: string) {
    await marcarPago(cobrancaId)
    carregar()
    setMsg('Marcado como pago')
  }

  async function handleEntrar() {
    if (!id) return
    const { data } = await supabase.rpc('admin_log', {
      p_acao: 'entrar_no_tenant',
      p_descricao: `Super admin entrou no tenant ${tenant.nome}`,
      p_tenant_id: id,
    })
    navigate(`/?tenant_id=${id}`, { replace: true })
  }

  const mesAtual = new Date().toISOString().slice(0, 7)

  return (
    <div className="min-h-screen bg-fundo">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/admin')} className="text-tenue hover:text-marca transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-2xl font-semibold text-marca">{tenant.nome}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full ${tenant.ativa ? 'bg-sucesso/20 text-sucesso-claro' : 'bg-perigo/20 text-perigo-claro'}`}>
            {tenant.ativa ? 'Ativo' : 'Inativo'}
          </span>
        </div>

        {msg && <p className="text-sm text-sucesso-claro mb-4">{msg}</p>}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-card border border-borda rounded-2xl p-4">
            <p className="text-xs text-tenue">Vertical</p>
            <p className="text-marca font-medium">{tenant.categoria}</p>
          </div>
          <div className="bg-card border border-borda rounded-2xl p-4">
            <p className="text-xs text-tenue">Mensalidade</p>
            <p className="text-marca font-medium tabular-nums">R$ {Number(tenant.valor_mensal).toFixed(2)}</p>
          </div>
          <div className="bg-card border border-borda rounded-2xl p-4">
            <p className="text-xs text-tenue">Vencimento</p>
            <p className="text-marca font-medium">Dia {tenant.vencimento}</p>
          </div>
          <div className="bg-card border border-borda rounded-2xl p-4">
            <p className="text-xs text-tenue">Fuso</p>
            <p className="text-marca font-medium">{tenant.timezone}</p>
          </div>
        </div>

        {/* Editar */}
        <div className="bg-card border border-borda rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-marca">Configuração</h2>
            <button onClick={() => { setForm({ categoria: tenant.categoria, valor_mensal: String(tenant.valor_mensal), vencimento: String(tenant.vencimento) }); setEditando(!editando) }}
              className="text-xs text-suave hover:text-marca">{editando ? 'Cancelar' : 'Editar'}</button>
          </div>
          {editando ? (
            <div className="space-y-3">
              <select value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}
                className="w-full bg-elevado border border-borda rounded-xl px-4 py-2.5 text-marca outline-none text-sm">
                <option value="barbearia">Barbearia</option>
                <option value="salao">Salão</option>
                <option value="estetica">Estética</option>
                <option value="clinica">Clínica</option>
              </select>
              <input type="number" value={form.valor_mensal} onChange={e => setForm(p => ({ ...p, valor_mensal: e.target.value }))}
                placeholder="Valor mensal" className="w-full bg-elevado border border-borda rounded-xl px-4 py-2.5 text-marca outline-none text-sm" />
              <input type="number" value={form.vencimento} onChange={e => setForm(p => ({ ...p, vencimento: e.target.value }))}
                min="1" max="28" placeholder="Dia vencimento" className="w-full bg-elevado border border-borda rounded-xl px-4 py-2.5 text-marca outline-none text-sm" />
              <button onClick={handleSalvar}
                className="bg-marca text-fundo px-4 py-2 rounded-xl text-sm font-medium">Salvar</button>
            </div>
          ) : (
            <p className="text-sm text-suave">{tenant.categoria} · R$ {Number(tenant.valor_mensal).toFixed(2)} · vence dia {tenant.vencimento}</p>
          )}
        </div>

        {/* Cobranças */}
        <div className="bg-card border border-borda rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-marca">Cobranças SaaS</h2>
            <button onClick={handleGerarCobranca}
              className="bg-elevado text-marca px-3 py-1.5 rounded-xl text-xs font-medium">
              Gerar {mesAtual}
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-borda">
                <th className="text-left text-xs text-tenue font-medium py-2">Mês</th>
                <th className="text-right text-xs text-tenue font-medium py-2">Valor</th>
                <th className="text-center text-xs text-tenue font-medium py-2">Status</th>
                <th className="text-right text-xs text-tenue font-medium py-2">Ação</th>
              </tr>
            </thead>
            <tbody>
              {cobrancas.length === 0 && (
                <tr><td colSpan={4} className="text-center text-tenue text-xs py-4">Nenhuma cobrança</td></tr>
              )}
              {cobrancas.map(c => (
                <tr key={c.id} className="border-b border-borda/50">
                  <td className="py-2 text-sm text-marca">{c.mes_referencia}</td>
                  <td className="py-2 text-sm text-marca tabular-nums text-right">R$ {Number(c.valor).toFixed(2)}</td>
                  <td className="py-2 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'pago' ? 'bg-sucesso/20 text-sucesso-claro' : c.status === 'cancelado' ? 'bg-perigo/20 text-perigo-claro' : 'bg-alerta/20 text-alerta-claro'}`}>
                      {c.status === 'pago' ? 'Pago' : c.status === 'cancelado' ? 'Cancelado' : 'Pendente'}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    {c.status === 'pendente' && (
                      <button onClick={() => handleMarcarPago(c.id)}
                        className="text-xs text-sucesso-claro hover:underline">Pago</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Ações */}
        <div className="flex gap-3">
          <button onClick={handleEntrar}
            className="flex-1 bg-marca text-fundo rounded-xl py-3 text-sm font-medium transition-transform active:scale-[0.975]">
            Entrar neste negócio
          </button>
        </div>
      </div>
    </div>
  )
}
