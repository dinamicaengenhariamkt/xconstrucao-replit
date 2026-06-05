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
| 14 | [Integração de Gateway de Pagamento](14-integracao-gateway-pagamento.md) | contratante, empreiteiro, admin | 3 | bloqueada | média |
| 15 | [UI de Assinatura (persona)](15-ui-assinatura.md) | contratante, empreiteiro | 3 | pronto | média |
| 16 | [Exibição de Anúncios (BannerSlot)](16-exibicao-anuncios.md) | público, contratante, empreiteiro | 2 | pronto | média |
| 17 | [Dashboards Reais (contratante + saúde/lucro)](17-dashboards-reais.md) | contratante, empreiteiro, admin | 3 | pronto | alta |
| 18 | [Dashboard Financeiro Admin Completo](18-financeiro-admin-completo.md) | admin | 3 | pronto | média |
| 19 | [Hardening de Segurança](19-hardening-seguranca.md) | todas | 3 | pronto | alta |
| 20 | [Satisfação & NPS/CSAT (surveys)](20-satisfacao-nps-csat.md) | contratante, empreiteiro, admin | 4 | bloqueada | baixa |
| 21 | [Observabilidade de Comunicação (Admin)](21-observabilidade-comunicacao-admin.md) | admin | 4 | revisão | média |
| 22 | [Autenticação Forte (2FA)](22-autenticacao-forte-2fa.md) | todas | 4 | revisão | média |
| 23 | [Meus Anúncios (Self-Service)](23-meus-anuncios-self-service.md) | contratante, empreiteiro, outsider, admin | 4 | bloqueada | baixa |
| 24 | [Anúncios Ricos (Preview, Home Dinâmica & Toggle)](24-anuncios-ricos.md) | admin, público | 4 | bloqueada | média |

---

## Convenções

### Status
- **pendente** — jornada documentada (roteiro pronto) mas ainda não iniciada.
- **mock** — UI existe mas dados são fixos / não persistem. Substituir por API + Drizzle.
- **parcial** — backend real coexiste com mock por trás de uma flag (`ENABLE_MOCK`). Remover flag e deletar mocks.
- **revisão** — implementação real ponta-a-ponta. Falta auditar pontas soltas e validar critérios de aceite.
- **pronto** — entregue, validado e mocks removidos.
- **bloqueada** — fundação pronta, mas a entrega final depende de uma decisão externa/de negócio (ex: escolher gateway de pagamento). Desbloquear quando a decisão chegar.

### Prioridade
- **alta** — bloqueia outras jornadas ou destrava experiência crítica de produto.
- **média** — agrega valor mas pode esperar a próxima wave.
- **baixa** — pode aguardar maturidade das jornadas geradoras.

### Waves
- **Wave 1 — Marketplace funcional**: 01, 03, 04, 05. Saída: contratante posta obra → empreiteiro candidata → contratante aceita → vínculo persistido.
- **Wave 2 — Execução, dinheiro e comunicação**: 06, 08, 13, 12.
- **Wave 3 — Back-office e refinamento**: 11, 09, 02, 07, 10, 12, 14. (09/10/11/12 entregues 2026-06; 14 documentada e bloqueada aguardando escolha de gateway.)

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
- Camada de storage: [server/storage.ts](../../server/storage.ts)
- Padrão de API real (referência): [app/api/obras/route.ts](../../app/api/obras/route.ts)
- Flag de mock genérica: `NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK` (nome legado — vale para todos os módulos admin/contratante/empreiteiro)

Histórico de decisões arquiteturais anteriores: [../_arquivado/](../_arquivado/).
