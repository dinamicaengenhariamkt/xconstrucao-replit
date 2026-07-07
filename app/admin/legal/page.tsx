'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@features/shared/components/PageHeader';
import { Button } from '@shared/components/ui/button';
import { Badge } from '@shared/components/ui/badge';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import { Skeleton } from '@shared/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { useToast } from '@shared/hooks/use-toast';
import { RiAddLine, RiFileTextLine } from 'react-icons/ri';
import { MarkdownView } from '@features/legal/components/MarkdownView';

interface Versao {
  id: string;
  tipo: 'termos' | 'privacidade';
  versao: number;
  titulo: string;
  conteudo: string;
  vigenteEm: string;
  ativo: boolean;
  criadoEm: string;
}

const TIPO_LABEL = { termos: 'Termos de Uso', privacidade: 'Política de Privacidade' } as const;

export default function AdminLegalPage() {
  const { toast } = useToast();
  const [versoes, setVersoes] = useState<Versao[]>([]);
  const [loading, setLoading] = useState(true);
  const [publicando, setPublicando] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [preview, setPreview] = useState<Versao | null>(null);

  const [form, setForm] = useState({ tipo: 'termos' as 'termos' | 'privacidade', titulo: 'Termos de Uso', conteudo: '' });
  const [reconsentModo, setReconsentModo] = useState<'avisar' | 'bloquear'>('avisar');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [rv, rc] = await Promise.all([
        fetch('/api/admin/legal', { credentials: 'include' }),
        fetch('/api/admin/configuracoes', { credentials: 'include' }),
      ]);
      if (rv.ok) setVersoes((await rv.json()).versoes ?? []);
      if (rc.ok) {
        const cfg = await rc.json();
        setReconsentModo(cfg?.legal?.reconsentModo === 'bloquear' ? 'bloquear' : 'avisar');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const salvarModo = async (modo: 'avisar' | 'bloquear') => {
    setReconsentModo(modo);
    try {
      await fetch('/api/admin/configuracoes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ chave: 'legal', valor: { reconsentModo: modo } }),
      });
      toast({ title: 'Modo de re-consentimento salvo' });
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    }
  };

  const publicar = async () => {
    if (form.conteudo.trim().length < 10) {
      toast({ title: 'Conteúdo muito curto', variant: 'destructive' });
      return;
    }
    setPublicando(true);
    try {
      const res = await fetch('/api/admin/legal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Falha ao publicar');
      }
      toast({ title: 'Nova versão publicada', description: 'A página pública passa a exibir esta versão.' });
      setModalOpen(false);
      setForm((f) => ({ ...f, conteudo: '' }));
      carregar();
    } catch (e) {
      toast({ title: 'Erro', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setPublicando(false);
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader title="Documentos Legais" subtitle="Versione Termos de Uso e Política de Privacidade" />
        <Button onClick={() => setModalOpen(true)}>
          <RiAddLine className="w-5 h-5 mr-2" /> Publicar nova versão
        </Button>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 p-4 text-sm text-amber-800 dark:text-amber-300">
        O <strong>conteúdo</strong> dos documentos é responsabilidade jurídica. Publique aqui a versão
        revisada pelo seu advogado — a página pública e o re-consentimento dos usuários são automáticos.
      </div>

      {/* Modo de re-consentimento (J28) */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Re-consentimento ao publicar nova versão</p>
          <p className="text-xs text-gray-500">
            <strong>Avisar</strong>: o usuário vê um aviso dispensável. <strong>Bloquear</strong>: exige aceite para continuar.
          </p>
        </div>
        <Select value={reconsentModo} onValueChange={(v) => salvarModo(v as 'avisar' | 'bloquear')}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="avisar">Avisar (recomendado)</SelectItem>
            <SelectItem value="bloquear">Bloquear até aceitar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : versoes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-8 text-center text-sm text-gray-500">
          <RiFileTextLine className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          Nenhuma versão publicada ainda.
        </div>
      ) : (
        <div className="grid gap-3">
          {versoes.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {TIPO_LABEL[v.tipo]} · v{v.versao}
                </p>
                <p className="text-xs text-gray-500">
                  Vigente em {new Date(v.vigenteEm).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {v.ativo && <Badge className="bg-green-100 text-green-700">Ativa</Badge>}
                <Button size="sm" variant="outline" onClick={() => setPreview(v)}>Ver</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal publicar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Publicar nova versão</DialogTitle>
            <DialogDescription>
              A nova versão vira a vigente imediatamente. Usuários que aceitaram a anterior receberão o re-consentimento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Documento</Label>
              <Select
                value={form.tipo}
                onValueChange={(t) =>
                  setForm((f) => ({
                    ...f,
                    tipo: t as 'termos' | 'privacidade',
                    titulo: TIPO_LABEL[t as 'termos' | 'privacidade'],
                  }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="termos">Termos de Uso</SelectItem>
                  <SelectItem value="privacidade">Política de Privacidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Título</Label>
              <Input value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Conteúdo (Markdown)</Label>
              <Textarea
                value={form.conteudo}
                onChange={(e) => setForm((f) => ({ ...f, conteudo: e.target.value }))}
                rows={12}
                placeholder={'## Seção\n\nTexto do documento...\n\n- item de lista\n- **negrito**'}
                className="font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={publicando}>Cancelar</Button>
            <Button onClick={publicar} disabled={publicando}>
              {publicando ? 'Publicando…' : 'Publicar versão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview de versão */}
      <Dialog open={preview !== null} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{preview ? `${TIPO_LABEL[preview.tipo]} · v${preview.versao}` : ''}</DialogTitle>
          </DialogHeader>
          {preview && <MarkdownView content={preview.conteudo} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
