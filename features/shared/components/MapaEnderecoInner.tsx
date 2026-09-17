'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { lookupCep, unformatCep, type CepLookupResult } from '@shared/lib/masks';

/**
 * XG18 — o mapa do endereço da obra.
 *
 * Antes daqui, `LocalizacaoCard` mostrava um `{/* Map placeholder *\/}`: uma div
 * cinza com um ícone e o texto "Mapa da localização", idêntica com ou sem
 * endereço preenchido. Não era bug de chave nem de configuração — a feature
 * nunca existiu.
 *
 * Usa Leaflet + OpenStreetMap com geocoding pelo Nominatim, o mesmo par que
 * `features/perfil/components/MapaRaioInner.tsx` já usa em produção: ambos
 * gratuitos e sem chave de API. Nenhuma dependência nova — `leaflet`,
 * `react-leaflet` e `@types/leaflet` já estavam no `package.json`.
 *
 * Só renderiza o marcador (sem o `Circle` de raio, que ali marca área de
 * atuação e aqui não significaria nada).
 *
 * ---
 * XG21 — o relato foi "não mostrou o endereço no mapa", com
 * "Rua dos Carvalhos, 400, CEP 06070-212". A investigação (2026-09-17):
 *
 * - O endereço existe, em **Cotia/SP**, mas o CEP real é **06701-212**. O que
 *   foi cadastrado tinha os dígitos trocados (`701`→`070`) e não existe na base
 *   dos Correios. Com o CEP certo, o Nominatim acha a rua exata.
 * - O mapa acertou em não inventar um ponto; o dado é que estava errado. Daí a
 *   cascata passar a consultar o **ViaCEP**, que resgata justamente o caso de
 *   "rua digitada errada, CEP certo" — e daí também o selo de precisão, para
 *   um fallback de cidade não se passar pela porta da obra.
 *
 * **Sobre `User-Agent`:** a política do Nominatim pede um UA identificável, e
 * fora do navegador ele responde **403** sem isso. Aqui não dá para atender:
 * o browser proíbe o JS de definir `User-Agent`, e manda o do próprio Chrome/
 * Safari. Ou seja, o Nominatim vê o IP de cada usuário, não o da aplicação.
 * Atender a política de verdade exigiria geocodificar **no servidor** (onde o
 * header é nosso) e persistir `lat`/`lng` — o que resolveria de uma vez o
 * rate limit e a ausência de cache. Continua como dívida (XG18 §5).
 */

// XG21 — servidos de `public/leaflet/` (copiados de `node_modules/leaflet/dist/images`).
// Antes vinham do unpkg: um CDN externo no caminho crítico do marcador, que
// falha calado se o unpkg estiver fora ou bloqueado na rede da obra.
const icon = new L.Icon({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -41],
  shadowSize: [41, 41],
});

interface Props {
  rua?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  className?: string;
  /**
   * XG21 — avisa o card qual degrau da cascata resolveu, para ele decidir o
   * que dizer ao usuário. `null` = não localizou.
   */
  onPrecisao?: (p: 'exata' | 'aproximada' | null) => void;
}

interface Coords {
  lat: number;
  lon: number;
}

/**
 * XG21 — um campo só conta se tiver letra ou número.
 *
 * Placeholders de exibição (`—`, `-`, `n/a`) vazavam para a busca: a query
 * "—, —, Brasil" **resolve** no Nominatim, para o centro geográfico do Brasil.
 * O resultado era um marcador confiante em Mato Grosso. A origem foi corrigida
 * em `features/obras/adapters.ts`; isto aqui é a defesa em profundidade, para o
 * bug não voltar por outro adapter.
 */
function preenchido(v?: string | null): v is string {
  return typeof v === 'string' && /[\p{L}\p{N}]/u.test(v);
}

/**
 * Cascata de precisão: endereço completo → CEP (ViaCEP) → bairro → cidade/UF.
 *
 * `exato` distingue o que é o endereço pedido (rua/número) do que é só a região
 * em volta — o card usa isso para não vender um mapa de bairro como se fosse a
 * porta da obra.
 */
type Tentativa = { valor: string; zoom: number; exato: boolean };

