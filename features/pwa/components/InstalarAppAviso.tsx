'use client';

/**
 * PWA — faixa fina no painel do xgestão, só no celular, só para quem ainda não
 * instalou. Some quando a pessoa fecha (fica guardado neste aparelho). Mesmo
 * estilo da faixa do teste grátis.
 */
import { useEffect, useState } from 'react';
import { RiCloseLine, RiSmartphoneLine } from 'react-icons/ri';
import { useInstalarApp } from '../lib/use-instalar-app';
import { InstalarAppDialog } from './InstalarAppDialog';

const DISPENSADO_KEY = 'xgestao:instalar-app-dispensado';

function lerDispensado(): boolean {
  try {
    return window.localStorage.getItem(DISPENSADO_KEY) === '1';
  } catch {
    return false;
  }
}

export function InstalarAppAviso() {
  const { plataforma, comoApp, instaladoAgora, podeInstalarDireto, instalar } = useInstalarApp();
  const [dispensado, setDispensado] = useState(true);
  const [dialogo, setDialogo] = useState(false);

  useEffect(() => { setDispensado(lerDispensado()); }, []);

  const celular = plataforma === 'android' || plataforma === 'ios';
  if (!celular || comoApp || instaladoAgora || dispensado) return null;

  const fechar = () => {
    setDispensado(true);
    try {
      window.localStorage.setItem(DISPENSADO_KEY, '1');
    } catch {
      // Sem storage: a faixa volta no próximo acesso.
    }
  };

  const abrir = async () => {
    // Android com o atalho pronto: instala direto, sem abrir janela.
    if (podeInstalarDireto) {
      const r = await instalar();
      if (r === 'aceito') fechar();
      if (r !== 'indisponivel') return;
    }
    setDialogo(true);
  };

  return (
    <>
      <div
        className="flex items-center justify-between gap-3 border-b border-primary/10 bg-primary/5 px-4 py-2 text-xs text-gray-700 dark:text-gray-200 sm:text-sm"
        data-testid="xgestao-aviso-instalar-app"
      >
        <span className="flex min-w-0 items-center gap-2">
          <RiSmartphoneLine className="shrink-0" />
          <span className="min-w-0">Use o xgestão como app no celular.</span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <button type="button" onClick={abrir} className="font-semibold underline underline-offset-2" data-testid="link-aviso-instalar-app">
            Instalar
          </button>
          <button type="button" onClick={fechar} aria-label="Fechar aviso de instalar o app" className="rounded p-0.5 hover:bg-primary/10">
            <RiCloseLine className="size-4" />
          </button>
        </span>
      </div>
      <InstalarAppDialog open={dialogo} onOpenChange={setDialogo} />
    </>
  );
}
