import type { AdminPlano, AdminPlanoAssinante, PlanosKpi } from '../types';

export const mockPlanosKpi: PlanosKpi = {
  totalAssinantes: 134,
  receitaMensal: 28_470,
  churnMes: 3,
  enterprise: 8,
};

export const mockPlanosContratante: AdminPlano[] = [
  {
    id: 'pc-starter',
    nome: 'Starter',
    perfil: 'contratante',
    preco: 0,
    totalAssinantes: 47,
    assinantesAtivos: 32,
    features: ['Até 3 obras', 'Chat com empreiteiras', 'Relatórios básicos'],
    ativo: true,
  },
  {
    id: 'pc-empresarial',
    nome: 'Empresarial',
    perfil: 'contratante',
    preco: 149,
    totalAssinantes: 38,
    assinantesAtivos: 35,
    features: ['Obras ilimitadas', 'Chat avançado', 'Relatórios completos', 'Suporte prioritário'],
    ativo: true,
  },
  {
    id: 'pc-enterprise',
    nome: 'Enterprise',
    perfil: 'contratante',
    preco: 349,
    totalAssinantes: 12,
    assinantesAtivos: 12,
    features: ['Tudo do Empresarial', 'API access', 'Gerente de conta dedicado', 'SLA garantido'],
    ativo: true,
  },
];

export const mockPlanosEmpreiteiro: AdminPlano[] = [
  {
    id: 'pe-basico',
    nome: 'Básico',
    perfil: 'empreiteiro',
    preco: 0,
    totalAssinantes: 52,
    assinantesAtivos: 38,
    features: ['Até 2 obras ativas', 'Perfil público', 'Candidatura a obras'],
    ativo: true,
  },
  {
    id: 'pe-profissional',
    nome: 'Profissional',
    perfil: 'empreiteiro',
    preco: 89,
    totalAssinantes: 29,
    assinantesAtivos: 27,
    features: ['Obras ilimitadas', 'Destaque no perfil', 'Chat avançado', 'Relatórios financeiros'],
    ativo: true,
  },
  {
    id: 'pe-enterprise',
    nome: 'Enterprise',
    perfil: 'empreiteiro',
    preco: 249,
    totalAssinantes: 8,
    assinantesAtivos: 8,
    features: ['Tudo do Profissional', 'API access', 'Gerente de conta', 'Integração ERP'],
    ativo: true,
  },
];

export const mockAssinantesContratante: AdminPlanoAssinante[] = [
  { id: 'ac-1', nome: 'Incorporadora Sunrise Ltda', email: 'contato@sunrise.com.br', planoNome: 'Enterprise', perfil: 'contratante', dataAdesao: '15/03/2023', status: 'ativo', valorMensal: 349 },
  { id: 'ac-2', nome: 'Construtora Horizonte S.A.', email: 'financeiro@horizonte.com.br', planoNome: 'Empresarial', perfil: 'contratante', dataAdesao: '02/06/2023', status: 'ativo', valorMensal: 149 },
  { id: 'ac-3', nome: 'Engenharia Delta Ltda', email: 'admin@delta.eng.br', planoNome: 'Empresarial', perfil: 'contratante', dataAdesao: '20/08/2023', status: 'ativo', valorMensal: 149 },
  { id: 'ac-4', nome: 'Carlos Eduardo Silva', email: 'carlos@email.com', planoNome: 'Starter', perfil: 'contratante', dataAdesao: '10/01/2024', status: 'ativo', valorMensal: 0 },
  { id: 'ac-5', nome: 'Roberto Mendes Ferreira', email: 'roberto@rmf.com.br', planoNome: 'Empresarial', perfil: 'contratante', dataAdesao: '05/03/2024', status: 'ativo', valorMensal: 149 },
  { id: 'ac-6', nome: 'Grupo Investimentos Beta', email: 'contato@grupobeta.com.br', planoNome: 'Enterprise', perfil: 'contratante', dataAdesao: '12/01/2025', status: 'trial', valorMensal: 0 },
  { id: 'ac-7', nome: 'Logística Rápida S.A.', email: 'admin@logistica.com.br', planoNome: 'Starter', perfil: 'contratante', dataAdesao: '20/09/2024', status: 'ativo', valorMensal: 0 },
  { id: 'ac-8', nome: 'Grupo Investimentos Gama', email: 'gama@investimentos.com', planoNome: 'Empresarial', perfil: 'contratante', dataAdesao: '18/04/2023', status: 'inativo', valorMensal: 149 },
];

export const mockAssinantesEmpreiteiro: AdminPlanoAssinante[] = [
  { id: 'ae-1', nome: 'MRV Serviços', email: 'contato@mrv.com.br', planoNome: 'Enterprise', perfil: 'empreiteiro', dataAdesao: '01/02/2023', status: 'ativo', valorMensal: 249 },
  { id: 'ae-2', nome: 'Andrade Construções', email: 'admin@andrade.com.br', planoNome: 'Profissional', perfil: 'empreiteiro', dataAdesao: '15/04/2023', status: 'ativo', valorMensal: 89 },
  { id: 'ae-3', nome: 'Ponto Alto Engenharia', email: 'contato@pontoalto.eng.br', planoNome: 'Enterprise', perfil: 'empreiteiro', dataAdesao: '20/06/2023', status: 'ativo', valorMensal: 249 },
  { id: 'ae-4', nome: 'Costa & Oliveira', email: 'costa@costaeoliveira.com.br', planoNome: 'Profissional', perfil: 'empreiteiro', dataAdesao: '10/08/2023', status: 'ativo', valorMensal: 89 },
  { id: 'ae-5', nome: 'Nova Estrutura Eng.', email: 'admin@novaestrutura.com.br', planoNome: 'Profissional', perfil: 'empreiteiro', dataAdesao: '05/11/2023', status: 'ativo', valorMensal: 89 },
  { id: 'ae-6', nome: 'Delta Estruturas', email: 'contato@delta.com.br', planoNome: 'Enterprise', perfil: 'empreiteiro', dataAdesao: '12/01/2025', status: 'trial', valorMensal: 0 },
  { id: 'ae-7', nome: 'Obras & CIA', email: 'obras@obrasecia.com.br', planoNome: 'Básico', perfil: 'empreiteiro', dataAdesao: '22/03/2023', status: 'cancelado', valorMensal: 0 },
  { id: 'ae-8', nome: 'Alpha Construtora', email: 'alpha@construcoes.com.br', planoNome: 'Básico', perfil: 'empreiteiro', dataAdesao: '30/09/2024', status: 'ativo', valorMensal: 0 },
];
