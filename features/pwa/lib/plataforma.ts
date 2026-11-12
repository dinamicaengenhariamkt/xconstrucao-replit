/**
 * PWA (11/11/2026) — de onde a pessoa está abrindo, para mostrar só o jeito
 * certo de instalar. Função pura: recebe o user agent e o número de toques,
 * para dar para testar sem navegador.
 *
 * - `android`: Chrome e afins. Com o evento do navegador, um botão instala direto.
 * - `ios`: iPhone e iPad. A Apple não deixa botão instalar; mostramos os 2 toques
 *   do Compartilhar. O iPad novo se diz "Macintosh", por isso o `toques`.
 * - `navegador-interno`: navegador dentro do Instagram, Facebook e afins. Ali
 *   não há como instalar; a pessoa precisa abrir no navegador do celular.
 * - `desktop`: computador. Mostramos o QR code para abrir no celular.
 */
export type PlataformaInstalacao = 'android' | 'ios' | 'navegador-interno' | 'desktop';

const NAVEGADOR_INTERNO = /FBAN|FBAV|FB_IAB|Instagram|LinkedInApp|TikTok|musical_ly|Snapchat|Line\/|; wv\)/i;

export function detectarPlataforma(userAgent: string, toques = 0): PlataformaInstalacao {
  const ua = userAgent || '';
  if (NAVEGADOR_INTERNO.test(ua)) return 'navegador-interno';
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && toques > 1)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

/** No iPhone, o Safari tem o Compartilhar embaixo; Chrome e outros, em cima. */
export function ehSafariIos(userAgent: string): boolean {
  return /iPhone|iPad|iPod|Macintosh/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent);
}

/** Página que o QR code abre no celular. */
export const PAGINA_INSTALAR = '/instalar';
