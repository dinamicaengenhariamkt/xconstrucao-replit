'use client';

import { RiFlaskLine } from 'react-icons/ri';
import { usePublicConfig } from '@features/shared/hooks/use-public-config';

interface AvisoAmbienteTesteProps {
  /** Complemento opcional, específico da tela (ex.: "Nenhum anúncio será cobrado."). */
  detalhe?: string;
  className?: string;
}

/**
 * Faixa de aviso exibida quando o gateway de pagamento está em sandbox.
 *
 * Existe porque `ASAAS_ENVIRONMENT` é independente de `NODE_ENV`: a aplicação
 * pode estar publicada, no domínio real e no banco de produção, com pagamentos
 * ainda simulados. Isso é intencional durante os testes com clientes — mas o
 * usuário precisa saber antes de informar dados de pagamento.
 *
 * Não renderiza nada em produção real, então pode ser colocado
 * incondicionalmente em qualquer tela de pagamento.
 */
export function AvisoAmbienteTeste({ detalhe, className }: AvisoAmbienteTesteProps) {
  const { config, isLoading } = usePublicConfig();

  // Enquanto carrega não mostra nada: o default do hook é `true` (fail-safe
  // para o caso de erro), e piscar o aviso para quem está em produção real
  // seria pior do que exibi-lo alguns instantes depois.
  if (isLoading || !config.pagamentoSandbox) return null;

  return (
    <div
      role="status"
      className={`rounded-2xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3 dark:border-amber-500/40 dark:bg-amber-500/10 ${className ?? ''}`}
    >
      <RiFlaskLine className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
      <div className="text-sm">
        <p className="font-semibold text-amber-900 dark:text-amber-200">
          Ambiente de testes — pagamentos simulados
        </p>
        <p className="text-amber-800 dark:text-amber-300/90 mt-0.5">
          Nenhuma cobrança real será feita e nenhum valor será debitado.
          {detalhe ? ` ${detalhe}` : ''}
        </p>
      </div>
    </div>
  );
}
