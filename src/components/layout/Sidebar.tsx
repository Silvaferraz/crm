import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTenant } from '@/contexts/TenantContext'

const itens = [
  { path: '/', label: 'Cobrar', icon: 'cifrao' },
  { path: '/agenda', label: 'Agenda', icon: 'calendario' },
  { path: '/clientes', label: 'Clientes', icon: 'usuarios' },
  { path: '/mensagens', label: 'Mensagens', icon: 'mensagem' },
  { path: '/caixa', label: 'Caixa', icon: 'recibo', adminOnly: true },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { tenant } = useTenant()

  const visiveis = itens.filter(
    i => !i.adminOnly || user?.papel === 'owner' || user?.papel === 'admin'
  )

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-60 bg-fosco border-r border-borda z-50">
      <div className="flex items-center gap-3 px-5 h-16 border-b border-borda">
        {tenant?.logo ? (
          <img src={tenant.logo} alt={tenant.nome} className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <div className="h-8 w-8 rounded-full bg-elevado flex items-center justify-center">
            <span className="text-sm font-bold text-marca">
              {tenant ? tenant.nome.charAt(0).toUpperCase() : 'T'}
            </span>
          </div>
        )}
        <span className="font-semibold text-marca truncate">{tenant?.nome ?? 'TrueBarbershop'}</span>
      </div>

      <nav className="flex-1 flex flex-col gap-1 p-3">
        {visiveis.map(item => {
          const ativo = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors active:scale-[0.975] ${
                ativo
                  ? 'bg-elevado text-marca font-medium'
                  : 'text-suave hover:bg-elevado/50'
              }`}
            >
              <SidebarIcon name={item.icon} ativo={ativo} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-borda p-3">
        <button
          onClick={() => navigate('/ajustes')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-suave hover:bg-elevado/50 w-full transition-colors"
        >
          <SidebarIcon name="ajustes" ativo={false} />
          Ajustes
        </button>

        {user?.super_admin && (
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-suave hover:bg-elevado/50 w-full transition-colors"
          >
            <SidebarIcon name="admin" ativo={false} />
            Painel da Plataforma
          </button>
        )}

        <div className="flex items-center gap-3 px-3 py-3 mt-1">
          <div className="h-8 w-8 rounded-full bg-elevado flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-marca">
              {user?.nome?.charAt(0).toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-marca truncate">{user?.nome ?? 'Usuário'}</p>
            <p className="text-xs text-tenue">{user?.papel}</p>
          </div>
          <button onClick={signOut} className="text-tenue hover:text-perigo transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}

function SidebarIcon({ name, ativo }: { name: string; ativo: boolean }) {
  const className = `w-5 h-5 ${ativo ? 'text-marca' : 'text-tenue'}`

  switch (name) {
    case 'cifrao':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8" /><path d="M12 6v12" /></svg>
    case 'calendario':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
    case 'usuarios':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    case 'mensagem':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
    case 'recibo':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" /><path d="M8 7h8" /><path d="M8 11h8" /><path d="M8 15h5" /></svg>
    case 'ajustes':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
    case 'admin':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
    default:
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="3" /></svg>
  }
}
