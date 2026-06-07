'use client';

import { useMemo } from 'react';
import { useUpload } from '@features/shared/hooks/use-uploads';
import { AdCreativeCard } from '@features/shared/anuncios/components/AdCreativeCard';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import { Button } from '@shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { RiUploadCloud2Line, RiDeleteBinLine } from 'react-icons/ri';
import type { TemplateId } from '@features/shared/anuncios/templates/types';
import type { ZonaOption, SlotDraft } from './types';

interface SlotEditorProps {
  slot: SlotDraft;
  index: number;
  zonas: ZonaOption[];
  onChange: (patch: Partial<SlotDraft>) => void;
  onRemove: () => void;
  precoSlot: number;
}

/**
 * J23 — editor de um slot do pedido. Form dirigido por zona+template, com PREVIEW
 * AO VIVO reusando o `AdCreativeCard` real (J24) — o anunciante vê exatamente o que
 * vai publicar. Upload de criativo via R2 (kind `anuncio_criativo`).
 */
export function SlotEditor({ slot, index, zonas, onChange, onRemove, precoSlot }: SlotEditorProps) {
  const { upload, pending, progress } = useUpload();

  const zonaAtual = useMemo(() => zonas.find((z) => z.zona === slot.zona), [zonas, slot.zona]);
  // Self-service só oferece templates que o editor consegue preencher. `destaque-dados`
  // (blocos de dados) é editorial/admin — fica de fora do self-service (§13).
  const TEMPLATES_SELF_SERVICE = ['imagem-card', 'banner-imagem', 'conteudo-texto'];
  const templatesDaZona = (zonaAtual?.templates ?? []).filter((t) => TEMPLATES_SELF_SERVICE.includes(t));

  const handleZona = (zona: string) => {
    const z = zonas.find((x) => x.zona === zona);
    const primeiroTemplate = z?.templates?.[0] ?? 'imagem-card';
    // Ao trocar de zona, garante template compatível.
    onChange({ zona, template: primeiroTemplate as TemplateId });
  };

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    try {
      const res = await upload({ kind: 'anuncio_criativo', file });
      onChange({ criativoUrl: res.publicUrl ?? res.signedUrl ?? null });
    } catch {
      // erro de upload é tratado pelo hook (toast); mantém estado.
    }
  };

  const mostraTexto = slot.template === 'conteudo-texto';

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 md:p-5 bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100">Local {index + 1}</h4>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="text-destructive hover:bg-destructive/10">
          <RiDeleteBinLine className="w-4 h-4 mr-1" /> Remover
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Form */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Onde exibir (zona)</Label>
            <Select value={slot.zona} onValueChange={handleZona}>
              <SelectTrigger><SelectValue placeholder="Escolha o local" /></SelectTrigger>
              <SelectContent>
                {zonas.map((z) => (
                  <SelectItem key={z.zona} value={z.zona}>{z.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Formato (template)</Label>
            <Select
              value={slot.template}
              onValueChange={(t) => onChange({ template: t as TemplateId })}
              disabled={templatesDaZona.length <= 1}
            >
              <SelectTrigger><SelectValue placeholder="Formato" /></SelectTrigger>
              <SelectContent>
                {templatesDaZona.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Título</Label>
            <Input
              value={slot.titulo}
              maxLength={160}
              onChange={(e) => onChange({ titulo: e.target.value })}
              placeholder="Título do anúncio"
            />
          </div>

          <div>
            <Label className="text-xs">Subtítulo (opcional)</Label>
            <Input
              value={slot.subtitulo ?? ''}
              maxLength={200}
              onChange={(e) => onChange({ subtitulo: e.target.value || null })}
              placeholder="Complemento"
            />
          </div>

          {mostraTexto && (
            <div>
              <Label className="text-xs">Texto do conteúdo</Label>
              <Textarea
                value={(slot.conteudo?.texto as string) ?? ''}
                maxLength={600}
                onChange={(e) => onChange({ conteudo: { ...slot.conteudo, texto: e.target.value } })}
                placeholder="Texto editorial do anúncio"
                rows={3}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Texto do botão (CTA)</Label>
              <Input
                value={slot.ctaTexto ?? ''}
                maxLength={40}
                onChange={(e) => onChange({ ctaTexto: e.target.value || null })}
                placeholder="Saiba mais"
              />
            </div>
            <div>
              <Label className="text-xs">Link de destino</Label>
              <Input
                value={slot.ctaUrl ?? ''}
                onChange={(e) => onChange({ ctaUrl: e.target.value || null })}
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Imagem do criativo</Label>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                <RiUploadCloud2Line className="w-4 h-4" />
                {pending ? `Enviando ${progress}%` : 'Enviar imagem'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files?.[0])}
                  disabled={pending}
                />
              </label>
              {slot.criativoUrl && <span className="text-[11px] text-green-600">Imagem carregada ✓</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Início (opcional)</Label>
              <Input type="date" value={slot.periodoInicio ?? ''} onChange={(e) => onChange({ periodoInicio: e.target.value || null })} />
            </div>
            <div>
              <Label className="text-xs">Fim (opcional)</Label>
              <Input type="date" value={slot.periodoFim ?? ''} onChange={(e) => onChange({ periodoFim: e.target.value || null })} />
            </div>
          </div>
        </div>

        {/* Preview ao vivo (fonte única — AdCreativeCard real) */}
        <div className="space-y-2">
          <Label className="text-xs text-gray-500">Pré-visualização</Label>
          <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-950 min-h-[180px] flex items-center justify-center">
            <AdCreativeCard
              template={slot.template}
              titulo={slot.titulo || 'Título do anúncio'}
              subtitulo={slot.subtitulo ?? null}
              criativoUrl={slot.criativoUrl ?? null}
              ctaUrl={slot.ctaUrl ?? null}
              ctaTexto={slot.ctaTexto ?? null}
              conteudo={slot.conteudo ?? null}
              variant="preview"
            />
          </div>
          <p className="text-right text-sm font-semibold text-gray-700 dark:text-gray-200">
            {precoSlot > 0 ? `R$ ${precoSlot.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
            <span className="text-[10px] font-normal text-amber-600 ml-1">(simulação)</span>
          </p>
        </div>
      </div>
    </div>
  );
}
