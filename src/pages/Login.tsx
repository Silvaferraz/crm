import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTenant } from '@/contexts/TenantContext'

interface LoginProps {
  onTenantsFound: (tenants: { id: string; nome: string; slug: string }[]) => void
}

export function Login({ onTenantsFound }: LoginProps) {
  const { signIn } = useAuth()
  const { tenant } = useTenant()
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    const result = await signIn(usuario, senha)

    if (result.erro) {
      setErro(result.erro)
      setLoading(false)
      return
    }

    if (result.tenantsVinculados) {
      onTenantsFound(result.tenantsVinculados)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-fundo flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {tenant?.logo ? (
            <img src={tenant.logo} alt={tenant.nome} className="h-12 mx-auto mb-2" />
          ) : (
            <div className="h-12 w-12 rounded-full bg-elevado flex items-center justify-center mx-auto mb-2">
              <span className="text-xl font-bold text-marca">
                {tenant ? tenant.nome.charAt(0).toUpperCase() : 'T'}
              </span>
            </div>
          )}
          <h1 className="text-xl font-semibold text-marca">
            {tenant?.nome ?? 'TrueBarbershop'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Usuário"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
              className="w-full bg-card border border-borda rounded-xl px-4 py-3 text-marca placeholder-suave outline-none focus:border-borda-forte transition-colors"
              autoComplete="username"
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              className="w-full bg-card border border-borda rounded-xl px-4 py-3 text-marca placeholder-suave outline-none focus:border-borda-forte transition-colors"
              autoComplete="current-password"
            />
          </div>

          <label className="flex items-center gap-2 text-suave text-sm">
            <input type="checkbox" className="rounded border-borda bg-card" />
            Continuar conectado neste aparelho
          </label>

          {erro && (
            <p className="text-perigo text-sm text-center">{erro}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-marca text-fundo font-semibold rounded-xl py-3 transition-transform active:scale-[0.975] disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
