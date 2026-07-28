-- ============================================================
-- TrueBarbershop — Seed fictício para desenvolvimento
-- ATENÇÃO: Dados exclusivamente para testes locais.
-- Nenhum dado real de cliente, negócio ou credencial.
-- ============================================================

-- Tenant de teste (Barbearia do Ferraz)
insert into tenants (id, nome, slug, categoria, nicho, timezone, whatsapp, ativa, vencimento, valor_mensal, webhook_token)
values
  ('11111111-1111-1111-1111-111111111111', 'Barbearia do Ferraz', 'barbearia-ferraz', 'barbearia', 'Barbearia tradicional', 'America/Sao_Paulo', '5511999999999', true, 5, 97.00, 'wh_test_token_001'),
  ('22222222-2222-2222-2222-222222222222', 'Clínica Bem-Estar', 'clinica-bem-estar', 'clinica', 'Clínica de estética avançada', 'America/Sao_Paulo', '5511888888888', true, 15, 147.00, 'wh_test_token_002')
on conflict (id) do nothing;

-- Usuário admin de teste
insert into usuarios (id, tenant_id, nome, usuario, papel, super_admin)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Admin Teste', 'admin', 'owner', false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Dra. Amanda', 'amanda', 'owner', false)
on conflict (id) do nothing;

-- Clientes fictícios
insert into clientes (id, tenant_id, nome, telefone, telefone_e164, email, data_nascimento, origem, observacoes)
values
  ('cccccccc-cccc-cccc-cccc-cccccccccc01', '11111111-1111-1111-1111-111111111111', 'Carlos Silva', '(11) 91234-5678', '5511912345678', 'carlos@email.com', '1990-05-20', 'Indicação', 'Cliente desde 2023'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc02', '11111111-1111-1111-1111-111111111111', 'João Pereira', '(11) 98765-4321', '5511987654321', 'joao@email.com', '1985-03-15', 'Google', null),
  ('cccccccc-cccc-cccc-cccc-cccccccccc03', '22222222-2222-2222-2222-222222222222', 'Maria Souza', '(11) 95555-1234', '5511955551234', 'maria@email.com', '1995-07-10', 'Instagram', 'Alérgica a ácido hialurônico')
on conflict (id) do nothing;

-- Serviços
insert into servicos (id, tenant_id, nome, preco, duracao_min, cor, intervalo_pos_min)
values
  ('dddddddd-dddd-dddd-dddd-dddddddddd01', '11111111-1111-1111-1111-111111111111', 'Corte Degradê', 65.00, 40, '#8b5cf6', 10),
  ('dddddddd-dddd-dddd-dddd-dddddddddd02', '11111111-1111-1111-1111-111111111111', 'Barba Completa', 35.00, 20, '#f59e0b', 5),
  ('dddddddd-dddd-dddd-dddd-dddddddddd03', '11111111-1111-1111-1111-111111111111', 'Hidratação', 50.00, 30, '#10b981', 0),
  ('dddddddd-dddd-dddd-dddd-dddddddddd04', '22222222-2222-2222-2222-222222222222', 'Limpeza de Pele', 120.00, 60, '#ec4899', 15),
  ('dddddddd-dddd-dddd-dddd-dddddddddd05', '22222222-2222-2222-2222-222222222222', 'Massagem Relaxante', 150.00, 90, '#8b5cf6', 10)
on conflict (id) do nothing;

-- Profissionais
insert into profissionais (id, tenant_id, nome, apelido, cor, ordem)
values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', '11111111-1111-1111-1111-111111111111', 'Roberto Alves', 'Roberto', '#8b5cf6', 1),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02', '11111111-1111-1111-1111-111111111111', 'Felipe Santos', 'Felipão', '#f59e0b', 2),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee03', '22222222-2222-2222-2222-222222222222', 'Dra. Amanda Costa', 'Amanda', '#ec4899', 1)
on conflict (id) do nothing;

-- Horários de trabalho (semana)
insert into horarios_trabalho (tenant_id, profissional_id, dia_semana, hora_inicio, hora_fim)
values
  ('11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', 0, '09:00', '13:00'),
  ('11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', 1, '09:00', '18:00'),
  ('11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', 2, '09:00', '18:00'),
  ('11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', 3, '09:00', '18:00'),
  ('11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', 4, '09:00', '18:00'),
  ('11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', 5, '09:00', '12:00'),
  ('11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02', 1, '09:00', '18:00'),
  ('11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02', 2, '09:00', '18:00'),
  ('11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02', 3, '09:00', '18:00'),
  ('11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02', 4, '09:00', '18:00'),
  ('11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02', 5, '09:00', '18:00'),
  ('22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee03', 1, '08:00', '19:00'),
  ('22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee03', 2, '08:00', '19:00'),
  ('22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee03', 3, '08:00', '19:00'),
  ('22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee03', 4, '08:00', '19:00'),
  ('22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee03', 5, '08:00', '18:00')
on conflict do nothing;

