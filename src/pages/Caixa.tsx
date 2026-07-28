export function Caixa() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-marca mb-6">Financeiro / Caixa</h1>

      <div className="bg-card border border-borda rounded-2xl p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-elevado flex items-center justify-center mx-auto mb-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-tenue">
            <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" />
          </svg>
        </div>
        <p className="text-suave text-sm">Nenhum movimento no período</p>
        <p className="text-tenue text-xs mt-1">As vendas e lançamentos aparecerão aqui</p>
      </div>
    </div>
  )
}
