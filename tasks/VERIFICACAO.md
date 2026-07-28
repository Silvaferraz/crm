# Verificações Pendentes

## Testes Automatizados (OK)
- [x] RPC `criar_agendamento` — criação com/sem serviços, conflito de horário
- [x] RPC `registrar_pagamento` — dinheiro com serviço, atualiza contadores
- [x] RPC `confirmar_pix` — idempotente (executar 2x não quebra)
- [x] TypeScript compila (`npx tsc --noEmit` sem erros)
- [x] Migrations aplicadas (`supabase migration up`)

## Testes via API (pendentes)

### Autenticação
- [ ] Login com credenciais corretas retorna sessão
- [ ] Login com credenciais erradas retorna erro
- [ ] Rota protegida redireciona sem sessão
- [ ] Logout invalida sessão

### Agenda — criação de agendamento (API)
- [x] Criar agendamento com cliente existente → retorna id
- [x] Criar agendamento com múltiplos serviços → serviços salvos em `agendamento_servicos` (via RPC com array)
- [x] Criar agendamento sem serviços → funciona (`p_servicos: null`)
- [x] Criar agendamento sem cliente (anon) → funciona
- [x] Conflito: mesmo profissional, mesmo horário → 400 erro (não criou duplicata)
- [x] Conflito: mesmo profissional, horário sobreposto parcialmente → 400 erro (não criou)
- [x] Profissional diferente, mesmo horário → OK (criou sem conflito)
- [x] Faixas de horário do profissional retornam corretamente (09:00-18:00 na terça)
- [x] Contagem de agendamentos do mês funciona (4 agendamentos no mês 7)

### Comanda / Vendas (API)
- [x] `registrarPagamento`: pix → cria como pendente, `confirmarPix` → vira "pago"
- [x] `registrarPagamento`: com agendamento_id → agendamento vira "concluido"
- [x] `registrarPagamento`: cliente campos atualizados (total_gasto, visitas, ultima_visita)
- [x] `registrarPagamento`: com produtos + serviços → ambos registrados (via RPC com arrays)
- [x] `confirmarPix`: já pago → não duplica (idempotente — re-confirmar não quebra)
- [x] `confirmarPix`: pagamento dinheiro → não afeta (status_pix continua NULL)

### Migrations / Schema
- [x] Tabela `agendamento_servicos` funciona com FK
- [ ] RLS bloqueia acesso cross-tenant (tenant A não vê dados do tenant B) — não testado
- [x] `grant execute` nas RPCs funciona para `authenticated` (testado com token JWT)
- [x] Seed tem dados mínimos (profissionais, serviços, horários, clientes)
- [ ] Seed DEVERIA ter horários de trabalho — adicionado manualmente (não está na migração)

## Testes Visuais (navegador) — pra você

### Login / Auth
- [ ] Tela de login renderiza com campos usuário/senha
- [ ] "Continuar conectado" funciona
- [ ] Login multi-tenant: seletor aparece se >1 tenant vinculado
- [ ] Logout funciona
- [ ] Cores do tenant aplicadas como CSS vars

### Agenda (`/agenda`)
- [ ] Calendário mensal navega entre meses
- [ ] Dias com agendamento mostram bolinhas de carga
- [ ] Hoje destacado com ring
- [ ] "Voltar para hoje" aparece quando em mês diferente
- [ ] Filtro por profissional filtra a lista
- [ ] Card do agendamento mostra horário, cliente, profissional, status
- [ ] Clicar no card abre modal de detalhe
- [ ] Modal detalhe: mudar status (confirmar → iniciar → concluir / cancelar / falta)
- [ ] Modal detalhe: botão "Ir para comanda" navega certo
- [ ] Modal criação: busca cliente funciona
- [ ] Modal criação: cadastro rápido funciona
- [ ] Modal criação: selecionar múltiplos serviços
- [ ] Modal criação: slots disponíveis aparecem após selecionar profissional + serviço
- [ ] Modal criação: criar agendamento com sucesso
- [ ] Modal criação: erro de conflito aparece

### Comanda (`/comanda`)
- [ ] Grade de serviços aparece com toggle
- [ ] Grade de produtos aparece com toggle
- [ ] Item selecionado fica destacado (cor + ✓)
- [ ] Carrinho mostra itens, subtotal, desconto, total
- [ ] Remover item do carrinho
- [ ] Botão "Limpar" zera carrinho
- [ ] Selecionar cliente (busca)
- [ ] Cadastro rápido de cliente
- [ ] Selecionar profissional
- [ ] Campo desconto funciona
- [ ] Formas pagamento: Dinheiro, Maquininha habilitados
- [ ] Formas pagamento: Pix desabilitado (sem integração)
- [ ] Modal confirmação aparece com valores corretos
- [ ] Confirmar pagamento → volta pra home
- [ ] Navegar com `?agendamento=ID`: pré-carrega serviços

### Comanda via Agenda
- [ ] Na agenda, clicar "Ir para comanda" → vai pra `/comanda?agendamento=ID`
- [ ] Serviços do agendamento pré-carregados na comanda
- [ ] Finalizar comanda com agendamento → agendamento vira "concluido"

### Geral
- [ ] Navegação bottom-nav (mobile) e sidebar (desktop)
- [ ] Estados vazios aparecem quando sem dados
- [ ] `active:scale-[0.975]` no toque
- [ ] Tema escuro consistente
