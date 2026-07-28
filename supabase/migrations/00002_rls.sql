-- ============================================================
-- TrueBarbershop — RLS (Row Level Security)
-- ============================================================

-- Helper: obtém o tenant_id do usuário autenticado
create or replace function public.tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select u.tenant_id
  from public.usuarios u
  where u.auth_user_id = auth.uid()
  limit 1;
$$;

-- Helper: verifica se o usuário autenticado é super_admin
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(
    (select u.super_admin from public.usuarios u where u.auth_user_id = auth.uid() limit 1),
    false
  );
$$;

-- Helper: política padrão — usuário vê apenas linhas do seu próprio tenant
create or replace function public.tenant_policy(tenant_id_col uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    case
      when public.is_super_admin() then true
      else tenant_id_col = public.tenant_id()
    end;
$$;

-- ============================================================
-- Habilitar RLS em todas as tabelas com tenant_id
-- ============================================================
alter table usuarios           enable row level security;
alter table clientes           enable row level security;
alter table cliente_notas      enable row level security;
alter table tags               enable row level security;
alter table cliente_tag        enable row level security;
alter table servicos           enable row level security;
alter table produtos           enable row level security;
alter table profissionais      enable row level security;
alter table profissional_servico enable row level security;
alter table horarios_trabalho  enable row level security;
alter table bloqueios_agenda   enable row level security;
alter table agendamentos       enable row level security;
alter table agendamento_servicos enable row level security;
alter table pagamentos         enable row level security;
alter table pagamento_servicos enable row level security;
alter table pagamento_produtos enable row level security;
alter table despesas           enable row level security;
alter table entradas_manuais   enable row level security;
alter table planos             enable row level security;
alter table cliente_planos     enable row level security;
alter table tenant_integracoes enable row level security;
alter table eventos_webhook_pagamento enable row level security;
alter table mensagem_templates enable row level security;
alter table notificacoes       enable row level security;
alter table pagamentos_saas    enable row level security;
alter table configuracoes      enable row level security;
alter table logs_auditoria     enable row level security;

-- ============================================================
-- Políticas — todas seguem o mesmo padrão:
-- super_admin vê tudo; demais vêem apenas o próprio tenant
-- ============================================================

create policy tenant_isolation on usuarios
  for all using (public.tenant_policy(tenant_id));
create policy tenant_isolation on clientes
  for all using (public.tenant_policy(tenant_id));
create policy tenant_isolation on cliente_notas
  for all using (public.tenant_policy(tenant_id));
create policy tenant_isolation on tags
  for all using (public.tenant_policy(tenant_id));
create policy tenant_isolation on cliente_tag
  for all using (public.tenant_policy(tenant_id));
create policy tenant_isolation on servicos
  for all using (public.tenant_policy(tenant_id));
create policy tenant_isolation on produtos
  for all using (public.tenant_policy(tenant_id));
create policy tenant_isolation on profissionais
  for all using (public.tenant_policy(tenant_id));
create policy tenant_isolation on profissional_servico
  for all using (public.tenant_policy(tenant_id));
create policy tenant_isolation on horarios_trabalho
  for all using (public.tenant_policy(tenant_id));
create policy tenant_isolation on bloqueios_agenda
  for all using (public.tenant_policy(tenant_id));
create policy tenant_isolation on agendamentos
  for all using (public.tenant_policy(tenant_id));
create policy tenant_isolation on agendamento_servicos
  for all using (public.tenant_policy(tenant_id));
create policy tenant_isolation on pagamentos
  for all using (public.tenant_policy(tenant_id));
create policy tenant_isolation on pagamento_servicos
  for all using (public.tenant_policy(tenant_id));
create policy tenant_isolation on pagamento_produtos
  for all using (public.tenant_policy(tenant_id));
create policy tenant_isolation on despesas
  for all using (public.tenant_policy(tenant_id));
create policy tenant_isolation on entradas_manuais
  for all using (public.tenant_policy(tenant_id));
create policy tenant_isolation on planos
  for all using (public.tenant_policy(tenant_id));
create policy tenant_isolation on cliente_planos
  for all using (public.tenant_policy(tenant_id));
create policy tenant_isolation on tenant_integracoes
  for all using (public.tenant_policy(tenant_id));
create policy tenant_isolation on eventos_webhook_pagamento
  for all using (public.tenant_policy(tenant_id));
create policy tenant_isolation on mensagem_templates
  for all using (public.tenant_policy(tenant_id));
create policy tenant_isolation on notificacoes
  for all using (public.tenant_policy(tenant_id));
create policy tenant_isolation on pagamentos_saas
  for all using (public.tenant_policy(tenant_id));
create policy tenant_isolation on configuracoes
  for all using (public.tenant_policy(tenant_id));
create policy tenant_isolation on logs_auditoria
  for all using (public.tenant_policy(tenant_id));

-- ============================================================
-- Política específica para tenants
-- ============================================================
alter table tenants enable row level security;

create policy tenant_isolation on tenants
  for all using (
    case
      when public.is_super_admin() then true
      else id = public.tenant_id()
    end
  );

-- ============================================================
-- Política para tabelas sem tenant_id (despesas_saas)
-- ============================================================
alter table despesas_saas enable row level security;

create policy super_admin_only on despesas_saas
  for all using (public.is_super_admin());
