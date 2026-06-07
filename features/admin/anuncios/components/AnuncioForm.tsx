'use client';

import { useMemo } from 'react';
import { Input } from '@shared/components/ui/input';
import { Textarea } from '@shared/components/ui/textarea';
import { Label } from '@shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { TEMPLATES } from '@features/shared/anuncios/templates';
import type { FieldDescriptor, TemplateId, BlocoDado } from '@features/shared/anuncios/templates/types';
import { AdCreativeCard } from '@features/shared/anuncios/components/AdCreativeCard';
import { CriativoUploadField } from './CriativoUploadField';
import { BlocosDadosField } from './BlocosDadosField';

/** Estado plano do formulário: colunas + chaves de conteudo, tudo num objeto. */
export interface AnuncioFormState {
  anuncianteId: string;
  template: TemplateId;
  titulo: string;
  subtitulo: string;
  criativoUrl: string | null;
  ctaTexto: string;
  ctaUrl: string;
  // chaves de conteudo (conteudo-texto / destaque-dados)
  texto: string;
  fonte: string;
  badge: string;
  atualizadoEm: string;
  blocos: BlocoDado[];
  inicio: string;
  fim: string;
}

export function emptyFormState(template: TemplateId = 'imagem-card'): AnuncioFormState {
  return {
    anuncianteId: '',
    template,
    titulo: '',
    subtitulo: '',
    criativoUrl: null,
    ctaTexto: '',
    ctaUrl: '',
    texto: '',
    fonte: '',
    badge: '',
    atualizadoEm: '',
    blocos: [],
    inicio: '',
    fim: '',
  };
}

/** Monta o `conteudo` (JSONB) a partir do estado, conforme o template. */
export function buildConteudo(s: AnuncioFormState): unknown | null {
  if (s.template === 'conteudo-texto') {
    return { texto: s.texto, ...(s.fonte ? { fonte: s.fonte } : {}), ...(s.badge ? { badge: s.badge } : {}) };
  }
  if (s.template === 'destaque-dados') {
    const blocos = s.blocos.filter((b) => b.rotulo.trim() && b.valor.trim());
    return { blocos, ...(s.fonte ? { fonte: s.fonte } : {}), ...(s.atualizadoEm ? { atualizadoEm: s.atualizadoEm } : {}) };
  }
  return null;
}

const aspectByTemplate: Record<TemplateId, string> = {
  'imagem-card': '4/3',
  'banner-imagem': '728/90',
  'conteudo-texto': '16/9',
  'destaque-dados': '4/3',
};

interface Props {
  state: AnuncioFormState;
  onChange: (next: AnuncioFormState) => void;
  templatesDisponiveis: TemplateId[];
  anunciantes: { id: string; nome: string }[];
}

/**
 * Formulário de anúncio dirigido por template (J24) + preview ao vivo. Os campos
 * exibidos vêm de `TEMPLATES[template].fields`; o preview usa o `AdCreativeCard`
 * real (mesmo componente que publica) — sem markup paralelo.
 */