function construirTentativas(p: Props): Tentativa[] {
  const tentativas: Tentativa[] = [];
  const rua = preenchido(p.rua) ? p.rua : undefined;
  const numero = preenchido(p.numero) ? p.numero : undefined;
  const bairro = preenchido(p.bairro) ? p.bairro : undefined;
  const cidade = preenchido(p.cidade) ? p.cidade : undefined;
  const estado = preenchido(p.estado) ? p.estado : undefined;
  const ruaComNumero = [rua, numero].filter(Boolean).join(', ');

  // Rua + cidade SEM bairro primeiro: um bairro que o OSM não reconhece zera o
  // resultado (ver nota em `tentativasDoCep`). Só depois tentamos com bairro,
  // que ajuda a desambiguar ruas homônimas na mesma cidade.
  if (ruaComNumero && cidade) {
    tentativas.push({
      valor: [ruaComNumero, cidade, estado, 'Brasil'].filter(Boolean).join(', '),
      zoom: 16,
      exato: true,
    });
    if (bairro) {
      tentativas.push({
        valor: [ruaComNumero, bairro, cidade, estado, 'Brasil'].filter(Boolean).join(', '),
        zoom: 16,
        exato: true,
      });
    }
  }

  if (bairro && cidade) {
    tentativas.push({
      valor: [bairro, cidade, estado, 'Brasil'].filter(Boolean).join(', '),
      zoom: 14,
      exato: false,
    });
  }

  if (cidade && estado) {
    tentativas.push({ valor: `${cidade}, ${estado}, Brasil`, zoom: 12, exato: false });
  }

  return tentativas;
}

/**
 * O CEP entra pelo ViaCEP, não pelo `postalcode=` do Nominatim.
 *
 * Medido em 2026-09-17: o `postalcode=` falhou em todos os CEPs brasileiros
 * testados, inclusive válidos. O ViaCEP é a base dos Correios e já existe no
 * projeto (`lookupCep`), então devolve logradouro/bairro/cidade oficiais — o
 * que resgata o caso em que o usuário digitou a rua errada mas o CEP certo.
 */
function tentativasDoCep(r: CepLookupResult, numero?: string | null): Tentativa[] {
  const numeroOk = preenchido(numero) ? numero : undefined;
  const logradouro = r.endereco.split(',')[0]?.trim();
  const tentativas: Tentativa[] = [];

  // Sem o bairro primeiro, e isso não é detalhe: o bairro dos Correios e o do
  // OSM divergem com frequência ("Residencial Recanto Verde" × "Recanto
  // Verde"), e um bairro que o OSM não reconhece **zera** o resultado da busca
  // inteira. Medido no CEP 06701-212: com bairro → vazio; sem bairro → acha a
  // rua exata.
  if (logradouro && r.cidade) {
    const comNumero = [logradouro, numeroOk].filter(Boolean).join(', ');
    tentativas.push({
      valor: [comNumero, r.cidade, r.estado, 'Brasil'].filter(Boolean).join(', '),
      zoom: 16,
      exato: true,
    });
  }
  if (r.bairro && r.cidade) {
    tentativas.push({
      valor: [r.bairro, r.cidade, r.estado, 'Brasil'].filter(Boolean).join(', '),
      zoom: 14,
      exato: false,
    });
  }
  if (r.cidade && r.estado) {
    tentativas.push({ valor: `${r.cidade}, ${r.estado}, Brasil`, zoom: 12, exato: false });
  }
  return tentativas;
}

