'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  RiArrowLeftLine,
  RiBuilding2Line,
  RiCalendarLine,
  RiCheckLine,
  RiImageLine,
  RiMapPinLine,
  RiShareLine,
} from 'react-icons/ri';
import { CompartilharModal } from '@features/empreiteiro/minhas-obras/components/CompartilharModal';
import { IconHelpOutline } from '@shared/components/icons';
import { GuidedTour, type TourStep } from './GuidedTour';
import { useGuidedTour } from '../hooks/use-guided-tour';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { FileUploader } from '@features/shared/components/FileUploader';
import { useToast } from '@shared/hooks/use-toast';
import { cn } from '@shared/lib/utils';

type ObraStatus = 'planejamento' | 'em_andamento' | 'pausada' | 'concluida';

type ObraEditavel = {
  id: string;
  nome: string;
  endereco: string;
  tipo: string | null;
  descricao: string | null;
  cep: string | null;
  numero: string | null;
  complemento: string | null;
  cidade: string | null;
  uf: string | null;
  areaM2: string | null;
  valorTotal: string | null;
  progresso: number | null;
  status: ObraStatus;
  dataInicio: string | null;
  dataPrevisao: string | null;
  fotoCapaFileId: string | null;
  fotoCapaUrl: string | null;
};

type FotoDaObra = {
  id: string;
  fileId: string;
  url: string;
  tag: string | null;
};

type FormState = {
  nome: string;
  tipo: string;
  descricao: string;
  areaM2: string;
  valorTotal: string;
  endereco: string;
  numero: string;
  complemento: string;
  cep: string;
  cidade: string;
  uf: string;
  dataInicio: string;
  dataPrevisao: string;
  status: ObraStatus;
};

const EMPTY_FORM: FormState = {
  nome: '',
  tipo: '',
  descricao: '',
  areaM2: '',
  valorTotal: '',
  endereco: '',
  numero: '',
  complemento: '',
  cep: '',
  cidade: '',
  uf: '',
  dataInicio: '',
  dataPrevisao: '',
  status: 'planejamento',
};

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof body?.message === 'string' ? body.message : 'Não foi possível carregar a obra.');
  }
  return body as T;
}

