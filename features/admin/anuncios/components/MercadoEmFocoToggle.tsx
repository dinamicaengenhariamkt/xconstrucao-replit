'use client';

import { RiStore2Line } from 'react-icons/ri';
import { Switch } from '@shared/components/ui/switch';
import { useToast } from '@shared/hooks/use-toast';
import { useAnuncioConfig, useSetAnuncioConfig } from '../hooks/use-anuncios';

const CHAVE = 'secao:mercado-em-foco';

/**
 * Master toggle (J24, Opção B) da seção "Mercado em Foco" da home. Independe de
 * haver campanha ativa: desligado, a seção some mesmo com anúncios ativos.
 * Fail-open: na ausência de registro, considera visível.
 */
export function MercadoEmFocoToggle() {
  const { data } = useAnuncioConfig();
  const setConfig = useSetAnuncioConfig();
  const { toast } = useToast();

  const row = data?.find((c) => c.chave === CHAVE);
  const visivel = row ? row.visivel : true;

  async function onToggle(next: boolean) {
    try {
      await setConfig.mutateAsync({ chave: CHAVE, visivel: next });
      toast({ title: next ? 'Seção ativada' : 'Seção ocultada', description: '"Mercado em Foco" na home.' });
    } catch (e) {
      toast({ title: 'Erro', description: e instanceof Error ? e.message : 'Tente novamente.', variant: 'destructive' });
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 bg-primary/5 rounded-lg shrink-0">
          <RiStore2Line className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Seção "Mercado em Foco" na home</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Quando desligada, a vitrine some da landing mesmo com anúncios ativos.
          </p>
        </div>
      </div>
      <Switch
        checked={visivel}
        onCheckedChange={onToggle}
        disabled={setConfig.isPending}
        data-testid="toggle-mercado-em-foco"
        aria-label="Alternar seção Mercado em Foco"
      />
    </div>
  );
}
