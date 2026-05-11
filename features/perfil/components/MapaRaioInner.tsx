'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { unformatCep } from '@shared/lib/masks';

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
  cep: string | null | undefined;
  cidade?: string | null;
  estado?: string | null;
  raioKm: number | null | undefined;
  className?: string;
}

interface Coords {
  lat: number;
  lon: number;
}

function FitBounds({ coords, raioKm }: { coords: Coords; raioKm: number }) {
  const map = useMap();
  useEffect(() => {
    const center = L.latLng(coords.lat, coords.lon);
    const radiusMeters = Math.max(raioKm, 1) * 1000;
    const bounds = center.toBounds(radiusMeters * 2);
    map.fitBounds(bounds, { padding: [16, 16] });
  }, [map, coords.lat, coords.lon, raioKm]);
  return null;
}

export default function MapaRaioInner({ cep, cidade, estado, raioKm, className }: Props) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const cepDigits = unformatCep(cep || '');
    if (cepDigits.length === 8) return { type: 'cep' as const, value: cepDigits };
    if (cidade && estado) return { type: 'cidade' as const, value: `${cidade}, ${estado}, Brasil` };
    return null;
  }, [cep, cidade, estado]);

  useEffect(() => {
    if (!query) {
      setCoords(null);
      setError(null);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    const url =
      query.type === 'cep'
        ? `https://nominatim.openstreetmap.org/search?postalcode=${query.value}&country=Brazil&format=json&limit=1`
        : `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query.value)}&format=json&limit=1`;
    fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } })
      .then((r) => r.json() as Promise<Array<{ lat: string; lon: string }>>)
      .then((rows) => {
        if (!rows.length) {
          setError('Localização não encontrada');
          setCoords(null);
        } else {
          setCoords({ lat: parseFloat(rows[0].lat), lon: parseFloat(rows[0].lon) });
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError('Falha ao consultar mapa');
        }
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [query]);

  const effectiveRaio = raioKm && raioKm > 0 ? raioKm : 25;

  if (!query) {
    return (
      <div className={`w-full h-64 rounded-xl bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center text-xs text-muted-foreground ${className ?? ''}`}>
        Informe um CEP ou cidade/UF para visualizar o mapa.
      </div>
    );
  }

  if (loading || !coords) {
    return (
      <div className={`w-full h-64 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse flex items-center justify-center text-xs text-muted-foreground ${className ?? ''}`}>
        {error ?? 'Localizando…'}
      </div>
    );
  }

  return (
    <div className={`w-full h-64 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 ${className ?? ''}`}>
      <MapContainer
        center={[coords.lat, coords.lon]}
        zoom={11}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[coords.lat, coords.lon]} icon={icon} />
        <Circle
          center={[coords.lat, coords.lon]}
          radius={effectiveRaio * 1000}
          pathOptions={{ color: '#22846D', fillColor: '#22846D', fillOpacity: 0.12, weight: 2 }}
        />
        <FitBounds coords={coords} raioKm={effectiveRaio} />
      </MapContainer>
    </div>
  );
}
