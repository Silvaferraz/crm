create or replace function public.criar_agendamento(
  p_tenant_id uuid,
  p_cliente_id uuid,
  p_profissional_id uuid,
  p_inicio timestamptz,
  p_fim timestamptz,
  p_observacoes text,
  p_servicos jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_agendamento_id uuid;
  v_servico jsonb;
  v_result jsonb;
begin
  perform 1 from profissionais
  where id = p_profissional_id
  for update;

  if exists (
    select 1 from agendamentos
    where profissional_id = p_profissional_id
    and status not in ('cancelado', 'falta')
    and inicio < p_fim
    and fim > p_inicio
    and tenant_id = p_tenant_id
  ) then
    raise exception 'Conflito de horário';
  end if;

  insert into agendamentos (tenant_id, cliente_id, profissional_id, inicio, fim, status, origem, observacoes)
  values (p_tenant_id, p_cliente_id, p_profissional_id, p_inicio, p_fim, 'agendado', 'painel', p_observacoes)
  returning id into v_agendamento_id;

  if p_servicos is not null then
    for v_servico in select * from jsonb_array_elements(p_servicos)
    loop
      insert into agendamento_servicos (tenant_id, agendamento_id, servico_id, preco_no_momento, duracao_no_momento)
      values (
        p_tenant_id,
        v_agendamento_id,
        (v_servico->>'servico_id')::uuid,
        (v_servico->>'preco')::numeric,
        (v_servico->>'duracao')::int
      );
    end loop;
  end if;

  select jsonb_build_object('id', v_agendamento_id) into v_result;
  return v_result;
end;
$$;

grant execute on function public.criar_agendamento to authenticated;
