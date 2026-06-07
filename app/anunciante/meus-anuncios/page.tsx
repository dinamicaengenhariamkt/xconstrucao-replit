'use client';

import Link from 'next/link';
import { PageHeader } from '@features/shared/components/PageHeader';
import { Button } from '@shared/components/ui/button';
import { RiAddLine } from 'react-icons/ri';
import { MeusAnunciosLista } from '@features/anuncios/self-service/components/MeusAnunciosLista';

export default function AnuncianteMeusAnunciosPage() {
  return (
    <div className="p-6 md:p-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader title="Meus Anúncios" subtitle="Seus pedidos e anúncios publicados" />
        <Link href="/anunciante/novo-pedido">
          <Button>
            <RiAddLine className="w-5 h-5 mr-2" /> Novo pedido
          </Button>
        </Link>
      </div>
      <MeusAnunciosLista />
    </div>
  );
}
