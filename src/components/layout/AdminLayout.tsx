import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTenant } from '@/contexts/TenantContext'

export function AdminLayout() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { tenant } = useTenant()

  return (
    <div className="min-h-screen bg-fundo">
      <header className="border-b border-borda bg-fosco">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-marca">Painel da Plataforma</span>
            <nav className="flex gap-1">
              <button onClick={() => navigate('/admin')}
                className="text-xs text-tenue hover:text-marca px-2 py-1 rounded-lg transition-colors">
                Negócios
              </button>
              <button onClick={() => navigate('/admin/logs')}
                className="text-xs text-tenue hover:text-marca px-2 py-1 rounded-lg transition-colors">
                Logs
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')}
              className="text-xs text-tenue hover:text-marca transition-colors">
              Voltar ao app
            </button>
            <span className="text-xs text-tenue">{user?.nome}</span>
            <button onClick={signOut} className="text-xs text-perigo-claro hover:underline">Sair</button>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
