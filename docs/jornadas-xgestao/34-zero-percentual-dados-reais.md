# Jornada — XG34: zero percentual e só dado real em todas as visões do xgestão

> Status: parcial (unidade e API aprovadas; inspeção visual completa pendente) | Prioridade: alta | Wave: xgestão-34
> Última atualização: 2026-10-04

Homologação: payload do admin sem agregado, detalhe sem percentual geral inventado e percentual manual de etapa independente de tarefas conferidos em testes. Custo real de R$ 321 do responsável bateu em dashboard/lista/detalhe. [Evidências e limites da rodada](40-relatorio-homologacao-mvp.md); não declarar todas as telas visualmente revisitadas.

## 1. Contexto & Objetivo

A [XG29](29-remocao-total-do-percentual.md) tirou o percentual de execução das telas do
**assinante**. A auditoria de 2026-10-04 achou o número vivo em outros lugares, em especial no
**admin xgestão**, que lê `obras.progresso`: coluna **sem escritor desde a XG23**. Resultado: o
admin mostra 0% ou um valor congelado como se fosse dado.

Diretriz do Ramon (2026-10-04): **nenhum percentual de acompanhamento em nenhuma visão** (admin,
assinante, membro, link público) e **nenhum número que não venha do banco**. Sem mock, sem
coluna morta, sem valor padrão disfarçado de dado.

## 2. Personas

- **Admin**: deixa de ver "Progresso médio" e "%" por obra; passa a ver indicadores reais.
- **Assinante / membro**: nenhuma mudança visível além dos resquícios removidos.
- **Cliente do link público**: deixa de ver "% concluído" nas tarefas.

## 3. Fluxo ponta-a-ponta

1. Levantar todo uso de `progresso` nas rotas do xgestão (lista no §9).
2. Remover da UI; remover da projeção/API quando ninguém mais consome.
3. Onde o admin tinha "Progresso médio", entra um indicador real (definido na
   [XG36](36-admin-xgestao-fechamento.md): obras no prazo × atrasadas).
4. Auditar cada big number do admin xgestão: de qual query vem, se a coluna tem escritor.

## 4. Telas envolvidas

- [app/admin/xgestao/page.tsx](../../app/admin/xgestao/page.tsx) — card "Progresso médio" (`:62`) e % por obra (`:229`)
- [app/admin/xgestao/obras/page.tsx](../../app/admin/xgestao/obras/page.tsx) — coluna % (`:200`)
- [app/admin/xgestao/obras/[id]/page.tsx](../../app/admin/xgestao/obras/[id]/page.tsx) — KPI % (`:80`)
- [features/xgestao/obra-publica/components/TabTarefasPublica.tsx](../../features/xgestao/obra-publica/components/TabTarefasPublica.tsx) — "% concluído" (`:53`)
- [features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx](../../features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx) — subtítulo "acompanhe o progresso" (`:192`, só no modo xgestão)

## 5. Componentes-chave

- [features/xgestao/admin/server/dashboard.ts](../../features/xgestao/admin/server/dashboard.ts) — `avg(obras.progresso)` (`:238`), `:255`, `:397`, `:451`
- [features/xgestao/admin/server/obras.ts](../../features/xgestao/admin/server/obras.ts) — `progresso` (`:90`, `:143`)
- [features/xgestao/admin/server/obra-detalhe.ts](../../features/xgestao/admin/server/obra-detalhe.ts) — `progresso` (`:69`, `:116`)
- [features/xgestao/obra-publica/server/projection.ts](../../features/xgestao/obra-publica/server/projection.ts) — `progresso` de etapa e tarefa (`:197`, `:257`, `:296`, `:333`)
- [features/xgestao/components/EditarInformacoesModal.tsx](../../features/xgestao/components/EditarInformacoesModal.tsx) — comentário desatualizado (`:73-75`)

## 6. Schema (Drizzle)

Nenhuma. `obras.progresso` **não é apagada** (o marketplace ainda usa); o xgestão só para de ler.

## 7. Endpoints

