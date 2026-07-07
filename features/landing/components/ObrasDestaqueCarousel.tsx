'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@shared/components/ui/carousel';
import { ObraDestaqueCard, type ObraDestaque } from './ObraDestaqueCard';

/**
 * Seção "Projetos em Destaque" da home (J25). Consome as obras curadas pelo admin
 * via GET /api/obras/destaque e exibe num carrossel (Embla). Quando não há
 * destaques, a seção inteira não renderiza (return null) — sem buraco na página.
 */
export function ObrasDestaqueCarousel() {
  const { data } = useQuery<{ rows: ObraDestaque[] }>({
    queryKey: ['obras', 'destaque', 'public'],
    queryFn: async () => {
      const res = await fetch('/api/obras/destaque');
      if (!res.ok) throw new Error('Erro ao buscar destaques');
      return res.json();
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const obras = data?.rows ?? [];
  if (obras.length === 0) return null;

  return (
    <section id="projetos" className="py-32 px-6 scroll-mt-24">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between md:items-end mb-20 gap-8">
          <div className="max-w-[600px]">
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              Projetos em <br />
              Destaque
            </h2>
            <p className="text-xl text-slate-500">
              Conheça alguns dos projetos que transformamos em realidade.
            </p>
          </div>
        </div>

        <Carousel opts={{ align: 'start', loop: obras.length > 3 }} className="w-full">
          <CarouselContent>
            {obras.map((obra) => (
              <CarouselItem key={obra.id} className="md:basis-1/2 lg:basis-1/3">
                <ObraDestaqueCard obra={obra} />
              </CarouselItem>
            ))}
          </CarouselContent>
          {obras.length > 1 && (
            <>
              <CarouselPrevious />
              <CarouselNext />
            </>
          )}
        </Carousel>
      </div>
    </section>
  );
}
