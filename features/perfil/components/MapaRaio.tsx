'use client';

import dynamic from 'next/dynamic';

const MapaRaioInner = dynamic(() => import('./MapaRaioInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center text-xs text-muted-foreground">
      Carregando mapa…
    </div>
  ),
});

interface MapaRaioProps {
  cep: string | null | undefined;
  cidade?: string | null;
  estado?: string | null;
  raioKm: number | null | undefined;
  className?: string;
}

export function MapaRaio(props: MapaRaioProps) {
  return <MapaRaioInner {...props} />;
}
