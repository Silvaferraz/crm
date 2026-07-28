export function Home() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-marca mb-6">Hoje / Cobrar</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {estatisticas.map(est => (
          <div key={est.label} className="bg-card border border-borda rounded-2xl p-4">
            <p className="text-tenue text-xs mb-1">{est.label}</p>
            <p className="text-xl font-semibold text-marca tabular-nums">{est.valor}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-borda rounded-2xl p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-elevado flex items-center justify-center mx-auto mb-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-tenue">
            <circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8" /><path d="M12 6v12" />
          </svg>
        </div>
        <p className="text-suave text-sm">Nenhum atendimento hoje ainda</p>
        <p className="text-tenue text-xs mt-1">Os serviços cobrados aparecerão aqui</p>
      </div>
    </div>
  )
}

const estatisticas = [
  { label: 'Faturamento', valor: 'R$ 0,00' },
  { label: 'Atendimentos', valor: '0' },
  { label: 'Pix Pendente', valor: 'R$ 0,00' },
  { label: 'Clientes', valor: '0' },
]
