'use client';

import dynamic from 'next/dynamic';

/**
 * XG18 — wrapper de carregamento do mapa do endereço.
 *
 * O `ssr: false` NÃO é otimização: o Leaflet acessa `window` no import, então
 * sem isto o build quebra na renderização do servidor. Mesmo motivo pelo qual
 * `features/perfil/components/MapaRaio.tsx` existe ao lado do `...Inner`.
 */
const MapaEnderecoInner = dynamic(() => import('./MapaEnderecoInner'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
      Carregando mapa…
    </div>
  ),
});

export function MapaEndereco(props: {
  rua?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  className?: string;
  onPrecisao?: (p: 'exata' | 'aproximada' | null) => void;
}) {
  return <MapaEnderecoInner {...props} />;
}
