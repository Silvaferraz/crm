export type Categoria = 'barbearia' | 'salao' | 'estetica' | 'clinica'

export type Papel = 'owner' | 'admin' | 'professional' | 'receptionist'

export type StatusAgendamento = 'agendado' | 'confirmado' | 'em_atendimento' | 'concluido' | 'cancelado' | 'falta'

export type OrigemAgendamento = 'painel' | 'online' | 'importado'

export type FormaPagamento = 'pix' | 'maquininha' | 'dinheiro'

export type StatusPix = 'pendente' | 'pago'

export type TipoBloqueio = 'folga' | 'feriado' | 'pessoal'

export type TipoMensagem = 'lembrete_24h' | 'aniversario' | 'retorno' | 'pos_atendimento'

export type CanalMensagem = 'whatsapp_link' | 'whatsapp_api'

export type StatusNotificacao = 'pendente' | 'enviada' | 'cancelada' | 'falhou'

export type StatusPagamentoSaaS = 'pendente' | 'pago' | 'cancelado'

export interface Tenant {
  id: string
  nome: string
  slug: string
  categoria: Categoria
  nicho: string | null
  logo: string | null
  cor_primaria: string | null
  cor_fundo: string | null
  cor_card: string | null
  timezone: string
  whatsapp: string | null
  ativa: boolean
  vencimento: number
  valor_mensal: number
  webhook_token: string | null
}

export interface Usuario {
  id: string
  tenant_id: string
  nome: string
  usuario: string
  papel: Papel
  super_admin: boolean
}

export interface Cliente {
  id: string
  tenant_id: string
  nome: string
  telefone: string | null
  telefone_e164: string | null
  email: string | null
  data_nascimento: string | null
  origem: string | null
  observacoes: string | null
  total_gasto: number
  quantidade_visitas: number
  ultima_visita: string | null
}

export interface ClienteNota {
  id: string
  tenant_id: string
  cliente_id: string
  usuario_id: string
  corpo: string
  fixada: boolean
}

export interface Tag {
  id: string
  tenant_id: string
  nome: string
  cor: string
}

export interface Servico {
  id: string
  tenant_id: string
  nome: string
  preco: number
  ativo: boolean
  duracao_min: number
  cor: string | null
  intervalo_pos_min: number
}

export interface Produto {
  id: string
  tenant_id: string
  nome: string
  preco: number
  ativo: boolean
}

export interface Profissional {
  id: string
  tenant_id: string
  usuario_id: string | null
  nome: string
  apelido: string | null
  foto: string | null
  cor: string
  ativo: boolean
  ordem: number
}

export interface ProfissionalServico {
  id: string
  tenant_id: string
  profissional_id: string
  servico_id: string
  preco: number | null
  duracao_min: number | null
}

export interface HorariosTrabalho {
  id: string
  tenant_id: string
  profissional_id: string
  dia_semana: number
  hora_inicio: string
  hora_fim: string
  vigencia_inicio: string | null
  vigencia_fim: string | null
}

export interface BloqueioAgenda {
  id: string
  tenant_id: string
  profissional_id: string | null
  inicio: string
  fim: string
  motivo: string | null
  tipo: TipoBloqueio
}

export interface Agendamento {
  id: string
  tenant_id: string
  cliente_id: string | null
  profissional_id: string
  inicio: string
  fim: string
  status: StatusAgendamento
  origem: OrigemAgendamento
  observacoes: string | null
  pagamento_id: string | null
  cancelado_em: string | null
  cancelado_motivo: string | null
}

export interface AgendamentoServico {
  id: string
  agendamento_id: string
  servico_id: string
  preco_no_momento: number
  duracao_no_momento: number
}

export interface Pagamento {
  id: string
  tenant_id: string
  cliente_id: string | null
  agendamento_id: string | null
  data_hora: string
  valor_total: number
  forma_pagamento: FormaPagamento
  status_pix: StatusPix | null
  barbeiro_id: string | null
  id_externo_pagamento: string | null
  status_provedor: string | null
  qr_code: string | null
  qr_base64: string | null
}

export interface PagamentoServico {
  id: string
  pagamento_id: string
  servico_id: string
  preco_no_momento: number
}

export interface PagamentoProduto {
  id: string
  pagamento_id: string
  produto_id: string
  preco_no_momento: number
}

export interface Despesa {
  id: string
  tenant_id: string
  valor: number
  descricao: string
  criado_em: string
}

export interface EntradaManual {
  id: string
  tenant_id: string
  valor: number
  descricao: string
  criado_em: string
}

export interface Plano {
  id: string
  tenant_id: string
  nome_plano: string
  valor: number
  descricao: string | null
  ativo: boolean
}

export interface ClientePlano {
  id: string
  tenant_id: string
  cliente_id: string
  plano_id: string
  data_inicio: string
  data_fim: string | null
  ativo: boolean
}

export interface TenantIntegracao {
  id: string
  tenant_id: string
  provedor: string
  access_token: string
  webhook_secret: string
  payer_email: string | null
  validado_em: string | null
  validado_como: string | null
  ativo: boolean
}

export interface EventoWebhookPagamento {
  id: string
  tenant_id: string
  id_pagamento_externo: string
  topico: string
  resultado: string | null
  payload: string | null
  criado_em: string
}

export interface MensagemTemplate {
  id: string
  tenant_id: string
  tipo: TipoMensagem
  canal: CanalMensagem
  titulo: string
  corpo: string
  antecedencia: number
  ativo: boolean
}

export interface Notificacao {
  id: string
  tenant_id: string
  cliente_id: string
  agendamento_id: string | null
  tipo: TipoMensagem
  canal: CanalMensagem
  agendado_para: string
  status: StatusNotificacao
  destino_e164: string | null
  corpo_renderizado: string
  enviado_em: string | null
  erro: string | null
  chave: string
}

export interface PagamentoSaaS {
  id: string
  tenant_id: string
  valor: number
  mes_referencia: string
  status: StatusPagamentoSaaS
  data_pagamento: string | null
}

export interface DespesaSaaS {
  id: string
  descricao: string
  valor: number
  criado_em: string
}

export interface LogAuditoria {
  id: string
  tenant_id: string | null
  usuario: string
  acao: string
  descricao: string | null
  ip: string | null
  criado_em: string
}

export interface Configuracao {
  id: string
  tenant_id: string
  chave: string
  valor: string
}
