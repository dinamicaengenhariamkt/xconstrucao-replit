import type { ObraStatusDb } from '@shared/constants/status';
import type { SecoesPublicas } from './secoes';

export interface ObraPublicaTarefa {
  id: string;
  titulo: string;
  descricao: string | null;
  etapa: string;
  status: 'pendente' | 'em_andamento' | 'bloqueado' | 'concluido';
  prazo: string | null;
  progresso: number | null;
}

export interface ObraPublicaEtapa {
  id: string;
  nome: string;
  descricao: string | null;
  progresso: number;
  status: 'pendente' | 'em_andamento' | 'bloqueado' | 'concluido';
  /** XG30 — par de datas do cronograma. Só vem com a seção `cronograma` ligada. */
  dataInicio: string | null;
  prazo: string | null;
}

export interface ObraPublicaDiario {
  id: string;
  texto: string;
  createdAt: string;
  fotos: string[];
}

export interface ObraPublicaOcorrencia {
  id: string;
  titulo: string;
  descricao: string;
  gravidade: 'critico' | 'medio' | 'baixo';
  status: 'aberta' | 'resolvida';
  fotoUrl: string | null;
  resolvidoEm?: string;
  createdAt: string;
}

export interface ObraPublicaFoto {
  id: string;
  url: string;
  fase: 'antes' | 'durante' | 'agora' | null;
  tag: string | null;
  createdAt: string;
}

/**
 * XG30 — recebimento da obra, e só ele. Existe apenas com a seção `pagamentos`
 * ligada no link. Os números seguem a regra da aba Financeiro (XG22): o
 * recebido sai dos lançamentos pagos em que o empreiteiro é recebedor.
 */
export interface ObraPublicaPagamentos {
  /** Contrato + aditivos. */
  valorTotal: number;
  recebido: number;
  saldo: number;
  parcelas: Array<{
    id: string;
    descricao: string;
    valor: number;
    vencimento: string | null;
    pagoEm: string | null;
    status: 'pago' | 'pendente' | 'atrasado';
  }>;
}

/**
 * Contrato mínimo e deliberadamente anônimo do conteúdo compartilhável.
 *
 * Nunca entram: custos e despesas, fornecedor ou beneficiário de pagamento,
 * lucro/resultado, método de pagamento, comprovantes, PIX, equipe, contato,
 * identificadores pessoais ou chaves de armazenamento. O único bloco
 * financeiro é `pagamentos` (XG30), que mostra o lado do recebimento e só
 * existe no link em que o dono ligou a seção. URLs de mídia já são
 * capabilities temporárias resolvidas no servidor apenas após validar o link.
 */
export interface ObraPublicaView {
  obra: {
    id: string;
    titulo: string;
    tipo: string | null;
    descricao: string | null;
    areaM2: string | null;
    /**
     * Enum `obra_status` do banco, não o status derivado da UI do marketplace.
     * Tipar estreito é o que impede aplicar o dicionário errado na renderização.
     */
    status: ObraStatusDb;
    cidade: string | null;
    uf: string | null;
    /**
     * Rua, apenas quando o dono liga a seção de localização. Os demais campos
     * de endereço e as coordenadas não existem neste contrato — nem como campo
     * opcional, para que não haja onde preenchê-los por engano.
     */
    logradouro: string | null;
    dataInicio: string | null;
    dataPrevisao: string | null;
    imagemUrl: string | null;
    ultimaAtualizacao: string | null;
  };
  etapas: ObraPublicaEtapa[];
  diario: ObraPublicaDiario[];
  ocorrencias: ObraPublicaOcorrencia[];
  fotos: ObraPublicaFoto[];
  tarefas: ObraPublicaTarefa[];
  /** `null` quando a seção está desligada: nem a consulta roda. */
  pagamentos: ObraPublicaPagamentos | null;
  /** O que este link expõe; o shell usa para montar só as abas liberadas. */
  secoes: SecoesPublicas;
}