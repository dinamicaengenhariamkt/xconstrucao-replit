export type ObraStatus = 'em_execucao' | 'com_atrasos' | 'com_pendencias' | 'planejamento' | 'finalizada';

export type ObraComplexidade = 'baixa' | 'media' | 'alta';

export type ApplicationStatus = 'nao_aplicado' | 'aplicado' | 'aceito' | 'rejeitado';

export interface FilterChipOption {
  label: string;
  value: string;
  count?: number;
}

export interface ObraCardData {
  id: string;
  titulo: string;
  endereco: string;
  imagemUrl: string;
  status: ObraStatus;
  progresso: number;
  orcamento: number;
  dataInicio: string;
  dataPrevisaoFim: string;
  contratante: string;
  tipo: string;
  complexidade: ObraComplexidade;
  descricao: string;
  applicationStatus?: ApplicationStatus;
}

export interface NovaObraCardData {
  id: string;
  titulo: string;
  endereco: string;
  imagemUrl: string;
  tipo: string;
  complexidade: ObraComplexidade;
  orcamento: number;
  prazo: string;
  descricao: string;
  contratante: string;
  destaque?: boolean;
  applicationStatus: ApplicationStatus;
  dataPublicacao: string;
  candidaturas: number;
}

export interface ChatConversation {
  id: string;
  participantName: string;
  participantInitials: string;
  participantColor: string;
  obraNome: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isActive: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  type: 'text' | 'file' | 'image';
  fileName?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface FAQSection {
  title: string;
  icon: string;
  items: FAQItem[];
}

export interface PendenciaItem {
  id: string;
  titulo: string;
  descricao: string;
  tipo: 'documento' | 'certificado' | 'financeiro' | 'avaliacao';
  resolvido: boolean;
}

export interface ObraDetalhe extends NovaObraCardData {
  areaTotal: string;
  tipoObra: string;
  etapas: ObraEtapa[];
  documentos: ObraDocumento[];
  requisitos: string[];
  localizacao: {
    cidade: string;
    estado: string;
    bairro: string;
  };
}

export interface ObraEtapa {
  id: string;
  nome: string;
  descricao: string;
  prazo: string;
  status: 'pendente' | 'em_andamento' | 'concluida';
}

export interface ObraDocumento {
  id: string;
  nome: string;
  tipo: string;
  tamanho: string;
  url: string;
}
