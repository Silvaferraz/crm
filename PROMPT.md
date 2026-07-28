# Prompt — Reconstruir o TrueBarbershop do zero em React + Supabase

---

## 1. Papel e objetivo

Você é uma engenheira de software sênior contratada para **reconstruir do zero** um CRM/SaaS de
agendamento e cobrança para pequenos negócios de serviço (barbearias, salões de beleza, clínicas
de estética, clínicas em geral). O sistema original é feito em Laravel + Blade + Alpine.js +
Tailwind CSS. Você vai recriá-lo com:

- **Frontend**: React (Vite), TypeScript, roteamento client-side.
- **Backend/dados**: Supabase — Postgres com Row Level Security (RLS), Auth, Storage, e Edge
  Functions para a lógica que não pode ficar só no cliente (webhook de pagamento, geração de PDF).

Regras não negociáveis:

1. **Nenhum dado real.** Nada de nomes de clientes, telefones, e-mails, tokens ou credenciais reais
   — o sistema nasce vazio, com no máximo dados de *seed* fictícios claramente marcados como tal.
2. **Paridade de funcionalidade.** Tudo que está descrito neste documento precisa existir no
   final. Não é um MVP reduzido — é o sistema inteiro, só que numa stack nova.
3. **Paridade visual.** O layout, a paleta de cores, a tipografia, os ícones, os componentes e o
   "feel" mobile-first (ver Seção 8) precisam ser reconhecíveis como o mesmo produto.
4. **Não inventar.** Se uma funcionalidade não está descrita aqui e você não tem certeza se deveria
   existir, pergunte antes de implementar. Não adicione recursos "vindos da sua cabeça" — nem
   simplificações silenciosas, nem extras não pedidos.
5. **Trabalhe em fases**, cada uma entregando algo que roda de ponta a ponta, e pare ao final de
   cada fase para validação antes de seguir. A ordem sugerida está na Seção 12.

---

## 2. Visão geral do produto

É um **SaaS multi-tenant**: uma única instalação atende vários negócios independentes (tenants),
cada um com seus próprios clientes, agenda, caixa e configurações — completamente isolados uns dos
outros. O mesmo produto atende **4 verticais de negócio diferentes** (ver Seção 5.1), e o
vocabulário da interface muda conforme o nicho: o que numa barbearia é "Cliente" numa clínica é
"Paciente"; "Barbeiro" numa clínica é "Profissional"; "Horário" numa clínica de estética é
"Sessão". Isso é feito por um sistema de terminologia configurável, não por telas diferentes — é
o **mesmo código**, o texto que muda.

### 2.1 Quem usa o sistema

| Papel | O que pode fazer |
|---|---|
| **Dono / Administrador** (`owner`, `admin`) | Tudo dentro do próprio negócio: agenda, cobrança, clientes, financeiro/caixa, e todos os Ajustes (serviços, produtos, equipe, usuários, dados do negócio, conexão de pagamento). |
| **Profissional** (`professional`) | Agenda e comanda/cobrança do dia a dia. Não vê o Caixa (financeiro) nem os Ajustes. |
| **Recepção** (`receptionist`) | Mesmo escopo do profissional: agenda, cobrar, clientes, mensagens. Não vê Caixa nem Ajustes. |
| **Super administrador** (flag `super_admin`, atravessa todos os tenants) | Não é "dono" de nenhum negócio específico — administra a plataforma inteira: cria/desativa negócios, define a vertical e os módulos habilitados de cada um, acompanha a mensalidade recebida de cada tenant (MRR do próprio SaaS), pode "entrar" num negócio para dar suporte. Painel completamente separado do painel do dono. |

Uma pessoa pode ter contas em **mais de um negócio com o mesmo usuário/senha** — nesse caso, ao
logar, o sistema pergunta "em qual negócio?" antes de entrar (ver Seção 6.1).

### 2.2 Por que multi-tenant importa aqui

Isolamento entre negócios não é um detalhe de implementação, é a característica central do
produto: nenhum dado de um negócio pode nunca ser lido ou escrito por outro. Isso precisa ser
garantido **no banco** (Row Level Security do Postgres/Supabase), não só filtrado nas queries da
aplicação — porque um filtro esquecido em uma única query vaza dado de um cliente para outro, e
isso é o pior tipo de bug possível num SaaS B2B.

---

## 3. Arquitetura alvo

### 3.1 Frontend

- **React + Vite + TypeScript.**
- Roteamento client-side (React Router ou equivalente), com uma casca de layout autenticado
  (sidebar/bottom-nav — ver Seção 8) e uma tela de login fora dela.
- Estado de servidor via alguma lib de data-fetching com cache (React Query/TanStack Query é uma
  escolha razoável) conversando com o Supabase client (`@supabase/supabase-js`).
- PWA: manifest **gerado dinamicamente por tenant** (nome, cor, ícone mudam conforme o negócio
  logado/identificado), service worker com estratégias de cache diferentes por tipo de rota (ver
  Seção 10), botão "Instalar app".

### 3.2 Backend / Supabase

- **Postgres** com uma tabela por entidade (schema completo na Seção 4), todas com coluna
  `tenant_id` e **RLS habilitado** — a política padrão é "só posso ler/escrever linhas do meu
  próprio tenant_id", derivado do usuário autenticado (não de um parâmetro que o cliente manda).
- **Supabase Auth** para login/sessão. Atenção: o sistema original tem um comportamento específico
  de multi-tenant no login (mesmo usuário/senha podendo pertencer a mais de um tenant) que o
  Supabase Auth padrão (1 e-mail = 1 usuário) não replica automaticamente — modele isso com uma
  tabela própria de "contas" vinculando `auth.users` a `(tenant_id, papel)`, permitindo que a
  mesma pessoa tenha múltiplas linhas. Documente a decisão tomada.
