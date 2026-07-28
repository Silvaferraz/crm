import { useMemo } from 'react'
import { getRotulo, getRotulos, getServicosSugeridos, getIconePorServico } from '@/lib/terminologia'
import { useTenant } from '@/contexts/TenantContext'
import type { Categoria } from '@/types'

export function useTerminologia() {
  const { tenant } = useTenant()

  return useMemo(() => {
    const categoria: Categoria = tenant?.categoria ?? 'barbearia'
    const overrides = undefined

    return {
      t: (chave: string, plural = false) => getRotulo(categoria, chave, plural, overrides),
      todos: getRotulos(categoria, overrides),
      servicosSugeridos: getServicosSugeridos(categoria),
      iconeServico: getIconePorServico,
      categoria,
    }
  }, [tenant?.categoria])
}
