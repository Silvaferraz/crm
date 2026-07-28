export function Clientes() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-marca mb-6">Clientes</h1>

      <div className="bg-card border border-borda rounded-2xl p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-elevado flex items-center justify-center mx-auto mb-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-tenue">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          </svg>
        </div>
        <p className="text-suave text-sm">Nenhum cliente cadastrado</p>
        <p className="text-tenue text-xs mt-1">Os clientes cadastrados aparecerão aqui</p>
      </div>
    </div>
  )
}
