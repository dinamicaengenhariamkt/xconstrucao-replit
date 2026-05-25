import { Pendencia } from '../types';

export const mockPendencias: Pendencia[] = [
  {
    id: '1',
    title: 'Licença ambiental',
    prazo: 'Vence em 3 dias',
    priority: 'alta',
    obraId: '4',
    obraNome: 'Casa de Praia Ubatuba',
  },
  {
    id: '2',
    title: 'Documentação técnica',
    prazo: 'Vence em 7 dias',
    priority: 'media',
    obraId: '2',
    obraNome: 'Edifício Comercial Horizonte',
  },
  {
    id: '3',
    title: 'Revisão de projetos',
    prazo: 'Vence em 15 dias',
    priority: 'baixa',
    obraId: '5',
    obraNome: 'Edifício Residencial Solar',
  },
];