export default function MapaEnderecoInner(props: Props) {
  const { className, onPrecisao } = props;
  const [coords, setCoords] = useState<Coords | null>(null);
  const [zoom, setZoom] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exato, setExato] = useState(false);

  const tentativas = useMemo(
    () => construirTentativas(props),
    // Só as partes do endereço importam para a query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.rua, props.numero, props.bairro, props.cidade, props.estado, props.cep],
  );

  const cepDigits = unformatCep(props.cep || '');
  const temCep = cepDigits.length === 8;

  useEffect(() => {
    if (tentativas.length === 0 && !temCep) {
      setCoords(null);
      setError(null);
      onPrecisao?.(null);
      return;
    }

    const ctrl = new AbortController();
    setLoading(true);
    setError(null);

    /** true = a rede falhou (offline, 429, 5xx); ≠ de "endereço não existe". */
    let houveFalhaDeRede = false;

    async function geocodificar(t: Tentativa): Promise<boolean> {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(t.valor)}&format=json&limit=1`;
      try {
        const resposta = await fetch(url, {
          signal: ctrl.signal,
          headers: { Accept: 'application/json' },
        });
        // XG21 — sem este check, um 429/503 caía no catch como se o endereço
        // não existisse, escondendo rate limit atrás de "endereço não encontrado".
        if (!resposta.ok) {
          houveFalhaDeRede = true;
          return false;
        }
        const linhas = (await resposta.json()) as Array<{ lat: string; lon: string }>;
        if (linhas.length > 0) {
          setCoords({ lat: parseFloat(linhas[0].lat), lon: parseFloat(linhas[0].lon) });
          setZoom(t.zoom);
          setExato(t.exato);
          setError(null);
          setLoading(false);
          onPrecisao?.(t.exato ? 'exata' : 'aproximada');
          return true;
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') throw err;
        houveFalhaDeRede = true;
      }
      return false;
    }

    (async () => {
      try {
        // 1) Endereço como foi digitado (rua+número → bairro → cidade).
        for (const t of tentativas) {
          if (await geocodificar(t)) return;
        }

        // 2) O CEP pela base dos Correios. Fica por último de propósito: só
        //    entra quando o texto digitado não resolveu, e é o degrau que
        //    resgata rua digitada errada com CEP certo.
        if (temCep) {
          const viaCep = await lookupCep(cepDigits, ctrl.signal);
          if (viaCep) {
            for (const t of tentativasDoCep(viaCep, props.numero)) {
              if (await geocodificar(t)) return;
            }
          }
        }

        setCoords(null);
        setExato(false);
        onPrecisao?.(null);
        setError(
          houveFalhaDeRede
            ? 'Mapa temporariamente indisponível. Tente novamente em instantes.'
            : 'Não foi possível localizar este endereço no mapa. Confira o CEP e o número.',
        );
        setLoading(false);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setCoords(null);
          setError('Mapa temporariamente indisponível.');
          setLoading(false);
        }
      }
    })();

    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tentativas, temCep, cepDigits]);

  const moldura = 'absolute inset-0 flex items-center justify-center px-6 text-center text-xs text-gray-500';

  // Um CEP sozinho já basta: o ViaCEP devolve cidade/bairro a partir dele.
  if (tentativas.length === 0 && !temCep) {
    return (
      <div className={className} data-testid="mapa-endereco-sem-dados">
        <div className={moldura}>Informe o CEP ou a cidade para ver o mapa.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={className} data-testid="mapa-endereco-carregando">
        <div className={moldura}>Localizando no mapa…</div>
      </div>
    );
  }

  if (!coords) {
    return (
      <div className={className} data-testid="mapa-endereco-indisponivel">
        <div className={moldura}>{error ?? 'Mapa indisponível.'}</div>
      </div>
    );
  }

  return (
    <div className={className} data-testid="mapa-endereco">
      <MapContainer
        center={[coords.lat, coords.lon]}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[coords.lat, coords.lon]} icon={icon} />
      </MapContainer>

      {/*
        XG21 — o selo existe porque um mapa que caiu no fallback de bairro ou
        cidade parece tão exato quanto o que achou a porta. Sem dizer qual é
        qual, o usuário confia num ponto que não é o da obra — a mesma
        armadilha do placeholder que a XG18 removeu.
        z-[400] fica acima dos tiles (z-200) e abaixo dos popups (z-700).
      */}
      <div
        className="absolute bottom-2 left-2 z-[400] rounded-md bg-white/90 dark:bg-gray-900/90 px-2 py-1 text-[10px] font-semibold shadow-sm backdrop-blur-sm"
        data-testid={exato ? 'mapa-precisao-exata' : 'mapa-precisao-aproximada'}
      >
        {exato ? (
          <span className="text-gray-700 dark:text-gray-200">Localização exata</span>
        ) : (
          <span className="text-amber-700 dark:text-amber-400">Local aproximado — confira o endereço</span>
        )}
      </div>
    </div>
  );
}
