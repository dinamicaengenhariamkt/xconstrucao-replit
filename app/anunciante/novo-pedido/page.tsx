'use client';

import { PageHeader } from '@features/shared/components/PageHeader';
import { AvisoAmbienteTeste } from '@features/shared/components/AvisoAmbienteTeste';
import { MontadorPedido } from '@features/anuncios/self-service/components/MontadorPedido';

export default function AnuncianteNovoPedidoPage() {
  return (
    <div className="p-6 md:p-12 space-y-8 max-w-5xl">
      <PageHeader title="Novo pedido de anúncio" subtitle="Escolha os locais, monte o criativo e confirme" />
      <AvisoAmbienteTeste detalhe="Seu anúncio segue o fluxo normal de aprovação." />
      <MontadorPedido redirectTo="/anunciante/meus-anuncios" />
    </div>
  );
}