async function patchObra(obraId: string, payload: Record<string, unknown>): Promise<ObraEditavel> {
  const response = await fetch(`/api/obras/${obraId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const firstFieldError = body?.errors?.fieldErrors
      ? Object.values(body.errors.fieldErrors).flat().find((value) => typeof value === 'string')
      : null;
    throw new Error(
      typeof firstFieldError === 'string'
        ? firstFieldError
        : typeof body?.message === 'string'
          ? body.message
          : 'Não foi possível salvar as alterações.',
    );
  }
  return body as ObraEditavel;
}

function formFromObra(obra: ObraEditavel): FormState {
  return {
    nome: obra.nome ?? '',
    tipo: obra.tipo ?? '',
    descricao: obra.descricao ?? '',
    areaM2: obra.areaM2 ?? '',
    valorTotal: obra.valorTotal ?? '',
    endereco: obra.endereco ?? '',
    numero: obra.numero ?? '',
    complemento: obra.complemento ?? '',
    cep: obra.cep ?? '',
    cidade: obra.cidade ?? '',
    uf: obra.uf ?? '',
    dataInicio: obra.dataInicio ?? '',
    dataPrevisao: obra.dataPrevisao ?? '',
    status: obra.status ?? 'planejamento',
  };
}

function Section({
  id,
  title,
  description,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-7"
    >
      <div className="mb-6 flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><Icon className="size-5" /></div>
        <div>
          <h2 className="font-bold text-gray-950 dark:text-white">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-gray-700 dark:text-gray-200">
        {label}{optional && <span className="ml-1 font-normal text-gray-400">(opcional)</span>}
      </label>
      {children}
    </div>
  );
}

/**
 * Roteiro da edição: cada passo diz o que a seção controla e, quando é o caso,
 * o que ela faz aparecer no link público — a dúvida mais comum de quem edita.
 */
const TOUR_EDICAO: TourStep[] = [
  {
    target: '#informacoes',
    title: 'Informações gerais',
    description:
      'Nome, tipo, descrição, área e orçamento. Descrição, tipo e área aparecem para o cliente no link público; o orçamento nunca é compartilhado.',
  },
  {
    target: '#localizacao',
    title: 'Localização',
    description:
      'Endereço completo para uso interno. No link público o cliente vê apenas cidade e UF — o endereço exato fica protegido.',
  },
  {
    target: '#planejamento',
    title: 'Prazos e status',
    description:
      'Datas e situação da obra. O progresso não fica aqui: ele vem das atualizações que você registra na obra, com data e fotos.',
  },
  {
    target: '#capa',
    title: 'Imagem de capa',
    description:
      'A foto que abre a obra, também no link público. Você pode enviar uma nova ou reaproveitar uma foto já registrada.',
  },
  {
    target: '#link-publico',
    title: 'Link público',
    description:
      'Gere o link para o cliente acompanhar sem criar conta. Dá para revogar quando quiser — quem tiver o link perde o acesso na hora.',
  },
];

export function EditarObraPage({ obraId }: { obraId: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [initialized, setInitialized] = useState(false);
  const [showShare, setShowShare] = useState(false);
  // Só habilita depois que o formulário renderizou: antes disso os alvos das
  // seções ainda não existem no DOM e o spotlight não teria o que destacar.
  const tour = useGuidedTour('edicao', initialized);
  const [cover, setCover] = useState<{ fileId: string | null; url: string | null }>({
    fileId: null,
    url: null,
  });

  const obraQuery = useQuery({
    queryKey: ['xgestao', 'obra-editavel', obraId],
    queryFn: () => getJson<ObraEditavel>(`/api/obras/${obraId}`),
  });
  const fotosQuery = useQuery({
    queryKey: ['obras', obraId, 'fotos'],
    queryFn: () => getJson<{ rows: FotoDaObra[] }>(`/api/obras/${obraId}/fotos`).then((data) => data.rows),
  });

  useEffect(() => {
    if (!obraQuery.data || initialized) return;
    setForm(formFromObra(obraQuery.data));
    setCover({
      fileId: obraQuery.data.fotoCapaFileId,
      url: obraQuery.data.fotoCapaUrl,
    });
    setInitialized(true);
  }, [initialized, obraQuery.data]);

  const completion = useMemo(() => {
    const sections = [
      Boolean(form.nome.trim() && form.tipo.trim()),
      Boolean(form.endereco.trim() && form.cidade.trim() && form.uf.trim()),
      Boolean(form.dataInicio && form.dataPrevisao),
      Boolean(cover.fileId),
    ];
    return { sections, total: sections.filter(Boolean).length };
  }, [cover.fileId, form]);

  const update = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const invalidateObra = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['xgestao', 'obra-editavel', obraId] }),
      queryClient.invalidateQueries({ queryKey: ['empreiteiro', 'minhas-obras'] }),
      queryClient.invalidateQueries({ queryKey: ['empreiteiro', 'minhas-obras', obraId] }),
    ]);
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      if (form.nome.trim().length < 3) throw new Error('Informe um nome com pelo menos 3 caracteres.');
      if (form.endereco.trim().length < 3) throw new Error('Informe o endereço da obra.');
      if (form.dataInicio && form.dataPrevisao && form.dataPrevisao < form.dataInicio) {
        throw new Error('A previsão de término não pode ser anterior ao início.');
      }
      if (form.cep.trim() && !/^\d{5}-?\d{3}$/.test(form.cep.trim())) {
        throw new Error('CEP inválido. Use o formato 00000-000.');
      }
      if (form.uf.trim() && !/^[A-Za-z]{2}$/.test(form.uf.trim())) {
        throw new Error('UF inválida. Use a sigla de 2 letras, como SP.');
      }
      if (form.areaM2.trim() && !Number.isFinite(Number(form.areaM2.trim()))) {
        throw new Error('Informe a área como número, por exemplo 120.5.');
      }
      if (form.valorTotal.trim() && !Number.isFinite(Number(form.valorTotal.trim()))) {
        throw new Error('Informe o orçamento como número.');
      }
      return patchObra(obraId, {
        nome: form.nome.trim(),
        tipo: form.tipo.trim() || null,
        descricao: form.descricao.trim() || null,
        areaM2: form.areaM2.trim() || null,
        valorTotal: form.valorTotal.trim() || '0',
        endereco: form.endereco.trim(),
        numero: form.numero.trim() || null,
        complemento: form.complemento.trim() || null,
        cep: form.cep.trim() || null,
        cidade: form.cidade.trim() || null,
        uf: form.uf.trim().toUpperCase() || null,
        dataInicio: form.dataInicio || null,
        dataPrevisao: form.dataPrevisao || null,
        status: form.status,
        // `progresso` não é enviado: a fonte de verdade são as atualizações.
      });
    },
    onSuccess: async () => {
      await invalidateObra();
      toast({ title: 'Obra atualizada', description: 'As informações foram salvas com sucesso.' });
    },
    onError: (error) => {
      toast({
        title: 'Não foi possível salvar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const coverMutation = useMutation({
    mutationFn: async ({ fileId, url }: { fileId: string | null; url: string | null }) => {
      await patchObra(obraId, { fotoCapaFileId: fileId });
      return { fileId, url };
    },
    onSuccess: async (nextCover) => {
      setCover(nextCover);
      await invalidateObra();
      toast({ title: nextCover.fileId ? 'Capa atualizada' : 'Capa removida' });
    },
    onError: (error) => {
      toast({
        title: 'Não foi possível atualizar a capa',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  if (obraQuery.isLoading || !initialized) {
    return <div className="p-6 md:p-10"><div className="h-96 animate-pulse rounded-3xl bg-gray-100 dark:bg-gray-900" /></div>;
  }

  if (obraQuery.isError) {
    return (
      <div className="p-6 text-center md:p-10">
        <p className="font-semibold">Não foi possível carregar esta obra.</p>
        <Button className="mt-4" variant="outline" onClick={() => obraQuery.refetch()}>Tentar novamente</Button>
      </div>
    );
  }

  const sections = [
    { id: 'informacoes', label: 'Informações gerais' },
    { id: 'localizacao', label: 'Localização' },
    { id: 'planejamento', label: 'Prazos e status' },
    { id: 'capa', label: 'Imagem de capa' },
    { id: 'link-publico', label: 'Link público' },
  ];

  return (
    <div className="mx-auto max-w-7xl p-4 pb-28 sm:p-6 md:p-10" data-testid="xgestao-editar-obra-page">
      <Link
        href={`/xgestao/obras/${obraId}`}
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-primary"
      >
        <RiArrowLeftLine /> Voltar para a obra
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">xgestão</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-950 dark:text-white sm:text-3xl">
            Complete os dados da obra
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500 sm:text-base">
            Atualize aos poucos. As informações básicas, o planejamento e a capa aparecem no acompanhamento da obra.
          </p>
        </div>
        <button
          type="button"
          onClick={tour.abrir}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-primary/40 hover:text-primary dark:border-gray-700 dark:text-gray-300"
          data-testid="xgestao-edicao-ajuda"
        >
          <IconHelpOutline className="text-base" />
          Ajuda
        </button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:sticky lg:top-6">
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">Progresso do cadastro</span>
              <span className="font-bold text-primary">
                {completion.total}/{completion.sections.length}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(completion.total / completion.sections.length) * 100}%` }}
              />
            </div>
          </div>
          <nav className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            {sections.map((section, index) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-600 hover:bg-primary/5 hover:text-primary dark:text-gray-300"
              >
                <span className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold',
                  completion.sections[index] ? 'border-primary bg-primary text-white' : 'border-gray-200',
                )}>
                  {completion.sections[index] ? <RiCheckLine /> : index + 1}
                </span>
                {section.label}
              </a>
            ))}
          </nav>
        </aside>

        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!saveMutation.isPending) saveMutation.mutate();
          }}
        >
          <Section id="informacoes" title="Informações gerais" description="Identifique e descreva a obra." icon={RiBuilding2Line}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nome da obra" htmlFor="obra-nome">
                <Input id="obra-nome" value={form.nome} onChange={(e) => update('nome', e.target.value)} minLength={3} maxLength={160} required data-testid="xgestao-edit-nome" />
              </Field>
              <Field label="Tipo de obra" htmlFor="obra-tipo" optional>
                <Input id="obra-tipo" value={form.tipo} onChange={(e) => update('tipo', e.target.value)} maxLength={80} placeholder="Ex.: Reforma comercial" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Descrição" htmlFor="obra-descricao" optional>
                  <textarea id="obra-descricao" value={form.descricao} onChange={(e) => update('descricao', e.target.value)} maxLength={4000} rows={5} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder="Escopo, objetivos e observações importantes." />
                </Field>
              </div>
              <Field label="Área (m²)" htmlFor="obra-area" optional>
                <Input id="obra-area" type="number" min="0" step="0.01" value={form.areaM2} onChange={(e) => update('areaM2', e.target.value)} />
              </Field>
              <Field label="Orçamento previsto (R$)" htmlFor="obra-valor" optional>
                <Input id="obra-valor" type="number" min="0" step="0.01" value={form.valorTotal} onChange={(e) => update('valorTotal', e.target.value)} />
              </Field>
            </div>
          </Section>

          <Section id="localizacao" title="Localização" description="Detalhe o endereço para facilitar o acompanhamento." icon={RiMapPinLine}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Logradouro" htmlFor="obra-endereco">
                  <Input id="obra-endereco" value={form.endereco} onChange={(e) => update('endereco', e.target.value)} minLength={3} maxLength={240} required data-testid="xgestao-edit-endereco" />
                </Field>
              </div>
              <Field label="Número" htmlFor="obra-numero" optional>
                <Input id="obra-numero" value={form.numero} onChange={(e) => update('numero', e.target.value)} maxLength={20} />
              </Field>
              <Field label="Complemento" htmlFor="obra-complemento" optional>
                <Input id="obra-complemento" value={form.complemento} onChange={(e) => update('complemento', e.target.value)} maxLength={120} />
              </Field>
              <Field label="CEP" htmlFor="obra-cep" optional>
                <Input id="obra-cep" value={form.cep} onChange={(e) => update('cep', e.target.value)} maxLength={9} placeholder="00000-000" />
              </Field>
              <Field label="Cidade" htmlFor="obra-cidade" optional>
                <Input id="obra-cidade" value={form.cidade} onChange={(e) => update('cidade', e.target.value)} maxLength={120} />
              </Field>
              <Field label="UF" htmlFor="obra-uf" optional>
                <Input id="obra-uf" value={form.uf} onChange={(e) => update('uf', e.target.value.toUpperCase().slice(0, 2))} maxLength={2} placeholder="SP" />
              </Field>
            </div>
          </Section>

          <Section id="planejamento" title="Prazos e status" description="Mantenha o momento da obra e a previsão atualizados." icon={RiCalendarLine}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Data de início" htmlFor="obra-inicio" optional>
                <Input id="obra-inicio" type="date" value={form.dataInicio} onChange={(e) => update('dataInicio', e.target.value)} />
              </Field>
              <Field label="Previsão de término" htmlFor="obra-previsao" optional>
                <Input id="obra-previsao" type="date" value={form.dataPrevisao} onChange={(e) => update('dataPrevisao', e.target.value)} />
              </Field>
              <Field label="Status" htmlFor="obra-status">
                <select id="obra-status" value={form.status} onChange={(e) => update('status', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="planejamento">Planejamento</option>
                  <option value="em_andamento">Em andamento</option>
                  <option value="pausada">Pausada</option>
                  <option value="concluida">Concluída</option>
                </select>
              </Field>
            </div>

            {/* O avanço é medido, não digitado: cada atualização registra o
                percentual com autor, data e fotos. Um campo editável aqui
                competiria com esse histórico e sobrescreveria o acumulado. */}
            <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Progresso da obra: {obraQuery.data?.progresso ?? 0}%
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    O avanço vem das atualizações registradas na obra, com data, responsável e fotos.
                  </p>
                </div>
                <Link
                  href={`/xgestao/obras/${obraId}`}
                  className="rounded-lg border border-primary/30 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
                  data-testid="xgestao-ir-para-atualizacoes"
                >
                  Registrar atualização
                </Link>
              </div>
            </div>
          </Section>

          <Section id="capa" title="Imagem de capa" description="Envie uma nova imagem ou escolha uma foto já vinculada a esta obra." icon={RiImageLine}>
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-100 dark:border-gray-800 dark:bg-gray-950">
              <div className="aspect-[16/7]">
                {cover.url ? (
                  <img src={cover.url} alt="Capa atual da obra" className="size-full object-cover" data-testid="xgestao-cover-preview" />
                ) : (
                  <div className="flex size-full flex-col items-center justify-center gap-2 text-gray-400">
                    <RiImageLine className="size-8" />
                    <span className="text-sm">Nenhuma capa definida</span>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <FileUploader
                kind="obra_capa"
                accept="image/jpeg,image/png,image/webp"
                label="Enviar nova capa"
                helper="PNG, JPG ou WebP, até 8 MB. Prefira imagens horizontais."
                testId="xgestao-upload-capa"
                disabled={coverMutation.isPending}
                onUploaded={async (file) => {
                  await coverMutation.mutateAsync({
                    fileId: file.id,
                    url: file.publicUrl ?? file.signedUrl,
                  });
                }}
              />
              {cover.fileId && (
                <Button type="button" variant="outline" disabled={coverMutation.isPending} onClick={() => coverMutation.mutate({ fileId: null, url: null })}>
                  Remover capa
                </Button>
              )}
            </div>

            {fotosQuery.data && fotosQuery.data.length > 0 && (
              <div className="mt-7">
                <p className="mb-3 text-sm font-semibold">Fotos desta obra</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {fotosQuery.data.map((foto) => {
                    const selected = cover.fileId === foto.fileId;
                    return (
                      <button
                        key={foto.id}
                        type="button"
                        disabled={coverMutation.isPending || !foto.url}
                        onClick={() => coverMutation.mutate({ fileId: foto.fileId, url: foto.url })}
                        className={cn(
                          'group relative aspect-[4/3] overflow-hidden rounded-xl border-2 bg-gray-100 transition-all',
                          selected ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-primary/50',
                        )}
                        data-testid={`xgestao-cover-option-${foto.id}`}
                      >
                        <img src={foto.url} alt={foto.tag || 'Foto da obra'} className="size-full object-cover" />
                        <span className="absolute inset-x-2 bottom-2 rounded-lg bg-black/65 px-2 py-1 text-xs font-semibold text-white">
                          {selected ? 'Capa atual' : 'Usar como capa'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </Section>

          <Section
            id="link-publico"
            title="Link público"
            description="Gere um link para o cliente acompanhar a obra sem precisar criar conta."
            icon={RiShareLine}
          >
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Quem abrir o link vê progresso, etapas, atualizações, fotos, diário e ocorrências —
                somente leitura.
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Valores, equipe e endereço exato nunca são compartilhados. As fotos aparecem apenas
                quando marcadas para envio ao cliente.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => setShowShare(true)}
                data-testid="xgestao-editar-compartilhar"
              >
                Gerenciar link público
              </Button>
            </div>
          </Section>

          <div className="sticky bottom-3 z-10 flex flex-col-reverse gap-3 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-gray-700 dark:bg-gray-900/95 sm:flex-row sm:items-center sm:justify-end">
            <Button asChild type="button" variant="outline"><Link href={`/xgestao/obras/${obraId}`}>Cancelar</Link></Button>
            <Button type="submit" disabled={saveMutation.isPending} data-testid="xgestao-salvar-obra">
              {saveMutation.isPending ? 'Salvando…' : 'Salvar alterações'}
            </Button>
          </div>
        </form>
      </div>

      <CompartilharModal
        open={showShare}
        onOpenChange={setShowShare}
        obra={{ id: obraId, titulo: obraQuery.data?.nome ?? 'Obra' }}
      />

      <GuidedTour steps={TOUR_EDICAO} open={tour.open} onClose={tour.fechar} />
    </div>
  );
}