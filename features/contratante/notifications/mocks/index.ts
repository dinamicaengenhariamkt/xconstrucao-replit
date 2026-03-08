import type { ContratanteNotification } from '../types';

const now = new Date();
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000).toISOString();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000).toISOString();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400 * 1000).toISOString();

export const MOCK_CONTRATANTE_NOTIFICATIONS: ContratanteNotification[] = [
  {
    id: 'cn-001',
    titulo: 'Nova proposta recebida',
    descricao: 'João Pereira enviou uma proposta para a obra "Reforma Comercial - Loja Centro".',
    tipo: 'info',
    lida: false,
    criadoEm: minutesAgo(8),
    href: '/contratante/minhas-obras/5',
  },
  {
    id: 'cn-002',
    titulo: 'Prazo de vistoria se aproxima',
    descricao: 'A vistoria da obra "Residencial Jardins" está agendada para amanhã às 10h.',
    tipo: 'lembrete',
    lida: false,
    criadoEm: minutesAgo(45),
    href: '/contratante/minhas-obras/1',
  },
  {
    id: 'cn-003',
    titulo: 'Proposta aprovada com sucesso',
    descricao: 'Você aprovou a proposta de Carlos Melo para "Ampliação Galpão Industrial".',
    tipo: 'sucesso',
    lida: false,
    criadoEm: hoursAgo(2),
    href: '/contratante/minhas-obras/2',
  },
  {
    id: 'cn-004',
    titulo: 'Documento pendente de assinatura',
    descricao: 'O contrato da obra "Construção Residência Alto da Boa Vista" aguarda sua assinatura.',
    tipo: 'alerta',
    lida: false,
    criadoEm: hoursAgo(5),
    href: '/contratante/documentos',
  },
  {
    id: 'cn-005',
    titulo: '3 novas propostas recebidas',
    descricao: 'Sua obra "Construção Piscina - Condomínio Alvorada" recebeu 3 novas propostas.',
    tipo: 'info',
    lida: false,
    criadoEm: hoursAgo(9),
    href: '/contratante/minhas-obras/5',
  },
  {
    id: 'cn-006',
    titulo: 'Medição aprovada',
    descricao: 'A medição #3 da obra "Reforma Fachada Prédio Comercial" foi aprovada. Pagamento liberado.',
    tipo: 'sucesso',
    lida: true,
    criadoEm: daysAgo(1),
    href: '/contratante/minhas-obras/1',
  },
  {
    id: 'cn-007',
    titulo: 'Obra concluída',
    descricao: 'O empreiteiro marcou a obra "Pintura Apartamento" como concluída. Faça a vistoria final.',
    tipo: 'lembrete',
    lida: true,
    criadoEm: daysAgo(2),
    href: '/contratante/minhas-obras/3',
  },
  {
    id: 'cn-008',
    titulo: 'Avaliação pendente',
    descricao: 'Avalie o empreiteiro Ricardo Silva pela obra "Instalação Elétrica" concluída há 5 dias.',
    tipo: 'lembrete',
    lida: true,
    criadoEm: daysAgo(5),
    href: '/contratante/minhas-obras/4',
  },
  {
    id: 'cn-009',
    titulo: 'Orçamento expirado',
    descricao: 'A proposta para "Cobertura Metálica - Armazém" expirou sem seleção de empreiteiro.',
    tipo: 'alerta',
    lida: true,
    criadoEm: daysAgo(7),
    href: '/contratante/minhas-obras/6',
  },
  {
    id: 'cn-010',
    titulo: 'Bem-vindo ao XConstrução!',
    descricao: 'Seu cadastro como contratante foi aprovado. Publique sua primeira obra agora.',
    tipo: 'sucesso',
    lida: true,
    criadoEm: daysAgo(30),
    href: '/contratante/nova-obra',
  },
];
