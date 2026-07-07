'use client';

import { useState } from 'react';
import {
  RiAlertLine,
  RiAddLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiArrowLeftLine,
} from 'react-icons/ri';
import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import { Badge } from '@shared/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { useToast } from '@shared/hooks/use-toast';
import { cn } from '@shared/lib/utils';
import {
  useObraDisputas,
  useDisputaDetalhe,
  useAbrirDisputa,
  useEnviarMensagemDisputa,
  type DisputaObraView,
} from '../hooks/use-obra-disputas';

/** Alvo selecionável ao abrir uma disputa (medição ou pagamento da obra). */
export interface DisputaAlvoOption {
  tipo: 'medicao' | 'pagamento';
  id: string;
  label: string;
}

const STATUS_LABEL: Record<DisputaObraView['status'], string> = {
  aberta: 'Aberta',
  em_analise: 'Em análise',
  aguardando_partes: 'Aguardando partes',
  resolvida: 'Resolvida',
  cancelada: 'Cancelada',
};

const STATUS_CLASS: Record<DisputaObraView['status'], string> = {
  aberta: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  em_analise: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  aguardando_partes: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  resolvida: 'bg-[#22846D]/10 text-[#22846D]',
  cancelada: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

const PRIORIDADE_LABEL: Record<DisputaObraView['prioridade'], string> = {
  alta: 'Alta', media: 'Média', baixa: 'Baixa',
};

const CATEGORIA_OPTIONS: { value: DisputaObraView['categoria']; label: string }[] = [
  { value: 'pagamento_atrasado', label: 'Pagamento atrasado' },
  { value: 'medicao_rejeitada', label: 'Medição rejeitada' },
  { value: 'qualidade_obra', label: 'Qualidade da obra' },
  { value: 'descumprimento_prazo', label: 'Descumprimento de prazo' },
  { value: 'escopo_contrato', label: 'Escopo do contrato' },
  { value: 'outros', label: 'Outros' },
];

function fmtData(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
}

interface Props {
  obraId: string;
  /** Alvos (medições/pagamentos) que o usuário pode contestar nesta obra. */
  alvos?: DisputaAlvoOption[];
}

export function TabDisputas({ obraId, alvos = [] }: Props) {
  const { toast } = useToast();
  const { data: disputas, isLoading } = useObraDisputas(obraId);
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [abrindo, setAbrindo] = useState(false);

  if (selecionada) {
    return <DisputaDetalhe disputaId={selecionada} onVoltar={() => setSelecionada(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Disputas</h3>
          <p className="text-sm text-muted-foreground">
            Contestações sobre medições e pagamentos desta obra. A administração media e decide.
          </p>
        </div>
        {alvos.length > 0 && (
          <Button onClick={() => setAbrindo((v) => !v)} data-testid="button-abrir-disputa">
            <RiAddLine className="w-4 h-4 mr-2" />
            Abrir disputa
          </Button>
        )}
      </div>

      {abrindo && alvos.length > 0 && (
        <AbrirDisputaForm
          obraId={obraId}
          alvos={alvos}
          onClose={() => setAbrindo(false)}
          onAberta={() => {
            setAbrindo(false);
            toast({ title: 'Disputa aberta', description: 'A administração foi notificada.' });
          }}
        />
      )}

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Carregando disputas...</div>
      ) : !disputas || disputas.length === 0 ? (
        <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
          <CardContent className="py-12 text-center">
            <RiCheckboxCircleLine className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma disputa nesta obra.</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {disputas.map((d) => (
            <li key={d.id}>
              <button
                onClick={() => setSelecionada(d.id)}
                className="w-full text-left rounded-xl border border-gray-100 dark:border-gray-800 p-4 hover:bg-accent/60 dark:hover:bg-accent/30 transition-colors"
                data-testid={`disputa-row-${d.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground">{d.codigo}</span>
                      <Badge className={cn('border-0 text-xs', STATUS_CLASS[d.status])}>
                        {STATUS_LABEL[d.status]}
                      </Badge>
                      {d.prioridade === 'alta' && d.status !== 'resolvida' && (
                        <Badge className="border-0 text-xs bg-red-50 text-red-600 dark:bg-red-900/20">
                          Prioridade {PRIORIDADE_LABEL[d.prioridade]}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-1 truncate">
                      {d.titulo}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{d.descricao}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <RiTimeLine className="w-3.5 h-3.5" />
                      {d.status === 'resolvida' ? 'Resolvida' : `${d.diasAberta}d aberta`}
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {d.abertaPorMim ? 'Aberta por você' : 'Aberta pela contraparte'}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AbrirDisputaForm({
  obraId,
  alvos,
  onClose,
  onAberta,
}: {
  obraId: string;
  alvos: DisputaAlvoOption[];
  onClose: () => void;
  onAberta: () => void;
}) {
  const { toast } = useToast();
  const abrir = useAbrirDisputa(obraId);
  const [alvoKey, setAlvoKey] = useState('');
  const [categoria, setCategoria] = useState<DisputaObraView['categoria']>('outros');
  const [prioridade, setPrioridade] = useState<DisputaObraView['prioridade']>('media');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');

  const alvo = alvos.find((a) => `${a.tipo}:${a.id}` === alvoKey);
  const podeEnviar = alvo && titulo.trim().length >= 3 && descricao.trim().length >= 10 && !abrir.isPending;

  const handleSubmit = async () => {
    if (!alvo) return;
    try {
      await abrir.mutateAsync({
        obraId,
        alvoTipo: alvo.tipo,
        alvoId: alvo.id,
        categoria,
        prioridade,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
      });
      onAberta();
    } catch (err) {
      const e = err as Error & { status?: number };
      toast({
        title: 'Erro',
        description: e.status === 409 ? 'Já existe uma disputa aberta sobre este item.' : e.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="rounded-xl border border-amber-200 dark:border-amber-900/40">
      <CardHeader className="p-6 pb-2">
        <div className="flex items-center gap-2">
          <RiAlertLine className="w-4 h-4 text-amber-500" />
          <p className="text-sm font-semibold">Abrir nova disputa</p>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-2 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-medium">Item contestado</Label>
          <Select value={alvoKey} onValueChange={setAlvoKey}>
            <SelectTrigger data-testid="select-alvo-disputa">
              <SelectValue placeholder="Selecione a medição ou pagamento" />
            </SelectTrigger>
            <SelectContent>
              {alvos.map((a) => (
                <SelectItem key={`${a.tipo}:${a.id}`} value={`${a.tipo}:${a.id}`}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">Categoria</Label>
            <Select value={categoria} onValueChange={(v) => setCategoria(v as DisputaObraView['categoria'])}>
              <SelectTrigger data-testid="select-categoria-disputa">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIA_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">Prioridade</Label>
            <Select value={prioridade} onValueChange={(v) => setPrioridade(v as DisputaObraView['prioridade'])}>
              <SelectTrigger data-testid="select-prioridade-disputa">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-medium">Título</Label>
          <Input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Resumo do problema"
            maxLength={160}
            data-testid="input-titulo-disputa"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-medium">Descrição</Label>
          <Textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreva o que aconteceu e o que você espera como resolução."
            rows={4}
            maxLength={2000}
            data-testid="textarea-descricao-disputa"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!podeEnviar} data-testid="button-confirmar-abrir-disputa">
            {abrir.isPending ? 'Abrindo...' : 'Abrir disputa'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DisputaDetalhe({ disputaId, onVoltar }: { disputaId: string; onVoltar: () => void }) {
  const { toast } = useToast();
  const { data, isLoading } = useDisputaDetalhe(disputaId);
  const enviar = useEnviarMensagemDisputa(disputaId);
  const [texto, setTexto] = useState('');

  const disputa = data?.disputa;
  const mensagens = data?.mensagens ?? [];
  const resolvida = disputa?.status === 'resolvida' || disputa?.status === 'cancelada';

  const handleEnviar = async () => {
    if (texto.trim().length < 1) return;
    try {
      await enviar.mutateAsync({ texto: texto.trim() });
      setTexto('');
    } catch (err) {
      toast({ title: 'Erro', description: (err as Error).message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onVoltar}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors"
        data-testid="button-voltar-disputas"
      >
        <RiArrowLeftLine className="w-4 h-4" />
        Voltar para disputas
      </button>

      {isLoading || !disputa ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Carregando disputa...</div>
      ) : (
        <>
          <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
            <CardContent className="p-6 flex flex-col gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-muted-foreground">
                  {disputa.codigo ?? `DSP-${disputa.id.slice(0, 6).toUpperCase()}`}
                </span>
                <Badge className={cn('border-0 text-xs', STATUS_CLASS[disputa.status])}>
                  {STATUS_LABEL[disputa.status]}
                </Badge>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{disputa.titulo}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{disputa.descricao}</p>
              {resolvida && disputa.resolucaoTexto && (
                <div className="rounded-lg bg-[#22846D]/5 border border-[#22846D]/20 p-4 mt-2">
                  <p className="text-xs font-semibold text-[#22846D] uppercase tracking-wide mb-1">
                    Decisão da administração
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{disputa.resolucaoTexto}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-gray-100 dark:border-gray-800">
            <CardHeader className="p-6 pb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Conversa</p>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2 flex flex-col gap-4">
              {mensagens.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhuma mensagem ainda. Use o campo abaixo para se manifestar.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {mensagens.map((m) => (
                    <li key={m.id} className="rounded-lg bg-accent/40 dark:bg-accent/20 p-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {m.autorNome ?? 'Usuário'}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{fmtData(m.criadaEm)}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{m.texto}</p>
                    </li>
                  ))}
                </ul>
              )}

              {resolvida ? (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Esta disputa foi encerrada. Não é possível adicionar mensagens.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  <Textarea
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    placeholder="Escreva sua mensagem para a administração e a contraparte..."
                    rows={3}
                    maxLength={2000}
                    data-testid="textarea-mensagem-disputa"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleEnviar}
                      disabled={enviar.isPending || texto.trim().length < 1}
                      data-testid="button-enviar-mensagem-disputa"
                    >
                      {enviar.isPending ? 'Enviando...' : 'Enviar mensagem'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
