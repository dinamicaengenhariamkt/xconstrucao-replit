'use client';

/**
 * XG35 — teste grátis no layout do xgestão (só para o responsável pela conta).
 *
 * - Barra fina abaixo do topo: dias restantes do teste, oferta do teste ou o
 *   lembrete do plano Free com chamada para os planos. Plano pago: nada.
 * - Diálogo de primeiro acesso oferecendo o teste (ou assinar direto), só no
 *   dashboard. Dispensar é conveniência por navegador (`localStorage`); a barra
 *   continua oferecendo.
 * - Diálogo de fim do teste: "Continuar no Free" grava a resposta no servidor e
 *   não volta a aparecer; "Ver planos" leva à aba Plano.
 */

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RiGiftLine, RiTimeLine, RiVipCrownLine } from 'react-icons/ri';
import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { usePerfilPlano, usePlanos } from '@features/planos/ui/use-planos';
import { XGESTAO_HOME } from '../../routes';

const PLANOS_HREF = '/xgestao/configuracoes?tab=plano';
const OFERTA_DISPENSADA_KEY = 'xgestao:teste-oferta-dispensada';

function ofertaFoiDispensada(): boolean {
  try {
    return window.localStorage.getItem(OFERTA_DISPENSADA_KEY) === '1';
  } catch {
    return false;
  }
}

function dispensarOferta() {
  try {
    window.localStorage.setItem(OFERTA_DISPENSADA_KEY, '1');
  } catch {
    // Sem storage (aba privada): a oferta volta no próximo acesso, a barra segue.
  }
}

async function postar(url: string) {
  const res = await fetch(url, { method: 'POST' });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? 'Não foi possível concluir agora.');
  return body;
}

export function TesteGratisAviso() {
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();
  const { data: perfil } = usePerfilPlano('xgestao');
  const { data: planos } = usePlanos('xgestao');
  const [ofertaFechada, setOfertaFechada] = useState(false);
  const [avisoFechado, setAvisoFechado] = useState(false);

  const invalidar = () => qc.invalidateQueries({ queryKey: ['perfil', 'plano'] });
  const iniciar = useMutation({ mutationFn: () => postar('/api/xgestao/teste'), onSuccess: invalidar });
  const continuarFree = useMutation({
    mutationFn: () => postar('/api/xgestao/teste/continuar-free'),
    onSuccess: invalidar,
  });

  const teste = perfil?.teste;
  if (!perfil || !teste) return null;

  const nomePlanoTeste =
    planos?.find((p) => p.tier === teste.tierTeste)?.nome ?? (teste.tierTeste === 'enterprise' ? 'Pro' : 'Basic');
  const noFree = perfil.plano === 'free';
  // Só no dashboard (porta de entrada): no console da obra o diálogo disputaria a tela com o tour guiado.
  const mostrarOferta = pathname === XGESTAO_HOME && noFree && teste.elegivel && !ofertaFechada && !ofertaFoiDispensada();
  const mostrarAvisoFim = teste.avisoFimPendente && !avisoFechado;

  const fecharOferta = () => {
    dispensarOferta();
    setOfertaFechada(true);
  };

  let barra: ReactNode = null;
  if (teste.emTeste) {
    const dias = teste.diasRestantes ?? 0;
    barra = (
      <>
        <span className="flex min-w-0 items-center gap-2">
          <RiTimeLine className="shrink-0" />
          <span className="truncate">
            Teste grátis do plano {nomePlanoTeste}: {dias === 1 ? 'falta 1 dia' : `faltam ${dias} dias`}.
          </span>
        </span>
        <Link href={PLANOS_HREF} className="shrink-0 font-semibold underline underline-offset-2" data-testid="link-teste-assinar">
          Assinar agora
        </Link>
      </>
    );
  } else if (noFree) {
    barra = (
      <>
        <span className="flex min-w-0 items-center gap-2">
          <RiVipCrownLine className="shrink-0" />
          <span className="truncate">
            {teste.elegivel
              ? `Você está no plano Free. Experimente o plano ${nomePlanoTeste} grátis por ${teste.duracaoDias} dias.`
              : 'Você está no plano Free. Conheça os planos para gerir mais obras.'}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          {teste.elegivel && (
            <button
              type="button"
              className="font-semibold underline underline-offset-2 disabled:opacity-60"
              onClick={() => iniciar.mutate()}
              disabled={iniciar.isPending}
              data-testid="button-barra-iniciar-teste"
            >
              Iniciar teste grátis
            </button>
          )}
          <Link href={PLANOS_HREF} className="font-semibold underline underline-offset-2" data-testid="link-barra-ver-planos">
            Ver planos
          </Link>
        </span>
      </>
    );
  }

  return (
    <>
      {barra && (
        <div
          className="flex items-center justify-between gap-3 border-b border-primary/10 bg-primary/5 px-4 py-2 text-xs text-gray-700 dark:text-gray-200 sm:text-sm"
          data-testid="xgestao-barra-plano"
        >
          {barra}
        </div>
      )}

      <Dialog open={mostrarOferta} onOpenChange={(open) => !open && fecharOferta()}>
        <DialogContent data-testid="dialog-oferta-teste">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RiGiftLine className="text-primary" /> Teste grátis por {teste.duracaoDias} dias
            </DialogTitle>
            <DialogDescription>
              Use o plano {nomePlanoTeste} sem pagar nada por {teste.duracaoDias} dias. Se não assinar até o fim,
              sua conta volta para o plano Free e suas obras continuam aqui. Se preferir, assine agora.
            </DialogDescription>
          </DialogHeader>
          {iniciar.isError && <p className="text-sm text-red-600">{iniciar.error.message}</p>}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={fecharOferta} data-testid="button-oferta-agora-nao">
              Agora não
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                fecharOferta();
                router.push(PLANOS_HREF);
              }}
              data-testid="button-oferta-assinar"
            >
              Assinar agora
            </Button>
            <Button
              onClick={() => iniciar.mutate(undefined, { onSuccess: () => setOfertaFechada(true) })}
              disabled={iniciar.isPending}
              data-testid="button-oferta-iniciar-teste"
            >
              Iniciar teste grátis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mostrarAvisoFim} onOpenChange={(open) => !open && setAvisoFechado(true)}>
        <DialogContent data-testid="dialog-fim-teste">
          <DialogHeader>
            <DialogTitle>Seu teste grátis terminou</DialogTitle>
            <DialogDescription>
              Sua conta voltou para o plano Free. Nada foi apagado: suas obras continuam disponíveis. Para voltar
              a ter os recursos do plano {nomePlanoTeste}, escolha um plano.
            </DialogDescription>
          </DialogHeader>
          {continuarFree.isError && <p className="text-sm text-red-600">{continuarFree.error.message}</p>}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => continuarFree.mutate(undefined, { onSuccess: () => setAvisoFechado(true) })}
              disabled={continuarFree.isPending}
              data-testid="button-continuar-free"
            >
              Continuar no Free
            </Button>
            <Button
              onClick={() => {
                setAvisoFechado(true);
                router.push(PLANOS_HREF);
              }}
              data-testid="button-fim-teste-ver-planos"
            >
              Ver planos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
