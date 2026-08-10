# Jornadas — xgestão

Jornadas do **xgestão**, o produto de gestão de obras onde o **empreiteiro é o cliente pagante**.

Separado de [`docs/jornadas/`](../jornadas/) de propósito: aquelas descrevem o **marketplace** (contratante ↔ empreiteiro), que segue construído e será apenas ocultado. Misturar as duas numerações confundiria as duas jornadas de produto.

- Numeração **XG01…** (as do marketplace vão de J01 a J61).
- Mesmo formato de [`docs/jornadas/_template.md`](../jornadas/_template.md) — 13 seções, links relativos `../../`.
- Mesmos status canônicos: `planejada` · `pendente` · `mock` · `parcial` · `revisão` · `pronto` · `bloqueada`.

## Índice

| # | Jornada | Bloco | Status | Prioridade | Risco |
|---|---|---|---|---|---|
| [XG01](01-fundacoes-e-shell.md) | Fundações e shell do xgestão | 1 | planejada | alta | baixo |
| [XG02](02-obra-do-empreiteiro.md) | Obra criada e editada pelo empreiteiro | 2 | planejada | alta | baixo |
| [XG03](03-planos-limites-trial.md) | Planos, limites e teste de 3 meses | 3 | planejada | alta | médio |
| [XG04](04-link-publico-obra.md) | Link público de acompanhamento | 4 | planejada | alta | **alto** |
| [XG05](05-ocultar-marketplace.md) | Ocultar o marketplace | 5 | planejada | alta | baixo |
| [XG06](06-admin-xgestao.md) | Visão administrativa do xgestão | 6 | planejada | média | baixo |
| [XG07](07-integracao-sinapi.md) | Integração SINAPI (preços de referência) | 7 | planejada | média | médio |

## Contexto

Fontes: [`docs/novo-fluxo/`](../novo-fluxo/) — transcrição da reunião (`reuniao-xconstrucao-xgestao-001.vtt`), o PDF de monetização e o [resumo executivo](../novo-fluxo/xgestao-plano-40-45-dias.pdf) gerado por [`scripts/gerar-pdf-xgestao.py`](../../scripts/gerar-pdf-xgestao.py).

**Prazo:** 40 a 45 dias corridos (~20 dias úteis de desenvolvimento + testes conjuntos e homologação).

## Decisões de arquitetura que valem para todas as jornadas

1. **Role aditiva, não role nova.** O xgestão usa a tabela `user_roles` ([`shared/db/schema.ts:196`](../../shared/db/schema.ts), J23). `users.role` continua `empreiteiro`. Trocar a role primária quebraria ~250 rotas com `guard.user.role !== "x"` e tiraria do usuário o acesso ao marketplace — o oposto de "ocultar, não apagar".
2. **Prefixo `/xgestao/*` com páginas finas.** Os ~40 arquivos de [`features/empreiteiro/minhas-obras/`](../../features/empreiteiro/minhas-obras/) são **reaproveitados por extração**, nunca copiados. O cliente foi enfático: o usuário precisa saber em qual produto está.
3. **Ocultar por configuração.** Toggles em [`settings-reader.ts`](../../features/admin/platform-settings/server/settings-reader.ts) (J26). Nada de apagar rota ou comentar componente. A reversibilidade é entregável.
4. **O banco já permite obra sem contratante.** Em [`shared/db/schema.ts:219-220`](../../shared/db/schema.ts), `clienteId` e `empreiteiraId` são nullable, e [`features/obras/api/access.ts`](../../features/obras/api/access.ts) concede acesso por `empreiteiraId` sem exigir candidatura. **Não há migration do modelo central.**

## Fora de escopo

- **Migração Replit → infra própria** — decisão em aberto do lado do cliente; não entra em nenhuma jornada.
- **Orçamento estruturado** (tabela de itens de orçamento por obra) — XG07 entrega consulta de preço de referência, não composição de orçamento. Projeto próprio.

> **SINAPI saiu de "fora de escopo" em 2026-08-10.** A premissa original era que só existiam planilhas mensais por UF. Ela vale para ETL próprio, mas existe API de terceiro ([Orçamentador](https://orcamentador.com.br/api/)) que reduz a integração a dias. Ver [XG07](07-integracao-sinapi.md). Ressalva: a chave gratuita expira a cada 15 dias e é liberada por formulário — o tier pago é pré-requisito de go-live.

## Definições pendentes

Bloqueiam parte do trabalho e devem ser respondidas pelo cliente:

1. Preços finais dos 3 planos e mecânica do teste de 3 meses (bloqueia XG03).
2. ~~SINAPI: existe serviço de consulta automática?~~ **Respondida em 2026-08-10:** sim, via terceiro. Ver [XG07](07-integracao-sinapi.md). Resta decidir se o custo do plano PRO (R$ 79,90/mês) entra no orçamento antes do lançamento.
3. Limite do Pro: 10 ou 15 obras — e "obra" é ativa ou vitalícia?
4. O que a visão admin precisa mostrar (bloqueia XG06).
5. Fim do teste com obras acima do limite: o que acontece?
6. Quota de consultas SINAPI por plano — a proposta de XG07 §9 (20 / 100 / ilimitado) precisa de aval comercial.