- `GET /api/admin/xgestao`, `/obras`, `/obras/[id]` — removem `progresso`/`progressoMedio` do payload
- Projeção do link público — remove `progresso` da tarefa

## 8. Mocks a remover

Nenhum encontrado no xgestão. Critério desta jornada: provar com grep que continua assim.

## 9. Checklist de implementação

- [x] Admin: card "Progresso médio" virou "Obras atrasadas" (previsão vencida e não concluída); coluna % da lista virou "Prazo" (vermelho se atrasada); KPI % do detalhe removido _(2026-10-04)_
- [x] Admin server: `progresso`/`progressoMedio` fora de `dashboard.ts`, `obras.ts`, `obra-detalhe.ts` _(2026-10-04)_
- [x] Link público: "% concluído" e `progresso` da tarefa removidos (tipo, projeção e tela) _(2026-10-04)_
- [x] Subtítulo do Minhas Obras no modo xgestão: "acompanhe prazos e valores" _(2026-10-04)_
- [x] Comentário de `EditarInformacoesModal.tsx` atualizado _(2026-10-04)_
- [x] `ObraPickerSheet` é do xchat (marketplace, sem chat no xgestão) e `RelatorioObraModal` não é importado por ninguém: nenhum dos dois é alcançável pelo xgestão _(2026-10-04)_
- [ ] **Auditoria de origem:** para cada big number do admin xgestão, registrar query + coluna +
      quem escreve a coluna. Qualquer coluna sem escritor sai ou é substituída
- [ ] Grep final: `progresso`/`%` nas rotas do xgestão só onde for decisão consciente (ver §11)
- [ ] Teste de integração do payload do admin sem `progresso`

## 10. Critérios de aceite

1. Nenhuma tela do xgestão (admin, assinante, membro, link) mostra percentual da obra ou de tarefa; só o percentual manual por etapa permanece.
2. Todo número do admin xgestão tem origem documentada no §13 e bate com SQL direto, ex.:
   `SELECT count(*) FROM obras WHERE empreiteira_id IS NOT NULL AND cliente_id IS NULL;`
3. Marketplace sem nenhuma alteração (`git diff` não toca rotas do marketplace).

## 11. Riscos / Pontos de atenção

- **Decidido (Ramon, 2026-10-04): o percentual da etapa fica.** A barra manual por etapa
  ([XG23](23-etapas-progresso-manual.md)) é dado que o dono digita e continua no console e no link
  público. O que sai é todo percentual **da obra/projeto** (agregado), que é resquício.
- Componentes compartilhados com o marketplace: remover via slot/flag do xgestão, nunca editando o
  comportamento do marketplace.

## 12. Links cruzados

- Depende de: [XG29](29-remocao-total-do-percentual.md)
- Bloqueia: [XG36](36-admin-xgestao-fechamento.md) (o indicador que substitui o % nasce lá)

## 13. Gaps descobertos durante execução

- 2026-10-04: jornada criada a partir da auditoria (admin lendo `obras.progresso`).
- 2026-10-04: achado na execução: o **"Valor pago"** do admin também lia `obras.valor_pago`, coluna sem escritor no xgestão (dívida da XG22). Trocado por custo real (saídas pagas pelo dono, mesma regra do dashboard do assinante, XG27) em `features/xgestao/admin/server/custo-real.ts`. Rótulos: "Custo real (saídas pagas)" no painel e "Custo real" no detalhe (era "Recebido", nome errado).
- 2026-10-04: achado na execução: a **Saúde** do admin xgestão era calculada sobre `obras.progresso` e `obras.valor_pago` (as duas mortas). Removida do admin (coluna da lista e card do detalhe), como a XG17 já tinha feito no console do assinante. Código compartilhado de saúde intocado (marketplace usa).
- 2026-10-04: origem dos números do painel admin após a XG34: assinantes/membros/obras/status = contagens diretas; "Obras atrasadas" = `data_previsao < current_date AND status <> 'concluida'`; "Orçamento gerenciado" = `sum(obras.valor_total)` (escrito pelo dono); "Custo real" = `custo-real.ts`; Lucro = `financeiro` entradas − saídas pagas.
