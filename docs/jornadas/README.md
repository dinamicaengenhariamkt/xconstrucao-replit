# Jornadas — XConstrução

Roteiro de execução da plataforma organizado por **jornada ponta-a-ponta**. Cada jornada cobre um domínio cruzando UI → API → banco → fluxos entre personas (admin, contratante, empreiteiro).

Cada arquivo é um **checklist vivo**: ao avançar a implementação, marque os itens e atualize o status no índice abaixo no mesmo PR.

---

## Índice

| # | Jornada | Personas | Wave | Status | Prioridade |
|:-:|---|---|:-:|---|:-:|
| 01 | [Identidade & Onboarding](01-identidade-onboarding.md) | todas | 1 | pronto | alta |
| 02 | [Perfis & Configurações](02-perfis-configuracoes.md) | contratante, empreiteiro, admin | 3 | pronto | média |
| 03 | [Cadastro de Obra](03-cadastro-obra.md) | contratante | 1 | pronto | alta |
| 04 | [Marketplace & Descoberta](04-marketplace-descoberta.md) | empreiteiro, contratante | 1 | pronto | alta |
| 05 | [Candidatura & Aceite](05-candidatura-aceite.md) | empreiteiro, contratante, admin | 1 | pronto | alta |
| 06 | [Medições & Diário de Obra](06-medicoes-diario-obra.md) | empreiteiro, contratante, admin | 2 | pronto | alta |
| 07 | [Atividades & Timeline](07-atividades-timeline.md) | todas | 3 | pronto | média |
| 08 | [Pagamentos da Obra](08-pagamentos-obra.md) | contratante, empreiteiro, admin | 2 | pronto | alta |
| 09 | [Financeiro Admin](09-financeiro-admin.md) | admin | 3 | pronto | média |
| 10 | [Disputas](10-disputas.md) | todas | 3 | pronto | baixa |
| 11 | [Planos & Assinatura](11-planos-assinatura.md) | contratante, empreiteiro, admin | 3 | pronto | média |
| 12 | [Anúncios](12-anuncios.md) | admin + visualizadores | 2 | pronto | média |
| 13 | [Chat & Notificações](13-chat-notificacoes.md) | contratante, empreiteiro | 2 | pronto | média |
| 14 | [Integração de Gateway de Pagamento](14-integracao-gateway-pagamento.md) | contratante, empreiteiro, admin | 3 | pronto (adapter Asaas real escrito) | média |
| 15 | [UI de Assinatura (persona)](15-ui-assinatura.md) | contratante, empreiteiro | 3 | pronto | média |
| 16 | [Exibição de Anúncios (BannerSlot)](16-exibicao-anuncios.md) | público, contratante, empreiteiro | 2 | pronto | média |
| 17 | [Dashboards Reais (contratante + saúde/lucro)](17-dashboards-reais.md) | contratante, empreiteiro, admin | 3 | pronto | alta |
| 18 | [Dashboard Financeiro Admin Completo](18-financeiro-admin-completo.md) | admin | 3 | pronto | média |
| 19 | [Hardening de Segurança](19-hardening-seguranca.md) | todas | 3 | pronto | alta |
| 20 | [Satisfação & NPS/CSAT (surveys)](20-satisfacao-nps-csat.md) | contratante, empreiteiro, admin | 4 | pronto | baixa |
| 21 | [Observabilidade de Comunicação (Admin)](21-observabilidade-comunicacao-admin.md) | admin | 4 | pronto | média |
| 22 | [Autenticação Forte (2FA)](22-autenticacao-forte-2fa.md) | todas | 4 | pronto | média |
| 23 | [Self-Service de Anúncios (Visão Anunciante + Meus Anúncios)](23-meus-anuncios-self-service.md) | anunciante, contratante, empreiteiro, admin | 6 | pronto | alta |
| 24 | [Anúncios Ricos (Templates, Home Dinâmica & Toggle)](24-anuncios-ricos.md) | admin, anunciante, público | 5 | pronto | alta |
| 25 | [Obras em Destaque na Home (Curadoria + Carrossel)](25-obras-em-destaque-home.md) | admin, público | 5 | pronto | alta |
| 26 | [Ativação das Configurações da Plataforma](26-ativacao-configuracoes-plataforma.md) | admin, todas | 5 | pronto | alta |
| 27 | [Gestão de Leads do Marketplace](27-gestao-leads-marketplace.md) | admin | 5 | pronto | alta |
| 28 | [Documentos Legais Versionados + Re-consentimento](28-documentos-legais-versionados.md) | admin/jurídico, usuários | 6 | pronto | média |
| 29 | [Observabilidade Histórica (snapshots de KPI)](29-observabilidade-historica-kpis.md) | admin | 6 | pronto | baixa |
| 30 | [Configurações Críticas de Segurança](30-configuracoes-criticas-seguranca.md) | admin, todas | 6 | parcial (2FA, webhooks e auditoria do PATCH: fase 2) | média |
| 31 | [Pagamento Real de Anúncios (Billing do Marketplace de Mídia)](31-pagamento-anuncios.md) | anunciante, admin | 7 | pronto (MVP) | média |
| 32 | [FAQ Gerenciável (Admin CRUD + Leitura por Visão)](32-faq-gerenciavel.md) | admin, contratante, empreiteiro | 7 | pronto | alta |
| 33 | [Observabilidade Técnica & Saúde da Plataforma (erros, logs, painel)](33-observabilidade-tecnica-saude-plataforma.md) | admin | 8 | pronto (config de deploy: §14) | alta |
| 34 | [Ajustes Finos de UX (Visão Admin)](34-ajustes-finos-ux-admin.md) | admin | 8 | pronto | média |
| 35 | [Testes Unitários (fundação de qualidade)](35-testes-unitarios.md) | dev/sistema | 9 | planejada | alta |
| 36 | [Testes de Integração (API + banco)](36-testes-integracao.md) | dev/sistema | 9 | pronto (baseline de cobertura zerada) | alta |
| 37 | [Testes End-to-End (navegador)](37-testes-e2e.md) | dev/sistema | 9 | pronto (cobertura via integração; browser → §12 Futuro) | alta |
| 38 | [Ajustes Finos de UX (Empreiteiro & Contratante)](38-ajustes-finos-ux-personas.md) | empreiteiro, contratante, admin | 8 | concluída | média |
| 39 | [Correção de Bugs: Cadastro de Obra & Curadoria](39-correcao-bugs-cadastro-obra-curadoria.md) | contratante, admin | 10 | pronto | alta |
| 40 | [Ajustes Finos de UX: Nova Obra (Contratante)](40-ajustes-finos-nova-obra-contratante.md) | contratante | 8 | pronto | média |
| 41 | [XChat Completo](41-xchat-completo.md) | contratante, empreiteiro, admin | 8 | pronto | alta |
| 42 | [Fundação de Dados: Marketplace Split & Recebimento](42-fundacao-dados-marketplace-split.md) | dev/sistema | 10 | concluída | alta |
| 43 | [Extensão asaas-client: Subcontas, Split, Saldo & Transfer](43-asaas-client-subcontas-split.md) | dev/sistema | 10 | concluída | alta |
| 44 | [Cadastro: CPF/CNPJ + Customer Asaas Proativo](44-cadastro-cpf-customer-asaas.md) | contratante, empreiteiro, anunciante | 10 | concluída | alta |
| 45 | [Onboarding de Subconta do Empreiteiro (Recebimento)](45-onboarding-subconta-empreiteiro.md) | empreiteiro | 10 | concluída | alta |
| 46 | [Webhooks de Status de Subconta (KYC)](46-webhooks-status-subconta-kyc.md) | empreiteiro, sistema | 10 | concluída | média |
| 47 | [Checkout de Obra com Split (Iniciação)](47-checkout-obra-split.md) | contratante, empreiteiro | 10 | concluída | alta |
| 48 | [Confirmação de Pagamento de Obra via Webhook](48-confirmacao-pagamento-obra-webhook.md) | contratante, empreiteiro, sistema | 10 | concluída | alta |
| 49 | [Saldo e Saque do Empreiteiro (Transferência)](49-saldo-saque-empreiteiro.md) | empreiteiro | 10 | concluída | média |
| 50 | [Reconciliação & Rollout do Split](50-reconciliacao-rollout-split.md) | admin, sistema | 10 | concluída | média |
| 51 | [Wizard de Onboarding (Primeiro Acesso)](51-wizard-onboarding.md) | contratante, empreiteiro, anunciante | 11 | pronto | alta |
| 52 | [Perfil Incompleto & Continuidade de Onboarding](52-perfil-incompleto-continuidade-onboarding.md) | contratante, empreiteiro | 11 | pronto | alta |
| 53 | [UI de Pagamento de Anúncios & FAQ do Anunciante](53-ui-pagamento-anuncios-faq.md) | anunciante, admin | 11 | pronto | alta |
| 54 | [Validação Ponta-a-Ponta das 3 Personas & Specs](54-validacao-personas-specs.md) | todas | 11 | pronto | alta |
| 55 | [Transparência LGPD do Processamento de Pagamento](55-transparencia-lgpd-pagamento.md) | todas | 11 | pronto | alta |
| 56 | [Hardening dos Fluxos de Pagamento](56-hardening-pagamento.md) | contratante, empreiteiro, anunciante | 11 | pronto | alta |
| 57 | [Notificações & Indicadores do Marketplace](57-notificacoes-indicadores-marketplace.md) | contratante, admin | 12 | pronto | alta |
| 58 | [Contrato entre as Partes (contratante ↔ empreiteiro)](58-contrato-entre-as-partes.md) | contratante, empreiteiro, admin | 12 | pronto | alta |
| 59 | [Termo de Aceite do Anunciante (gate de entrada)](59-termo-aceite-anunciante.md) | anunciante, admin | 12 | pronto | média |
| 60 | [Área de Contratos no Admin](60-contratos-admin.md) | admin | 12 | pronto | média |

