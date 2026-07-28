import { createClient } from 'npm:@supabase/supabase-js'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req: Request) => {
  const url = new URL(req.url)
  const tenantId = url.searchParams.get('tenant_id')
  const inicio = url.searchParams.get('inicio')
  const fim = url.searchParams.get('fim')
  const nomeParam = url.searchParams.get('nome')

  if (!tenantId || !inicio || !fim) {
    return new Response('Missing parameters', { status: 400 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  let nomeTenant = nomeParam || 'Relatório Financeiro'
  try {
    const { data: tenant } = await supabase.from('tenants').select('nome').eq('id', tenantId).single()
    if (tenant?.nome) nomeTenant = tenant.nome
  } catch { /* fallback */ }

  const { data: resumo } = await supabase.rpc('resumo_financeiro', {
    p_tenant_id: tenantId,
    p_inicio: inicio,
    p_fim: fim,
  })

  const d = resumo as any
  const fmt = (v: number) => v.toFixed(2)

  const porForma = (f: string) => {
    const item = d?.por_forma?.find((x: any) => x.forma === f)
    const nome = f === 'dinheiro' ? 'Dinheiro' : f === 'maquininha' ? 'Maquininha' : 'Pix'
    return `<tr><td>${nome}</td><td class="num">R$ ${item ? fmt(item.total) : '0,00'}</td></tr>`
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório Financeiro</title>
<style>
  @page { margin: 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; font-size: 12px; color: #111; background: #fff; padding: 40px; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .periodo { font-size: 13px; color: #666; margin-bottom: 24px; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
  .card .label { font-size: 11px; color: #888; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
  .card .valor { font-size: 18px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .verde { color: #16a34a; }
  .vermelho { color: #dc2626; }
  section { margin-bottom: 24px; }
  h2 { font-size: 14px; margin-bottom: 8px; color: #333; border-bottom: 1px solid #eee; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 12px; }
  th { color: #888; font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; }
  td { color: #333; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .footer { margin-top: 32px; font-size: 10px; color: #aaa; text-align: center; }
  @media print { body { padding: 0; } .no-print { display: none; } }
</style>
</head>
<body>
  <h1>{{NOME}}</h1>
  <p class="periodo">${new Date(inicio).toLocaleDateString('pt-BR')} — ${new Date(fim).toLocaleDateString('pt-BR')}</p>

  <div class="grid">
    <div class="card"><div class="label">Vendas</div><div class="valor">R$ ${fmt(d?.total_vendas ?? 0)}</div></div>
    <div class="card"><div class="label">Atendimentos</div><div class="valor">${d?.qtd_atendimentos ?? 0}</div></div>
    <div class="card"><div class="label">Ticket Médio</div><div class="valor">R$ ${fmt(d?.ticket_medio ?? 0)}</div></div>
    <div class="card"><div class="label">Saldo</div><div class="valor ${(d?.saldo ?? 0) >= 0 ? 'verde' : 'vermelho'}">R$ ${fmt(d?.saldo ?? 0)}</div></div>
  </div>

  ${d?.pix_pendente > 0 ? `<p style="color:#d97706;margin-bottom:16px;font-size:13px;">Pix pendente: R$ ${fmt(d.pix_pendente)} (não incluso no saldo)</p>` : ''}

  <section>
    <h2>Por forma de pagamento</h2>
    <table>
      <thead><tr><th>Forma</th><th class="num">Total</th></tr></thead>
      <tbody>${['dinheiro', 'maquininha', 'pix'].map(porForma).join('')}</tbody>
    </table>
  </section>

  ${d?.serie_diaria?.length > 0 ? `
  <section>
    <h2>Série diária</h2>
    <table>
      <thead><tr><th>Dia</th><th class="num">Total</th></tr></thead>
      <tbody>${d.serie_diaria.map((s: any) => `<tr><td>${new Date(s.dia + 'T12:00:00').toLocaleDateString('pt-BR')}</td><td class="num">R$ ${fmt(s.total)}</td></tr>`).join('')}</tbody>
    </table>
  </section>` : ''}

  ${d?.ranking_servicos?.length > 0 ? `
  <section>
    <h2>Serviços mais vendidos</h2>
    <table>
      <thead><tr><th>Serviço</th><th class="num">Qtd</th><th class="num">Total</th></tr></thead>
      <tbody>${d.ranking_servicos.map((s: any) => `<tr><td>${s.servico}</td><td class="num">${s.qtd}</td><td class="num">R$ ${fmt(s.total)}</td></tr>`).join('')}</tbody>
    </table>
  </section>` : ''}

  ${d?.ranking_profissionais?.length > 0 ? `
  <section>
    <h2>Ranking por profissional</h2>
    <table>
      <thead><tr><th>Profissional</th><th class="num">Qtd</th><th class="num">Total</th></tr></thead>
      <tbody>${d.ranking_profissionais.map((p: any) => `<tr><td>${p.profissional}</td><td class="num">${p.qtd}</td><td class="num">R$ ${fmt(p.total)}</td></tr>`).join('')}</tbody>
    </table>
  </section>` : ''}

  <p class="no-print" style="margin-top:24px;text-align:center">
    <button onclick="window.print()" style="padding:10px 24px;font-size:14px;border:1px solid #ccc;border-radius:6px;background:#f5f5f5;cursor:pointer;">Salvar como PDF</button>
  </p>

  <p class="footer">Gerado em ${new Date().toLocaleString('pt-BR')} • TrueBarbershop</p>
  <script>window.onload = () => { if (window.location.search.includes('print=true')) window.print() }</script>
</body>
</html>`

  const saida = html.replace('{{NOME}}', nomeTenant)

  return new Response(saida, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
})
