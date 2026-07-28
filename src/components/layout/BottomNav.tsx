import { useLocation, useNavigate } from 'react-router-dom'

const itens = [
  { path: '/', label: 'Cobrar', icon: 'cifrao' },
  { path: '/agenda', label: 'Agenda', icon: 'calendario' },
  { path: '/clientes', label: 'Clientes', icon: 'usuarios' },
  { path: '/mensagens', label: 'Mensagens', icon: 'mensagem' },
  { path: '/caixa', label: 'Caixa', icon: 'recibo', adminOnly: true },
]

interface BottomNavProps {
  papel?: string | null
  isSuperAdmin?: boolean
}

export function BottomNav({ papel }: BottomNavProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const visiveis = itens.filter(
    i => !i.adminOnly || papel === 'owner' || papel === 'admin'
  )

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-fundo/80 backdrop-blur-lg border-t border-borda safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {visiveis.map(item => {
          const ativo = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center justify-center gap-0.5 h-full px-3 min-w-0"
            >
              {ativo && (
                <span className="absolute top-0 left-1/4 right-1/4 h-0.5 rounded-full bg-marca" />
              )}
              <Icon name={item.icon} ativo={ativo} />
              <span className={`text-[10px] leading-tight ${ativo ? 'text-marca font-medium' : 'text-tenue'}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function Icon({ name, ativo }: { name: string; ativo: boolean }) {
  const className = `w-6 h-6 ${ativo ? 'text-marca' : 'text-tenue'}`

  switch (name) {
    case 'cifrao':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8" /><path d="M12 6v12" />
        </svg>
      )
    case 'calendario':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    case 'usuarios':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case 'mensagem':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    case 'recibo':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" /><path d="M8 7h8" /><path d="M8 11h8" /><path d="M8 15h5" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
  }
}
