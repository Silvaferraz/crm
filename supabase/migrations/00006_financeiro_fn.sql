create or replace function public.resumo_financeiro(
  p_tenant_id uuid,
  p_inicio timestamptz,
  p_fim timestamptz
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_vendas numeric;
  v_qtd_atendimentos int;
  v_ticket_medio numeric;
  v_total_entradas numeric;
  v_total_despesas numeric;
  v_saldo numeric;
  v_pix_pendente numeric;
  v_por_forma jsonb;
  v_serie_diaria jsonb;
  v_ranking_servicos jsonb;
  v_ranking_profissionais jsonb;
begin
  -- Vendas confirmadas (exceto pix pendente)
  select coalesce(sum(valor_total), 0) into v_total_vendas
  from pagamentos
  where tenant_id = p_tenant_id
    and data_hora >= p_inicio and data_hora < p_fim
    and (forma_pagamento != 'pix' or status_pix = 'pago');

  select count(*) into v_qtd_atendimentos
  from pagamentos
  where tenant_id = p_tenant_id
    and data_hora >= p_inicio and data_hora < p_fim
    and (forma_pagamento != 'pix' or status_pix = 'pago')
    and exists (select 1 from pagamento_servicos where pagamento_id = pagamentos.id);

  v_ticket_medio := case when v_qtd_atendimentos > 0 then v_total_vendas / v_qtd_atendimentos else 0 end;

  select coalesce(sum(valor), 0) into v_total_entradas
  from entradas_manuais where tenant_id = p_tenant_id and criado_em >= p_inicio and criado_em < p_fim;

  select coalesce(sum(valor), 0) into v_total_despesas
  from despesas where tenant_id = p_tenant_id and criado_em >= p_inicio and criado_em < p_fim;

  v_saldo := v_total_vendas + v_total_entradas - v_total_despesas;

  select coalesce(sum(valor_total), 0) into v_pix_pendente
  from pagamentos
  where tenant_id = p_tenant_id
    and data_hora >= p_inicio and data_hora < p_fim
    and forma_pagamento = 'pix' and (status_pix is null or status_pix = 'pendente');

  select jsonb_agg(jsonb_build_object('forma', forma, 'total', total) order by total desc) into v_por_forma
  from (
    select forma_pagamento as forma, coalesce(sum(valor_total), 0) as total
    from pagamentos
    where tenant_id = p_tenant_id
      and data_hora >= p_inicio and data_hora < p_fim
      and (forma_pagamento != 'pix' or status_pix = 'pago')
    group by forma_pagamento
  ) sub;

  select jsonb_agg(jsonb_build_object('dia', dia, 'total', total) order by dia) into v_serie_diaria
  from (
    select date(data_hora) as dia, coalesce(sum(valor_total), 0) as total
    from pagamentos
    where tenant_id = p_tenant_id
      and data_hora >= p_inicio and data_hora < p_fim
      and (forma_pagamento != 'pix' or status_pix = 'pago')
    group by date(data_hora)
  ) sub;

  select jsonb_agg(jsonb_build_object('servico', nome, 'total', total, 'qtd', qtd) order by total desc) into v_ranking_servicos
  from (
    select s.nome, coalesce(sum(ps.preco_no_momento), 0) as total, count(*) as qtd
    from pagamento_servicos ps
    join servicos s on s.id = ps.servico_id
    where ps.tenant_id = p_tenant_id
      and exists (select 1 from pagamentos p where p.id = ps.pagamento_id and p.data_hora >= p_inicio and p.data_hora < p_fim and (p.forma_pagamento != 'pix' or p.status_pix = 'pago'))
    group by s.nome
  ) sub;

  select jsonb_agg(jsonb_build_object('profissional', nome, 'total', total, 'qtd', qtd) order by total desc) into v_ranking_profissionais
  from (
    select pr.nome, coalesce(sum(pg.valor_total), 0) as total, count(*) as qtd
    from pagamentos pg
    join profissionais pr on pr.id = pg.barbeiro_id
    where pg.tenant_id = p_tenant_id
      and pg.data_hora >= p_inicio and pg.data_hora < p_fim
      and (pg.forma_pagamento != 'pix' or pg.status_pix = 'pago')
      and pg.barbeiro_id is not null
    group by pr.nome
  ) sub;

  return jsonb_build_object(
    'total_vendas', v_total_vendas,
    'qtd_atendimentos', v_qtd_atendimentos,
    'ticket_medio', round(v_ticket_medio, 2),
    'total_entradas', v_total_entradas,
    'total_despesas', v_total_despesas,
    'saldo', v_saldo,
    'pix_pendente', v_pix_pendente,
    'por_forma', coalesce(v_por_forma, '[]'::jsonb),
    'serie_diaria', coalesce(v_serie_diaria, '[]'::jsonb),
    'ranking_servicos', coalesce(v_ranking_servicos, '[]'::jsonb),
    'ranking_profissionais', coalesce(v_ranking_profissionais, '[]'::jsonb)
  );
end;
$$;

grant execute on function public.resumo_financeiro to authenticated;
