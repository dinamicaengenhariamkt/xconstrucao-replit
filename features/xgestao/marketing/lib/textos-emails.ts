/**
 * XG52 — textos dos e-mails automáticos do xgestão (puros, testáveis).
 *
 * Regras de escrita: curto, direto, sem prometer o que o produto não faz, sem
 * oferecer teste ou bônus de novo (regra anti-abuso do XG50) e sem travessão.
 */
import { CATEGORIA_EMAIL, type TipoEmailXgestao } from './regras-emails';

export const CAMINHO_PLANOS = '/xgestao/planos';
export const CAMINHO_ASSINATURA = '/xgestao/configuracoes?tab=plano';
export const CAMINHO_NOTIFICACOES = '/xgestao/configuracoes?tab=notificacoes';
export const CAMINHO_OBRAS = '/xgestao/obras';

export interface DadosTexto {
  /** Primeiro nome, ou vazio. */
  nome: string | null;
  /** Data da situação já formatada (dd/mm/aaaa), quando o e-mail cita uma. */
  data: string | null;
}

export interface ConteudoEmail {
  assunto: string;
  titulo: string;
  paragrafos: string[];
  botao: { texto: string; caminho: string };
  /** Rodapé que explica por que a pessoa recebeu. */
  rodape: string;
}

export function primeiroNome(nome: string | null | undefined): string | null {
  const primeiro = (nome ?? '').trim().split(/\s+/)[0];
  return primeiro ? primeiro : null;
}

/** Data em dd/mm/aaaa no fuso de São Paulo. */
export function dataBrSp(data: Date | string | null | undefined): string | null {
  if (!data) return null;
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' });
}

const RODAPE_PRAZO =
  'Você recebeu este aviso porque tem uma conta no xgestão. Se preferir não receber avisos de prazo da assinatura, desligue em Configurações, na aba Notificações.';
const RODAPE_CONTA = 'Este é um aviso sobre a sua conta no xgestão.';
const RODAPE_MARKETING =
  'Você recebeu este e-mail porque aceitou receber dicas e novidades do xgestão. Pode sair quando quiser pelo link abaixo, sem precisar entrar na conta.';

function ola(nome: string | null): string {
  return nome ? `Olá, ${nome}.` : 'Olá.';
}

function testeAcabando(dados: DadosTexto, quando: string, assunto: string): ConteudoEmail {
  const ate = dados.data ? ` vai até ${dados.data}` : ` termina ${quando}`;
  return {
    assunto,
    titulo: `Seu teste termina ${quando}`,
    paragrafos: [
      ola(dados.nome),
      `Seu teste grátis do xgestão${ate}. Depois do fim, a conta segue liberada por mais 24 horas e então passa para somente leitura: suas obras e registros continuam lá, mas não dá para criar nem editar.`,
      'Para continuar usando sem interrupção, escolha um plano antes do fim do teste.',
    ],
    botao: { texto: 'Ver planos', caminho: CAMINHO_PLANOS },
    rodape: RODAPE_PRAZO,
  };
}

export function conteudoEmail(tipo: TipoEmailXgestao, dados: DadosTexto): ConteudoEmail {
  switch (tipo) {
    case 'teste_acaba_7d':
      return testeAcabando(dados, 'em 7 dias', 'Seu teste do xgestão termina em 7 dias');
    case 'teste_acaba_3d':
      return testeAcabando(dados, 'em 3 dias', 'Seu teste do xgestão termina em 3 dias');
    case 'teste_acaba_1d':
      return testeAcabando(dados, 'em 1 dia', 'Seu teste do xgestão termina em 1 dia');
    case 'teste_acabou':
      return {
        assunto: 'Seu teste do xgestão terminou',
        titulo: 'Seu teste terminou',
        paragrafos: [
          ola(dados.nome),
          dados.data
            ? `O prazo do seu teste grátis acabou. A conta segue liberada até ${dados.data} e depois fica em somente leitura.`
            : 'O prazo do seu teste grátis acabou. A conta segue liberada por 24 horas e depois fica em somente leitura.',
          'Nada é apagado: você continua vendo suas obras e registros. Para voltar a criar e editar, escolha um plano.',
        ],
        botao: { texto: 'Escolher um plano', caminho: CAMINHO_PLANOS },
        rodape: RODAPE_PRAZO,
      };
    case 'cobranca_atraso':
      return {
        assunto: 'Pagamento pendente na sua assinatura do xgestão',
        titulo: 'Pagamento pendente',
        paragrafos: [
          ola(dados.nome),
          'Não conseguimos confirmar o pagamento da sua assinatura do xgestão.',
          dados.data
            ? `Para a conta não passar para somente leitura, regularize até ${dados.data}. Se já pagou, pode ignorar este aviso.`
            : 'Para a conta não passar para somente leitura, regularize o pagamento. Se já pagou, pode ignorar este aviso.',
        ],
        botao: { texto: 'Ver minha assinatura', caminho: CAMINHO_ASSINATURA },
        rodape: RODAPE_PRAZO,
      };
    case 'cancelamento_confirmado':
      return {
        assunto: 'Cancelamento da assinatura do xgestão confirmado',
        titulo: 'Cancelamento confirmado',
        paragrafos: [
          ola(dados.nome),
          dados.data
            ? `Recebemos o cancelamento da sua assinatura. Você continua com acesso completo até ${dados.data}.`
            : 'Recebemos o cancelamento da sua assinatura. Você continua com acesso completo até o fim do período já pago.',
          'Depois disso a conta fica em somente leitura e seus dados continuam guardados. Se mudar de ideia, é só assinar de novo na aba Plano das configurações.',
        ],
        botao: { texto: 'Ver minha assinatura', caminho: CAMINHO_ASSINATURA },
        rodape: RODAPE_CONTA,
      };
    case 'sem_obra_3d':
      return {
        assunto: 'Que tal cadastrar sua primeira obra no xgestão?',
        titulo: 'Sua primeira obra',
        paragrafos: [
          ola(dados.nome),
          'Você criou sua conta no xgestão há alguns dias e ainda não cadastrou nenhuma obra.',
          'Com a obra cadastrada, você registra o diário, as fotos, as etapas e os gastos num lugar só, e pode compartilhar o andamento com o cliente por um link.',
        ],
        botao: { texto: 'Cadastrar uma obra', caminho: CAMINHO_OBRAS },
        rodape: RODAPE_MARKETING,
      };
    case 'volta_7d':
    case 'volta_30d':
      return {
        assunto: 'Suas obras continuam guardadas no xgestão',
        titulo: 'Suas obras continuam aqui',
        paragrafos: [
          ola(dados.nome),
          dados.data
            ? `Sua conta está em somente leitura desde ${dados.data}. Tudo o que você registrou continua guardado.`
            : 'Sua conta está em somente leitura. Tudo o que você registrou continua guardado.',
          'Se quiser voltar a cadastrar e editar obras, é só escolher um plano.',
        ],
        botao: { texto: 'Ver planos', caminho: CAMINHO_PLANOS },
        rodape: RODAPE_MARKETING,
      };
  }
}

export function ehMarketing(tipo: TipoEmailXgestao): boolean {
  return CATEGORIA_EMAIL[tipo] === 'marketing';
}
