'use client';

import { useEffect, useState } from 'react';
import { MarkdownView } from './MarkdownView';
import { Skeleton } from '@shared/components/ui/skeleton';

interface LegalDoc {
  tipo: string;
  versao: number;
  titulo: string;
  conteudo: string;
  vigenteEm: string;
}

/**
 * J28 — Carrega e renderiza a versão vigente de um documento legal (do banco).
 * Substitui o JSX hardcoded. Conteúdo em Markdown renderizado de forma segura.
 */
export function LegalDocumentView({ tipo }: { tipo: 'termos' | 'privacidade' }) {
  const [doc, setDoc] = useState<LegalDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/legal/${tipo}`);
        if (res.ok) setDoc(await res.json());
        else setErro(true);
      } catch {
        setErro(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [tipo]);

  if (loading) {
    return (
      <div className="max-w-[900px] mx-auto space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (erro || !doc) {
    return (
      <p className="max-w-[900px] mx-auto text-center text-slate-500">
        Não foi possível carregar o documento. Tente novamente mais tarde.
      </p>
    );
  }

  return (
    <div>
      <p className="max-w-[900px] mx-auto text-sm text-slate-400 mb-6">
        Versão {doc.versao}
      </p>
      <MarkdownView content={doc.conteudo} />
    </div>
  );
}
