import { ContratanteActivity, Pendencia } from '../types';

export const mockActivities: ContratanteActivity[] = [
  {
    id: '1',
    icon: 'check',
    color: 'success',
    title: 'Fundação concluída',
    obraNome: 'Residência Aurora',
    timestamp: 'Há 2 horas',
  },
  {
    id: '2',
    icon: 'upload',
    color: 'info',
    title: 'Documento enviado',
    obraNome: 'Edifício Horizonte',
    timestamp: 'Há 5 horas',
  },
  {
    id: '3',
    icon: 'edit',
    color: 'warning',
    title: 'Cronograma atualizado',
    obraNome: 'Loft Industrial',
    timestamp: 'Ontem',
  },
  {
    id: '4',
    icon: 'payment',
    color: 'purple',
    title: 'Pagamento processado',
    obraNome: 'Villa Marítima',
    timestamp: 'Há 2 dias',
  },
];

export const mockPendencias: Pendencia[] = [
  {
    id: '1',
    title: 'Licença ambiental',
    prazo: 'Vence em 3 dias',
    priority: 'alta',
  },
  {
    id: '2',
    title: 'Documentação técnica',
    prazo: 'Vence em 7 dias',
    priority: 'media',
  },
  {
    id: '3',
    title: 'Revisão de projetos',
    prazo: 'Vence em 15 dias',
    priority: 'baixa',
  },
];
