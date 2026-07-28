import { useNavigate } from 'react-router-dom'

const itensAjustes = [
  { label: 'Negócio', path: '/ajustes/negocio' },
  { label: 'Recebimento', path: '/ajustes/recebimento' },
  { label: 'Serviços', path: '/ajustes/servicos' },
  { label: 'Produtos', path: '/ajustes/produtos' },
  { label: 'Equipe', path: '/ajustes/equipe' },
  { label: 'Usuários', path: '/ajustes/usuarios' },
]

export function Ajustes() {
  const navigate = useNavigate()

  return (
    <div>
      <h1 className="text-2xl font-semibold text-marca mb-6">Ajustes</h1>

      <div className="space-y-3">
        {itensAjustes.map(item => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="w-full bg-card border border-borda rounded-2xl px-5 py-4 text-left flex items-center justify-between hover:bg-elevado transition-colors active:scale-[0.975]"
          >
            <span className="text-marca font-medium">{item.label}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-tenue">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}
