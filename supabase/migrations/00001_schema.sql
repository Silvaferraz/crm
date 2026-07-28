-- ============================================================
-- TrueBarbershop — Schema Completo do Banco
-- ============================================================

-- Extensões
create extension if not exists "pgcrypto";

-- ============================================================
-- 4.1 tenants — o negócio (o "cliente" do SaaS)
-- ============================================================
create table tenants (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  slug        text not null unique,
  categoria   text not null default 'barbearia'
              check (categoria in ('barbearia', 'salao', 'estetica', 'clinica')),
  nicho       text,
  logo        text,
  cor_primaria text,
  cor_fundo   text,
  cor_card    text,
  timezone    text not null default 'America/Sao_Paulo',
  whatsapp    text,
  ativa       boolean not null default true,
  vencimento  integer not null default 1
              check (vencimento between 1 and 28),
  valor_mensal numeric(10,2) not null default 0,
  webhook_token text unique,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- 4.2 usuarios — quem loga no painel
-- ============================================================
create table usuarios (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  nome        text not null,
  usuario     text not null,
  papel       text not null default 'professional'
              check (papel in ('owner', 'admin', 'professional', 'receptionist')),
  super_admin boolean not null default false,
  created_at  timestamptz not null default now(),
  unique      (tenant_id, usuario)
);

-- ============================================================
-- 4.3 clientes — a ficha do cliente do negócio
-- ============================================================
create table clientes (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references tenants(id) on delete cascade,
  nome              text not null,
  telefone          text,
  telefone_e164     text,
  email             text,
  data_nascimento   date,
  origem            text,
  observacoes       text,
  total_gasto       numeric(10,2) not null default 0,
  quantidade_visitas integer not null default 0,
  ultima_visita     timestamptz,
  created_at        timestamptz not null default now()
);

create table cliente_notas (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  cliente_id  uuid not null references clientes(id) on delete cascade,
  usuario_id  uuid not null references usuarios(id) on delete cascade,
  corpo       text not null,
  fixada      boolean not null default false,
  created_at  timestamptz not null default now()
);

create table tags (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  nome        text not null,
  cor         text not null default '#6366f1',
  unique      (tenant_id, nome)
);

create table cliente_tag (
  tenant_id   uuid not null references tenants(id) on delete cascade,
  cliente_id  uuid not null references clientes(id) on delete cascade,
  tag_id      uuid not null references tags(id) on delete cascade,
  primary key (cliente_id, tag_id)
);

-- ============================================================
-- 4.4 servicos e produtos — o que o negócio vende
-- ============================================================
create table servicos (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references tenants(id) on delete cascade,
  nome              text not null,
  preco             numeric(10,2) not null default 0,
  ativo             boolean not null default true,
  duracao_min       integer not null default 30,
  cor               text,
  intervalo_pos_min integer not null default 0
);

create table produtos (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  nome        text not null,
  preco       numeric(10,2) not null default 0,
  ativo       boolean not null default true
);

-- ============================================================
-- 4.5 Agenda — o motor de agendamento
-- ============================================================
create table profissionais (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  usuario_id  uuid references usuarios(id) on delete set null,
  nome        text not null,
  apelido     text,
  foto        text,
  cor         text not null default '#6366f1',
  ativo       boolean not null default true,
  ordem       integer not null default 0
);

create table profissional_servico (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  profissional_id uuid not null references profissionais(id) on delete cascade,
  servico_id    uuid not null references servicos(id) on delete cascade,
  preco         numeric(10,2),
  duracao_min   integer,
  unique        (profissional_id, servico_id)
);

create table horarios_trabalho (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references tenants(id) on delete cascade,
  profissional_id   uuid not null references profissionais(id) on delete cascade,
  dia_semana        integer not null check (dia_semana between 0 and 6),
  hora_inicio       time not null,
  hora_fim          time not null,
  vigencia_inicio   date,
  vigencia_fim      date
);

create table bloqueios_agenda (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  profissional_id uuid references profissionais(id) on delete cascade,
  inicio          timestamptz not null,
  fim             timestamptz not null,
  motivo          text,
  tipo            text not null default 'folga'
                  check (tipo in ('folga', 'feriado', 'pessoal'))
);

create table agendamentos (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references tenants(id) on delete cascade,
  cliente_id        uuid references clientes(id) on delete set null,
  profissional_id   uuid not null references profissionais(id) on delete cascade,
  inicio            timestamptz not null,
  fim               timestamptz not null,
  status            text not null default 'agendado'
                    check (status in ('agendado','confirmado','em_atendimento','concluido','cancelado','falta')),
  origem            text not null default 'painel'
                    check (origem in ('painel', 'online', 'importado')),
  observacoes       text,
  pagamento_id      uuid,
  cancelado_em      timestamptz,
  cancelado_motivo  text,
  created_at        timestamptz not null default now(),
  check (fim > inicio)
);

create table agendamento_servicos (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references tenants(id) on delete cascade,
  agendamento_id      uuid not null references agendamentos(id) on delete cascade,
  servico_id          uuid not null references servicos(id) on delete cascade,
  preco_no_momento    numeric(10,2) not null,
  duracao_no_momento  integer not null
);

-- ============================================================
-- 4.6 Vendas / caixa
-- ============================================================
create table pagamentos (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null references tenants(id) on delete cascade,
  cliente_id            uuid references clientes(id) on delete set null,
  agendamento_id        uuid references agendamentos(id) on delete set null,
  data_hora             timestamptz not null default now(),
  valor_total           numeric(10,2) not null,
  forma_pagamento       text not null check (forma_pagamento in ('pix', 'maquininha', 'dinheiro')),
  status_pix            text check (status_pix in ('pendente', 'pago')),
  barbeiro_id           uuid references profissionais(id) on delete set null,
  id_externo_pagamento  text,
  status_provedor       text,
  qr_code               text,
  qr_base64             text,
  created_at            timestamptz not null default now()
);

create table pagamento_servicos (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references tenants(id) on delete cascade,
  pagamento_id      uuid not null references pagamentos(id) on delete cascade,
  servico_id        uuid not null references servicos(id) on delete cascade,
  preco_no_momento  numeric(10,2) not null
);

create table pagamento_produtos (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references tenants(id) on delete cascade,
  pagamento_id      uuid not null references pagamentos(id) on delete cascade,
  produto_id        uuid not null references produtos(id) on delete cascade,
  preco_no_momento  numeric(10,2) not null
);

create table despesas (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  valor       numeric(10,2) not null,
  descricao   text not null,
  criado_em   timestamptz not null default now()
);

create table entradas_manuais (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  valor       numeric(10,2) not null,
  descricao   text not null,
  criado_em   timestamptz not null default now()
);

-- ============================================================
-- 4.7 Planos (assinaturas do cliente final)
-- ============================================================
create table planos (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  nome_plano  text not null,
  valor       numeric(10,2) not null,
  descricao   text,
  ativo       boolean not null default true
);

create table cliente_planos (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  cliente_id  uuid not null references clientes(id) on delete cascade,
  plano_id    uuid not null references planos(id) on delete cascade,
  data_inicio date not null,
  data_fim    date,
  ativo       boolean not null default true
);

-- ============================================================
-- 4.8 Integração de pagamento
-- ============================================================
create table tenant_integracoes (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references tenants(id) on delete cascade unique,
  provedor          text not null default 'mercadopago',
  access_token      text not null,
  webhook_secret    text not null,
  payer_email       text,
  validado_em       timestamptz,
  validado_como     text,
  ativo             boolean not null default false,
  created_at        timestamptz not null default now()
);

create table eventos_webhook_pagamento (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references tenants(id) on delete cascade,
  id_pagamento_externo text not null,
  topico              text not null,
  resultado           text,
  payload             jsonb,
  criado_em           timestamptz not null default now(),
  unique              (id_pagamento_externo, topico)
);

-- ============================================================
-- 4.9 Mensagens / lembretes
-- ============================================================
create table mensagem_templates (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  tipo          text not null check (tipo in ('lembrete_24h','aniversario','retorno','pos_atendimento')),
  canal         text not null default 'whatsapp_link'
                check (canal in ('whatsapp_link', 'whatsapp_api')),
  titulo        text not null,
  corpo         text not null,
  antecedencia  integer not null default 24,
  ativo         boolean not null default false
);

create table notificacoes (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references tenants(id) on delete cascade,
  cliente_id        uuid not null references clientes(id) on delete cascade,
  agendamento_id    uuid references agendamentos(id) on delete set null,
  tipo              text not null,
  canal             text not null default 'whatsapp_link',
  agendado_para     timestamptz not null,
  status            text not null default 'pendente'
                    check (status in ('pendente','enviada','cancelada','falhou')),
  destino_e164      text,
  corpo_renderizado text not null,
  enviado_em        timestamptz,
  erro              text,
  chave             text not null,
  unique            (tenant_id, chave)
);

-- ============================================================
-- 4.10 Financeiro da própria plataforma (SaaS)
-- ============================================================
create table pagamentos_saas (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  valor           numeric(10,2) not null,
  mes_referencia  text not null,
  status          text not null default 'pendente'
                  check (status in ('pendente', 'pago', 'cancelado')),
  data_pagamento  timestamptz,
  unique          (tenant_id, mes_referencia)
);

create table despesas_saas (
  id          uuid primary key default gen_random_uuid(),
  descricao   text not null,
  valor       numeric(10,2) not null,
  criado_em   timestamptz not null default now()
);

-- ============================================================
-- 4.11 Auditoria
-- ============================================================
create table logs_auditoria (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid references tenants(id) on delete set null,
  usuario     text not null,
  acao        text not null,
  descricao   text,
  ip          text,
  criado_em   timestamptz not null default now()
);

-- ============================================================
-- 4.12 Configuração livre
-- ============================================================
create table configuracoes (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  chave       text not null,
  valor       text not null,
  unique      (tenant_id, chave)
);

-- Índices essenciais
create index idx_usuarios_tenant on usuarios(tenant_id);
create index idx_clientes_tenant on clientes(tenant_id);
create index idx_servicos_tenant on servicos(tenant_id);
create index idx_produtos_tenant on produtos(tenant_id);
create index idx_profissionais_tenant on profissionais(tenant_id);
create index idx_horarios_trabalho_profissional on horarios_trabalho(profissional_id);
create index idx_bloqueios_agenda_profissional on bloqueios_agenda(profissional_id);
create index idx_agendamentos_tenant_data on agendamentos(tenant_id, inicio);
create index idx_agendamentos_profissional_data on agendamentos(profissional_id, inicio);
create index idx_pagamentos_tenant on pagamentos(tenant_id);
create index idx_notificacoes_status on notificacoes(tenant_id, status);
create index idx_logs_auditoria_tenant on logs_auditoria(tenant_id);
