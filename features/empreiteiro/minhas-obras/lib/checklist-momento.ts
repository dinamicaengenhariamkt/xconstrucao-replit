/**
 * EMP-08 — `completadoEm`/`assinadoEm` passaram a ser gravados pelo servidor
 * como ISO (data e hora completas) na obra própria do xgestão. Registros
 * antigos guardam o texto do navegador ("21:14" ou "17/09/2026 21:14") e
 * continuam aparecendo como estavam.
 */
const ISO = /^\d{4}-\d{2}-\d{2}T/;

const FORMATO = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

/** "10/11/2026 14:30" para ISO; o texto legado é devolvido sem mudança. */
export function formatarMomentoChecklist(valor: string | null | undefined): string {
  if (!valor) return '';
  if (ISO.test(valor)) {
    const data = new Date(valor);
    if (!Number.isNaN(data.getTime())) return FORMATO.format(data).replace(',', '');
  }
  return valor.trim();
}

/** Só hora ("21:14", formato antigo) pede "às"; com data, "em". */
export function preposicaoMomento(valor: string | null | undefined): 'em' | 'às' {
  return formatarMomentoChecklist(valor).includes('/') ? 'em' : 'às';
}
