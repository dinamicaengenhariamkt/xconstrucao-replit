'use client';

/**
 * PWA — o "como instalar" de cada aparelho, num lugar só. Usado na home, na
 * página /instalar (destino do QR code) e no painel do xgestão.
 *
 * Android com o atalho do navegador: 1 botão. iPhone: 2 toques guiados.
 * Computador: QR code. Navegador do Instagram/Facebook: abrir no navegador.
 */
import { useState, type ReactNode } from 'react';
import { IoShareOutline } from 'react-icons/io5';
import {
  RiAddBoxLine,
  RiCheckboxCircleLine,
  RiComputerLine,
  RiFileCopyLine,
  RiMore2Fill,
  RiSmartphoneLine,
} from 'react-icons/ri';
import { Button } from '@shared/components/ui/button';
import { useInstalarApp } from '../lib/use-instalar-app';
import { PAGINA_INSTALAR } from '../lib/plataforma';
import { InstalarAppQrCode } from './InstalarAppQrCode';

function Passo({ numero, children }: { numero: number; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#333333] text-xs font-bold text-white dark:bg-white dark:text-[#333333]">
        {numero}
      </span>
      <span className="pt-0.5 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{children}</span>
    </li>
  );
}

function Destaque({ children }: { children: ReactNode }) {
  return <strong className="inline-flex items-center gap-1 font-semibold text-[#101819] dark:text-white">{children}</strong>;
}

export function InstalarAppPassos({ mostrarQrNoComputador = true }: { mostrarQrNoComputador?: boolean }) {
  const { plataforma, safariIos, comoApp, instaladoAgora, podeInstalarDireto, instalar } = useInstalarApp();
  const [resultado, setResultado] = useState<'aceito' | 'recusado' | null>(null);
  const [copiado, setCopiado] = useState(false);

  if (!plataforma) {
    return <div className="h-32 animate-pulse rounded-xl bg-slate-200/60 dark:bg-slate-700/40" role="status" aria-label="Carregando" />;
  }

  if (comoApp || instaladoAgora || resultado === 'aceito') {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400" data-testid="instalar-app-pronto">
        <RiCheckboxCircleLine className="size-5 shrink-0" />
        {comoApp
          ? 'Você já está usando o app do xgestão.'
          : 'Pronto! O ícone do xgestão está na tela inicial do seu aparelho.'}
      </p>
    );
  }

  const clicarInstalar = async () => {
    const r = await instalar();
    if (r !== 'indisponivel') setResultado(r);
  };

  if (plataforma === 'navegador-interno') {
    const copiar = async () => {
      try {
        await navigator.clipboard.writeText(`${window.location.origin}${PAGINA_INSTALAR}`);
        setCopiado(true);
      } catch {
        setCopiado(false);
      }
    };
    return (
      <div className="space-y-4" data-testid="instalar-app-navegador-interno">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          Você abriu este link por dentro de outro aplicativo. Para instalar, abra no navegador do celular
          (Chrome no Android ou Safari no iPhone): toque nos <Destaque><RiMore2Fill />três pontinhos</Destaque> e
          em <Destaque>Abrir no navegador</Destaque>.
        </p>
        <Button type="button" variant="outline" onClick={copiar} className="rounded-full">
          <RiFileCopyLine /> {copiado ? 'Link copiado' : 'Copiar link'}
        </Button>
      </div>
    );
  }

  if (plataforma === 'android') {
    if (podeInstalarDireto) {
      return (
        <div className="space-y-3" data-testid="instalar-app-android">
          <Button
            type="button"
            onClick={clicarInstalar}
            className="h-12 w-full rounded-full bg-[#333333] px-8 font-bold text-white hover:brightness-110 dark:bg-white dark:text-[#1C1F22] sm:w-auto"
            data-testid="button-instalar-app"
          >
            <RiSmartphoneLine className="size-5" /> Instalar o app
          </Button>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {resultado === 'recusado'
              ? 'Sem problema. Quando quiser, é só tocar de novo ou instalar pelo menu do navegador.'
              : 'Toque no botão e confirme. O ícone aparece na tela inicial.'}
          </p>
        </div>
      );
    }
    return (
      <ol className="space-y-3" data-testid="instalar-app-android-passos">
        <Passo numero={1}>
          No Chrome, toque nos <Destaque><RiMore2Fill />três pontinhos</Destaque> no canto de cima.
        </Passo>
        <Passo numero={2}>
          Toque em <Destaque>Instalar app</Destaque> ou <Destaque>Adicionar à tela inicial</Destaque> e confirme.
        </Passo>
        <li className="pl-10 text-xs text-slate-500 dark:text-slate-400">
          Se o app já estiver instalado, é só abrir pelo ícone do xgestão.
        </li>
      </ol>
    );
  }

  if (plataforma === 'ios') {
    return (
      <ol className="space-y-3" data-testid="instalar-app-ios">
        <Passo numero={1}>
          Toque em <Destaque><IoShareOutline className="size-4" />Compartilhar</Destaque>
          {safariIos ? ', na barra de baixo do Safari.' : ', no canto de cima do navegador.'}
        </Passo>
        <Passo numero={2}>
          Role e toque em <Destaque><RiAddBoxLine />Adicionar à Tela de Início</Destaque>.
        </Passo>
        <Passo numero={3}>
          Toque em <Destaque>Adicionar</Destaque>. Pronto: o xgestão fica na sua tela inicial.
        </Passo>
      </ol>
    );
  }

  // Computador.
  return (
    <div className="space-y-5" data-testid="instalar-app-desktop">
      {mostrarQrNoComputador && (
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          <InstalarAppQrCode />
          <ol className="space-y-3">
            <Passo numero={1}>Abra a câmera do celular e aponte para o código.</Passo>
            <Passo numero={2}>Toque no link que aparecer. A página mostra o passo a passo do seu aparelho.</Passo>
          </ol>
        </div>
      )}
      {podeInstalarDireto && (
        <Button type="button" variant="outline" onClick={clicarInstalar} className="rounded-full" data-testid="button-instalar-computador">
          <RiComputerLine /> Instalar também neste computador
        </Button>
      )}
    </div>
  );
}
