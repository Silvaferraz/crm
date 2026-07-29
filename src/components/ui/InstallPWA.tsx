import { useState, useEffect } from 'react'
import { isInstalled, isIOS, capturarInstallPrompt } from '@/lib/pwa'

export function InstallPWA() {
  const [show, setShow] = useState(false)
  const [prompt, setPrompt] = useState<Event | null>(null)
  const ios = isIOS()
  const installed = isInstalled()

  useEffect(() => {
    if (installed) return
    capturarInstallPrompt().then(setPrompt)
    if (ios) setShow(true)
  }, [])

  useEffect(() => {
    if (prompt) setShow(true)
  }, [prompt])

  if (!show || installed) return null

  async function handleInstall() {
    if (prompt) {
      ;(prompt as any).prompt()
      const res = await (prompt as any).userChoice
      if (res.outcome === 'accepted') setShow(false)
    }
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:w-80">
      <div className="bg-card border border-borda rounded-2xl p-4 shadow-lg">
        <p className="text-sm text-marca font-medium mb-1">
          {ios ? 'Instalar app' : 'Instalar app'}
        </p>
        <p className="text-xs text-tenue mb-3">
          {ios
            ? 'Toque em Compartilhar e depois "Adicionar à Tela de Início"'
            : 'Instale para acesso rápido e offline'}
        </p>
        <div className="flex gap-2">
          {!ios && (
            <button onClick={handleInstall}
              className="flex-1 bg-marca text-fundo rounded-xl py-2 text-sm font-medium transition-transform active:scale-[0.975]">
              Instalar
            </button>
          )}
          <button onClick={() => setShow(false)}
            className="flex-1 bg-elevado text-suave rounded-xl py-2 text-sm font-medium transition-transform active:scale-[0.975]">
            Agora não
          </button>
        </div>
      </div>
    </div>
  )
}