---

## Convenções

### Status
- **planejada** — roteiro completo e desbloqueado, pronto para entrar na fila de implementação (nada de código ainda). É o "pendente" com aval para começar.
- **pendente** — jornada documentada (roteiro pronto) mas ainda não iniciada.
- **mock** — UI existe mas dados são fixos / não persistem. Substituir por API + Drizzle.
- **parcial** — backend real coexiste com mock por trás de uma flag (`ENABLE_MOCK`). Remover flag e deletar mocks.
- **revisão** — implementação real ponta-a-ponta. Falta auditar pontas soltas e validar critérios de aceite.
- **pronto** — entregue, validado e mocks removidos.
- **bloqueada** — fundação pronta, mas a entrega final depende de uma decisão externa/de negócio (ex: escolher gateway de pagamento). Desbloquear quando a decisão chegar.

> **Ressalva no status.** Quando uma jornada está entregue mas com um recorte que
> vale sinalizar, use **status canônico + parêntese curto** — nunca invente um
> status novo. Ex.: `pronto (MVP)`, `parcial (2FA e webhooks: fase 2)`. Isso mantém
> a tabela filtrável e ainda assim honesta. `concluída`/`concluído` aparecem em
> jornadas antigas como sinônimo informal de `pronto`; não usar em jornadas novas.
>
> **O que não deve virar checkbox.** Item que depende de infra indisponível
> (ex.: browser E2E) ou de terceiro (ex.: revisão jurídica) **não fica no
> checklist** — vira uma seção própria "Futuro — requer X" ou uma observação na §13.
> Motivo: checkbox aberto é lido como pendência acionável e reaparece em toda
> revisão de escopo, poluindo o levantamento do que realmente falta fazer.
> Exemplos: [J37 §12](37-testes-e2e.md) (browser) e
> [J28 §13](28-documentos-legais-versionados.md) (jurídico).

