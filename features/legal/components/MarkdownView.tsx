'use client';

import React from 'react';

/**
 * J28 — Renderizador Markdown mínimo e SEGURO (sem dangerouslySetInnerHTML, sem lib
 * externa). Cobre o subconjunto usado nos documentos legais: headings (#/##/###),
 * negrito (**), listas (- ) e parágrafos. Texto é tratado como dado, nunca como HTML.
 */

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // Quebra em segmentos **negrito** vs normal. Sem HTML cru.
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={`${keyPrefix}-b-${i}`}>{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={`${keyPrefix}-t-${i}`}>{part}</React.Fragment>;
  });
}

export function MarkdownView({ content }: { content: string }) {
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listBuffer.length === 0) return;
    const items = [...listBuffer];
    listBuffer = [];
    blocks.push(
      <ul key={`ul-${key++}`} className="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-300 mb-4">
        {items.map((it, i) => (
          <li key={i}>{renderInline(it, `li-${key}-${i}`)}</li>
        ))}
      </ul>,
    );
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith('### ')) {
      flushList();
      blocks.push(
        <h3 key={`h3-${key++}`} className="text-lg font-bold mt-6 mb-2 text-[#101819] dark:text-white">
          {renderInline(line.slice(4), `h3-${key}`)}
        </h3>,
      );
    } else if (line.startsWith('## ')) {
      flushList();
      blocks.push(
        <h2 key={`h2-${key++}`} className="text-2xl font-extrabold mt-10 mb-3 text-[#101819] dark:text-white">
          {renderInline(line.slice(3), `h2-${key}`)}
        </h2>,
      );
    } else if (line.startsWith('# ')) {
      flushList();
      blocks.push(
        <h1 key={`h1-${key++}`} className="text-3xl font-extrabold mb-4 text-[#101819] dark:text-white">
          {renderInline(line.slice(2), `h1-${key}`)}
        </h1>,
      );
    } else if (line.startsWith('- ')) {
      listBuffer.push(line.slice(2));
    } else if (line.trim() === '') {
      flushList();
    } else {
      flushList();
      blocks.push(
        <p key={`p-${key++}`} className="text-base leading-relaxed text-slate-600 dark:text-slate-300 mb-4">
          {renderInline(line, `p-${key}`)}
        </p>,
      );
    }
  }
  flushList();

  return <div className="max-w-[900px] mx-auto">{blocks}</div>;
}
