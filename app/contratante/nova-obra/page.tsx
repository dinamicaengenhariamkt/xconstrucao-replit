'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RiAttachment2, RiCloseLine, RiSaveLine, RiSendPlaneLine } from 'react-icons/ri';
import { PageHeader } from '@features/shared/components/PageHeader';
import { useToast } from '@shared/hooks/use-toast';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Textarea } from '@shared/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@shared/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { useUpload } from '@features/shared/hooks/use-uploads';

const ESTADOS_BR = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA',
  'MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN',
  'RO','RR','RS','SC','SE','SP','TO',
];

const TIPOS_OBRA = [
  { value: 'residencial', label: 'Residencial' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'reforma', label: 'Reforma' },
  { value: 'infraestrutura', label: 'Infraestrutura' },
];

const MODALIDADES = [
  { value: 'administracao', label: 'Administração (mão de obra + materiais separados)' },
  { value: 'empreitada_global', label: 'Empreitada global (preço fechado total)' },
  { value: 'empreitada_etapa', label: 'Empreitada por etapa' },
];

const MATERIAIS_POR = [
  { value: 'contratante', label: 'Contratante' },
  { value: 'empreiteiro', label: 'Empreiteiro' },
  { value: 'misto', label: 'Misto' },
];

const TIPOS_ANEXO = [
  { value: 'projeto_arquitetonico', label: 'Projeto arquitetônico' },
  { value: 'projeto_estrutural', label: 'Projeto estrutural' },
  { value: 'art_rrt', label: 'ART/RRT' },
  { value: 'alvara', label: 'Alvará' },
  { value: 'foto_local', label: 'Foto do local' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'outros', label: 'Outros' },
] as const;

type TipoAnexo = (typeof TIPOS_ANEXO)[number]['value'];

