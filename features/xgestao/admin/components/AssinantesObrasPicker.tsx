'use client';

import { useMemo, useState } from 'react';
import { RiSearchLine } from 'react-icons/ri';
import { Input } from '@shared/components/ui/input';
import { Button } from '@shared/components/ui/button';
import { Skeleton } from '@shared/components/ui/skeleton';
import type { XgestaoAssinanteDetalhe } from '../server/assinantes';

const POR_PAGINA = 8;

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

interface Props {
  assinantes: XgestaoAssinanteDetalhe[];
  selecionadaId: string;
  onSelecionar: (id: string) => void;
  carregando: boolean;
  erro: boolean;
  onTentarNovamente: () => void;
}

/** Seleção da empreiteira pagante, nunca dos destinatários dos links públicos. */
export function AssinantesObrasPicker({
  assinantes, selecionadaId, onSelecionar, carregando, erro, onTentarNovamente,
}: Props) {
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim());
    return [...assinantes]
      .filter((assinante) =>
        !termo || normalizar(`${assinante.empreiteiraNome} ${assinante.email}`).includes(termo))
      .sort((a, b) => a.empreiteiraNome.localeCompare(b.empreiteiraNome, 'pt-BR'));
  }, [assinantes, busca]);
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);
  const totalObras = assinantes.reduce((total, assinante) => total + assinante.obrasGerenciadas, 0);

  return (
    <aside className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900" aria-label="Empreiteiras assinantes do xgestão">
      <h2 className="text-base font-bold">Empreiteiras assinantes</h2>
      <p className="mt-1 text-xs text-muted-foreground">Escolha uma empreiteira para acompanhar suas obras.</p>
      <div className="relative mt-4">
        <RiSearchLine className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <Input
          aria-label="Buscar empreiteira assinante"
          placeholder="Buscar empreiteira"
          value={busca}
          onChange={(event) => { setBusca(event.target.value); setPagina(1); }}
          className="pl-9"
          data-testid="xgestao-assinantes-busca"
        />
      </div>
      {erro ? (
        <div className="mt-4 rounded-xl border border-red-200 p-4 text-sm dark:border-red-900">
          <p>Não foi possível carregar as empreiteiras.</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={onTentarNovamente}>Tentar novamente</Button>
        </div>
      ) : carregando ? (
        <div className="mt-4 space-y-2" aria-label="Carregando empreiteiras">
          {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-2">
            <button
              type="button"
              aria-pressed={!selecionadaId}
              onClick={() => onSelecionar('')}
              className={`w-full rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${!selecionadaId ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-primary/40 dark:border-gray-800'}`}
              data-testid="xgestao-assinante-todos"
            >
              <span className="block text-sm font-bold">Todas as empreiteiras</span>
              <span className="text-xs text-muted-foreground">{assinantes.length} empreiteiras · {totalObras} obras</span>
            </button>
            {visiveis.map((assinante) => (
              <button
                key={assinante.empreiteiraId}
                type="button"
                aria-pressed={selecionadaId === assinante.empreiteiraId}
                onClick={() => onSelecionar(assinante.empreiteiraId)}
                className={`w-full rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${selecionadaId === assinante.empreiteiraId ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-primary/40 dark:border-gray-800'}`}
                data-testid={`xgestao-assinante-selecionar-${assinante.empreiteiraId}`}
              >
                <span className="block truncate text-sm font-bold" title={assinante.empreiteiraNome}>{assinante.empreiteiraNome}</span>
                <span className="block truncate text-xs text-muted-foreground" title={assinante.email}>{assinante.email}</span>
                <span className="text-xs text-muted-foreground">
                  {assinante.obrasGerenciadas} obras · {assinante.obrasAtivas} em andamento
                </span>
              </button>
            ))}
            {assinantes.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">Nenhuma empreiteira com perfil concluído.</p>
            )}
            {assinantes.length > 0 && visiveis.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">Nenhuma empreiteira encontrada.</p>
            )}
          </div>
          {totalPaginas > 1 && (
            <div className="mt-4 flex items-center justify-between gap-2 border-t pt-3 text-xs dark:border-gray-800">
              <Button size="sm" variant="outline" disabled={paginaAtual === 1} onClick={() => setPagina(paginaAtual - 1)}>Anterior</Button>
              <span aria-live="polite">{paginaAtual} de {totalPaginas}</span>
              <Button size="sm" variant="outline" disabled={paginaAtual === totalPaginas} onClick={() => setPagina(paginaAtual + 1)}>Próxima</Button>
            </div>
          )}
        </>
      )}
    </aside>
  );
}