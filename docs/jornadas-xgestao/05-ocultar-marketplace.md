# Jornada — XG05: Ocultar o marketplace

> Status: planejada | Prioridade: alta | Wave: xgestão-5
> Última atualização: 2026-08-09

## 1. Contexto & Objetivo

Durante o lançamento do xgestão, o marketplace sai de cena — **por configuração, nunca por remoção**. A ordem do cliente foi literal: *"ocultar, não apagar"*. Todo o fluxo de contratante e empreiteiro-marketplace continua íntegro, testável e reversível a qualquer momento.

> **Decisão do cliente (2026-08-09):** os cadastros de marketplace hoje são **só testes** (dele e do próprio cliente) — não há usuário real. Então dá para ocultar de forma mais ampla sem risco. A exigência firme permanece: **não quebrar o que já funciona**. Depois do MVP do xgestão, um ambiente separado de homologação para retomar o marketplace.

A reversibilidade é o entregável desta jornada — vale demonstrar ao vivo para o cliente.

## 2. Personas

- **Visitante**: vê só o xgestão na home; marketplace aparece como "em breve".
- **Empreiteiro**: não vê mais os itens de menu do marketplace enquanto o toggle estiver desligado.
- **Superadmin**: liga e desliga o toggle.

## 3. Fluxo ponta-a-ponta

```mermaid
flowchart LR
  A[Admin desliga marketplaceVisivel] --> B[(platform_settings)]
  B --> C[Home: só xgestão]
  B --> D[Menu: itens de marketplace somem]
  B -.rotas seguem vivas.-> E[APIs continuam respondendo]
```

## 4. Telas envolvidas

- [app/page.tsx](../../app/page.tsx) — CTAs "Sou Empreiteiro" / "Sou Contratante" passam a depender do toggle.
- [app/acesso-plataforma/page.tsx](../../app/acesso-plataforma/page.tsx) — mesmo gate nos dois cards.
- [app/xgestao-inteligente/page.tsx](../../app/xgestao-inteligente/page.tsx) — **já existe e está órfã**.
- [app/sitemap.ts](../../app/sitemap.ts) — remover URLs do marketplace enquanto oculto.
- Login próprio do xgestão, com marca.

## 5. Componentes-chave

- [features/admin/platform-settings/server/settings-reader.ts](../../features/admin/platform-settings/server/settings-reader.ts) — toggle `marketplaceVisivel` (criado em XG01). Cache de 30s, fail-open.
- [features/empreiteiro/constants.ts](../../features/empreiteiro/constants.ts) e [EmpreiteiroSidebar.tsx](../../features/empreiteiro/components/EmpreiteiroSidebar.tsx) — nav condicional.
- [features/landing/components/GlassNav.tsx](../../features/landing/components/GlassNav.tsx) — navegação pública.

## 6. Schema (Drizzle)

Nenhuma alteração. `platformSettings` é JSONB key/value e o toggle já foi criado em XG01.

## 7. Endpoints

Nenhum novo. **As rotas e APIs do marketplace continuam vivas e respondendo** — é justamente o que o spec de integração prova.

## 8. Achado: uma landing pronta e desligada

[app/xgestao-inteligente/page.tsx](../../app/xgestao-inteligente/page.tsx) já existe, está escrita, tem a copy certa ("Teste Grátis por 3 meses") e é estática — mas **nada aponta para ela**: o card do xgestão na home leva a `/acesso-plataforma`. São duas linhas para destravar uma página já pronta.

## 9. Checklist de implementação

- [ ] Gatear os CTAs de marketplace na home pelo `marketplaceVisivel`, com estado "em breve"
- [ ] Apontar os CTAs do xgestão para `/xgestao-inteligente` (ou direto ao login do xgestão)
- [ ] Mesmo gate em `/acesso-plataforma`
- [ ] Ocultar do menu do empreiteiro: Novas Obras Disponíveis, Obras Salvas, Minhas Candidaturas, Meus Recebimentos, Meu Saldo
- [ ] Remover URLs de marketplace do sitemap enquanto oculto
- [ ] Login próprio do xgestão, com marca
- [ ] Spec `tests/e2e/integration/xgestao-marketplace-oculto.integration.spec.ts`

> ⚠️ **Nenhuma rota apagada, nenhum componente comentado, nada removido de [features/marketplace/](../../features/marketplace/).** Ocultação é sempre condicional de renderização lida do toggle.

## 10. Critérios de aceite

1. Com `marketplaceVisivel = false`: a home mostra só a entrada do xgestão; o marketplace aparece como "em breve".
2. O menu do empreiteiro perde os itens de marketplace.
3. **As APIs do marketplace continuam respondendo normalmente** — a prova de que foi ocultado, não removido.
4. Voltar o toggle para `true` restaura tudo em ≤30s (TTL do cache), sem deploy.
5. `git diff` não mostra remoção de rota nem de componente do marketplace.
6. O fluxo completo do marketplace (contratante → candidatura → obra) segue funcionando com o toggle ligado.

## 11. Riscos / Pontos de atenção

- O reader é **fail-open**: erro de banco nunca deve esconder o site inteiro nem ligar manutenção. Preservar essa propriedade.
- Ocultar entradas deixando rotas vivas significa que um bookmark antigo ainda funciona. Como não há usuário real, é aceitável e até desejável — mas está registrado aqui para não virar surpresa.

## 12. Links cruzados

- Depende de: XG01 (toggles)
- Relacionada: J26 (configurações de plataforma), J25 (obras em destaque na home)

## 13. Gaps descobertos durante execução

> Doc viva. Registrar aqui o que apareceu no caminho e não estava no roteiro original. Uma linha por item, com data.
