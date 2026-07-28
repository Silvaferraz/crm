import { supabase } from '@/lib/supabase'
import type { Tag } from '@/types'

export async function listarTags(tenantId: string) {
  const { data } = await supabase
    .from('tags')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('nome')
  return (data ?? []) as Tag[]
}

export async function salvarTag(t: Partial<Tag> & { tenant_id: string }) {
  if (t.id) {
    await supabase.from('tags').update(t).eq('id', t.id)
    return
  }
  await supabase.from('tags').insert(t)
}

export async function excluirTag(id: string) {
  await supabase.from('tags').delete().eq('id', id)
}
