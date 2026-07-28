import { useState } from 'react'
import { useTenant } from '@/contexts/TenantContext'
import { supabase } from '@/lib/supabase'

export function NegocioPage() {
  const { tenant, setTenant } = useTenant()
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})

  if (!tenant) return null
  const t = tenant

  async function handleSubmit() {
    const { data } = await supabase
      .from('tenants')
      .update({ nome: form.nome, nicho: form.nicho, whatsapp: form.whatsapp, timezone: form.timezone, cor_primaria: form.cor_primaria, cor_fundo: form.cor_fundo, cor_card: form.cor_card })
      .eq('id', t.id)
      .select()
      .single()

    if (data) {
      setTenant(data as any)
      setEditando(false)
    }
  }

  if (!editando) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-marca">Negócio</h1>
          <button onClick={() => { setForm(tenant as unknown as Record<string, string>); setEditando(true) }}
            className="bg-marca text-fundo px-4 py-2 rounded-xl font-medium text-sm transition-transform active:scale-[0.975]">
            Editar
          </button>
        </div>

        <div className="bg-card border border-borda rounded-2xl p-5 space-y-4">
          <Campo label="Nome" value={tenant.nome} />
          <Campo label="Nicho" value={tenant.nicho ?? '-'} />
          <Campo label="WhatsApp" value={tenant.whatsapp ?? '-'} />
          <Campo label="Fuso horário" value={tenant.timezone} />
          <div>
            <p className="text-xs text-tenue mb-2">Cores</p>
            <div className="flex gap-3">
              <Cor label="Primária" cor={tenant.cor_primaria} />
              <Cor label="Fundo" cor={tenant.cor_fundo} />
              <Cor label="Card" cor={tenant.cor_card} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-marca mb-6">Editar Negócio</h1>
      <div className="space-y-4">
        <Input label="Nome" value={form.nome ?? ''} onChange={v => setForm(p => ({ ...p, nome: v }))} />
        <Input label="Nicho" value={form.nicho ?? ''} onChange={v => setForm(p => ({ ...p, nicho: v }))} />
        <Input label="WhatsApp" value={form.whatsapp ?? ''} onChange={v => setForm(p => ({ ...p, whatsapp: v }))} />
        <Input label="Fuso horário" value={form.timezone ?? ''} onChange={v => setForm(p => ({ ...p, timezone: v }))} />
        <div className="grid grid-cols-3 gap-4">
          <Input label="Cor primária" type="color" value={form.cor_primaria ?? '#ffffff'} onChange={v => setForm(p => ({ ...p, cor_primaria: v }))} />
          <Input label="Cor fundo" type="color" value={form.cor_fundo ?? '#0c0c0c'} onChange={v => setForm(p => ({ ...p, cor_fundo: v }))} />
          <Input label="Cor card" type="color" value={form.cor_card ?? '#1a1a1a'} onChange={v => setForm(p => ({ ...p, cor_card: v }))} />
        </div>
        <div className="flex gap-3">
          <button onClick={() => setEditando(false)} className="flex-1 bg-elevado text-marca rounded-xl py-3 font-medium transition-transform active:scale-[0.975]">Cancelar</button>
          <button onClick={handleSubmit} className="flex-1 bg-marca text-fundo rounded-xl py-3 font-medium transition-transform active:scale-[0.975]">Salvar</button>
        </div>
      </div>
    </div>
  )
}

function Campo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-tenue">{label}</p>
      <p className="text-marca">{value}</p>
    </div>
  )
}

function Cor({ label, cor }: { label: string; cor: string | null }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-lg border border-borda" style={{ backgroundColor: cor ?? '#0c0c0c' }} />
      <span className="text-xs text-tenue">{label}</span>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs text-tenue mb-1 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-elevado border border-borda rounded-xl px-4 py-2.5 text-marca placeholder-suave outline-none focus:border-borda-forte transition-colors text-sm" />
    </div>
  )
}