export function AnuncioForm({ state, onChange, templatesDisponiveis, anunciantes }: Props) {
  const fields = TEMPLATES[state.template]?.fields ?? [];

  function set<K extends keyof AnuncioFormState>(key: K, value: AnuncioFormState[K]) {
    onChange({ ...state, [key]: value });
  }

  // Conteudo derivado para o preview, recalculado a cada mudança.
  const previewConteudo = useMemo(() => buildConteudo(state), [state]);
  const ctaSeguro = state.ctaUrl && /^https?:\/\//i.test(state.ctaUrl) ? state.ctaUrl : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(260px,360px)] gap-6">
      {/* Coluna do formulário */}
      <div className="flex flex-col gap-5 min-w-0">
        {/* Anunciante */}
        <div className="flex flex-col gap-2">
          <Label>Anunciante <span className="text-red-500">*</span></Label>
          <Select value={state.anuncianteId} onValueChange={(v) => set('anuncianteId', v)}>
            <SelectTrigger data-testid="select-anunciante">
              <SelectValue placeholder="Selecione um anunciante..." />
            </SelectTrigger>
            <SelectContent>
              {anunciantes.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Template */}
        <div className="flex flex-col gap-2">
          <Label>Formato (template) <span className="text-red-500">*</span></Label>
          <Select
            value={state.template}
            onValueChange={(v) => onChange({ ...state, template: v as TemplateId })}
          >
            <SelectTrigger data-testid="select-template">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {templatesDisponiveis.map((t) => (
                <SelectItem key={t} value={t}>{TEMPLATES[t]?.label ?? t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-400">{TEMPLATES[state.template]?.descricao}</p>
        </div>

        {/* Campos dinâmicos do template */}
        {fields.map((f) => (
          <DynamicField key={f.name} field={f} state={state} set={set} />
        ))}

        {/* Período */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label>Data de início</Label>
            <Input type="date" value={state.inicio} onChange={(e) => set('inicio', e.target.value)} data-testid="input-data-inicio" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Data de fim</Label>
            <Input type="date" value={state.fim} onChange={(e) => set('fim', e.target.value)} data-testid="input-data-fim" />
          </div>
        </div>
      </div>

      {/* Coluna do preview */}
      <div className="lg:sticky lg:top-0 self-start">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Preview ao vivo</p>
        <div className="rounded-xl bg-gray-100 dark:bg-gray-800/50 p-4">
          <AdCreativeCard
            template={state.template}
            titulo={state.titulo}
            subtitulo={state.subtitulo || null}
            criativoUrl={state.criativoUrl}
            ctaUrl={ctaSeguro}
            ctaTexto={state.ctaTexto || null}
            conteudo={previewConteudo}
            variant="preview"
          />
        </div>
        <p className="text-[11px] text-gray-400 mt-2">É assim que o anúncio aparecerá na zona escolhida.</p>
      </div>
    </div>
  );
}

function DynamicField({
  field,
  state,
  set,
}: {
  field: FieldDescriptor;
  state: AnuncioFormState;
  set: <K extends keyof AnuncioFormState>(key: K, value: AnuncioFormState[K]) => void;
}) {
  const name = field.name as keyof AnuncioFormState;
  const label = (
    <Label>
      {field.label} {field.required && <span className="text-red-500">*</span>}
    </Label>
  );

  if (field.kind === 'image-upload') {
    return (
      <div className="flex flex-col gap-2">
        {label}
        <CriativoUploadField
          value={state.criativoUrl}
          onChange={(url) => set('criativoUrl', url)}
          aspect={aspectByTemplate[state.template]}
          help={field.help}
        />
      </div>
    );
  }

  if (field.kind === 'data-blocks') {
    return (
      <div className="flex flex-col gap-2">
        {label}
        {field.help && <p className="text-xs text-gray-400 -mt-1">{field.help}</p>}
        <BlocosDadosField value={state.blocos} onChange={(b) => set('blocos', b)} />
      </div>
    );
  }

  if (field.kind === 'textarea') {
    return (
      <div className="flex flex-col gap-2">
        {label}
        <Textarea
          rows={4}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          value={(state[name] as string) ?? ''}
          onChange={(e) => set(name, e.target.value as AnuncioFormState[typeof name])}
          data-testid={`field-${field.name}`}
        />
        {field.maxLength && <p className="text-xs text-gray-400">Máximo {field.maxLength} caracteres</p>}
      </div>
    );
  }

  // text | url
  return (
    <div className="flex flex-col gap-2">
      {label}
      <Input
        type={field.kind === 'url' ? 'url' : 'text'}
        maxLength={field.maxLength}
        placeholder={field.placeholder}
        value={(state[name] as string) ?? ''}
        onChange={(e) => set(name, e.target.value as AnuncioFormState[typeof name])}
        data-testid={`field-${field.name}`}
      />
      {field.help && <p className="text-xs text-gray-400">{field.help}</p>}
    </div>
  );
}