### Prioridade
- **alta** — bloqueia outras jornadas ou destrava experiência crítica de produto.
- **média** — agrega valor mas pode esperar a próxima wave.
- **baixa** — pode aguardar maturidade das jornadas geradoras.

### Waves
- **Wave 1 — Marketplace funcional**: 01, 03, 04, 05. Saída: contratante posta obra → empreiteiro candidata → contratante aceita → vínculo persistido.
- **Wave 2 — Execução, dinheiro e comunicação**: 06, 08, 13, 12.
- **Wave 3 — Back-office e refinamento**: 11, 09, 02, 07, 10, 12, 14. (09/10/11/12 entregues 2026-06; **14: adapter Asaas real escrito — desbloqueada; auditoria 2026-07-19 confirmou que a integração existe. Hardening de produção e recebimento/split ficam na Wave 10**.)
- **Wave 4 — Segurança e observabilidade**: 19, 21, 22 (entregues 2026-06); **20 (NPS/CSAT — desbloqueada e implementada 2026-07-24** com premissas de coleta padrão: NPS pós-conclusão de obra, CSAT pós-pagamento; coleta pulável nas notificações; card admin só aparece com respostas reais). *(23 movida p/ Wave 6 após reestruturação.)*
- **Wave 5 — Vitrine dinâmica e controle admin** (pós primeiro deploy): **25 (obras em destaque + carrossel), 26 (config real anti-fantasma), 27 (gestão de leads), 24 (templates + home dinâmica de anúncios) — entregues 2026-06-05/06**. Frente de "tirar o estático/fantasma da plataforma" — nenhuma depende do gateway (J14). A J24 é pré-requisito da J23 (reuso de templates/preview).
- **Wave 6 — Compliance, histórico e segurança crítica** (pós-MVP): **29 (observabilidade histórica/snapshots) — entregue 2026-06-05** (deltas reais aparecem após ≥1 mês de coleta); 28 (docs legais versionados — bloqueada por jurídico), 30 (configurações críticas de segurança — desmembrada da J26; mexe no fluxo de auth, exige plano de não-bloqueio); **23 (self-service de anúncios — reestruturada e planejada 2026-06-07**: multi-role + visão anunciante + pedido multi-slot + checkout-protótipo; cobrança real extraída p/ a J31).
- **Wave 7 — Monetização do marketplace de mídia**: **31 (pagamento real de anúncios — pronto MVP 2026-07-22)**: liga o gateway Asaas ao checkout da J23. Cobrança one-off (100% conta-mãe), moderar-antes-de-pagar, período obrigatório, início hoje..+7d, expiração automática, sem pausa em anúncio pago. Gated por `AD_PAYMENT_GATEWAY=asaas`+`PAYMENT_GATEWAY=asaas`; protótipo é fallback dev. Backlog: pausa-com-crédito, sobreposição de período, recorrência, estorno.
- **Wave 8 — Observabilidade técnica (pré-produção)**: **33 (saúde da plataforma + captura de erros — planejada 2026-06-08; decisão fechada 2026-06-20: híbrido Sentry free + Pino + `app_errors` próprio)**: camada técnica antes do uso real por clientes — captura proativa de erros + painel de saúde no admin, com meta de independência do Sentry. Complementa a auditoria funcional (J21) e os KPIs (J29). **34 (ajustes finos de UX da visão admin — pronto 2026-06-20)**: jornada agrupadora de refinamentos de consistência (hover de cards, arquitetura de filtros do financeiro, NaN%, top bar, active da sidebar). **38 (ajustes finos de UX empreiteiro & contratante — concluída)**: irmã da J34 nas demais visões (anúncio dinâmico na sidebar, FAQ sem cards vazios, margem da Nova Obra, acesso a "Meus rascunhos") — em sua maioria religação de UI a serviços/persistência já existentes. **40 (ajustes finos de UX: Nova Obra do contratante — pronto 2026-07-06)**: novo lote focado na tela Nova Obra (altura do select de UF, máscara de CEP reusando `CepInput`, duplo scroll do layout, extensões/validação de anexos, selects opcionais limpáveis, feedback do "Salvar rascunho") — guarda-chuva dos próximos refinamentos das telas do contratante. Inclui correção do E2E `j03-nova-obra` (porta de cleanup) descoberta na verificação.
- **Wave 9 — Qualidade & robustez (rede de segurança automatizada)**: trio de testes criado 2026-06-20 para dar robustez pré-produção, complementando a observabilidade (J33). **35 (testes unitários — planejada, ainda sem código)**: base da pirâmide + fundação (Vitest, ESLint, hook de auto-validação local — CI no GitHub Actions fora de escopo por ora, deploy é direto no Replit). Há arquivos `*.test.ts` em `features/planos/` que nenhum runner executa hoje. **36 (testes de integração — em andamento)**: API + banco isolado; a suíte roda e o radar `npm run test:integration:gaps` aponta o que falta. **37 (testes E2E — parcial, bloqueada por infra)**: base Playwright já existe, mas o Chromium não sobe neste ambiente (`GLIBC_PRIVATE not found`) — a cobertura visual está represada. Princípio: muitos unitários (baratos) → alguns de integração → poucos E2E (caros). Teste automatizado **protege contra regressão**; não substitui o teste manual exploratório (que descobre o que falta).

