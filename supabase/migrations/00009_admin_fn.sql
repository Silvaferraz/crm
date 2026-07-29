-- Métricas dos tenants para o painel super admin
create or replace function public.admin_tenants_metricas()
returns table (
  id uuid,
  nome text,
  slug text,
  categoria text,
  ativa boolean,
  vencimento integer,
  valor_mensal numeric,
  created_at timestamptz,
  qtd_usuarios bigint,
  qtd_clientes bigint,
  mrr_pago numeric,
  ultimo_pagamento text
)
language plpgsql
security definer
set search_path = public
as $func$
begin
  return query
  select
    t.id, t.nome, t.slug, t.categoria, t.ativa, t.vencimento, t.valor_mensal, t.created_at,
    coalesce((select count(*) from usuarios u where u.tenant_id = t.id), 0) as qtd_usuarios,
    coalesce((select count(*) from clientes c where c.tenant_id = t.id), 0) as qtd_clientes,
    coalesce((
      select sum(valor) from pagamentos_saas ps
      where ps.tenant_id = t.id and ps.status = 'pago'
    ), 0) as mrr_pago,
    (select ps.mes_referencia from pagamentos_saas ps
     where ps.tenant_id = t.id and ps.status = 'pago'
     order by ps.mes_referencia desc limit 1) as ultimo_pagamento
  from tenants t
  order by t.nome;
end;
$func$;

-- Log de auditoria (inserir)
create or replace function public.admin_log(
  p_acao text,
  p_descricao text default null,
  p_tenant_id uuid default null,
  p_ip text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $func$
begin
  insert into logs_auditoria (tenant_id, usuario, acao, descricao, ip)
  values (
    p_tenant_id,
    (select nome from usuarios where auth_user_id = auth.uid() limit 1)::text,
    p_acao,
    p_descricao,
    p_ip
  );
end;
$func$;

-- Gerar cobrança SaaS do mês para todos os tenants ativos
create or replace function public.admin_gerar_cobrancas(p_mes_referencia text)
returns integer
language plpgsql
security definer
set search_path = public
as $func$
declare
  v_count integer := 0;
begin
  insert into pagamentos_saas (tenant_id, valor, mes_referencia, status)
  select t.id, t.valor_mensal, p_mes_referencia, 'pendente'
  from tenants t
  where t.ativa = true
    and not exists (
      select 1 from pagamentos_saas ps
      where ps.tenant_id = t.id and ps.mes_referencia = p_mes_referencia
    );
  get diagnostics v_count = row_count;
  return v_count;
end;
$func$;

-- Marcar cobrança SaaS como paga
create or replace function public.admin_marcar_pago(
  p_id uuid,
  p_data_pagamento timestamptz default now()
)
returns void
language plpgsql
security definer
set search_path = public
as $func$
begin
  update pagamentos_saas set status = 'pago', data_pagamento = p_data_pagamento
  where id = p_id and status = 'pendente';
end;
$func$;

-- Ativar/desativar tenant
create or replace function public.admin_set_tenant_ativo(
  p_tenant_id uuid,
  p_ativo boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $func$
begin
  update tenants set ativa = p_ativo where id = p_tenant_id;
  perform admin_log('tenant_' || case when p_ativo then 'ativado' else 'desativado' end, p_tenant_id::text, p_tenant_id);
end;
$func$;
