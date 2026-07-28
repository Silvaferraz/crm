import type { Categoria } from '@/types'

type Rotulos = Record<string, { singular: string; plural: string }>

const verticais: Record<Categoria, Rotulos> = {
  barbearia: {
    cliente: { singular: 'Cliente', plural: 'Clientes' },
    profissional: { singular: 'Barbeiro', plural: 'Barbeiros' },
    servico: { singular: 'Serviço', plural: 'Serviços' },
    produto: { singular: 'Produto', plural: 'Produtos' },
    agendamento: { singular: 'Horário', plural: 'Horários' },
    negocio: { singular: 'Barbearia', plural: 'Barbearias' },
    atendimento: { singular: 'Atendimento', plural: 'Atendimentos' },
  },
  salao: {
    cliente: { singular: 'Cliente', plural: 'Clientes' },
    profissional: { singular: 'Profissional', plural: 'Profissionais' },
    servico: { singular: 'Serviço', plural: 'Serviços' },
    produto: { singular: 'Produto', plural: 'Produtos' },
    agendamento: { singular: 'Horário', plural: 'Horários' },
    negocio: { singular: 'Salão', plural: 'Salões' },
    atendimento: { singular: 'Atendimento', plural: 'Atendimentos' },
  },
  estetica: {
    cliente: { singular: 'Cliente', plural: 'Clientes' },
    profissional: { singular: 'Especialista', plural: 'Especialistas' },
    servico: { singular: 'Procedimento', plural: 'Procedimentos' },
    produto: { singular: 'Produto', plural: 'Produtos' },
    agendamento: { singular: 'Sessão', plural: 'Sessões' },
    negocio: { singular: 'Clínica', plural: 'Clínicas' },
    atendimento: { singular: 'Sessão', plural: 'Sessões' },
  },
  clinica: {
    cliente: { singular: 'Paciente', plural: 'Pacientes' },
    profissional: { singular: 'Profissional', plural: 'Profissionais' },
    servico: { singular: 'Procedimento', plural: 'Procedimentos' },
    produto: { singular: 'Produto', plural: 'Produtos' },
    agendamento: { singular: 'Consulta', plural: 'Consultas' },
    negocio: { singular: 'Clínica', plural: 'Clínicas' },
    atendimento: { singular: 'Atendimento', plural: 'Atendimentos' },
  },
}

const servicosSugeridos: Record<Categoria, { nome: string; preco: number; duracao_min: number }[]> = {
  barbearia: [
    { nome: 'Corte Degradê', preco: 65, duracao_min: 40 },
    { nome: 'Corte Social', preco: 50, duracao_min: 30 },
    { nome: 'Barba Completa', preco: 35, duracao_min: 20 },
    { nome: 'Hidratação', preco: 50, duracao_min: 30 },
    { nome: 'Sobrancelha', preco: 20, duracao_min: 10 },
  ],
  salao: [
    { nome: 'Corte Feminino', preco: 80, duracao_min: 60 },
    { nome: 'Escova', preco: 60, duracao_min: 40 },
    { nome: 'Coloração', preco: 150, duracao_min: 120 },
    { nome: 'Progressiva', preco: 200, duracao_min: 150 },
    { nome: 'Manicure', preco: 40, duracao_min: 30 },
  ],
  estetica: [
    { nome: 'Limpeza de Pele', preco: 120, duracao_min: 60 },
    { nome: 'Massagem Relaxante', preco: 150, duracao_min: 90 },
    { nome: 'Drenagem Linfática', preco: 130, duracao_min: 60 },
    { nome: 'Microagulhamento', preco: 200, duracao_min: 90 },
    { nome: 'Peeling Químico', preco: 180, duracao_min: 60 },
  ],
  clinica: [
    { nome: 'Consulta Geral', preco: 200, duracao_min: 30 },
    { nome: 'Aplicação de Botox', preco: 500, duracao_min: 30 },
    { nome: 'Preenchimento Labial', preco: 400, duracao_min: 30 },
    { nome: 'Bioestimulador', preco: 600, duracao_min: 45 },
    { nome: 'Avaliação Estética', preco: 150, duracao_min: 60 },
  ],
}

const mapaIcones: Record<string, string> = {
  corte: 'tesoura',
  barba: 'navalha',
  cabelo: 'tesoura',
  hidratação: 'gota',
  massagem: 'mao',
  pele: 'rosto',
  botox: 'seringa',
  preenchimento: 'seringa',
  manicure: 'unha',
  coloração: 'tinta',
  progressiva: 'escova',
  limpeza: 'rosto',
  drenagem: 'mao',
  consulta: 'estetoscopio',
  sobrancelha: 'sobrancelha',
  peeling: 'rosto',
  bioestimulador: 'seringa',
  avaliação: 'clipboard',
}

export function getRotulos(categoria: Categoria, overrides?: Record<string, string>) {
  const base = verticais[categoria] ?? verticais.barbearia
  const resolvido: Rotulos = {}

  for (const [chave, valor] of Object.entries(base)) {
    resolvido[chave] = {
      singular: overrides?.[`${chave}.singular`] ?? valor.singular,
      plural: overrides?.[`${chave}.plural`] ?? valor.plural,
    }
  }

  return resolvido
}

export function getRotulo(
  categoria: Categoria,
  chave: string,
  plural = false,
  overrides?: Record<string, string>,
): string {
  const overrideKey = `${chave}.${plural ? 'plural' : 'singular'}`
  if (overrides?.[overrideKey]) return overrides[overrideKey]

  const base = verticais[categoria] ?? verticais.barbearia
  const entry = base[chave] ?? verticais.barbearia[chave]
  if (!entry) return chave

  return plural ? entry.plural : entry.singular
}

export function getServicosSugeridos(categoria: Categoria) {
  return servicosSugeridos[categoria] ?? servicosSugeridos.barbearia
}

export function getIconePorServico(nome: string): string {
  const nomeLower = nome.toLowerCase()
  for (const [palavra, icone] of Object.entries(mapaIcones)) {
    if (nomeLower.includes(palavra)) return icone
  }
  return 'default'
}