- **Wave 10 — Método de pagamento real & marketplace com split** (documentada 2026-07-19, pós-auditoria da J11/Asaas): leva o pagamento de "controle interno" para **movimentação financeira real via Asaas**. Duas frentes: (a) **hardening da cobrança de assinatura** para produção — fechar o gap bloqueante de CPF/CNPJ (J44) e as env vars/webhook (checklist da J11); (b) **novo papel de recebedor** — o empreiteiro recebe pela obra e saca para o banco dele, via subconta Asaas com split real. Sequência: **42 (schema) + 43 (asaas-client) paralelos → 44 (cadastro/CPF) → 45 (subconta) → (46 KYC, 47 checkout-split paralelos) → 48 (confirmação webhook) → 49 (saldo/saque) / 50 (reconciliação/rollout)**. Tudo atrás da flag `MARKETPLACE_SPLIT` (default off); o `quitarLancamento` manual permanece como fallback para não quebrar o fluxo atual. Descoberta-chave da auditoria: o **adapter Asaas real já existia** (a J14 não estava de fato bloqueada). Riscos concentrados em KYC/compliance (a plataforma vira intermediária financeira), idempotência de split e regressão no roteamento do webhook único.

- **Wave 11 — Onboarding guiado & conversão** (documentada 2026-07-22): camada de UX sobre fluxos já prontos. **51 (wizard de onboarding pós-cadastro — pronto)**: hoje o primeiro acesso é cru (`cadastro → verificar email → login → dashboard`). O wizard, **pulável**, coleta PF/PJ explícito + dados de empresa e faz merchandising do plano pago (free como saída) no momento de maior atenção. **Não** reconstrói a criação de conta Asaas — reusa o provisionamento proativo silencioso da J44. Decisões de produto (fricção pulável, Asaas como hoje, empurrar pago, multi-role via J23) confirmadas com o dono em 2026-07-22.

