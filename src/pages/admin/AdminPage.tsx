import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarTenantsMetricas, setTenantAtivo, criarTenant } from '@/services/admin'
import { supabase } from '@/lib/supabase'

export function AdminPage() {
  const navigate = useNavigate()
  const [tenants, setTenants] = useState<any[]>([])
  const [showNovo, setShowNovo] = useState(false)
  const [novoForm, setNovoForm] = useState({ nome: '', slug: '', categoria: 'barbearia', timezone: 'America/Sao_Paulo' })

  const carregar = useCallback(async () => {
    setTenants(await listarTenantsMetricas())
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const mrr = tenants.filter(t => t.ativa).reduce((s, t) => s + Number(t.valor_mensal), 0)
  const mrrPago = tenants.reduce((s, t) => s + Number(t.mrr_pago), 0)

  async function toggleAtivo(t: any) {
    await setTenantAtivo(t.id, !t.ativa)
    carregar()
  }

  async function handleCriar() {
    await criarTenant(novoForm)
    setShowNovo(false)
    carregar()
  }

  return (
    <div className="min-h-screen bg-fundo">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-marca">Painel da Plataforma</h1>
          <button onClick={() => setShowNovo(true)}
            className="bg-marca text-fundo px-4 py-2 rounded-xl text-sm font-medium">
            + Novo negócio
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-borda rounded-2xl p-4">
            <p className="text-xs text-tenue uppercase tracking-wide">MRR Potencial</p>
            <p className="text-2xl font-bold text-marca tabular-nums">R$ {mrr.toFixed(2)}</p>
            <p className="text-xs text-tenue">{tenants.filter(t => t.ativa).length} negócios ativos</p>
          </div>
          <div className="bg-card border border-borda rounded-2xl p-4">
            <p className="text-xs text-tenue uppercase tracking-wide">MRR Pago (histórico)</p>
            <p className="text-2xl font-bold text-sucesso-claro tabular-nums">R$ {mrrPago.toFixed(2)}</p>
          </div>
          <div className="bg-card border border-borda rounded-2xl p-4">
            <p className="text-xs text-tenue uppercase tracking-wide">Total Clientes</p>
            <p className="text-2xl font-bold text-marca tabular-nums">
              {tenants.reduce((s, t) => s + Number(t.qtd_clientes), 0)}
            </p>
          </div>
        </div>

        <div className="bg-card border border-borda rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-borda">
                <th className="text-left text-xs text-tenue font-medium px-4 py-3">Negócio</th>
                <th className="text-left text-xs text-tenue font-medium px-4 py-3">Vertical</th>
                <th className="text-right text-xs text-tenue font-medium px-4 py-3">Usuários</th>
                <th className="text-right text-xs text-tenue font-medium px-4 py-3">Clientes</th>
                <th className="text-right text-xs text-tenue font-medium px-4 py-3">Mensal</th>
                <th className="text-center text-xs text-tenue font-medium px-4 py-3">Status</th>
                <th className="text-center text-xs text-tenue font-medium px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map(t => (
                <tr key={t.id} className="border-b border-borda/50 hover:bg-elevado/30 transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => navigate(`/admin/tenants/${t.id}`)}
                      className="text-sm text-marca font-medium hover:text-suave transition-colors text-left">
                      {t.nome}
                    </button>
                    <p className="text-xs text-tenue">{t.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-suave">{t.categoria}</td>
                  <td className="px-4 py-3 text-sm text-marca tabular-nums text-right">{t.qtd_usuarios}</td>
                  <td className="px-4 py-3 text-sm text-marca tabular-nums text-right">{t.qtd_clientes}</td>
                  <td className="px-4 py-3 text-sm text-marca tabular-nums text-right">R$ {Number(t.valor_mensal).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${t.ativa ? 'bg-sucesso/20 text-sucesso-claro' : 'bg-perigo/20 text-perigo-claro'}`}>
                      {t.ativa ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => toggleAtivo(t)}
                        className={`text-xs px-2 py-1 rounded-lg ${t.ativa ? 'text-perigo-claro hover:bg-perigo/20' : 'text-sucesso-claro hover:bg-sucesso/20'} transition-colors`}>
                        {t.ativa ? 'Desativar' : 'Ativar'}
                      </button>
                      <button onClick={() => navigate(`/admin/tenants/${t.id}`)}
                        className="text-xs px-2 py-1 rounded-lg text-suave hover:bg-elevado transition-colors">
                        Gerenciar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showNovo && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowNovo(false)}>
            <div className="bg-card border border-borda rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-semibold text-marca">Novo negócio</h2>
              <input value={novoForm.nome} onChange={e => setNovoForm(p => ({ ...p, nome: e.target.value }))}
                placeholder="Nome" className="w-full bg-elevado border border-borda rounded-xl px-4 py-2.5 text-marca outline-none text-sm" />
              <input value={novoForm.slug} onChange={e => setNovoForm(p => ({ ...p, slug: e.target.value }))}
                placeholder="Slug (ex.: minha-barbearia)" className="w-full bg-elevado border border-borda rounded-xl px-4 py-2.5 text-marca outline-none text-sm" />
              <select value={novoForm.categoria} onChange={e => setNovoForm(p => ({ ...p, categoria: e.target.value }))}
                className="w-full bg-elevado border border-borda rounded-xl px-4 py-2.5 text-marca outline-none text-sm">
                <option value="barbearia">Barbearia</option>
                <option value="salao">Salão</option>
                <option value="estetica">Estética</option>
                <option value="clinica">Clínica</option>
              </select>
              <button onClick={handleCriar}
                className="w-full bg-marca text-fundo rounded-xl py-3 text-sm font-medium">
                Criar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
