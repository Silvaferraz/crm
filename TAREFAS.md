# Tarefas — TrueBarbershop (React + Supabase)

---

## Fase 1 — Fundação

- [ ] **1.1** Inicializar projeto React + Vite + TypeScript com estrutura de pastas
- [ ] **1.2** Configurar Tailwind CSS com tema escuro e tokens de cor (Seção 8.2)
- [ ] **1.3** Configurar projeto Supabase (banco, auth, storage)
- [ ] **1.4** Criar schema completo do banco (Seção 4): `tenants`, `usuarios`, `clientes`, `servicos`, `produtos`, `profissionais`, `horarios_trabalho`, `bloqueios_agenda`, `agendamentos`, `agendamento_servicos`, `pagamentos`, `pagamento_servicos`, `pagamento_produtos`, `despesas`, `entradas_manuais`, `planos`, `cliente_planos`, `tenant_integracoes`, `eventos_webhook_pagamento`, `mensagem_templates`, `notificacoes`, `pagamentos_saas`, `despesas_saas`, `logs_auditoria`, `configuracoes`, `cliente_notas`, `tags`, `cliente_tag`, `profissional_servico`
- [ ] **1.5** Habilitar RLS em todas as tabelas com `tenant_id` — política padrão: leitura/escrita apenas do próprio tenant
- [ ] **1.6** Criar exceção de RLS para super_admin (atravessa tenants)
- [ ] **1.7** Criar seed fictício de desenvolvimento: 1 tenant de teste + 1 usuário admin + dados mínimos
- [ ] **1.8** Configurar `color-scheme: dark` e `-webkit-tap-highlight-color: transparent` no CSS global
- [ ] **1.9** Adicionar fonte Inter e configuração de `tabular-nums` no CSS

---

## Fase 2 — Autenticação e casca do app

- [ ] **2.1** Modelar tabela de vínculo usuário↔tenant (mesmo `auth.users` pode pertencer a múltiplos tenants)
- [ ] **2.2** Implementar tela de login com campos usuário + senha + "continuar conectado"
- [ ] **2.3** Exibir marca do negócio no login (via cookie `?n=` ou parâmetro de URL) — sem sessão ainda
- [ ] **2.4** Implementar fluxo multi-tenant: se usuário tem contas em >1 tenant, mostrar seletor "em qual negócio?"
- [ ] **2.5** Criar layout autenticado com navegação:
  - Mobile: bottom-nav fixa com backdrop-blur, até 5 itens, ativo com cor + traço no topo
  - Desktop (>=768px): sidebar fixa ~240px, logo + nome no topo, avatar + sair no rodapé
- [ ] **2.6** Implementar menu de conta (avatar canto superior direito) com link para Ajustes
- [ ] **2.7** Implementar hook `useTerminologia()` com resolução: override do tenant → vertical → padrão → chave crua
- [ ] **2.8** Criar objeto de configuração por vertical (`barbearia`, `salao`, `estetica`, `clinica`) com rótulos e serviços sugeridos
- [ ] **2.9** Implementar logout e proteção de rotas (redirecionar para login se não autenticado)
- [ ] **2.10** Aplicar cores do tenant como variáveis CSS em runtime (`--cor-marca`, `--cor-fundo`, `--cor-card`)

---

## Fase 3 — Cadastros base

### Serviços
- [ ] **3.1** CRUD de serviços: nome, preço, duração, cor, intervalo pós-atendimento, ativo/inativo
- [ ] **3.2** Botão "semear serviços sugeridos" da vertical (útil para cadastro inicial vazio)

### Produtos
- [ ] **3.3** CRUD de produtos: nome, preço, ativo/inativo

### Equipe
- [ ] **3.4** CRUD de profissionais: nome, apelido, foto, cor, ativo, ordem
- [ ] **3.5** Vincular profissional a usuário (opcional — profissional pode não ter login)
- [ ] **3.6** CRUD de horários de trabalho: por dia da semana, múltiplas faixas por dia, vigência opcional
- [ ] **3.7** Opção de replicar horários de um dia para os outros
- [ ] **3.8** CRUD de bloqueios de agenda: por profissional (ou global), tipo (folga/feriado/pessoal), motivo
- [ ] **3.9** Override opcional de duração/preço por combinação profissional × serviço (`profissional_servico`)

---

## Fase 4 — Clientes

- [ ] **4.1** Lista de clientes com busca por nome/telefone
- [ ] **4.2** Cadastro completo: nome, telefone, e-mail, nascimento, origem, observações
- [ ] **4.3** Cadastro rápido (só nome + WhatsApp) — usado dentro do modal de comanda
- [ ] **4.4** Ficha do cliente com:
  - Notas fixáveis no topo (ex.: alérgico a produto X)
  - Etiquetas (tags) coloridas e removíveis (N:N)
  - Ações rápidas: abrir WhatsApp, agendar
  - Estatísticas: total gasto, visitas, ticket médio, dias desde última visita
  - Destaque visual se >60 dias sem visita
  - Destaque se faz aniversário no mês