- **Storage** para as logos dos negócios (bucket público, só leitura anônima, escrita restrita ao
  dono autenticado do tenant).
- **Edge Functions** para o que não pode rodar no cliente:
  - Webhook do provedor de pagamento (recebe POST de fora, sem sessão de usuário — ver Seção 5.4).
  - Emissão/consulta de cobrança Pix junto ao provedor (a credencial do provedor nunca pode viajar
    para o navegador).
  - Geração do relatório financeiro em PDF.
  - Geração diária da fila de mensagens/lembretes (equivalente ao cron do sistema original — pode
    ser uma função agendada via `pg_cron` ou um agendador externo chamando a Edge Function).

### 3.3 O que muda de propósito em relação ao original (e está OK mudar)

- Autenticação por bcrypt manual → Supabase Auth. Ganho arquitetural aceitável, desde que o
  comportamento multi-tenant do login seja preservado (Seção 6.1).
- Provedor de pagamento Pix: o sistema original integra com o Mercado Pago, por tenant, com
  credencial própria por negócio. Se integrar com o Mercado Pago no Supabase não for viável,
  qualquer provedor de Pix equivalente serve — o que **não pode mudar** é o fluxo: cobrança criada
  como pendente, confirmação assíncrona via webhook assinado, mais um polling manual "já paguei"
  como plano B, tudo idempotente (nunca contar o mesmo pagamento duas vezes).
- Geração de PDF pode usar qualquer biblioteca equivalente ao dompdf usado hoje.

---

## 4. Modelo de dados

Abaixo, tabela por tabela, com os campos que importam e o **porquê** de cada decisão — isso não é
um CRUD genérico, cada estrutura resolve um problema real do negócio.

### 4.1 `tenants` — o negócio (o "cliente" do SaaS)
- `id`, `nome`, `slug`, `categoria` (chave técnica da vertical: `barbearia`/`salao`/`estetica`/
  `clinica` — ver Seção 5.1), `nicho` (texto livre que o dono escreve para se descrever, ex.:
  "Studio de tatuagem" — não afeta lógica nenhuma, é só identidade),
  `logo` (caminho do arquivo no Storage), `cor_primaria`/`cor_fundo`/`cor_card` (hex, branding —
  ver Seção 8.2), `timezone` (ex.: `America/Sao_Paulo` — **cada tenant tem seu próprio fuso**,
  isso é usado em todo cálculo de data/hora), `whatsapp`, `ativa` (bool), `vencimento`
  (dia do mês em que vence a mensalidade do SaaS), `valor_mensal` (quanto o tenant paga pelo SaaS),
  `webhook_token` (string opaca única, usada para identificar o tenant nas notificações do
  provedor de pagamento, sem depender de sessão).

### 4.2 `usuarios` — quem loga no painel
- `id`, `tenant_id`, `nome`, `usuario` (login), `papel` (`owner`/`admin`/`professional`/
  `receptionist`), `super_admin` (bool). **Unicidade de `usuario` é por tenant, não global** — dois
  negócios diferentes podem ter cada um o seu "admin".

### 4.3 `clientes` — a ficha do cliente do negócio (não confundir com o tenant)
- `id`, `tenant_id`, `nome`, `telefone`, `telefone_e164` (telefone normalizado só com dígitos e
  DDI, usado para montar o link do WhatsApp), `email`, `data_nascimento`, `origem` (como chegou),
  `observacoes`, `total_gasto`, `quantidade_visitas`, `ultima_visita` — **estes três últimos são
  contadores materializados**, não calculados on-the-fly: recalculá-los a cada carregamento de tela
  tornaria a lista de clientes lenta. Eles são atualizados de forma incremental a cada venda
  confirmada, com uma rotina de reconciliação disponível para corrigir divergências.
  Regra importante: **Pix pendente nunca conta como visita nem soma no total_gasto** — só quando
  confirmado.
