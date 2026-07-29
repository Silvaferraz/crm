-- ============================================================
-- Migration 00007 — Funções para fila de mensagens
-- ============================================================

-- Função auxiliar: renderiza placeholders no corpo do template
create or replace function public.renderizar_template(
  corpo text,
  cliente_nome text default '',
  cliente_telefone text default '',
  profissional_nome text default '',
  servico_nome text default '',
  data_hora text default '',
  estabelecimento text default ''
) returns text as $_$
begin
  corpo := replace(corpo, '{cliente_nome}', coalesce(cliente_nome, ''));
  corpo := replace(corpo, '{cliente_telefone}', coalesce(cliente_telefone, ''));
  corpo := replace(corpo, '{profissional_nome}', coalesce(profissional_nome, ''));
  corpo := replace(corpo, '{servico_nome}', coalesce(servico_nome, ''));
  corpo := replace(corpo, '{data_hora}', coalesce(data_hora, ''));
  corpo := replace(corpo, '{estabelecimento}', coalesce(estabelecimento, ''));
  return corpo;
end;
$_$ language plpgsql;

-- Função principal: gera a fila de notificações para um tenant
-- Retorna a quantidade de notificações geradas
create or replace function public.gerar_fila_notificacoes(
  p_tenant_id uuid,
  p_agora timestamptz default now()
) returns integer as $$
declare
  v_count integer := 0;
  v_template record;
  v_cliente record;
  v_agendamento record;
  v_corpo text;
  v_chave text;
  v_agendado_para timestamptz;
  v_tenant_nome text;
  v_profissional_nome text;
  v_servico_nomes text;