// Cliente: forma "permissiva" para permitir salvar rascunho com poucos campos.
// O servidor reaplica insertObraSchemaStrict (com superRefine condicional).
const formSchema = z.object({
  nome: z.string().trim().min(3, 'Nome deve ter no mínimo 3 caracteres').max(160),
  tipo: z.string().optional(),
  descricao: z.string().optional(),
  cep: z.string().optional(),
  endereco: z.string().trim().min(3, 'Endereço obrigatório').max(240),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  modalidade: z.enum(['administracao', 'empreitada_global', 'empreitada_etapa']).optional().or(z.literal('')),
  materiaisPor: z.enum(['contratante', 'empreiteiro', 'misto']).optional().or(z.literal('')),
  areaM2: z.string().optional(),
  padraoAcabamento: z.string().optional(),
  acessibilidadeObs: z.string().optional(),
  dataInicio: z.string().optional(),
  dataPrevisao: z.string().optional(),
  valorTotal: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface StagedAnexo {
  id: string; // local uuid
  file: File;
  tipo: TipoAnexo;
  observacao: string;
  uploading: boolean;
  progress: number;
  error?: string;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function cleanPayload(values: FormValues, visibilidade: 'rascunho' | 'publicada') {
  const toNullable = (v?: string) => (v && v.trim() !== '' ? v : null);
  // Colunas numeric do PG chegam como string no Drizzle — mantemos string aqui.
  const toNumStr = (v?: string) =>
    v && v.trim() !== '' && !Number.isNaN(Number(v)) ? String(Number(v)) : null;
  return {
    nome: values.nome.trim(),
    endereco: values.endereco.trim(),
    tipo: toNullable(values.tipo),
    descricao: toNullable(values.descricao),
    cep: toNullable(values.cep),
    cidade: toNullable(values.cidade),
    uf: values.uf ? values.uf.toUpperCase() : null,
    modalidade: values.modalidade ? values.modalidade : null,
    materiaisPor: values.materiaisPor ? values.materiaisPor : null,
    areaM2: toNumStr(values.areaM2),
    padraoAcabamento: toNullable(values.padraoAcabamento),
    acessibilidadeObs: toNullable(values.acessibilidadeObs),
    dataInicio: toNullable(values.dataInicio),
    dataPrevisao: toNullable(values.dataPrevisao),
    valorTotal: toNumStr(values.valorTotal),
    visibilidade,
  };
}

export default function NovaObraPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { upload } = useUpload();
  const [submitting, setSubmitting] = useState<'rascunho' | 'publicada' | null>(null);
  const [staged, setStaged] = useState<StagedAnexo[]>([]);
  const [cepLoading, setCepLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      tipo: '',
      descricao: '',
      cep: '',
      endereco: '',
      cidade: '',
      uf: '',
      modalidade: '',
      materiaisPor: '',
      areaM2: '',
      padraoAcabamento: '',
      acessibilidadeObs: '',
      dataInicio: '',
      dataPrevisao: '',
      valorTotal: '',
    },
  });

  // ----- ViaCEP debounce 400ms -----
  const cep = form.watch('cep');
  useEffect(() => {
    if (!cep) return;
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    const ctrl = new AbortController();
    setCepLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal: ctrl.signal });
        const data = await r.json();
        if (data && !data.erro) {
          const cur = form.getValues();
          if (!cur.endereco || cur.endereco.length < 3) {
            const linha = [data.logradouro, data.bairro].filter(Boolean).join(', ');
            if (linha) form.setValue('endereco', linha, { shouldValidate: true });
          }
          if (!cur.cidade) form.setValue('cidade', data.localidade ?? '', { shouldValidate: true });
          if (!cur.uf) form.setValue('uf', (data.uf ?? '').toUpperCase(), { shouldValidate: true });
        }
      } catch {
        // silencioso — ViaCEP é opcional
      } finally {
        setCepLoading(false);
      }
    }, 400);
    return () => {
      ctrl.abort();
      clearTimeout(t);
      setCepLoading(false);
    };
  }, [cep, form]);

  // ----- Anexos handlers -----
  function onPickFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const next: StagedAnexo[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.size > 15_000_000) {
        toast({
          title: 'Arquivo grande demais',
          description: `${f.name} excede 15MB.`,
          variant: 'destructive',
        });
        continue;
      }
      next.push({
        id: uid(),
        file: f,
        tipo: 'outros',
        observacao: '',
        uploading: false,
        progress: 0,
      });
    }
    setStaged((s) => [...s, ...next]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function updateStaged(id: string, patch: Partial<StagedAnexo>) {
    setStaged((s) => s.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function removeStaged(id: string) {
    setStaged((s) => s.filter((it) => it.id !== id));
  }

  // ----- Submit -----
  async function submit(visibilidade: 'rascunho' | 'publicada') {
    const valid = await form.trigger();
    if (!valid) return;

    const values = form.getValues();
    setSubmitting(visibilidade);

    try {
      const payload = cleanPayload(values, visibilidade);
      const r = await fetch('/api/obras', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) {
        const fieldErrors = (data?.errors?.fieldErrors ?? {}) as Record<string, string[]>;
        const first = Object.entries(fieldErrors)[0];
        const msg = first
          ? `${first[0]}: ${first[1]?.[0] ?? 'inválido'}`
          : data?.message || 'Erro ao salvar obra';
        toast({ title: 'Não foi possível salvar', description: msg, variant: 'destructive' });
        setSubmitting(null);
        return;
      }

      const obraId = data.id as string;

      // Upload + bind anexos (sequencial pra não estourar o R2 com PUTs concorrentes).
      if (staged.length > 0) {
        for (const item of staged) {
          updateStaged(item.id, { uploading: true, progress: 0, error: undefined });
          try {
            const commit = await upload({
              file: item.file,
              kind: 'obra_anexo',
              onProgress: (p) => updateStaged(item.id, { progress: p }),
            });
            const bindRes = await fetch(`/api/obras/${obraId}/anexos`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileId: commit.id,
                tipo: item.tipo,
                observacao: item.observacao || null,
              }),
            });
            if (!bindRes.ok) {
              const j = await bindRes.json().catch(() => ({}));
              throw new Error(j?.message ?? 'Falha ao vincular anexo');
            }
            updateStaged(item.id, { uploading: false, progress: 100 });
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Falha no upload';
            updateStaged(item.id, { uploading: false, error: msg });
            toast({
              title: `Anexo "${item.file.name}" falhou`,
              description: msg,
              variant: 'destructive',
            });
          }
        }
      }

      toast({
        title: visibilidade === 'publicada' ? 'Obra publicada!' : 'Rascunho salvo',
        description:
          visibilidade === 'publicada'
            ? 'Empreiteiros já podem se candidatar.'
            : 'Você pode continuar editando depois.',
      });

      router.push('/contratante/minhas-obras');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro inesperado';
      toast({ title: 'Erro', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(null);
    }
  }

  const busy = submitting !== null;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Nova obra"
        subtitle="Cadastre uma obra. Salve como rascunho a qualquer momento ou publique para receber candidaturas."
      />

      <Form {...form}>
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            submit('publicada');
          }}
        >
          {/* 1. Identificação */}
          <Card data-testid="card-identificacao">
            <CardHeader>
              <CardTitle>Identificação</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nome da obra *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: Reforma cozinha apto 302" data-testid="input-nome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-tipo">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIPOS_OBRA.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Obrigatório para publicar.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="areaM2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área (m²)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" placeholder="120" data-testid="input-area" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="padraoAcabamento"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Padrão de acabamento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: padrão médio, porcelanato 60x60" data-testid="input-padrao" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 2. Endereço + ViaCEP */}
          <Card data-testid="card-endereco">
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-6">
              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>CEP {cepLoading && <span className="ml-2 text-xs text-muted-foreground">buscando…</span>}</FormLabel>
                    <FormControl>
                      <Input placeholder="00000-000" data-testid="input-cep" maxLength={9} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endereco"
                render={({ field }) => (
                  <FormItem className="md:col-span-6">
                    <FormLabel>Endereço *</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, número, complemento" data-testid="input-endereco" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cidade"
                render={({ field }) => (
                  <FormItem className="md:col-span-4">
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input data-testid="input-cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="uf"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>UF</FormLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-uf">
                          <SelectValue placeholder="UF" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ESTADOS_BR.map((uf) => (
                          <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="acessibilidadeObs"
                render={({ field }) => (
                  <FormItem className="md:col-span-6">
                    <FormLabel>Acessibilidade do local</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder="Elevador? Acesso para caminhão? Restrições de horário?"
                        data-testid="input-acessibilidade"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 3. Escopo */}
          <Card data-testid="card-escopo">
            <CardHeader>
              <CardTitle>Escopo</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="modalidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modalidade</FormLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-modalidade">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MODALIDADES.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Obrigatório para publicar.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="materiaisPor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Materiais por</FormLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-materiais">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MATERIAIS_POR.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Obrigatório para publicar.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={5}
                        placeholder="Descreva o escopo, requisitos, prazos, condições especiais (mín. 20 caracteres para publicar)."
                        data-testid="input-descricao"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 4. Datas + orçamento */}
          <Card data-testid="card-orcamento">
            <CardHeader>
              <CardTitle>Datas e orçamento</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="dataInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de início</FormLabel>
                    <FormControl>
                      <Input type="date" data-testid="input-data-inicio" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dataPrevisao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previsão de término</FormLabel>
                    <FormControl>
                      <Input type="date" data-testid="input-data-previsao" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="valorTotal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orçamento estimado (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="15000.00"
                        data-testid="input-valor"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 5. Anexos */}
          <Card data-testid="card-anexos">
            <CardHeader>
              <CardTitle>Anexos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                  className="hidden"
                  data-testid="input-file-anexo"
                  onChange={(e) => onPickFiles(e.target.files)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-add-anexo"
                >
                  <RiAttachment2 className="mr-2 h-4 w-4" />
                  Adicionar arquivos
                </Button>
                <p className="text-sm text-muted-foreground">
                  PDF ou imagens. Até 15MB cada. O envio acontece quando você salvar a obra.
                </p>
              </div>

              {staged.length === 0 ? (
                <p className="text-sm text-muted-foreground" data-testid="text-anexos-empty">
                  Nenhum arquivo selecionado.
                </p>
              ) : (
                <ul className="space-y-3">
                  {staged.map((item) => (
                    <li
                      key={item.id}
                      className="grid items-center gap-3 rounded-md border p-3 md:grid-cols-[1fr_220px_1fr_auto]"
                      data-testid={`row-anexo-${item.id}`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{item.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(item.file.size / 1024 / 1024).toFixed(2)} MB
                          {item.uploading && ` · enviando ${item.progress}%`}
                          {item.error && <span className="text-destructive"> · {item.error}</span>}
                        </p>
                      </div>
                      <Select
                        value={item.tipo}
                        onValueChange={(v) => updateStaged(item.id, { tipo: v as TipoAnexo })}
                      >
                        <SelectTrigger data-testid={`select-tipo-anexo-${item.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_ANEXO.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Observação (opcional)"
                        value={item.observacao}
                        onChange={(e) => updateStaged(item.id, { observacao: e.target.value })}
                        data-testid={`input-obs-anexo-${item.id}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStaged(item.id)}
                        disabled={item.uploading}
                        data-testid={`button-remove-anexo-${item.id}`}
                      >
                        <RiCloseLine className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* 6. Visibilidade + ações */}
          <Card data-testid="card-acoes">
            <CardHeader>
              <CardTitle>Salvar</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
              <p className="mr-auto text-sm text-muted-foreground">
                Rascunho exige apenas <strong>nome</strong> e <strong>endereço</strong>. Publicar exige todos os campos marcados como obrigatórios.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => submit('rascunho')}
                disabled={busy}
                data-testid="button-salvar-rascunho"
              >
                <RiSaveLine className="mr-2 h-4 w-4" />
                {submitting === 'rascunho' ? 'Salvando…' : 'Salvar rascunho'}
              </Button>
              <Button
                type="submit"
                disabled={busy}
                data-testid="button-publicar"
              >
                <RiSendPlaneLine className="mr-2 h-4 w-4" />
                {submitting === 'publicada' ? 'Publicando…' : 'Publicar obra'}
              </Button>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