- `cliente_notas`: `id`, `tenant_id`, `cliente_id`, `usuario_id`, `corpo`, `fixada` (bool — nota
  fixada aparece destacada no topo da ficha, é onde fica "alérgica a produto X" ou "não atender
  sem sinal").
- `tags` + `cliente_tag`: etiquetas por tenant (não globais — um negócio não vê as etiquetas do
  outro), cor própria, N:N com cliente.

### 4.4 `servicos` e `produtos` — o que o negócio vende
- `servicos`: `id`, `tenant_id`, `nome`, `preco`, `ativo`, `duracao_min` (usada para calcular o
  fim de um agendamento), `cor` (cor do bloco na agenda; nulo = usa a cor do profissional),
  `intervalo_pos_min` (folga depois do atendimento, para limpeza/preparo — **não** soma no horário
  de término mostrado ao cliente, só é usado para calcular o próximo horário livre).
- `produtos`: `id`, `tenant_id`, `nome`, `preco`, `ativo` — itens de venda avulsa (não têm duração
  nem entram na agenda, só na comanda).

### 4.5 Agenda — o motor de agendamento
- `profissionais`: `id`, `tenant_id`, `usuario_id` (opcional — um profissional pode ter agenda sem
  ter login, e um usuário administrativo pode não ter agenda), `nome`, `apelido`, `foto`, `cor`
  (usada em toda a UI para identificar visualmente quem atende), `ativo`, `ordem`.
- `profissional_servico`: override opcional de duração/preço por combinação profissional×serviço
  (a mesma coloração pode levar tempos diferentes com profissionais diferentes). Ausência de
  vínculo = "faz tudo, no padrão do serviço".
- `horarios_trabalho`: `id`, `tenant_id`, `profissional_id`, `dia_semana` (0=domingo…6=sábado),
  `hora_inicio`, `hora_fim`, `vigencia_inicio`/`vigencia_fim` (nulos = escala permanente).
  **Várias linhas no mesmo dia são o desenho, não um bug**: 09:00–12:00 + 13:00–18:00 dá o
  intervalo de almoço automaticamente, sem precisar de uma coluna "pausa".
- `bloqueios_agenda`: `id`, `tenant_id`, `profissional_id` (nulo = fecha o estabelecimento
  inteiro — feriado), `inicio`, `fim`, `motivo`, `tipo` (`folga`/`feriado`/`pessoal`).
- `agendamentos`: `id`, `tenant_id`, `cliente_id` (**nulo é permitido** — encaixe anônimo sem ficha
  cadastrada), `profissional_id`, `inicio`, `fim` (sempre gravados em **UTC**; conversão para o
  fuso do tenant acontece só na borda de entrada/saída da aplicação), `status`
  (`agendado`/`confirmado`/`em_atendimento`/`concluido`/`cancelado`/`falta`), `origem`
  (`painel`/`online`/`importado`), `observacoes`, `pagamento_id` (link para a venda quando
  cobrado), `cancelado_em`, `cancelado_motivo`.
- `agendamento_servicos`: snapshot de `preco_no_momento` e `duracao_no_momento` por serviço do
  agendamento — **mudar o preço de tabela depois não pode reescrever um agendamento já marcado.**

**Regras do motor de agenda** (implementar como lógica de domínio, não espalhada em componentes de
UI):
- Duração total do agendamento = soma da duração dos serviços escolhidos (com override do
  profissional aplicado quando existir).
- Folga pós-atendimento = o **maior** `intervalo_pos_min` entre os serviços do combo (não a soma).
- Um horário só é válido se cabe **inteiro** dentro de uma única faixa de expediente (duas faixas
  coladas não emendam — se o dono quer atender por cima do horário de almoço, ele cadastra uma
  faixa só).
- Verificação de conflito (dois agendamentos sobrepostos no mesmo profissional) precisa ser
  **transacional e com lock** — sem isso, dois toques simultâneos no botão de agendar (ou uma
  corrida de rede) podem criar dois compromissos no mesmo horário. No Postgres/Supabase, use uma
  transação com `SELECT ... FOR UPDATE` na linha do profissional antes de checar/gravar.
- Cancelar não apaga a linha — muda o status. Cancelado/falta continuam aparecendo na agenda do
  dia (o dono precisa ver quem desmarcou).
- Geração de horários livres: para cada faixa de expediente do dia, percorrer em passos (ex.: 15
  min) checando se o intervalo (duração do serviço + folga) cabe sem colidir com agendamentos
  existentes nem bloqueios.

### 4.6 Vendas / caixa
- `pagamentos`: `id`, `tenant_id`, `cliente_id` (nulo permitido), `agendamento_id` (nulo — venda
  pode não vir de um agendamento, ex. balcão), `data_hora`, `valor_total`, `forma_pagamento`
  (`pix`/`maquininha`/`dinheiro`), `status_pix` (`pendente`/`pago`, **só se aplica quando
  forma_pagamento = pix**; nas outras formas é nulo — e é justamente esse nulo que indica "já é
  dinheiro em caixa"), `barbeiro_id` (quem atendeu), `id_externo_pagamento` (referência do
  provedor), `status_provedor` (status cru retornado pelo provedor, útil para investigar sem abrir
  o painel deles), `qr_code`/`qr_base64` (dados do Pix).
- `pagamento_servicos` / `pagamento_produtos`: snapshot de `preco_no_momento` — mesmo raciocínio
  do agendamento: histórico de venda não pode mudar quando a tabela de preços mudar.
- `despesas` / `entradas_manuais`: lançamentos manuais de caixa (`id`, `tenant_id`, `valor`,
  `descricao`, `criado_em`).

**Regra de "conta" (faturamento)**: tudo que **não é** Pix, mais o Pix **pago**. Pix pendente
aparece separado, como informação, e **nunca** soma no faturamento — regra crítica de negócio,
respeitada em toda tela e no relatório em PDF (os dois precisam bater número a número).

**Idempotência de confirmação de Pix**: tanto o webhook do provedor quanto um botão manual
"já paguei" (polling) podem tentar confirmar o mesmo pagamento — a operação de confirmação precisa
ser segura contra dupla-execução (checar o estado atual com lock antes de aplicar a mudança, sair
cedo se já estava confirmado).

### 4.7 Planos (assinaturas do cliente final — funcionalidade legada, incluir se fizer sentido)
- `planos`: `id`, `tenant_id`, `nome_plano`, `valor`, `descricao`, `ativo`.
- `cliente_planos`: `id`, `tenant_id`, `cliente_id`, `plano_id`, `data_inicio`, `data_fim`, `ativo`.

### 4.8 Integração de pagamento
- `tenant_integracoes`: `id`, `tenant_id`, `provedor`, `access_token` (**criptografado em
  repouso**, nunca em texto plano), `webhook_secret` (criptografado), `payer_email`,
  `validado_em`/`validado_como` (nulo = credencial nunca testada com sucesso — nenhum tenant deve
  poder cobrar Pix sem isso), `ativo`.
- `eventos_webhook_pagamento`: `id`, `tenant_id`, `id_pagamento_externo`, `topico`, `resultado`,
  `payload`, `criado_em`, com **unicidade em `(id_pagamento_externo, topico)`** — é a barreira que
  impede processar a mesma notificação duas vezes (provedores de pagamento reenviam notificação
  quando não recebem 200 rápido o bastante).

### 4.9 Mensagens / lembretes
- `mensagem_templates`: `id`, `tenant_id`, `tipo` (`lembrete_24h`/`aniversario`/`retorno`/
  `pos_atendimento`), `canal` (`whatsapp_link` hoje; `whatsapp_api` é o próximo passo, mesma
  tabela), `titulo`, `corpo` (com placeholders), `antecedencia` (horas antes do compromisso, ou
  dias de ausência — depende do tipo), `ativo`. **Nascem desligados por padrão** — ninguém quer
  descobrir no primeiro dia que o sistema mandou mensagem para a base inteira.
- `notificacoes` (a fila): `id`, `tenant_id`, `cliente_id`, `agendamento_id`, `tipo`, `canal`,
  `agendado_para`, `status` (`pendente`/`enviada`/`cancelada`/`falhou`), `destino_e164`,
  `corpo_renderizado` (**o texto é congelado no momento em que entra na fila** — editar o
  template depois não muda mensagens já agendadas), `enviado_em`, `erro`, `chave` (string
  determinística tipo `lembrete_24h:ag:12` ou `aniversario:cli:5:2026-08`, com unicidade por
  tenant — é a barreira contra duplicidade quando a rotina de geração roda mais de uma vez).

**Sem API paga de WhatsApp, o envio automático de fato não existe** — o sistema gera a fila e
mostra um botão que abre `wa.me` com o texto pronto para o atendente clicar manualmente. Isso é
intencional, não uma limitação a esconder: documente essa camada como está, com espaço para depois
um canal `whatsapp_api` consumir a mesma fila sem mudar o resto.

### 4.10 Financeiro da própria plataforma (SaaS)
- `pagamentos_saas`: `id`, `tenant_id`, `valor`, `mes_referencia` (`YYYY-MM`), `status`
  (`pendente`/`pago`/`cancelado`), `data_pagamento`, unicidade em `(tenant_id, mes_referencia)`.
- `despesas_saas`: sem `tenant_id` — é o caixa da própria plataforma, não de um cliente.

### 4.11 Auditoria
- `logs_auditoria`: `id`, `tenant_id`, `usuario`, `acao`, `descricao`, `ip`, `criado_em`.

### 4.12 Configuração livre
- `configuracoes`: chave/valor por tenant (`tenant_id`, `chave`, `valor`) — usada hoje para
  overrides pontuais de rótulo de terminologia por tenant (ex.: um salão que prefere "hóspede" a
  "cliente" sem precisar mexer em código).

---

## 5. Regras de negócio (o que faz este sistema ser este sistema, não um CRUD genérico)

### 5.1 Terminologia por vertical (white-label de vocabulário)

O texto da interface muda conforme `tenants.categoria`. Implemente como uma configuração de dados
(não como telas duplicadas): um objeto/tabela por vertical com os rótulos singular/plural de cada
conceito (`cliente`, `profissional`, `servico`, `produto`, `agendamento`, `negocio`,
`atendimento`), a duração padrão sugerida ao cadastrar um serviço novo, uma lista de serviços
sugeridos para o cadastro inicial (para o negócio não abrir numa tela em branco), e um mapa de
ícone por palavra-chave do nome do serviço.

As 4 verticais e seus rótulos principais:

| Vertical (`categoria`) | cliente | profissional | servico | agendamento | negocio |
|---|---|---|---|---|---|
| `barbearia` (padrão) | Cliente | Barbeiro | Serviço | Horário | Barbearia |
| `salao` | Cliente | Profissional | Serviço | Horário | Salão |
| `estetica` | Cliente | Especialista | Procedimento | Sessão | Clínica |
| `clinica` | Paciente | Profissional | Procedimento | Consulta | Clínica |

Resolução do rótulo, da mais específica para a mais genérica: **1)** override gravado por aquele
tenant em `configuracoes` → **2)** rótulo da vertical do tenant → **3)** rótulo da vertical padrão
(barbearia) → **4)** se nada bater, mostre a própria chave crua (ex.: `cliente.plural`) — propositalmente
visível, para um rótulo faltando ser óbvio ao testar, em vez de aparecer como texto vazio.