- **Wave 12 — Camada contratual & percepção do marketplace** (implementada 2026-07-23, documentada 2026-07-24): fecha duas lacunas que o marketplace carregava desde a Wave 1. **57 (notificações & indicadores — pronto)**: o marketplace funcionava em silêncio (contratante não sabia se a obra fora aprovada, não via propostas novas, admin não sabia que uma obra fora contratada). **58 (contrato entre as partes — pronto)**: a plataforma intermediava um acordo que não existia por escrito. Muda o comportamento central do aceite — a obra **não** vai mais direto para `em_andamento`, passa por `pendente_contratante → pendente_empreiteiro → assinado`, com assinatura eletrônica registrada (IP/UA) sobre template versionado. **59 (termo do anunciante — pronto)**: gate de entrada antes do primeiro pedido de anúncio. **60 (contratos no admin — pronto)**: unifica as duas fontes de aceite (`user_consents` + `contrato_assinaturas`) numa área auditável. As quatro foram implementadas antes de serem documentadas — os docs vieram depois, junto do hardening que fechou o bootstrap de schema ausente e o bug de cancelamento (ver J58 §13).

Princípio: dentro de cada wave, **terminar uma jornada inteira** (schema → API → UI → remover mock → critério de aceite) antes de iniciar a próxima.

