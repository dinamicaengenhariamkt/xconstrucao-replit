'use client';

import { cn } from '@shared/lib/utils';
import { IconLocationOn, IconMap, IconOpenInNew } from '@shared/components/icons';

interface Localizacao {
  cidade: string;
  estado: string;
  bairro: string;
  rua: string;
  numero?: string;
  complemento?: string;
  cep: string;
}

interface LocalizacaoCardProps {
  localizacao: Localizacao;
  luminous?: boolean;
}

export function LocalizacaoCard({ localizacao, luminous = false }: LocalizacaoCardProps) {
  // Rua + número (ex.: "Rua X, 123") dá ao Google Maps o ponto mais preciso.
  const ruaComNumero = localizacao.numero
    ? [localizacao.rua, localizacao.numero].filter(Boolean).join(', ')
    : localizacao.rua;

  const handleOpenMaps = () => {
    // Preferimos CEP + rua/número quando disponíveis — geocodifica melhor que
    // texto solto. Ordem: rua+número, bairro, cidade, estado, CEP.
    const partes = [ruaComNumero, localizacao.bairro, localizacao.cidade, localizacao.estado, localizacao.cep]
      .filter(Boolean);
    const q = encodeURIComponent(partes.join(', '));
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 rounded-2xl overflow-hidden',
        luminous
          ? 'luminous-section'
          : 'border border-gray-100 dark:border-gray-800 shadow-sm',
      )}
    >
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <IconLocationOn className="text-primary" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Localização da Obra</h2>
          <p className="text-xs text-gray-500">Endereço completo do terreno</p>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map placeholder */}
          <div className="lg:col-span-2 aspect-video bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden relative">
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
              <div className="text-center">
                <IconMap className="text-gray-400 text-6xl" />
                <p className="text-sm text-gray-500 mt-2">Mapa da localização</p>
              </div>
            </div>
          </div>

          {/* Address + actions */}
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                  <IconLocationOn className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Endereço Completo</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{ruaComNumero}</p>
                  {localizacao.complemento && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{localizacao.complemento}</p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400">{localizacao.bairro}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{localizacao.cidade} - {localizacao.estado}</p>
                  {localizacao.cep && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">CEP: {localizacao.cep}</p>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleOpenMaps}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <IconOpenInNew />
              Abrir no Google Maps
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