Um helper/hook único (`useTerminologia()` ou equivalente) deve ser usado em toda a interface — não
duplique a lógica de resolução em cada componente.

### 5.2 Comanda / POS (a tela que se usa dezenas de vezes por dia)

Esta é a tela de maior uso do sistema — precisa ser rápida e resiliente a rede ruim (o carrinho
inteiro deve viver no estado do cliente, só tocando a rede no envio final):

- Grade de cartões de **serviços** e (se houver) **produtos**, cada cartão é um **toggle**: tocar
  adiciona à comanda, tocar de novo remove. Nunca "empilha" — dois cortes na mesma comanda exigem
  dois toques em cards diferentes ou duas comandas, não é permitido duplicar o mesmo item por
  acidente. O card precisa comunicar visualmente "já está dentro" (não só cor — usar também um
  ícone/selo, para acessibilidade).
- Total recalculado em tempo real conforme os itens são alternados.
- Três formas de pagamento como botões: **Dinheiro**, **Maquininha**, **Pix**. Pix fica desabilitado
  (com explicação) se o negócio não tiver uma integração de pagamento validada.
- Tocar em qualquer forma de pagamento abre um **modal de confirmação antes de qualquer cobrança
  acontecer** — mesmo em dinheiro. Nesse modal: lista de itens (removível), campo de desconto,
  total recalculado, seleção de cliente (busca por nome+telefone, o telefone desempata clientes de
  mesmo nome), atalho de **cadastro rápido de cliente** (só nome + WhatsApp, sem sair do modal —
  chamada separada da confirmação da venda, para o cadastro não travar se a comanda falhar depois),
  seleção de quem atendeu. Só depois desse modal a venda é de fato enviada.
- Se a comanda vier de um agendamento sendo fechado, pré-carregar os serviços daquele agendamento.
- Travar contra duplo envio (o atendente reclica com rede lenta) — desabilitar o botão assim que o
  envio começa.
