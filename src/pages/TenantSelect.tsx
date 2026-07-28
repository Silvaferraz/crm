interface TenantSelectProps {
  tenants: { id: string; nome: string; slug: string }[]
  onSelect: (id: string) => void
}

export function TenantSelect({ tenants, onSelect }: TenantSelectProps) {
  return (
    <div className="min-h-screen bg-fundo flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-marca text-center mb-2">
          Escolher negócio
        </h1>
        <p className="text-suave text-sm text-center mb-6">
          Este usuário tem acesso a mais de um negócio. Selecione qual deseja acessar.
        </p>

        <div className="space-y-3">
          {tenants.map(t => (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className="w-full bg-card border border-borda rounded-xl px-4 py-4 text-marca text-left hover:bg-elevado transition-colors active:scale-[0.975]"
            >
              <span className="font-medium">{t.nome}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