begin
  select nome into v_tenant_nome from tenants where id = p_tenant_id;

  -- 1) Lembrete 24h antes
  for v_template in
    select * from mensagem_templates
    where tenant_id = p_tenant_id and tipo = 'lembrete_24h' and ativo = true
    limit 1
  loop
    for v_agendamento in
      select
        a.id as agendamento_id,
        a.inicio,
        a.cliente_id,
        a.profissional_id,
        c.nome as cliente_nome,
        c.telefone_e164,
        pr.nome as profissional_nome,
        coalesce(
          (select string_agg(s.nome, ', ') from agendamento_servicos ags
           join servicos s on s.id = ags.servico_id
           where ags.agendamento_id = a.id), ''
        ) as servico_nomes
      from agendamentos a
      join clientes c on c.id = a.cliente_id
      join profissionais pr on pr.id = a.profissional_id
      where a.tenant_id = p_tenant_id
        and a.status = 'confirmado'
        and a.inicio between p_agora and p_agora + interval '24 hours'
    loop
      v_chave := 'lembrete_24h:ag:' || v_agendamento.agendamento_id;
      v_agendado_para := p_agora;
      v_corpo := renderizar_template(
        v_template.corpo,
        v_agendamento.cliente_nome,
        null,
        v_agendamento.profissional_nome,
        v_agendamento.servico_nomes,
        to_char(v_agendamento.inicio at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI'),
        v_tenant_nome
      );
      insert into notificacoes (tenant_id, cliente_id, agendamento_id, tipo, canal, agendado_para, status, destino_e164, corpo_renderizado, chave)
      values (p_tenant_id, v_agendamento.cliente_id, v_agendamento.agendamento_id, 'lembrete_24h', 'whatsapp_link', v_agendado_para, 'pendente', v_agendamento.telefone_e164, v_corpo, v_chave)
      on conflict (tenant_id, chave) do nothing;
      if found then v_count := v_count + 1; end if;
    end loop;
  end loop;

  -- 2) Aniversário (clientes que fazem aniversário hoje)
  for v_template in
    select * from mensagem_templates
    where tenant_id = p_tenant_id and tipo = 'aniversario' and ativo = true
    limit 1
  loop
    for v_cliente in
      select id, nome, telefone_e164
      from clientes
      where tenant_id = p_tenant_id
        and data_nascimento is not null
        and extract(month from data_nascimento) = extract(month from p_agora)
        and extract(day from data_nascimento) = extract(day from p_agora)
    loop
      v_chave := 'aniversario:cli:' || v_cliente.id || ':' || to_char(p_agora, 'YYYY-MM');
      v_agendado_para := p_agora;
      v_corpo := renderizar_template(v_template.corpo, v_cliente.nome, null, null, null, null, v_tenant_nome);
      insert into notificacoes (tenant_id, cliente_id, tipo, canal, agendado_para, status, destino_e164, corpo_renderizado, chave)
      values (p_tenant_id, v_cliente.id, 'aniversario', 'whatsapp_link', v_agendado_para, 'pendente', v_cliente.telefone_e164, v_corpo, v_chave)
      on conflict (tenant_id, chave) do nothing;
      if found then v_count := v_count + 1; end if;
    end loop;
  end loop;

  -- 3) Retorno (clientes que não visitam há X dias)
  for v_template in
    select * from mensagem_templates
    where tenant_id = p_tenant_id and tipo = 'retorno' and ativo = true
    limit 1
  loop
    for v_cliente in
      select id, nome, telefone_e164
      from clientes
      where tenant_id = p_tenant_id
        and ultima_visita is not null
        and ultima_visita < p_agora - (v_template.antecedencia || ' days')::interval
        and (select count(*) from notificacoes n2
             where n2.tenant_id = p_tenant_id
               and n2.cliente_id = clientes.id
               and n2.tipo = 'retorno'
               and n2.status = 'enviada'
               and n2.enviado_em > p_agora - interval '90 days') = 0
    loop
      v_chave := 'retorno:cli:' || v_cliente.id || ':' || to_char(p_agora, 'YYYY-MM-DD');
      v_agendado_para := p_agora;
      v_corpo := renderizar_template(v_template.corpo, v_cliente.nome);
      insert into notificacoes (tenant_id, cliente_id, tipo, canal, agendado_para, status, destino_e164, corpo_renderizado, chave)
      values (p_tenant_id, v_cliente.id, 'retorno', 'whatsapp_link', v_agendado_para, 'pendente', v_cliente.telefone_e164, v_corpo, v_chave)
      on conflict (tenant_id, chave) do nothing;
      if found then v_count := v_count + 1; end if;
    end loop;
  end loop;

  -- 4) Pós-atendimento (X horas depois de concluído)
  for v_template in
    select * from mensagem_templates
    where tenant_id = p_tenant_id and tipo = 'pos_atendimento' and ativo = true
    limit 1
  loop
    for v_agendamento in
      select
        a.id as agendamento_id,
        a.cliente_id,
        c.nome as cliente_nome,
        c.telefone_e164,
        pr.nome as profissional_nome,
        coalesce(
          (select string_agg(s.nome, ', ') from agendamento_servicos ags
           join servicos s on s.id = ags.servico_id
           where ags.agendamento_id = a.id), ''
        ) as servico_nomes
      from agendamentos a
      join clientes c on c.id = a.cliente_id
      join profissionais pr on pr.id = a.profissional_id
      where a.tenant_id = p_tenant_id
        and a.status = 'concluido'
        and a.inicio between p_agora - (v_template.antecedencia || ' hours')::interval - interval '1 hour'
                        and p_agora - (v_template.antecedencia || ' hours')::interval + interval '1 hour'
    loop
      v_chave := 'pos_atendimento:ag:' || v_agendamento.agendamento_id;
      v_agendado_para := p_agora;
      v_corpo := renderizar_template(
        v_template.corpo,
        v_agendamento.cliente_nome,
        null,
        v_agendamento.profissional_nome,
        v_agendamento.servico_nomes,
        null,
        v_tenant_nome
      );
      insert into notificacoes (tenant_id, cliente_id, agendamento_id, tipo, canal, agendado_para, status, destino_e164, corpo_renderizado, chave)
      values (p_tenant_id, v_agendamento.cliente_id, v_agendamento.agendamento_id, 'pos_atendimento', 'whatsapp_link', v_agendado_para, 'pendente', v_agendamento.telefone_e164, v_corpo, v_chave)
      on conflict (tenant_id, chave) do nothing;
      if found then v_count := v_count + 1; end if;
    end loop;
  end loop;

  return v_count;
end;
$$ language plpgsql;

-- Função para gerar fila de TODOS os tenants ativos
create or replace function public.gerar_fila_todos_tenants()
returns integer as $$
declare
  v_total integer := 0;
  v_r record;
begin
  for v_r in select id from tenants where ativa = true loop
    v_total := v_total + gerar_fila_notificacoes(v_r.id);
  end loop;
  return v_total;
end;
$$ language plpgsql;

-- RPC para marcar notificação como enviada (usado via sendBeacon)
create or replace function public.marcar_notificacao_enviada(p_id uuid)
returns void as $$
begin
  update notificacoes set status = 'enviada', enviado_em = now() where id = p_id and status = 'pendente';
end;
$$ language plpgsql security definer;
