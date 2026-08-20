export type PlanoTier = 'free' | 'pro' | 'enterprise';
export type PlanoPersona = 'empreiteiro' | 'contratante' | 'xgestao';

export interface PlanCatalogEntry {
  nome: string;
  precoMensal: number;
  features: string[];
  limites: Record<string, number>;
}

export interface PlanUsageItem {
  key: string;
  label: string;
  current: number;
  max: number;
}

export const EMPREITEIRO_USAGE_LABELS: Record<string, string> = {
  obrasAtivas: 'Obras ativas',
  propostasMes: 'Propostas no mês',
  fotosPortfolio: 'Fotos no portfólio',
  contratosAtivos: 'Contratos ativos',
};

export const CONTRATANTE_USAGE_LABELS: Record<string, string> = {
  obrasAbertas: 'Obras abertas',
  empreiteirosContratados: 'Empreiteiros contratados',
  contratosAtivos: 'Contratos ativos',
  propostasRecebidas: 'Propostas recebidas',
};

export const XGESTAO_USAGE_LABELS: Record<string, string> = {
  obrasAtivas: 'Obras ativas',
};

export const PLANS_CATALOG: Record<PlanoPersona, Record<PlanoTier, PlanCatalogEntry>> = {
  empreiteiro: {
    free: {
      nome: 'Plano Gratuito',
      precoMensal: 0,
      features: [
        '2 obras ativas simultâneas',
        '5 propostas por mês',
        'Portfólio com até 10 fotos',
        'Acesso ao diretório de obras',
      ],
      limites: { obrasAtivas: 2, propostasMes: 5, fotosPortfolio: 10, contratosAtivos: 2 },
    },
    pro: {
      nome: 'Plano Profissional',
      precoMensal: 89,
      features: [
        '10 obras ativas simultâneas',
        '30 propostas por mês',
        'Portfólio com até 100 fotos',
        'Acesso completo ao diretório de obras',
        'Contratos digitais',
        'Relatórios de desempenho',
        'Suporte prioritário',
      ],
      limites: { obrasAtivas: 10, propostasMes: 30, fotosPortfolio: 100, contratosAtivos: 10 },
    },
    enterprise: {
      nome: 'Plano Empresarial',
      precoMensal: 249,
      features: [
        'Obras ativas ilimitadas',
        'Propostas ilimitadas',
        'Portfólio ilimitado',
        'Contratos digitais',
        'Análises com IA',
        'API e integrações',
        'Suporte dedicado',
      ],
      limites: { obrasAtivas: 9999, propostasMes: 9999, fotosPortfolio: 9999, contratosAtivos: 9999 },
    },
  },
  contratante: {
    free: {
      nome: 'Plano Gratuito',
      precoMensal: 0,
      features: [
        '1 obra publicada por vez',
        'Até 5 propostas por obra',
        'Acesso ao diretório de empreiteiros',
      ],
      limites: { obrasAbertas: 1, empreiteirosContratados: 3, contratosAtivos: 1, propostasRecebidas: 5 },
    },
    pro: {
      nome: 'Plano Profissional',
      precoMensal: 99,
      features: [
        '5 obras publicadas simultâneas',
        'Propostas ilimitadas por obra',
        'Acesso completo ao diretório de empreiteiros',
        'Contratos digitais',
        'Relatórios de obra',
      ],
      limites: { obrasAbertas: 5, empreiteirosContratados: 10, contratosAtivos: 5, propostasRecebidas: 50 },
    },
    enterprise: {
      nome: 'Plano Empresarial',
      precoMensal: 149,
      features: [
        'Obras ilimitadas',
        'Propostas ilimitadas por obra',
        'Empreiteiros ilimitados',
        'Contratos digitais',
        'Gestão de medições',
        'Relatórios de obra',
        'Análises com IA',
        'Suporte prioritário',
      ],
      limites: { obrasAbertas: 9999, empreiteirosContratados: 9999, contratosAtivos: 9999, propostasRecebidas: 9999 },
    },
  },
  xgestao: {
    free: {
      nome: 'Freemium',
      precoMensal: 0,
      features: ['1 obra ativa', 'Gestão operacional da obra'],
      limites: { obrasAtivas: 1 },
    },
    pro: {
      nome: 'Basic',
      precoMensal: 89,
      features: ['3 obras ativas', 'Gestão operacional da obra', 'Suporte prioritário'],
      limites: { obrasAtivas: 3 },
    },
    enterprise: {
      nome: 'Pro',
      precoMensal: 249,
      features: ['10 obras ativas', 'Gestão operacional da obra', 'Suporte prioritário'],
      limites: { obrasAtivas: 10 },
    },
  },
};

export function getPlanCatalog(persona: PlanoPersona, tier: PlanoTier): PlanCatalogEntry {
  return PLANS_CATALOG[persona][tier];
}