- Ao concluir a venda com sucesso, se ela veio de um agendamento, o agendamento muda para
  "concluído" automaticamente (fechar a comanda é o que fecha o atendimento — não deve exigir dois
  toques em telas diferentes).

### 5.3 Fluxo de pagamento Pix

1. Venda registrada como pendente (`status_pix = pendente`), QR code gerado e mostrado.
2. Confirmação chega por dois caminhos possíveis, que precisam poder correr em paralelo sem
   duplicar: **(a)** webhook do provedor de pagamento, **(b)** botão "já paguei" na tela, que
   consulta o status atual junto ao provedor.
3. Confirmar é **idempotente**: relê o registro com lock, sai cedo se já estava pago, senão marca
   como pago e só então atualiza os contadores do cliente.
4. Contadores do cliente (total gasto, visitas, última visita) só sobem na confirmação — nunca na
   criação da cobrança pendente.
5. Se a chamada ao provedor falhar ao gerar o QR, a venda **continua registrada** como Pix
   pendente (não desaparece) — o atendimento aconteceu de verdade, apagar o registro faria o caixa
   fechar errado; a tela deve oferecer trocar a forma de pagamento depois.

### 5.4 Webhook do provedor de pagamento

Roda fora de qualquer sessão de usuário (é o servidor do provedor chamando). Fluxo mínimo a
implementar:

1. Identificar o tenant por um token opaco na própria URL do webhook (não por header nem sessão).
2. Validar a assinatura da notificação com o segredo daquele tenant especificamente (segredo é
   por-tenant, não global).
3. Registrar o evento numa tabela com unicidade em `(id_externo, tópico)` **antes** de processar —
   essa unicidade é a barreira contra reprocessar a mesma notificação reenviada.
4. Conferir que o pagamento referenciado realmente pertence àquele tenant antes de confirmar.
5. Chamar a mesma rotina idempotente de confirmação usada pelo polling manual.

### 5.5 Financeiro / Caixa

- Períodos: **dia** (desde 00:00 de hoje), **semana** (desde segunda-feira desta semana), **mês**
  (desde dia 1º), e **mês fechado** (um mês passado específico, do dia 1 ao último dia).
- Todo cálculo de intervalo de data é feito **no fuso do tenant** e só convertido para UTC na
  borda da consulta ao banco — nunca usar o fuso do servidor.
- Resumo do período: total de vendas, atendimentos, ticket médio, saldo (vendas + entradas manuais
  − despesas), Pix pendente (mostrado à parte, nunca somado no faturamento).
- Detalhamento por forma de pagamento (sempre mostrando as três formas, mesmo zeradas — uma tabela
  que muda de tamanho conforme o movimento é difícil de ler de relance).
- Série "por dia" para gráfico de barras.
- Ranking de serviços mais vendidos e ranking por profissional/equipe.
- Lançamentos manuais de entrada e despesa, com exclusão.
- Lista de vendas do período.
- Exportação em PDF com os **mesmos números** da tela (mesma função de cálculo por trás dos dois,
  nunca duas implementações divergentes).
- Acesso restrito a quem administra (dono/admin) — profissional e recepção não veem esta tela.

### 5.6 Clientes (ficha do CRM)

- Lista com busca.
- Ficha do cliente: notas fixáveis no topo (para avisos importantes tipo alergia), etiquetas
  (tags) coloridas e removíveis, ações rápidas (abrir WhatsApp, agendar), estatísticas (total
  gasto, visitas, ticket médio, dias desde a última visita — com destaque visual quando passou de
  ~60 dias sem vir), dados de contato, indicação visual de "faz aniversário este mês", **histórico
  unificado** combinando vendas e agendamentos numa única linha do tempo ordenada por data (um
  agendamento que já virou venda aparece só como venda, não duplicado).
- Cadastro completo (nome, telefone, e-mail, nascimento, origem, observações) e cadastro rápido
  (só nome + telefone, usado dentro da comanda).

### 5.7 Mensagens / lembretes

- Geração diária automática da fila (rodando via agendador, ex.: `pg_cron` chamando uma Edge
  Function, ou um agendador externo) + botão manual "gerar agora" para quem não tem agendador
  configurado.
- Tela com três seções: **para enviar agora** (com o texto completo visível antes de mandar, botão
  que abre o WhatsApp com o texto pronto e marca como enviada — usar `navigator.sendBeacon` ou
  equivalente para essa marcação sobreviver à troca de app para o WhatsApp), **na fila** (futuras),
  **últimas enviadas**.
- Badge visual por tipo de mensagem (lembrete/aniversário/retorno), cada um com uma cor semântica
  própria, não texto cinza genérico.
- Edição de templates restrita a quem administra; disparar o lembrete de hoje é trabalho de
  qualquer atendente.

### 5.8 Multi-tenant e papéis

- RLS: toda tabela com `tenant_id` só permite leitura/escrita de linhas do tenant do usuário
  autenticado, deduzido de uma tabela de vínculo usuário↔tenant — nunca de um parâmetro vindo do
  cliente.
- Super admin atravessa tenants deliberadamente — modele isso como uma exceção explícita e
  auditada nas políticas de RLS (ou como rotas que só passam por Edge Functions com service role),
  nunca como um "desligar RLS" genérico.
- Painel do super admin: lista de negócios com contadores (usuários, clientes, valor mensal,
  vencimento), MRR agregado, tela de cobrança/mensalidades do SaaS (marcar pago, lançar despesa da
  plataforma), ativar/desativar negócio, "entrar" num negócio para dar suporte (o super admin
  continua sendo ele mesmo, só passa a ver os dados daquele tenant — registrar essa ação em log de
  auditoria), edição por-tenant de vertical e de quais módulos estão habilitados.
