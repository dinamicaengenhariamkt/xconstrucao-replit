'use client';

export interface ObraDestaque {
  id: string;
  nome: string;
  cidade: string | null;
  uf: string | null;
  tipo: string | null;
  capaUrl: string;
}

/**
 * Card apresentacional de uma obra em destaque na home (J25). Espelha o layout
 * antes hardcoded em app/page.tsx (imagem aspect-video, título, localização).
 */
export function ObraDestaqueCard({ obra }: { obra: ObraDestaque }) {
  const local = [obra.cidade, obra.uf].filter(Boolean).join(', ');
  return (
    <div className="flex flex-col gap-4">
      <div
        className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl transition-all duration-300 grayscale hover:grayscale-0"
        style={{ backgroundImage: `url("${obra.capaUrl}")` }}
        role="img"
        aria-label={obra.nome}
      />
      <div className="flex justify-between items-center px-1">
        <span className="font-bold">{obra.nome}</span>
        {local && (
          <span className="text-xs bg-slate-100 px-2 py-1 rounded">{local}</span>
        )}
      </div>
    </div>
  );
}