### Doc viva — seção "Gaps descobertos"
Cada jornada tem uma seção 13 onde se registra, durante a execução, o que apareceu no caminho e não estava no roteiro original (edge cases, validações implícitas, decisões de UX, integrações que viraram dor). Uma linha por item, com data. Atualizar no mesmo PR que resolve o gap. Isso transforma o markdown em referência viva — quem entrar depois lê o roteiro *e* o aprendizado.

### Backlog paralelo (transversal)
Itens descobertos durante a execução que **não pertencem a uma jornada só** — refinamentos sistêmicos, dívidas técnicas cross-feature, decisões arquiteturais ainda em aberto — ficam em [_backlog-paralelo.md](_backlog-paralelo.md). O agent `product-owner` lê esse arquivo no `/jornada` pra incluir nas evoluções sugeridas.

### Sobreposição entre jornadas
Quando uma feature aparece em duas jornadas (ex: notificação de candidatura aceita aparece em J05 e J13), use a regra do **dono primário**:
- A jornada que **origina** o evento documenta o disparo.
- A jornada que **consome** documenta a UI/canal.
- Linkar entre os dois markdowns na seção 12.

---

## Como criar uma nova jornada

1. Copie [_template.md](_template.md) para um novo arquivo numerado (`14-...md`).
2. Preencha as seções 1–11.
3. Adicione uma linha na tabela acima com status inicial.
4. Indique dependências e bloqueios na seção 12 do novo arquivo e nos arquivos referenciados.

---

## Referência rápida — arquitetura

- Stack: Next.js 16 App Router, React 19, Tailwind 4, shadcn/ui, Drizzle ORM, PostgreSQL, NextAuth.js
- Schema canônico: [shared/db/schema.ts](../../shared/db/schema.ts)
- Modelo financeiro ASAAS (conta-mãe, customers, subcontas, split): [../asaas-modelo-financeiro.md](../asaas-modelo-financeiro.md)
- Camada de storage: [server/storage.ts](../../server/storage.ts)
- Padrão de API real (referência): [app/api/obras/route.ts](../../app/api/obras/route.ts)
- ~~Flag de mock genérica `NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK`~~ — **não existe mais**: auditoria de 2026-07-26 confirmou zero ocorrências no código. Não há nenhuma flag de mock na plataforma; o status `parcial` do glossário acima descreve um estado que nenhuma jornada ocupa hoje.

Histórico de decisões arquiteturais anteriores: [../_arquivado/](../_arquivado/).

---

## Higienização de 2026-07-26

Auditoria cruzou **cada checkbox aberto** das 60 jornadas com o código. Resultado:
de 14 jornadas com itens em aberto, **restaram 3** — e as três são trabalho real,
não descompasso de documentação:

| Jornada | O que falta | Por quê |
|---|---|---|
| **J35 — Testes Unitários** | 11/11 | Única genuinamente não iniciada: sem Vitest, sem ESLint, e 6 arquivos `*.test.ts` órfãos que nenhum runner executa. |
| **J30 — Config. Críticas de Segurança** | 4 | Três são fase 2 declarada; a **auditoria do PATCH** é lacuna real (ver `_backlog-paralelo.md`). Status rebaixado de `concluído` para `parcial`. |
| **J09 — Financeiro Admin** | 1 | Exportação CSV — casa com o gate de relatórios da J30; fazer as duas pontas juntas. |

O resto eram checkboxes que ninguém marcou depois de entregar. Os que dependiam de
**infra indisponível** (browser E2E) ou de **terceiro** (revisão jurídica, Secrets do
Sentry) saíram do checklist e viraram seção própria — [J37 §12](37-testes-e2e.md),
[J28 §13](28-documentos-legais-versionados.md),
[J33 §14](33-observabilidade-tecnica-saude-plataforma.md) — justamente para não
reaparecerem como pendência acionável a cada revisão de escopo.

Correções de código que a auditoria disparou estão registradas nas §13 da
[J44](44-cadastro-cpf-customer-asaas.md) (bug do `users.cpf_cnpj` + regra de
documento por persona), [J36](36-testes-integracao.md) (18 testes órfãos
recuperados) e [J37](37-testes-e2e.md).
