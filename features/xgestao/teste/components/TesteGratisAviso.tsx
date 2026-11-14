'use client';

/**
 * XG35/XG43 — teste grátis no layout do xgestão (só para o responsável pela conta).
 *
 * - Barra fina abaixo do topo, em toda página: relógio regressivo do teste
 *   (com segundos nas últimas 24h), as 24h de tolerância depois do fim, o +1 mês
 *   para quem assina no último mês, cancelamento agendado e pagamento pendente.
 * - O teste começa sozinho no primeiro acesso (layout do servidor). O diálogo
 *   de oferta só aparece se esse início falhar ou para ex-assinante sem teste.
 * - Diálogo de fim do teste: "Continuar em somente leitura" grava a resposta no
 *   servidor e não volta a aparecer; "Ver planos" leva à aba Plano.
 */

import { useEffect, useState, type ReactNode } from 'react';
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
import { formatarContagem } from '../contagem';

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

const DIA_MS = 86_400_000;
const CARENCIA_INADIMPLENCIA_MS = 7 * DIA_MS;
/** Faixa do +1 mês: aparece no último mês do teste (estratégia comercial). */
const JANELA_BONUS_DIAS = 30;

function dataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

/** Agora que avança sozinho: a cada segundo perto do fim, a cada 30s no resto. */
function useAgora(rapido: boolean): number {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    setAgora(Date.now());
    const id = window.setInterval(() => setAgora(Date.now()), rapido ? 1_000 : 30_000);
    return () => window.clearInterval(id);
  }, [rapido]);
  return agora;
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
  const fimMs = teste?.fimTeste ? new Date(teste.fimTeste).getTime() : null;
  const bloqueioMs = teste?.bloqueioEm ? new Date(teste.bloqueioEm).getTime() : null;
  // Segundos só quando falta menos de 1 dia para o fim ou para o bloqueio.
  const alvoMs = teste?.emTeste ? (teste.emTolerancia ? bloqueioMs : fimMs) : null;
  const agora = useAgora(alvoMs !== null && alvoMs - Date.now() < DIA_MS);
  if (!perfil || !teste) return null;

  const nomePlanoTeste =
    planos?.find((p) => p.tier === teste.tierTeste)?.nome ?? 'Basic';
  const noFree = perfil.somenteLeitura === true;
  // Só no dashboard (porta de entrada): no console da obra o diálogo disputaria a tela com o tour guiado.
  const mostrarOferta = pathname === XGESTAO_HOME && noFree && teste.elegivel && !ofertaFechada && !ofertaFoiDispensada();
  const mostrarAvisoFim = teste.avisoFimPendente && !avisoFechado;

  const fecharOferta = () => {
    dispensarOferta();
    setOfertaFechada(true);
  };

  // PRD 55 — os links da faixa ganham área de toque de 44 px sem a faixa crescer.
  const linkAssinar = (texto: string) => (
    <Link href={PLANOS_HREF} className="shrink-0 font-semibold underline underline-offset-2 relative after:absolute after:-inset-x-2 after:-inset-y-3 after:content-['']" data-testid="link-teste-assinar">
      {texto}
    </Link>
  );

  let barra: ReactNode = null;
  if (teste.emTeste && fimMs !== null) {
    const emTolerancia = teste.emTolerancia || agora >= fimMs;
    const restanteMs = (emTolerancia ? (bloqueioMs ?? fimMs) : fimMs) - agora;
    // XG50 — sem o +1 mês quando o bônus já foi usado (conta ou CPF/CNPJ).
    const mostrarBonus = teste.bonusDisponivel !== false && (emTolerancia || fimMs - agora <= JANELA_BONUS_DIAS * DIA_MS);
    barra = (
      <>
        <span className="flex min-w-0 items-center gap-2">
          <RiTimeLine className="shrink-0" />
          <span className="min-w-0" data-testid="xgestao-barra-contagem">
            {emTolerancia
              ? <>Seu teste grátis terminou. A edição será bloqueada em <strong className="tabular-nums">{formatarContagem(restanteMs)}</strong>.</>
              : <>Teste grátis do plano {nomePlanoTeste}: termina em <strong className="tabular-nums">{formatarContagem(restanteMs)}</strong>.</>}
            {mostrarBonus && (
              <span className="font-semibold" data-testid="xgestao-barra-bonus">
                {' '}Assine agora e ganhe +1 mês grátis.
              </span>
            )}
          </span>
        </span>
        {linkAssinar('Assinar agora')}
      </>
    );
  } else if (perfil.cancelamentoAgendado && perfil.renovaEm) {
    barra = (
      <>
        <span className="flex min-w-0 items-center gap-2" data-testid="xgestao-barra-cancelamento">
          <RiTimeLine className="shrink-0" />
          <span className="min-w-0">
            Assinatura cancelada. Você continua com acesso completo até {dataCurta(perfil.renovaEm)}; depois, a conta fica somente para leitura.
          </span>
        </span>
        {linkAssinar('Assinar novamente')}
      </>
    );
  } else if (perfil.inadimplente && perfil.renovaEm) {
    const limite = new Date(new Date(perfil.renovaEm).getTime() + CARENCIA_INADIMPLENCIA_MS).toISOString();
    barra = (
      <>
        <span className="flex min-w-0 items-center gap-2" data-testid="xgestao-barra-inadimplente">
          <RiTimeLine className="shrink-0" />
          <span className="min-w-0">
            Não conseguimos confirmar o pagamento. Regularize até {dataCurta(limite)} para continuar editando.
          </span>
        </span>
        {linkAssinar('Ver plano')}
      </>
    );
  } else if (noFree) {
    barra = (
      <>
        <span className="flex min-w-0 items-center gap-2">
          <RiVipCrownLine className="shrink-0" />
          <span className="truncate">
            {teste.elegivel
              ? `Experimente o plano ${nomePlanoTeste} grátis por ${teste.duracaoDias} dias.`
              : teste.testeNegadoPorDocumento
                ? 'Esse documento já usou o período de teste. Você pode assinar quando quiser.'
                : 'Conta somente para leitura. Assine para voltar a editar; seus dados estão preservados.'}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          {teste.elegivel && (
            <button
              type="button"
              className="font-semibold underline underline-offset-2 disabled:opacity-60 relative after:absolute after:-inset-x-2 after:-inset-y-3 after:content-['']"
              onClick={() => iniciar.mutate()}
              disabled={iniciar.isPending}
              data-testid="button-barra-iniciar-teste"
            >
              Iniciar teste grátis
            </button>
          )}
          <Link href={PLANOS_HREF} className="font-semibold underline underline-offset-2 relative after:absolute after:-inset-x-2 after:-inset-y-3 after:content-['']" data-testid="link-barra-ver-planos">
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
              sua conta fica somente para leitura e seus dados continuam aqui. Não há cobrança automática. Se preferir, assine agora.
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
              Sua conta está somente para leitura. Nada foi apagado: suas obras continuam disponíveis. Para voltar
              a editar, escolha um plano.
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
              Continuar em somente leitura
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
