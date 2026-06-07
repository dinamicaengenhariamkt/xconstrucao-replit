'use client';

import { useState } from 'react';
import { PageHeader } from '@features/shared/components/PageHeader';
import { Button } from '@shared/components/ui/button';
import { RiAddLine, RiArrowLeftLine } from 'react-icons/ri';
import { MeusAnunciosLista } from '@features/anuncios/self-service/components/MeusAnunciosLista';
import { MontadorPedido } from '@features/anuncios/self-service/components/MontadorPedido';

/**
 * J23/D6 — "Meus Anúncios" embutido na visão de contratante. Mesmo componente
 * compartilhado da visão de anunciante; cliente anuncia sem sair da própria visão.
 */
export default function ContratanteMeusAnunciosPage() {
  const [criando, setCriando] = useState(false);

  return (
    <div className="p-6 md:p-12 space-y-8 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader
          title={criando ? 'Novo pedido de anúncio' : 'Meus Anúncios'}
          subtitle={criando ? 'Escolha os locais, monte o criativo e confirme' : 'Seus pedidos e anúncios publicados'}
        />
        {criando ? (
          <Button variant="outline" onClick={() => setCriando(false)}>
            <RiArrowLeftLine className="w-4 h-4 mr-2" /> Voltar
          </Button>
        ) : (
          <Button onClick={() => setCriando(true)}>
            <RiAddLine className="w-5 h-5 mr-2" /> Novo pedido
          </Button>
        )}
      </div>

      {criando ? (
        <MontadorPedido redirectTo="/contratante/meus-anuncios" />
      ) : (
        <MeusAnunciosLista />
      )}
    </div>
  );
}