- Rotas do painel do super admin devem devolver **404 e não 403** para quem não é super admin — um
  403 confirmaria que a rota existe; 404 esconde a existência do painel.

### 5.9 Branding / white-label

- Cada tenant define: logo (upload, normalizado para um formato único — ex. PNG quadrado, com
  algum padding para funcionar bem tanto em círculo quanto em ícone de app), e três cores
  (`cor_primaria`, `cor_fundo`, `cor_card`).
- Essas cores são aplicadas como variáveis de tema no CSS, lidas em runtime a partir do tenant
  logado — nunca hardcoded em componente.
- A tela de login e o manifest do PWA precisam mostrar a marca do negócio **mesmo sem sessão
  ativa** — resolvendo o tenant por um parâmetro de URL (`?n=`) e/ou um cookie de longa duração
  gravado no aparelho após o primeiro login bem-sucedido (nunca usado para autenticar, só para
  saber qual logo desenhar). O super admin nunca deve disparar esse comportamento — o login dele
  continua genérico.
- Fallback sempre presente: quem não subiu logo continua vendo a inicial do nome do negócio; quem
  não personalizou cor vê a paleta padrão escura (Seção 8.2).

---

## 6. Telas (inventário completo, com comportamento)

Assuma **mobile-first**: cada tela abaixo é primeiro desenhada para celular, depois adaptada para
desktop (ver Seção 8.1 sobre o padrão de navegação).

### 6.1 Login
Tela isolada (sem a casca/menu do app). Campos usuário e senha, checkbox "continuar conectado
neste aparelho". Mostra a marca do negócio (logo ou inicial + nome) quando resolvida por cookie/
URL, senão mostra a identidade genérica do produto. **Se o usuário/senha combinarem com contas em
mais de um tenant**, mostra uma segunda etapa: lista de rádio "em qual negócio?" antes de entrar —
não escolha o primeiro silenciosamente.

### 6.2 Hoje / Cobrar (tela inicial, o "balcão")
A home do app. No topo, a comanda completa (Seção 5.2) — é a tarefa mais frequente, por isso vem
primeiro. Abaixo, separado visualmente, um resumo do dia: cartões de estatística (faturamento,
atendimentos, Pix pendente, total de clientes), lista "a seguir" (próximos agendamentos de hoje,
com link para o detalhe), lista dos últimos atendimentos cobrados.

### 6.3 Agenda
Calendário mensal (grade fixa de 6 semanas/42 células, para a lista de baixo não pular de posição
ao trocar de mês), com indicador de carga por dia (pontos para até 3 agendamentos, número acima
disso), navegação mês anterior/seguinte, atalho "voltar para hoje". Abaixo, lista dos agendamentos
do dia selecionado, com filtro por profissional (chips horizontais). Botão de criar novo
agendamento. Tela de detalhe do agendamento (mudar status, cancelar com motivo, ou seguir direto
para a comanda para fechar o atendimento).

### 6.4 Clientes
Lista com busca. Ficha completa conforme Seção 5.6.

### 6.5 Mensagens
Conforme Seção 5.7: fila para enviar, na fila (futuras), últimas enviadas, mais a tela de edição
de templates (admin).

### 6.6 Financeiro / Caixa
Conforme Seção 5.5: tabs de período, cartões de resumo, detalhamento por forma de pagamento,
gráfico de barras por dia, rankings, lançamentos manuais, lista de vendas, exportar PDF. **Não
existe biblioteca de gráficos no sistema original** — as barras são feitas com largura percentual
em CSS puro; você pode usar uma lib leve se preferir, mas não é obrigatório.

### 6.7 Ajustes (hub, acesso só para quem administra)
Uma tela índice levando a:
- **Negócio**: nome, nicho (texto livre), logo (upload com preview e opção de remover), WhatsApp,
  fuso horário (select com as zonas brasileiras relevantes), as três cores de branding.
- **Recebimento**: estado da conexão com o provedor de pagamento (conectado/não conectado, quando
  foi validado), formulário para (re)configurar a credencial (campo tipo senha, nunca reexibida em
  texto puro), segredo do webhook, e-mail do pagador, liga/desliga Pix no caixa, exibição da URL
  de notificação (para conferência, não precisa ser cadastrada manualmente em lugar nenhum),
  desconectar conta.
- **Serviços**: CRUD com preço, duração, cor, intervalo pós-atendimento, ativo/inativo, e um botão
  para semear os serviços sugeridos da vertical (útil no cadastro inicial vazio).
- **Produtos**: CRUD com preço, ativo/inativo.
- **Equipe**: CRUD de profissionais (nome, apelido, foto, cor), horários de trabalho recorrentes
  por dia da semana (com opção de replicar um dia para os outros), bloqueios pontuais
  (folga/feriado/pessoal).
- **Usuários**: CRUD de contas de acesso ao painel (login, papel, redefinir senha).

### 6.8 Painel da Plataforma (super admin, rota/área totalmente separada)
Lista de negócios com métricas, criação de novo negócio, tela de mensalidades/cobrança do SaaS
(gerar cobrança do mês, marcar como paga, lançar despesa da plataforma), tela por-negócio de
vertical + módulos habilitados, ação de ativar/desativar negócio, ação de "entrar" no negócio.

---

## 7. Papéis e permissões (matriz de referência)

| Área | owner / admin | professional / receptionist | super_admin |
|---|---|---|---|
| Hoje / Cobrar | ✅ | ✅ | atravessa (ao "entrar" num tenant) |
| Agenda | ✅ | ✅ | idem |
| Clientes | ✅ | ✅ | idem |
| Mensagens (disparar) | ✅ | ✅ | idem |
| Mensagens (editar templates) | ✅ | ❌ | idem |
| Financeiro / Caixa | ✅ | ❌ (403) | idem |
| Ajustes (todas as sub-telas) | ✅ | ❌ (403) | idem |
| Painel da Plataforma | ❌ (404) | ❌ (404) | ✅ |

