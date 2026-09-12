# Jornada — XG11: Uso offline e instalação no celular

> Status: planejada | Prioridade: baixa | Wave: pós-MVP
> Última atualização: 2026-09-02

## 1. Contexto & Objetivo

Obra tem sinal ruim. O empreiteiro registra medição, foto e diário **no canteiro**, que é
exatamente onde a rede falha — e hoje, sem rede, **nenhuma tela abre**.

Esta jornada existe para registrar o diagnóstico e o caminho. **Não está em execução:** a
prioridade atual é fechar link público, admin e pagamento para os testes com usuários reais.

## 2. Personas

- **Empreiteiro (xgestão)**: usa o celular no canteiro, com sinal intermitente.
- **Cliente final**: abre o link público, normalmente com rede boa. Fora do escopo.

## 3. Diagnóstico — o que existe hoje

**Nada.** Verificado em 2026-09-02:

| Item | Situação |
|---|---|
| `manifest.json` / `.webmanifest` | **não existe** — `public/` tem só `robots.txt`, `images/`, `og-images/` |
| Service worker | **não existe** — nenhum `sw.js`, nenhum `navigator.serviceWorker` |
| Dependência PWA | **nenhuma** — sem `next-pwa`, `serwist`, `workbox` |
| IndexedDB / persistência | **nenhuma** — sem `idb`, `dexie`, `localforage` |
| `metadata.manifest` em `app/layout.tsx` | ausente |

Não é o caso de "manifest sem service worker": não há nem manifest.

A arquitetura atual é o oposto de offline-first, e isso é deliberado: `setNoCacheHeaders` em
praticamente toda rota, `force-dynamic` e `revalidate = 0` nas páginas sensíveis, sessão com
refresh. O cache do TanStack Query é em memória e morre ao recarregar.

## 4. Telas envolvidas

Nenhuma ainda. Quando entrar, o alvo é o console da obra — etapas, medições, diário e fotos.

## 5. Componentes-chave

- `app/layout.tsx` — receberia `metadata.manifest`, `themeColor` e os ícones.
- `next.config.ts` — receberia o plugin de service worker.
- [use-obra-j06.ts](../../features/obras/medicoes/hooks/use-obra-j06.ts) — as mutations que
  precisariam de fila.

## 6. Schema (Drizzle)

**Nenhuma alteração no servidor.** A fila offline é estado do cliente. A fase 3 exige uma
chave de idempotência por mutação, para reenvio não duplicar medição — provavelmente um
identificador gerado no cliente, aceito pelas rotas de escrita.

## 7. Endpoints

Nenhum novo nas fases 1 e 2. A fase 3 exige que as rotas de escrita sejam **idempotentes**.

## 8. As três fases, em ordem de custo

**Fase 1 — instalável (barata, poucos dias).** Manifest, ícones e um service worker que
cacheia o app shell. O app instala na tela inicial e abre mais rápido. **Ainda exige rede
para os dados** — o ganho é de percepção e acesso, não de autonomia.

**Fase 2 — leitura offline (média).** Persistir o cache do TanStack Query em IndexedDB. O
empreiteiro abre a obra e vê o último estado conhecido, com aviso de que está desatualizado.
Precisa decidir o que fazer com signed URLs de foto, que expiram.

**Fase 3 — escrita offline (cara, e a que tem valor real).** Fila de mutações para medição,
diário e foto criados sem sinal, sincronizados ao voltar a rede. É aqui que mora a dor de
verdade — e o problema difícil: conflito, reenvio duplicado, foto grande em fila, e o que
mostrar quando a sincronização falha.

> **Não fazer a fase 3 pela metade.** Uma fila que perde registro é pior que não ter fila: o
> empreiteiro confia, o dado some, e a confiança na plataforma vai junto. Se entrar, entra
> com idempotência e feedback explícito de sincronização.

## 9. Checklist de implementação

- [ ] Fase 1 — manifest, ícones, `metadata.manifest`, service worker de app shell
- [ ] Fase 1 — verificar que o service worker **não** cacheia resposta autenticada
- [ ] Fase 2 — persistir o cache do TanStack em IndexedDB, com indicador de dado defasado
- [ ] Fase 2 — política para signed URL expirada nas fotos em cache
- [ ] Fase 3 — chave de idempotência nas rotas de escrita
- [ ] Fase 3 — fila de mutações com retry, e feedback de sincronização na UI

## 10. Critérios de aceite

1. Fase 1: o app instala na tela inicial e abre com a rede desligada, mostrando um estado
   vazio honesto em vez de erro de navegador.
2. Fase 2: obra visitada antes abre sem rede, com aviso visível de dado desatualizado.
3. Fase 3: medição criada sem sinal é enviada ao voltar a rede, **exatamente uma vez**.
4. Nenhuma resposta autenticada fica em cache acessível a outra sessão do mesmo aparelho.

## 11. Riscos / Pontos de atenção

- **Cache de dado autenticado é o risco principal.** Um service worker mal configurado serve
  a resposta de um usuário para o próximo login no mesmo aparelho. É o tipo de falha que só
  aparece em produção.
- **Autonomia parcial gera confiança indevida.** Se a leitura funciona offline mas a escrita
  falha em silêncio, o usuário assume que o registro foi salvo.
- **Custo de manutenção permanente.** Service worker desatualizado serve versão velha da
  aplicação; exige estratégia de atualização desde o primeiro dia.

## 12. Links cruzados

- Depende de: XG01 (shell), XG02 (o console da obra que se quer usar offline)
- Relacionada: J06 (medições, diário e fotos — as escritas que a fase 3 enfileiraria)

## 13. Gaps descobertos durante execução

> Doc viva. Registrar aqui o que apareceu no caminho e não estava no roteiro original. Uma linha por item, com data.

- **2026-09-02 — diagnóstico inicial:** nenhuma infraestrutura PWA existe. Jornada aberta como registro, sem execução.
