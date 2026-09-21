'use client';

import { ObraCard } from '@features/shared/components/ObraCard';
import { SinalObra, textoOrcamento, textoPrazo } from '@features/shared/components/SinalObra';
import { semaforoFinanceiro, semaforoPrazo } from '@features/xgestao/lib/indicadores-obra';
import type { HealthStatus } from '@features/shared/health';
import type { MinhaObraCardProps } from '../types';

export function MinhaObraCard({
  obra,
  healthStatus,
  basePath = "/empreiteiro/minhas-obras",
}: MinhaObraCardProps & { healthStatus?: HealthStatus; basePath?: string }) {
  return (
    <ObraCard
      obraId={obra.id}
      titulo={obra.titulo}
      endereco={obra.endereco}
      imagemUrl={obra.imagemUrl}
      status={obra.status}
      progresso={obra.progresso}
      /**
       * XG29 — na obra própria o percentual de execução dá lugar aos dois sinais
       * do dashboard. O cliente: *"a gente não tem controle sobre essa
       * quantidade (...) independente da informação que você coloque lá, ele não
       * tá modificando essa porcentagem"*.
       *
       * A montagem é aqui, e não dentro do `ObraCard`, porque `isObraPropria` é
       * um conceito deste produto — o card compartilhado só recebe o bloco
       * pronto. No marketplace, `undefined` deixa a barra de progresso de pé.
       */
      indicadores={
        obra.isObraPropria ? (
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <SinalObra estado={semaforoPrazo(obra.diasAtraso)}>
              {textoPrazo(obra.diasAtraso)}
            </SinalObra>
            <SinalObra estado={semaforoFinanceiro(obra.consumoOrcamento)}>
              {textoOrcamento(obra.consumoOrcamento, true)}
            </SinalObra>
          </div>
        ) : undefined
      }
      orcamento={obra.orcamento}
      dataInicio={obra.dataInicio}
      dataPrevisaoFim={obra.dataPrevisaoFim}
      tipo={obra.tipo}
      parteContraria={obra.temContratante ? obra.contratante : undefined}
      parteContrariaRole={obra.temContratante ? "Contratante" : undefined}
      basePath={basePath}
      dateMode="range"
      healthStatus={healthStatus}
    />
  );
}