---

## 8. Sistema de design

O produto é **dark-mode-only** por definição — não existe alternância clara/escura, é uma escolha
de identidade, não uma preferência de usuário.

### 8.1 Layout e navegação

- No celular: barra de navegação **fixa na parte de baixo da tela**, translúcida com desfoque
  (`backdrop-blur`), até 5 itens (Cobrar, Agenda, Clientes, Mensagens, e Caixa só para quem
  administra). Item ativo marcado por cor **e** por um traço no topo do ícone (nunca só por
  opacidade — precisa ser legível sob sol, no celular).
- No desktop (a partir de ~768px): a mesma navegação vira uma **barra lateral fixa** de ~240px,
  com o item ativo em formato de pastilha preenchida. No topo da barra lateral, logo/inicial do
  negócio + nome. No rodapé, avatar do usuário logado + botão de sair, e (se super admin) link
  para o Painel da Plataforma.
- **Ajustes não fica na navegação principal** — vive atrás de um menu de conta no canto superior
  direito (avatar), para não disputar espaço com as tarefas do dia a dia.
- Conteúdo principal: coluna centralizada com largura máxima (~48rem), padding responsivo,
  respeitando a área segura do sistema (notch/gestos) no celular.

### 8.2 Paleta de cores (tokens semânticos)

Três cores vêm do tenant (branding, white-label) e têm um valor de fallback; todas as outras são
fixas — cores de **significado**, que não podem ser sobrescritas pela marca do negócio (um tenant
que escolhe roxo não pode fazer "cancelado" deixar de ser vermelho):

```
--cor-marca:   var(--tenant-primaria, #ffffff)   /* cor de destaque/marca do tenant */
--cor-fundo:   var(--tenant-fundo,   #0c0c0c)    /* fundo geral */
--cor-card:    var(--tenant-card,    #1a1a1a)    /* superfície de cartão */

--cor-elevado: #262626   /* "cartão dentro do cartão": item selecionado, hover, linha ativa */
--cor-fosco:   #141414   /* fundo da barra lateral no desktop */

--cor-borda:        rgba(255,255,255,0.09)  /* traço padrão, discreto */
--cor-borda-forte:  rgba(255,255,255,0.18)  /* traço de item ativo/em foco */

--cor-suave: rgba(255,255,255,0.58)  /* texto de apoio */
--cor-tenue: rgba(255,255,255,0.38)  /* texto de metadado */

--cor-sucesso:       #16a34a   --cor-sucesso-claro: #4ade80
--cor-perigo:        #dc2626   --cor-perigo-claro:  #f87171
--cor-alerta:        #d97706   --cor-alerta-claro:  #fbbf24
```

Uso: os tons "sólidos" (`sucesso`, `perigo`, `alerta`) são para preenchimento com texto branco por
cima; os tons "-claro" são para texto colorido sobre fundo escuro (mais contraste). Texto principal
usa a cor de marca; texto secundário usa `suave`; metadado (datas, contagens) usa `tenue`.

### 8.3 Tipografia e forma

- Fonte: **Inter**, com pilha de fallback de sistema.
- Cantos bem arredondados (`rounded-xl`/`rounded-2xl` em cards, botões e inputs).
- Números alinhados (`tabular-nums`) em qualquer coluna numérica (valores em R$, contagens).
- Números monetários formatados em pt-BR: `R$ 1.234,56`.

### 8.4 Ícones

Sem depender de fonte de ícones externa (o original removeu Font Awesome por causar ícones
quebrados quando a fonte não carregava) — use **SVG inline**, traço (`stroke`, não `fill`), grade
24×24, `stroke-width` consistente, herdando a cor do texto via `currentColor`. Um pequeno conjunto
de ícones "de interface" (tesoura, calendário, usuários, cifrão, cartão, raio/pix, recibo, etc.) e
um conjunto de ícones "de vertical" mapeados por palavra-chave do nome do serviço (ex.: nome
contém "barba" → ícone de navalha; contém "massagem" → ícone de mão), com um ícone padrão de
fallback quando nada bate.

### 8.5 Feedback de interação

- Sem depender de `:hover` como sinal principal (é um produto usado majoritariamente no celular,
  onde não existe hover) — o feedback de toque é o elemento **encolher levemente** no toque
  (`scale ~0.975`), rápido (~60ms), e voltar.
- Foco visível (contorno) só para navegação por teclado (`:focus-visible`), nunca em todo clique
  de mouse/toque.
- Sem "flash" cinza nativo de toque no mobile (`-webkit-tap-highlight-color: transparent`),
  substituído pelo feedback próprio acima.
- Respeitar `prefers-reduced-motion`.
- Formulários/inputs nativos (date, time, select) devem ser forçados a tema escuro
  (`color-scheme: dark`) — senão o calendário nativo abre branco ofuscante sobre um app preto.

### 8.6 Padrões de conteúdo

- Listas de itens em telas de celular são sempre **cards empilhados**, nunca tabelas com scroll
  horizontal.
- Estados vazios sempre com uma borda tracejada e uma frase curta explicando o que vai aparecer
  ali (nunca uma tela em branco sem explicação).
- Toda ação destrutiva (excluir nota, remover etiqueta, cancelar agendamento) pede confirmação.

---

## 9. Integrações externas

- **Pagamento (Pix)**: por tenant, credencial própria, validada antes de ser salva (se a
  credencial for recusada pelo provedor, nada é gravado). Ver fluxo completo na Seção 5.3–5.4.
