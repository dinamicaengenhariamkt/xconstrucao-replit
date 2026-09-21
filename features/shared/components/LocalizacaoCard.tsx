'use client';

import { cn } from '@shared/lib/utils';
import { IconEdit, IconLocationOn, IconOpenInNew } from '@shared/components/icons';

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
  /**
   * XG12 — editar o endereço sem sair da obra. Opcional de propósito: o
   * contratante e o link público consomem este card em leitura pura e não
   * passam nada, seguindo sem o botão.
   */
  onEditar?: () => void;
}

/**
 * XG21 — um campo só vale se tiver letra ou número.
 *
 * Placeholders de exibição (`—`, `-`) chegavam aqui vindos dos adapters e
 * viravam parte da busca. Continua valendo depois da XG26: sem mapa, a query
 * do Google Maps é a única busca — e um traço nela ainda estraga o resultado.
 */
function preenchido(v?: string | null): v is string {
  return typeof v === 'string' && /[\p{L}\p{N}]/u.test(v);
}

export function LocalizacaoCard({ localizacao, luminous = false, onEditar }: LocalizacaoCardProps) {
  // Rua + número (ex.: "Rua X, 123") dá ao Google Maps o ponto mais preciso.
  const ruaComNumero = localizacao.numero
    ? [localizacao.rua, localizacao.numero].filter(Boolean).join(', ')
    : localizacao.rua;

  const cidadeEstado = [localizacao.cidade, localizacao.estado].filter(preenchido).join(' - ');

  const handleOpenMaps = () => {
    // Preferimos CEP + rua/número quando disponíveis — geocodifica melhor que
    // texto solto. Ordem: rua+número, bairro, cidade, estado, CEP.
    const partes = [
      ruaComNumero,
      localizacao.bairro,
      localizacao.cidade,
      localizacao.estado,
      localizacao.cep,
    ].filter(preenchido);
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
      data-tour="localizacao-obra"
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
        {/*
          XG26 — o mapa saiu.

          Entrou na XG18 como Leaflet + OpenStreetMap geocodificado pelo
          Nominatim, e a XG21 tentou salvá-lo com uma cascata de tentativas.
          Não bastou: geocoding gratuito não cobre endereço brasileiro com
          precisão, e o browser sequer permite mandar o `User-Agent` que a
          política do Nominatim exige. O cliente ofereceu a saída — ficar só
          com o endereço e os botões, que nunca dependeram de geocoding: o
          "Abrir no Google Maps" delega a busca ao Google, que acerta.

          Largura de metade do card (o mesmo que a coluna ocupava quando havia
          mapa ao lado): o texto fica curto o bastante para ler de relance, e
          os botões não viram barras atravessando a tela. */}
        <div className="flex flex-col gap-4 max-w-md">
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
                {localizacao.bairro && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{localizacao.bairro}</p>
                )}
                {/* XG21 — sem o guard, uma obra sem cidade mostrava só " - ".
                    Os adapters mandam '' quando não há dado. */}
                {cidadeEstado ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{cidadeEstado}</p>
                ) : (
                  <p className="text-sm italic text-amber-600 dark:text-amber-400">Cidade não informada</p>
                )}
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

          {onEditar && (
            <button
              onClick={onEditar}
              className="w-full py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:border-primary/40 hover:text-primary transition-colors cursor-pointer"
              data-testid="btn-editar-localizacao"
            >
              <IconEdit />
              Editar endereço
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
