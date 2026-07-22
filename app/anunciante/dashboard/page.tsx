'use client';

import Link from 'next/link';
import { PageHeader } from '@features/shared/components/PageHeader';
import { Button } from '@shared/components/ui/button';
import { RiAddLine, RiMegaphoneLine } from 'react-icons/ri';
import { MeusAnunciosLista } from '@features/anuncios/self-service/components/MeusAnunciosLista';
import { usePublicConfig } from '@features/shared/hooks/use-public-config';

export default function AnuncianteDashboardPage() {
  const { config } = usePublicConfig();
  return (
    <div className="p-6 md:p-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader title="Anunciante" subtitle="Gerencie seus anúncios na X-Construção" />
        <Link href="/anunciante/novo-pedido">
          <Button size="lg">
            <RiAddLine className="w-5 h-5 mr-2" /> Novo pedido de anúncio
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 flex items-start gap-4">
        <RiMegaphoneLine className="w-8 h-8 text-primary shrink-0" />
        <div>
          <p className="font-semibold text-gray-800 dark:text-gray-100">Anuncie onde seu público está</p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Escolha os locais, monte o criativo com pré-visualização ao vivo e acompanhe a aprovação.
            {config.adPaymentEnabled
              ? ' Após a aprovação, você paga com segurança para o anúncio entrar no ar.'
              : ' A cobrança é simulada nesta fase — você não será cobrado.'}
          </p>
        </div>
      </div>

      <MeusAnunciosLista />
    </div>
  );
}