- **WhatsApp**: só via deep link `https://wa.me/<telefone-e164>?text=<mensagem-codificada>` aberto
  pelo próprio atendente — **não existe integração paga com WhatsApp Cloud API no sistema
  original**; não implemente envio automático de verdade, a menos que o usuário peça
  explicitamente essa camada extra.
- **E-mail/SMS**: não existe nenhuma integração hoje — não adicione.
- **PDF**: geração de relatório financeiro para impressão/download, com os mesmos números da tela.

---

## 10. PWA (Progressive Web App)

- Manifest **gerado dinamicamente por tenant** (nome, cor de tema, ícone = a logo do negócio
  reprocessada para um formato quadrado com `purpose: any maskable`, ou um ícone gerado com a
  inicial do nome quando não há logo).
- Service worker com estratégias diferenciadas por tipo de rota: as telas principais (agenda, hoje)
  em "network first" com timeout curto e fallback pra cache; imagens em "stale while revalidate";
  qualquer requisição de escrita (POST/comanda/webhook) sempre direto na rede, nunca servida do
  cache; página de fallback offline quando a navegação falha totalmente.
- Atualizações do service worker **não devem ser aplicadas automaticamente em silêncio** — mostrar
  um aviso discreto ("nova versão disponível, atualizar") em vez de forçar reload, para não
  derrubar uma comanda em andamento no meio do preenchimento.
- Botão "Instalar app": no Android/Chrome/Edge, captura o evento nativo de prompt de instalação
  (precisa ser capturado cedo, antes do resto da aplicação montar, e reemitido internamente, senão
  o evento se perde); no iOS Safari (que não tem esse evento), mostrar instrução manual
  "Compartilhar → Adicionar à Tela de Início"; se o app já estiver rodando instalado
  (`display-mode: standalone`), não mostrar nada.
- `apple-touch-icon` e `theme-color` também precisam refletir a marca do tenant, inclusive na tela
  de login (branding antes da autenticação, ver Seção 5.9).

---

## 11. Fora de escopo / o que explicitamente não replicar

- Nenhum dado real de cliente, negócio, telefone, e-mail ou credencial — o banco nasce vazio.
- Nenhuma credencial real de provedor de pagamento no código nem em `.env` de exemplo.
- Não é necessário replicar bit a bit o sistema de autenticação por bcrypt manual — Supabase Auth
  é uma troca aceitável, desde que o comportamento multi-tenant de login (Seção 6.1) seja
  preservado.
- Não é necessário usar exatamente Mercado Pago — qualquer provedor de Pix equivalente serve,
  desde que o fluxo (pendente → confirmação assíncrona idempotente) seja mantido.
- Não implemente envio automático de WhatsApp via API paga, e-mail, ou SMS — essas integrações não
  existem no sistema original; se o usuário quiser adicioná-las, é uma decisão a ser tomada
  explicitamente fora deste documento.
- Não adicione light mode, múltiplos temas de fonte, ou customizações visuais além das três cores
  de branding descritas.
- Não invente módulos/features de "CRM avançado" (automação de marketing, funis, IA) que não estão
  descritos aqui.

---

## 12. Como trabalhar — fases sugeridas

Execute em fases, cada uma deixando o app **rodando e utilizável** ao final, mesmo que incompleto.
Pare ao final de cada fase e aguarde validação antes de seguir para a próxima. Ordem sugerida:

1. **Fundação**: projeto React+Vite+TS, projeto Supabase, schema completo do banco (Seção 4) com
   RLS habilitado desde o início (não como retrofit depois), seed mínimo fictício para
   desenvolvimento (um tenant de teste, um usuário admin de teste — claramente marcados como
   dados de teste).
2. **Autenticação e casca do app**: login (com o fluxo multi-tenant da Seção 6.1), layout
   autenticado com navegação (Seção 8.1), sistema de terminologia por vertical (Seção 5.1) já
   plugado desde o início — não como retrofit depois.
3. **Cadastros base**: Serviços, Produtos, Equipe (profissionais + horários + bloqueios).
4. **Clientes**: lista, ficha completa, notas, tags.
5. **Agenda**: calendário, criação/edição de agendamentos, motor de disponibilidade (Seção 4.5),
   proteção transacional contra conflito.
6. **Comanda / Vendas**: a tela de cobrança (Seção 5.2), pagamento em dinheiro/maquininha primeiro
   (confirmação imediata), depois Pix (Seção 5.3–5.4, incluindo o webhook via Edge Function).
7. **Financeiro / Caixa**: relatórios, gráficos, lançamentos manuais, exportação em PDF.
8. **Mensagens / lembretes**: templates, geração da fila (agendada), tela de envio manual via
   WhatsApp.
9. **Branding e PWA**: upload de logo, cores customizáveis, manifest dinâmico, service worker,
   botão de instalar.
10. **Painel da Plataforma**: área de super admin (Seção 6.8).

### Critérios de "bem feito" em cada fase

- Sem dados mockados fixos no código depois que a fase que os substitui estiver pronta.
- TypeScript com tipos reais (não `any` solto) nas entidades de domínio.
- RLS testada de verdade: criar dois tenants de teste e confirmar que um não enxerga dado do outro
  em nenhuma tela nem em nenhuma query direta.
- Condições de corrida tratadas onde importam: dois agendamentos simultâneos no mesmo horário,
  duas confirmações do mesmo Pix chegando ao mesmo tempo.
- Lógica de cálculo (financeiro, disponibilidade de agenda, terminologia) vive em funções/serviços
  de domínio reutilizáveis, não duplicada entre componente de tela e função de exportação/relatório.
- Testado de verdade em viewport de celular (não só a janela do navegador redimensionada) antes de
  considerar uma fase concluída.

Se qualquer ponto deste documento for ambíguo ou parecer conflitar com uma boa prática de
React/Supabase, pare e pergunte antes de decidir sozinho.
