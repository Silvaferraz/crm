create or replace function public.registrar_pagamento(
  p_tenant_id uuid,
  p_cliente_id uuid,
  p_agendamento_id uuid,
  p_valor_total numeric,
  p_forma_pagamento text,
  p_profissional_id uuid,
  p_servicos jsonb,
  p_produtos jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pagamento_id uuid;
  v_item jsonb;
  v_cliente_existente boolean;
begin
  insert into pagamentos (tenant_id, cliente_id, agendamento_id, valor_total, forma_pagamento, barbeiro_id, data_hora)
  values (
    p_tenant_id,
    p_cliente_id,
    p_agendamento_id,
    p_valor_total,
    p_forma_pagamento,
    p_profissional_id,
    case when p_forma_pagamento = 'pix' then now() else now() end
  )
  returning id into v_pagamento_id;

  if p_servicos is not null then
    for v_item in select * from jsonb_array_elements(p_servicos)
    loop
      insert into pagamento_servicos (tenant_id, pagamento_id, servico_id, preco_no_momento)
      values (p_tenant_id, v_pagamento_id, (v_item->>'servico_id')::uuid, (v_item->>'preco')::numeric);
    end loop;
  end if;

  if p_produtos is not null then
    for v_item in select * from jsonb_array_elements(p_produtos)
    loop
      insert into pagamento_produtos (tenant_id, pagamento_id, produto_id, preco_no_momento)
      values (p_tenant_id, v_pagamento_id, (v_item->>'produto_id')::uuid, (v_item->>'preco')::numeric);
    end loop;
  end if;

  -- Atualiza contadores do cliente
  if p_cliente_id is not null then
    select exists(select 1 from clientes where id = p_cliente_id) into v_cliente_existente;
    if v_cliente_existente and p_forma_pagamento != 'pix' then
      update clientes set
        total_gasto = total_gasto + p_valor_total,
        quantidade_visitas = quantidade_visitas + 1,
        ultima_visita = now()
      where id = p_cliente_id;
    end if;
  end if;

  -- Se veio de agendamento, conclui o agendamento
  if p_agendamento_id is not null then
    update agendamentos set status = 'concluido' where id = p_agendamento_id;
  end if;

  return jsonb_build_object('id', v_pagamento_id);
end;
$$;

create or replace function public.confirmar_pix(
  p_pagamento_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_cliente_id uuid;
  v_valor_total numeric;
begin
  -- Lock preventivo
  select tenant_id, cliente_id, valor_total into v_tenant_id, v_cliente_id, v_valor_total
  from pagamentos where id = p_pagamento_id
  for update;

  -- Sair cedo se já estava pago
  if exists (select 1 from pagamentos where id = p_pagamento_id and forma_pagamento = 'pix' and status_pix = 'pago') then
    return;
  end if;

  -- Marcar como pago
  update pagamentos set status_pix = 'pago' where id = p_pagamento_id;

  -- Atualizar contadores do cliente
  if v_cliente_id is not null then
    update clientes set
      total_gasto = total_gasto + v_valor_total,
      quantidade_visitas = quantidade_visitas + 1,
      ultima_visita = now()
    where id = v_cliente_id;
  end if;
end;
$$;

grant execute on function public.registrar_pagamento to authenticated;
grant execute on function public.confirmar_pix to authenticated;
