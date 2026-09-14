'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { unformatCep } from '@shared/lib/masks';

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
 */

const icon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
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
}

interface Coords {
  lat: number;
  lon: number;
}

/**
 * Cascata de precisão: endereço completo → CEP → cidade/UF.
 *
 * O Nominatim geocodifica endereço brasileiro com qualidade irregular; quando
 * a rua não resolve, o CEP costuma resolver, e a cidade quase sempre resolve.
 * Melhor um mapa na cidade certa que um espaço vazio.
 */
function construirTentativas(p: Props): { tipo: 'q' | 'cep'; valor: string; zoom: number }[] {
  const tentativas: { tipo: 'q' | 'cep'; valor: string; zoom: number }[] = [];
  const ruaComNumero = [p.rua, p.numero].filter(Boolean).join(', ');

  if (ruaComNumero && p.cidade) {
    const partes = [ruaComNumero, p.bairro, p.cidade, p.estado, 'Brasil'].filter(Boolean);
    tentativas.push({ tipo: 'q', valor: partes.join(', '), zoom: 16 });
  }

  const cepDigits = unformatCep(p.cep || '');
  if (cepDigits.length === 8) {
    tentativas.push({ tipo: 'cep', valor: cepDigits, zoom: 15 });
  }

  if (p.cidade && p.estado) {
    tentativas.push({ tipo: 'q', valor: `${p.cidade}, ${p.estado}, Brasil`, zoom: 12 });
  }

  return tentativas;
}

export default function MapaEnderecoInner(props: Props) {
  const { className } = props;
  const [coords, setCoords] = useState<Coords | null>(null);
  const [zoom, setZoom] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tentativas = useMemo(
    () => construirTentativas(props),
    // Só as partes do endereço importam para a query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.rua, props.numero, props.bairro, props.cidade, props.estado, props.cep],
  );

  useEffect(() => {
    if (tentativas.length === 0) {
      setCoords(null);
      setError(null);
      return;
    }

    const ctrl = new AbortController();
    setLoading(true);
    setError(null);

    (async () => {
      for (const tentativa of tentativas) {
        const url =
          tentativa.tipo === 'cep'
            ? `https://nominatim.openstreetmap.org/search?postalcode=${tentativa.valor}&country=Brazil&format=json&limit=1`
            : `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(tentativa.valor)}&format=json&limit=1`;
        try {
          const resposta = await fetch(url, {
            signal: ctrl.signal,
            headers: { Accept: 'application/json' },
          });
          const linhas = (await resposta.json()) as Array<{ lat: string; lon: string }>;
          if (linhas.length > 0) {
            setCoords({ lat: parseFloat(linhas[0].lat), lon: parseFloat(linhas[0].lon) });
            setZoom(tentativa.zoom);
            setError(null);
            setLoading(false);
            return;
          }
        } catch (err) {
          if ((err as Error).name === 'AbortError') return;
          // Erro de rede numa tentativa não encerra a cascata: a próxima
          // (menos precisa) ainda pode resolver.
        }
      }
      setCoords(null);
      setError('Não foi possível localizar este endereço no mapa.');
      setLoading(false);
    })();

    return () => ctrl.abort();
  }, [tentativas]);

  const moldura = 'absolute inset-0 flex items-center justify-center px-6 text-center text-xs text-gray-500';

  if (tentativas.length === 0) {
    return (
      <div className={className} data-testid="mapa-endereco-sem-dados">
        <div className={moldura}>Informe cidade e estado para ver o mapa.</div>
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
    <MapContainer
      center={[coords.lat, coords.lon]}
      zoom={zoom}
      scrollWheelZoom={false}
      style={{ width: '100%', height: '100%' }}
      data-testid="mapa-endereco"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[coords.lat, coords.lon]} icon={icon} />
    </MapContainer>
  );
}
