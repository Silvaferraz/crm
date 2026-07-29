export function registrarSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
    })
  }
}

export function capturarInstallPrompt(): Promise<Event | null> {
  return new Promise((resolve) => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      resolve(e)
    }, { once: true })
    setTimeout(() => resolve(null), 10000)
  })
}

export function isInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
}

export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

export function atualizarManifest(tenant: { nome: string; cor_primaria: string | null; logo: string | null }) {
  const manifestEl = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
  if (manifestEl) {
    const url = new URL(manifestEl.href)
    url.searchParams.set('t', encodeURIComponent(tenant.nome))
    if (tenant.cor_primaria) url.searchParams.set('c', tenant.cor_primaria)
    if (tenant.logo) url.searchParams.set('l', tenant.logo)
    manifestEl.href = url.toString()
  }
}

export function atualizarMetaTags(tenant: { nome: string; cor_primaria: string | null; logo: string | null }) {
  let themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (!themeMeta) {
    themeMeta = document.createElement('meta')
    themeMeta.name = 'theme-color'
    document.head.appendChild(themeMeta)
  }
  themeMeta.content = tenant.cor_primaria || '#0c0c0c'

  let appleIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')
  if (!appleIcon) {
    appleIcon = document.createElement('link')
    appleIcon.rel = 'apple-touch-icon'
    document.head.appendChild(appleIcon)
  }
  appleIcon.href = tenant.logo || '/favicon.svg'

  let appleTitle = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-title"]')
  if (!appleTitle) {
    appleTitle = document.createElement('meta')
    appleTitle.name = 'apple-mobile-web-app-title'
    document.head.appendChild(appleTitle)
  }
  appleTitle.content = tenant.nome

  document.title = tenant.nome
}