- [ ] **4.5** Histórico unificado: vendas + agendamentos numa única linha do tempo (agendamento que virou venda aparece só como venda)
- [ ] **4.6** CRUD de tags por tenant (cor própria, visível apenas no próprio tenant)

---

## Fase 5 — Agenda

- [ ] **5.1** Calendário mensal com grade fixa de 6 semanas (42 células) e indicador de carga por dia
- [ ] **5.2** Navegação mês anterior/seguinte + atalho "voltar para hoje"
- [ ] **5.3** Lista de agendamentos do dia selecionado, com filtro por profissional (chips horizontais)
- [ ] **5.4** Botão "criar novo agendamento"
- [ ] **5.5** Formulário de criação/edição de agendamento:
  - Selecionar cliente (com cadastro rápido)
  - Selecionar profissional
  - Selecionar serviço(s) — duração total = soma das durações (com override)
  - Calcular horários disponíveis automaticamente
- [ ] **5.6** Motor de disponibilidade:
  - Percorrer faixas de expediente em passos de 15 min
  - Verificar se duração + folga cabe sem colidir com agendamentos nem bloqueios
  - Folga pós-atendimento = maior `intervalo_pos_min` entre serviços do combo
- [ ] **5.7** Proteção transacional contra conflito: `SELECT ... FOR UPDATE` antes de checar/gravar
- [ ] **5.8** Mudar status do agendamento: confirmar, em atendimento, concluir, cancelar (com motivo), falta
- [ ] **5.9** Cancelamento não apaga a linha — apenas muda status (cancelado/falta continuam visíveis na agenda)
- [ ] **5.10** Tela de detalhe do agendamento com atalho "ir para comanda" para fechar atendimento

---

## Fase 6 — Comanda / Vendas

### Comanda (POS)
- [ ] **6.1** Grade de cartões de serviços e produtos como toggle: tocar adiciona/remove
- [ ] **6.2** Card comunica visualmente "já está na comanda" (cor + ícone/selo)
- [ ] **6.3** Total recalculado em tempo real conforme itens são alternados
- [ ] **6.4** Três botões de forma de pagamento: Dinheiro, Maquininha, Pix
- [ ] **6.5** Pix desabilitado com explicação se tenant não tem integração validada
- [ ] **6.6** Modal de confirmação antes de qualquer cobrança:
  - Lista de itens (removível)
  - Campo de desconto
  - Total recalculado
  - Seleção de cliente (busca nome+telefone)
  - Cadastro rápido de cliente (só nome + WhatsApp) sem sair do modal
  - Seleção de quem atendeu
- [ ] **6.7** Travar botão de envio contra duplo-clique (desabilitar ao enviar)
- [ ] **6.8** Se comanda veio de agendamento, pré-carregar serviços do agendamento
- [ ] **6.9** Ao concluir venda de agendamento, mudar status para "concluído" automaticamente

### Pagamento Dinheiro/Maquininha (confirmação imediata)
- [ ] **6.10** Registrar venda como paga instantaneamente
- [ ] **6.11** Atualizar contadores do cliente (total gasto, visitas, última visita)

### Pagamento Pix
- [ ] **6.12** Registrar venda como pendente (`status_pix = pendente`) e exibir QR Code
- [ ] **6.13** Se falha ao gerar QR, venda continua registrada como pendente (não desaparece)
- [ ] **6.14** Oferecer opção de trocar forma de pagamento se Pix falhou
- [ ] **6.15** Implementar rotina idempotente de confirmação de Pix:
  - Reler registro com lock
  - Sair cedo se já estava pago
  - Marcar como pago e atualizar contadores do cliente
- [ ] **6.16** Botão "já paguei" (polling) — consulta provedor e chama rotina de confirmação

### Webhook (Edge Function)
- [ ] **6.17** Edge Function para webhook do provedor de pagamento:
  - Identificar tenant por token opaco na URL
  - Validar assinatura com segredo do tenant
  - Registrar evento com unicidade `(id_externo, topico)` — barreira contra duplicidade
  - Conferir se pagamento pertence ao tenant
  - Chamar rotina idempotente de confirmação
- [ ] **6.18** Registrar log de eventos de webhook (`eventos_webhook_pagamento`)
- [ ] **6.19** Tela de configuração de recebimento: conectar/desconectar provedor, exibir URL de notificação

---

## Fase 7 — Financeiro / Caixa

- [ ] **7.1** Abas de período: dia, semana, mês, mês fechado (específico)
- [ ] **7.2** Cartões de resumo: total vendas, atendimentos, ticket médio, saldo (vendas + entradas − despesas)
- [ ] **7.3** Pix pendente mostrado à parte, nunca somado no faturamento
- [ ] **7.4** Detalhamento por forma de pagamento (sempre as 3 formas, mesmo zeradas)
- [ ] **7.5** Série por dia para gráfico de barras (CSS puro ou lib leve)
- [ ] **7.6** Ranking de serviços mais vendidos
- [ ] **7.7** Ranking por profissional/equipe
- [ ] **7.8** Lançamentos manuais de entrada e despesa (com exclusão)
- [ ] **7.9** Lista de vendas do período
- [ ] **7.10** Exportação em PDF com os mesmos números da tela (Edge Function)
- [ ] **7.11** Acesso restrito a owner/admin (profissional/recepção não veem — retornar 403)

