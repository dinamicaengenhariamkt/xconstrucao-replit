import { ContratanteActivity, Pendencia } from '../types';

// obraId/obraNome alinhados com as obras de minhas-obras.mock.ts:
// 1 Residência Parque das Flores · 2 Edifício Comercial Horizonte · 3 Reforma Loja Center Norte
// 4 Casa de Praia Ubatuba · 5 Edifício Residencial Solar · 6 Clínica Médica Saúde Total
export const mockActivities: ContratanteActivity[] = [
  { id: '1', icon: 'check', color: 'success', title: 'Fundação concluída', obraId: '1', obraNome: 'Residência Parque das Flores', timestamp: 'Há 2 horas' },
  { id: '2', icon: 'upload', color: 'info', title: 'Documento enviado', obraId: '2', obraNome: 'Edifício Comercial Horizonte', timestamp: 'Há 5 horas' },
  { id: '3', icon: 'edit', color: 'warning', title: 'Cronograma atualizado', obraId: '3', obraNome: 'Reforma Loja Center Norte', timestamp: 'Ontem' },
  { id: '4', icon: 'payment', color: 'purple', title: 'Pagamento processado', obraId: '4', obraNome: 'Casa de Praia Ubatuba', timestamp: 'Há 2 dias' },
  { id: '5', icon: 'check', color: 'success', title: 'Estrutura aprovada', obraId: '1', obraNome: 'Residência Parque das Flores', timestamp: 'Há 3 dias' },
  { id: '6', icon: 'upload', color: 'info', title: 'Fotos da obra adicionadas', obraId: '2', obraNome: 'Edifício Comercial Horizonte', timestamp: 'Há 3 dias' },
  { id: '7', icon: 'payment', color: 'purple', title: 'Medição #4 liberada', obraId: '5', obraNome: 'Edifício Residencial Solar', timestamp: 'Há 4 dias' },
  { id: '8', icon: 'edit', color: 'warning', title: 'Orçamento ajustado', obraId: '3', obraNome: 'Reforma Loja Center Norte', timestamp: 'Há 5 dias' },
  { id: '9', icon: 'check', color: 'success', title: 'Tarefa de alvenaria concluída', obraId: '6', obraNome: 'Clínica Médica Saúde Total', timestamp: 'Há 6 dias' },
  { id: '10', icon: 'upload', color: 'info', title: 'Contrato assinado anexado', obraId: '4', obraNome: 'Casa de Praia Ubatuba', timestamp: 'Há 1 semana' },
  { id: '11', icon: 'payment', color: 'purple', title: 'Pagamento de medição inicial', obraId: '1', obraNome: 'Residência Parque das Flores', timestamp: 'Há 1 semana' },
  { id: '12', icon: 'edit', color: 'warning', title: 'Equipe técnica atualizada', obraId: '5', obraNome: 'Edifício Residencial Solar', timestamp: 'Há 9 dias' },
  { id: '13', icon: 'check', color: 'success', title: 'Etapa de instalações finalizada', obraId: '2', obraNome: 'Edifício Comercial Horizonte', timestamp: 'Há 10 dias' },
  { id: '14', icon: 'upload', color: 'info', title: 'Laudo técnico enviado', obraId: '6', obraNome: 'Clínica Médica Saúde Total', timestamp: 'Há 12 dias' },
  { id: '15', icon: 'payment', color: 'purple', title: 'Reembolso de despesas aprovado', obraId: '3', obraNome: 'Reforma Loja Center Norte', timestamp: 'Há 12 dias' },
  { id: '16', icon: 'edit', color: 'warning', title: 'Previsão de entrega revisada', obraId: '4', obraNome: 'Casa de Praia Ubatuba', timestamp: 'Há 2 semanas' },
  { id: '17', icon: 'check', color: 'success', title: 'Vistoria intermediária aprovada', obraId: '1', obraNome: 'Residência Parque das Flores', timestamp: 'Há 2 semanas' },
  { id: '18', icon: 'upload', color: 'info', title: 'Planta arquitetônica atualizada', obraId: '5', obraNome: 'Edifício Residencial Solar', timestamp: 'Há 3 semanas' },
];

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
