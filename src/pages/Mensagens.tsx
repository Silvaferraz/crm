export function Mensagens() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-marca mb-6">Mensagens</h1>

      <div className="bg-card border border-borda rounded-2xl p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-elevado flex items-center justify-center mx-auto mb-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-tenue">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <p className="text-suave text-sm">Nenhuma mensagem pendente</p>
        <p className="text-tenue text-xs mt-1">As mensagens para enviar aparecerão aqui</p>
      </div>
    </div>
  )
}