---

## Fase 8 — Mensagens / Lembretes

- [ ] **8.1** CRUD de templates de mensagem por tenant: tipo (lembrete_24h/aniversario/retorno/pos_atendimento), canal, título, corpo com placeholders, antecedência, ativo
- [ ] **8.2** Templates nascem desligados por padrão
- [ ] **8.3** Edição de templates restrita a admin
- [ ] **8.4** Geração diária da fila de notificações (Edge Function agendada + botão manual "gerar agora")
- [ ] **8.5** Barreira contra duplicidade na fila: chave determinística por tenant (ex.: `lembrete_24h:ag:12`)
- [ ] **8.6** Tela com 3 seções:
  - Para enviar agora (texto visível, botão abre WhatsApp, marca como enviada)
  - Na fila (futuras)
  - Últimas enviadas
- [ ] **8.7** Usar `navigator.sendBeacon` para marcar como enviada antes de trocar para WhatsApp
- [ ] **8.8** Badge visual por tipo de mensagem com cor semântica própria
- [ ] **8.9** Template renderizado é congelado no momento em que entra na fila (`corpo_renderizado`)

---

## Fase 9 — Branding e PWA

- [ ] **9.1** Upload de logo (PNG quadrado, padding para funcionar em círculo e ícone de app)
- [ ] **9.2** Preview + opção de remover logo
- [ ] **9.3** Fallback: inicial do nome do negócio quando não há logo
- [ ] **9.4** Formulário de cores: primária, fundo, card (hex) — com fallback para paleta escura padrão
- [ ] **9.5** Manifest PWA gerado dinamicamente por tenant (nome, cor, ícone)
- [ ] **9.6** Service worker com estratégias:
  - Telas principais: network first com timeout + fallback pra cache
  - Imagens: stale while revalidate
  - Escritas (POST/comanda): sempre rede, nunca cache
  - Página de fallback offline
- [ ] **9.7** Atualizações do SW não automáticas — mostrar aviso "nova versão disponível, atualizar"
- [ ] **9.8** Botão "Instalar app":
  - Capturar evento `beforeinstallprompt` cedo e reemitir
  - iOS: mostrar instrução "Compartilhar → Adicionar à Tela de Início"
  - Não mostrar se já está instalado (`display-mode: standalone`)
- [ ] **9.9** `apple-touch-icon` e `theme-color` dinâmicos por tenant (inclusive na tela de login)

---

## Fase 10 — Painel da Plataforma (Super Admin)

- [ ] **10.1** Rota separada da área do negócio (devolve 404 para não-super-admin)
- [ ] **10.2** Lista de negócios com métricas: usuários, clientes, valor mensal, vencimento
- [ ] **10.3** MRR agregado (receita mensal recorrente de todos os tenants ativos)
- [ ] **10.4** Criar novo negócio (definir vertical e módulos habilitados)
- [ ] **10.5** Ativar/desativar negócio
- [ ] **10.6** Tela de cobrança SaaS: gerar cobrança do mês, marcar como paga, lançar despesa da plataforma
- [ ] **10.7** Tela por-negócio: editar vertical + módulos habilitados
- [ ] **10.8** Ação "entrar" no negócio (super admin vê dados do tenant, continua sendo ele mesmo — registrar em log de auditoria)
- [ ] **10.9** Logs de auditoria visíveis para super admin

---

## Geral / Transversal

- [ ] **G.1** Estado vazio com borda tracejada + explicação em todas as listas
- [ ] **G.2** Toda ação destrutiva com confirmação (excluir nota, remover etiqueta, cancelar agendamento)
- [ ] **G.3** Feedback de toque: `scale(0.975)` por ~60ms no mobile
- [ ] **G.4** `:focus-visible` apenas para navegação por teclado (não em clique)
- [ ] **G.5** Respeitar `prefers-reduced-motion`
- [ ] **G.6** Listas em mobile = cards empilhados (nunca tabela com scroll horizontal)
- [ ] **G.7** SVG inline para ícones (stroke, 24×24, currentColor, espessura consistente)
- [ ] **G.8** Conjunto de ícones de interface + ícones por palavra-chave de serviço + fallback
- [ ] **G.9** Inputs nativos (date, time, select) com `color-scheme: dark`
- [ ] **G.10** Contadores materializados do cliente (total_gasto, visitas, ultima_visita) atualizados incrementalmente
- [ ] **G.11** Rotina de reconciliação disponível para corrigir contadores do cliente
- [ ] **G.12** Números formatados em pt-BR: `R$ 1.234,56`
- [ ] **G.13** Números alinhados com `tabular-nums`
- [ ] **G.14** Todos os cálculos de data no fuso do tenant, convertendo para UTC só na borda da query
- [ ] **G.15** Sistema de temas com variáveis CSS lidas do tenant em runtime (nunca hardcoded)
