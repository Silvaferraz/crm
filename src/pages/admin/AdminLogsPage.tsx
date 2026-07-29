import { useState, useEffect, useCallback } from 'react'
import { listarLogs } from '@/services/admin'

export function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([])

  const carregar = useCallback(async () => {
    setLogs(await listarLogs())
  }, [])

  useEffect(() => { carregar() }, [carregar])

  return (
    <div className="min-h-screen bg-fundo">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold text-marca mb-6">Logs de Auditoria</h1>

        <div className="bg-card border border-borda rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-borda">
                <th className="text-left text-xs text-tenue font-medium px-4 py-3">Data</th>
                <th className="text-left text-xs text-tenue font-medium px-4 py-3">Usuário</th>
                <th className="text-left text-xs text-tenue font-medium px-4 py-3">Ação</th>
                <th className="text-left text-xs text-tenue font-medium px-4 py-3">Descrição</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr><td colSpan={4} className="text-center text-tenue text-sm py-8">Nenhum log registrado</td></tr>
              )}
              {logs.map(l => (
                <tr key={l.id} className="border-b border-borda/50">
                  <td className="px-4 py-3 text-xs text-tenue whitespace-nowrap">
                    {new Date(l.criado_em).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-sm text-marca">{l.usuario}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-elevado text-suave px-2 py-0.5 rounded-full">{l.acao}</span></td>
                  <td className="px-4 py-3 text-sm text-suave">{l.descricao ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
