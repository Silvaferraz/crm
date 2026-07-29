Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/gerar_fila_todos_tenants`, {
    method: 'POST',
    headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
  })

  const total = await res.json()
  return new Response(JSON.stringify({ geradas: total }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
