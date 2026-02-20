import type { ObraContratanteDetalhe } from '../types';
import { mockObrasContratante } from './minhas-obras.mock';

const detalhesMap: Record<string, Partial<ObraContratanteDetalhe>> = {
  '1': {
    descricao: 'Construção de residência de alto padrão com 3 pavimentos, piscina e área gourmet completa.',
    valorPago: 348000,
    valorRestante: 232000,
    diasRestantes: 185,
    tarefasConcluidas: 28,
    tarefasTotal: 45,
    etapas: [
      {
        id: 'e1', nome: 'Fundação', progresso: 100,
        tarefas: [
          { id: 't1', titulo: 'Escavação do terreno', concluida: true },
          { id: 't2', titulo: 'Concretagem da base', concluida: true },
          { id: 't3', titulo: 'Impermeabilização', concluida: true },
        ],
      },
      {
        id: 'e2', nome: 'Estrutura', progresso: 85,
        tarefas: [
          { id: 't4', titulo: 'Pilares do térreo', concluida: true },
          { id: 't5', titulo: 'Laje do 1º andar', concluida: true },
          { id: 't6', titulo: 'Pilares do 1º andar', concluida: true },
          { id: 't7', titulo: 'Laje do 2º andar', concluida: false },
        ],
      },
      {
        id: 'e3', nome: 'Alvenaria', progresso: 40,
        tarefas: [
          { id: 't8', titulo: 'Paredes do térreo', concluida: true },
          { id: 't9', titulo: 'Paredes do 1º andar', concluida: false },
          { id: 't10', titulo: 'Paredes do 2º andar', concluida: false },
        ],
      },
      {
        id: 'e4', nome: 'Acabamento', progresso: 0,
        tarefas: [
          { id: 't11', titulo: 'Reboco interno', concluida: false },
          { id: 't12', titulo: 'Piso cerâmico', concluida: false },
          { id: 't13', titulo: 'Pintura', concluida: false },
        ],
      },
    ],
    equipe: [
      { id: 'm1', nome: 'Carlos Silva', funcao: 'Mestre de Obras', iniciais: 'CS', cor: 'bg-blue-500', telefone: '(11) 98765-4321' },
      { id: 'm2', nome: 'Ana Costa', funcao: 'Engenheira Civil', iniciais: 'AC', cor: 'bg-purple-500', telefone: '(11) 97654-3210' },
      { id: 'm3', nome: 'Roberto Mendes', funcao: 'Eletricista', iniciais: 'RM', cor: 'bg-amber-500', telefone: '(11) 96543-2109' },
      { id: 'm4', nome: 'Fátima Oliveira', funcao: 'Arquiteta', iniciais: 'FO', cor: 'bg-green-600', telefone: '(11) 95432-1098' },
    ],
    financeiro: [
      { id: 'f1', descricao: 'Medição 1 - Fundação', valor: 120000, tipo: 'saida', data: '15/02/2025', status: 'pago', categoria: 'Medição' },
      { id: 'f2', descricao: 'Material - Cimento e Aço', valor: 85000, tipo: 'saida', data: '01/03/2025', status: 'pago', categoria: 'Material' },
      { id: 'f3', descricao: 'Medição 2 - Estrutura', valor: 143000, tipo: 'saida', data: '20/04/2025', status: 'pago', categoria: 'Medição' },
      { id: 'f4', descricao: 'Material - Tijolos e Argamassa', valor: 45000, tipo: 'saida', data: '15/05/2025', status: 'pendente', categoria: 'Material' },
      { id: 'f5', descricao: 'Medição 3 - Alvenaria', valor: 95000, tipo: 'saida', data: '10/06/2025', status: 'pendente', categoria: 'Medição' },
    ],
    fotos: [
      { id: 'p1', url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400', data: '15/02/2025', etapa: 'Fundação' },
      { id: 'p2', url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400', data: '20/03/2025', etapa: 'Estrutura' },
      { id: 'p3', url: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=400', data: '10/04/2025', etapa: 'Estrutura' },
      { id: 'p4', url: 'https://images.unsplash.com/photo-1590274853856-f22d5ee3d228?w=400', data: '05/05/2025', etapa: 'Alvenaria' },
      { id: 'p5', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400', data: '20/05/2025', etapa: 'Alvenaria' },
      { id: 'p6', url: 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=400', data: '01/06/2025', etapa: 'Alvenaria' },
    ],
  },
};

export function getObraContratanteDetalheMock(id: string): ObraContratanteDetalhe | null {
  const obraBase = mockObrasContratante.find((o) => o.id === id);
  if (!obraBase) return null;

  const extra = detalhesMap[id] || detalhesMap['1'];

  return {
    ...obraBase,
    descricao: extra.descricao || 'Obra em andamento com acompanhamento completo.',
    valorPago: extra.valorPago || obraBase.orcamento * (obraBase.progresso / 100),
    valorRestante: extra.valorRestante || obraBase.orcamento * (1 - obraBase.progresso / 100),
    diasRestantes: extra.diasRestantes || 120,
    tarefasConcluidas: extra.tarefasConcluidas || Math.round(45 * obraBase.progresso / 100),
    tarefasTotal: extra.tarefasTotal || 45,
    etapas: extra.etapas || [],
    equipe: extra.equipe || [],
    financeiro: extra.financeiro || [],
    fotos: extra.fotos || [],
  };
}
