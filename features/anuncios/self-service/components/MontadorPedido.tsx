'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@shared/components/ui/button';
import { useToast } from '@shared/hooks/use-toast';
import { RiAddLine, RiShoppingBag3Line } from 'react-icons/ri';
import { usePublicConfig } from '@features/shared/hooks/use-public-config';
import { SlotEditor } from './SlotEditor';
import { ContratoAnuncianteModal } from './ContratoAnuncianteModal';
import type { SlotDraft, ZonaOption } from './types';

/** Calcula dias inclusivos (mesma regra do server precificacao.calcularDias). */
function calcDias(ini: string | null, fim: string | null): number {
  if (!ini || !fim) return 30;
  const a = Date.parse(ini);
  const b = Date.parse(fim);
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return 30;
  return Math.min(365, Math.max(1, Math.floor((b - a) / 86_400_000) + 1));
}

const TEMPLATES_SELF_SERVICE = ['imagem-card', 'banner-imagem', 'conteudo-texto'];

function novoSlot(zonas: ZonaOption[]): SlotDraft {
  const z = zonas[0];
  const templatePadrao = (z?.templates ?? []).find((t) => TEMPLATES_SELF_SERVICE.includes(t)) ?? 'imagem-card';
  return {
    zona: z?.zona ?? '',
    template: templatePadrao as SlotDraft['template'],
    titulo: '',
    subtitulo: null,
    criativoUrl: null,
    ctaUrl: null,
    ctaTexto: null,
    conteudo: null,
    periodoInicio: null,
    periodoFim: null,
  };
}

/**
 * J23 — montador de pedido multi-slot + checkout-protótipo. Usado na visão do
 * anunciante e (via wrapper) nas visões de cliente. Soma o preço (simulado) dos
 * slots, envia para POST /api/anuncios/pedidos e mostra "adquirido com sucesso".
 */
export function MontadorPedido({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { config } = usePublicConfig();
  const [zonas, setZonas] = useState<ZonaOption[]>([]);
  const [slots, setSlots] = useState<SlotDraft[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [carregandoZonas, setCarregandoZonas] = useState(true);
  // A tabela de preços do self-service ainda é de protótipo (valores a definir
  // com os sócios — J23 §13). A API sinaliza isso em `simulacao`; sem consumir
  // o campo, o anunciante via um preço em reais indistinguível de um definitivo.
  const [precoSimulado, setPrecoSimulado] = useState(false);
  // J59 — gate do Termo do Anunciante: abre quando o POST responde 403 CONTRATO_ANUNCIANTE_NAO_ACEITO.
  const [contratoOpen, setContratoOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/anuncios/precos', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const opts: ZonaOption[] = (data.precos ?? []).map((p: ZonaOption) => ({
            zona: p.zona,
            nome: p.nome,
            precoDia: p.precoDia,
            multiplo: p.multiplo,
            templates: p.templates ?? [],
          }));
          setZonas(opts);
          setSlots([novoSlot(opts)]);
          setPrecoSimulado(data.simulacao === true);
        }
      } finally {
        setCarregandoZonas(false);
      }
    })();
  }, []);

  const precoDeSlot = (s: SlotDraft): number => {
    const z = zonas.find((x) => x.zona === s.zona);
    if (!z) return 0;
    return Math.round(z.precoDia * calcDias(s.periodoInicio, s.periodoFim) * 100) / 100;
  };

  const total = useMemo(() => slots.reduce((acc, s) => acc + precoDeSlot(s), 0), [slots, zonas]);

  const atualizarSlot = (i: number, patch: Partial<SlotDraft>) => {
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };

  const podeEnviar = slots.length > 0 && slots.every((s) => s.zona && s.titulo.trim().length >= 2);

  const enviar = async () => {
    if (!podeEnviar) {
      toast({ title: 'Preencha os campos', description: 'Cada local precisa de zona e título.', variant: 'destructive' });
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch('/api/anuncios/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ slots }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        // J59 — precisa aceitar o Termo do Anunciante antes de anunciar: abre o
        // modal em vez do toast destrutivo. Ao aceitar, reenvia o pedido.
        if (err.code === 'CONTRATO_ANUNCIANTE_NAO_ACEITO') {
          setContratoOpen(true);
          return;
        }
        throw new Error(err.message || 'Falha ao enviar o pedido');
      }
      toast({
        title: 'Pedido adquirido com sucesso!',
        description: 'Seu pedido entrou em análise. Você será avisado quando for aprovado.',
      });
      router.push(redirectTo);
    } catch (e) {
      toast({ title: 'Erro', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setEnviando(false);
    }
  };

  if (carregandoZonas) {
    return <p className="text-sm text-gray-500">Carregando opções de anúncio…</p>;
  }

  return (
    <div className="space-y-5">
      {slots.map((slot, i) => (
        <SlotEditor
          key={i}
          slot={slot}
          index={i}
          zonas={zonas}
          precoSlot={precoDeSlot(slot)}
          onChange={(patch) => atualizarSlot(i, patch)}
          onRemove={() => setSlots((prev) => prev.filter((_, idx) => idx !== i))}
        />
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => setSlots((prev) => [...prev, novoSlot(zonas)])}
        disabled={slots.length >= 10}
      >
        <RiAddLine className="w-4 h-4 mr-1" /> Adicionar outro local
      </Button>

      {/* Checkout: no modo pago o pagamento vem após a aprovação (moderar-antes-de-pagar). */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-5 bg-white dark:bg-gray-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Total estimado ({slots.length} local{slots.length !== 1 ? 'is' : ''})</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            <span className="text-xs font-normal text-amber-600 ml-2">
              {config.adPaymentEnabled ? 'você paga após a aprovação' : 'simulação — sem cobrança real'}
            </span>
          </p>
          {/* Preço provisório: distinto do aviso acima, que fala da COBRANÇA.
              Aqui o alerta é sobre o VALOR em si — a tabela por zona ainda é
              de protótipo, então mesmo com cobrança real ligada o número
              exibido pode mudar. */}
          {precoSimulado && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Valores de referência — a tabela de preços ainda está em definição
              e pode ser ajustada antes da veiculação.
            </p>
          )}
        </div>
        <Button type="button" onClick={enviar} disabled={!podeEnviar || enviando} size="lg">
          <RiShoppingBag3Line className="w-5 h-5 mr-2" />
          {enviando ? 'Processando…' : config.adPaymentEnabled ? 'Enviar pedido' : 'Confirmar aquisição'}
        </Button>
      </div>

      <ContratoAnuncianteModal
        open={contratoOpen}
        onOpenChange={setContratoOpen}
        onAceito={() => {
          // Aceite registrado → reenvia o pedido automaticamente.
          void enviar();
        }}
      />
    </div>
  );
}
