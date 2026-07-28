export function Agenda() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-marca mb-6">Agenda</h1>

      <div className="bg-card border border-borda rounded-2xl p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-elevado flex items-center justify-center mx-auto mb-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-tenue">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <p className="text-suave text-sm">Nenhum agendamento para hoje</p>
        <p className="text-tenue text-xs mt-1">Os horários agendados aparecerão aqui</p>
      </div>
    </div>
  )
}
