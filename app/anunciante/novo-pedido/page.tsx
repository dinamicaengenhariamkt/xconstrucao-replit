'use client';

import { PageHeader } from '@features/shared/components/PageHeader';
import { MontadorPedido } from '@features/anuncios/self-service/components/MontadorPedido';

export default function AnuncianteNovoPedidoPage() {
  return (
    <div className="p-6 md:p-12 space-y-8 max-w-5xl">
      <PageHeader title="Novo pedido de anúncio" subtitle="Escolha os locais, monte o criativo e confirme" />
      <MontadorPedido redirectTo="/anunciante/meus-anuncios" />
    </div>
  );
}
