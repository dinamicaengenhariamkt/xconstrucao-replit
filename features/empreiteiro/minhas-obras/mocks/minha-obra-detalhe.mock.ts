import type { MinhaObraDetalhe } from '../types';

export const mockMinhaObraDetalhes: Record<string, MinhaObraDetalhe> = {
  '1': {
    id: '1',
    titulo: 'Residência Parque das Flores',
    endereco: 'Rua das Orquídeas, 450 - Campinas, SP',
    imagemUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
    status: 'com_atrasos',
    progresso: 45,
    orcamento: 420000,
    dataInicio: '15/03/2025',
    dataPrevisaoFim: '20/12/2025',
    contratante: { nome: 'Carlos Mendes', iniciais: 'CM', cor: 'bg-blue-500' },
    tipo: 'Residencial',
    valorPago: 189000,
    aReceber: 231000,
    diasAtraso: 15,
    tarefasPendentes: 8,
    tarefasTotal: 24,
    problemasAbertos: 3,
    equipeAtiva: 12,
    etapas: [
      { id: 'et1', nome: 'Fundação', progresso: 100, tarefas: [
        { id: 't1', titulo: 'Escavação das sapatas', concluida: true },
        { id: 't2', titulo: 'Montagem de formas', concluida: true },
        { id: 't3', titulo: 'Concretagem', concluida: true },
      ]},
      { id: 'et2', nome: 'Estrutura', progresso: 60, tarefas: [
        { id: 't4', titulo: 'Formas conferidas', concluida: true },
        { id: 't5', titulo: 'Armação validada', concluida: true },
        { id: 't6', titulo: 'Escoramento verificado', concluida: true },
        { id: 't7', titulo: 'Liberação concretagem', concluida: false },
        { id: 't8', titulo: 'Assinatura engenheiro', concluida: false },
      ]},
    ],
    tarefas: [
      { id: 'tk1', titulo: 'Concretagem laje 3º pavimento', etapa: 'Estrutura', responsavel: 'Equipe Pedro', prazo: 'Hoje', status: 'em_andamento', prioridade: 'alta' },
      { id: 'tk2', titulo: 'Montagem formas 4º pav', etapa: 'Estrutura', responsavel: 'Equipe João', prazo: 'Amanhã', status: 'pendente', prioridade: 'media' },
      { id: 'tk3', titulo: 'Aguardando esquadrias', etapa: 'Acabamento', responsavel: 'Fornecedor', prazo: '15 dias', status: 'bloqueado', prioridade: 'alta' },
    ],
    timeline: [
      { id: 'tl1', tipo: 'progresso', titulo: 'Progresso atualizado: 45%', descricao: 'Estrutura da laje 2º pavimento finalizada', autor: 'João Silva', data: 'Hoje, 14:32' },
      { id: 'tl2', tipo: 'tarefa', titulo: 'Tarefa concluída: Formas laje 2º pav', descricao: 'Montagem de formas concluída com sucesso', autor: 'Equipe Pedro', data: 'Ontem, 17:15' },
      { id: 'tl3', tipo: 'documento', titulo: 'Documento anexado', descricao: 'Relatorio_Semanal_24.pdf adicionado', autor: 'Maria Santos', data: 'Há 2 dias' },
      { id: 'tl4', tipo: 'problema', titulo: 'Problema reportado: Atraso material', descricao: 'Esquadrias com atraso de 15 dias confirmado pelo fornecedor', autor: 'Carlos Eng.', data: 'Há 3 dias' },
      { id: 'tl5', tipo: 'nota', titulo: 'Reunião de alinhamento', descricao: 'Definido novo cronograma com equipe técnica', autor: 'João Silva', data: 'Há 5 dias' },
    ],
    fotos: [
      { id: 'f1', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400', data: 'Hoje, 14:32', tag: 'Estrutura' },
      { id: 'f2', url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400', data: 'Hoje, 11:20', tag: 'Estrutura' },
      { id: 'f3', url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400', data: 'Ontem', tag: 'Alvenaria' },
      { id: 'f4', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400', data: 'Há 2 dias' },
    ],
  },
  '2': {
    id: '2',
    titulo: 'Edifício Comercial Horizonte',
    endereco: 'Av. Paulista, 1200 - São Paulo, SP',
    imagemUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
    status: 'em_execucao',
    progresso: 72,
    orcamento: 1850000,
    dataInicio: '10/01/2025',
    dataPrevisaoFim: '30/06/2026',
    contratante: { nome: 'Ana Ferreira', iniciais: 'AF', cor: 'bg-amber-500' },
    tipo: 'Comercial',
    valorPago: 1332000,
    aReceber: 518000,
    diasAtraso: 0,
    tarefasPendentes: 5,
    tarefasTotal: 30,
    problemasAbertos: 1,
    equipeAtiva: 25,
    etapas: [
      { id: 'et1', nome: 'Fundação', progresso: 100, tarefas: [
        { id: 't1', titulo: 'Estacas cravadas', concluida: true },
        { id: 't2', titulo: 'Blocos de fundação', concluida: true },
      ]},
      { id: 'et2', nome: 'Estrutura', progresso: 90, tarefas: [
        { id: 't3', titulo: 'Pilares térreo', concluida: true },
        { id: 't4', titulo: 'Lajes 1-5 andar', concluida: true },
        { id: 't5', titulo: 'Cobertura', concluida: false },
      ]},
    ],
    tarefas: [
      { id: 'tk1', titulo: 'Acabamento fachada norte', etapa: 'Acabamento', responsavel: 'Equipe Lucas', prazo: 'Esta semana', status: 'em_andamento', prioridade: 'alta' },
    ],
    timeline: [
      { id: 'tl1', tipo: 'progresso', titulo: 'Progresso atualizado: 72%', descricao: 'Fachada norte 80% concluída', autor: 'Lucas Silva', data: 'Hoje, 10:15' },
    ],
    fotos: [
      { id: 'f1', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400', data: 'Hoje, 10:15', tag: 'Fachada' },
    ],
  },
};

export function getMinhaObraDetalheMock(id: string): MinhaObraDetalhe | null {
  if (mockMinhaObraDetalhes[id]) return mockMinhaObraDetalhes[id];
  const base = mockMinhaObraDetalhes['2'];
  return { ...base, id, titulo: `Obra ${id}` };
}
