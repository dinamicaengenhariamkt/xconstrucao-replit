import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectarPlataforma, ehSafariIos } from '../../features/pwa/lib/plataforma';
import { SCRIPT_CAPTURA_INSTALACAO, AVISO_PWA } from '../../features/pwa/lib/captura-instalacao';
import manifest from '../../app/manifest';

/** PWA (11/11/2026) — qual instrução cada aparelho recebe e o manifesto do app. */
const UA = {
  androidChrome: 'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  androidSamsung: 'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36',
  iphoneSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  iphoneChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.90 Mobile/15E148 Safari/604.1',
  ipadNovo: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  instagram: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 340.0.0.22.109',
  facebookAndroid: 'Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/480.0.0.0;]',
  webviewAndroid: 'Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36',
  windowsChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  macSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
};

test('Android (Chrome e Samsung) recebe o caminho do Android', () => {
  assert.equal(detectarPlataforma(UA.androidChrome, 5), 'android');
  assert.equal(detectarPlataforma(UA.androidSamsung, 5), 'android');
});

test('iPhone e iPad (inclusive o iPad que se diz Macintosh) recebem os passos do Compartilhar', () => {
  assert.equal(detectarPlataforma(UA.iphoneSafari, 5), 'ios');
  assert.equal(detectarPlataforma(UA.iphoneChrome, 5), 'ios');
  assert.equal(detectarPlataforma(UA.ipadNovo, 5), 'ios');
});

test('Mac de verdade (sem toque) e Windows são computador: QR code', () => {
  assert.equal(detectarPlataforma(UA.macSafari, 0), 'desktop');
  assert.equal(detectarPlataforma(UA.windowsChrome, 0), 'desktop');
  assert.equal(detectarPlataforma('', 0), 'desktop');
});

test('navegador de dentro do Instagram, Facebook ou WebView pede para abrir no navegador', () => {
  assert.equal(detectarPlataforma(UA.instagram, 5), 'navegador-interno');
  assert.equal(detectarPlataforma(UA.facebookAndroid, 5), 'navegador-interno');
  assert.equal(detectarPlataforma(UA.webviewAndroid, 5), 'navegador-interno');
});

test('Safari no iPhone tem o Compartilhar embaixo; Chrome no iPhone, em cima', () => {
  assert.equal(ehSafariIos(UA.iphoneSafari), true);
  assert.equal(ehSafariIos(UA.iphoneChrome), false);
});

test('script de captura guarda o convite do Android e avisa o hook', () => {
  assert.match(SCRIPT_CAPTURA_INSTALACAO, /beforeinstallprompt/);
  assert.match(SCRIPT_CAPTURA_INSTALACAO, /preventDefault\(\)/);
  assert.match(SCRIPT_CAPTURA_INSTALACAO, /appinstalled/);
  assert.ok(SCRIPT_CAPTURA_INSTALACAO.includes(`'${AVISO_PWA}'`));
  // É JavaScript válido (vai cru no <body>).
  assert.doesNotThrow(() => new Function(SCRIPT_CAPTURA_INSTALACAO));
});

test('manifesto abre o painel do xgestão, em tela cheia, com ícones normal e maskable', () => {
  const m = manifest();
  assert.equal(m.start_url, '/xgestao/dashboard');
  assert.equal(m.scope, '/');
  assert.equal(m.display, 'standalone');
  assert.equal(m.short_name, 'xgestão');
  const tamanhos = (m.icons ?? []).map((i) => `${i.sizes}:${i.purpose}`);
  assert.deepEqual(tamanhos, ['192x192:any', '512x512:any', '512x512:maskable']);
});
