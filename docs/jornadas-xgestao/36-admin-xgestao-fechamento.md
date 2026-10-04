# Jornada — XG36: fechamento do admin xgestão (visão macro com dado real)

> Status: implementada (falta verificação visual; testes na rodada final) | Prioridade: alta | Wave: xgestão-36
> Última atualização: 2026-10-04

## 1. Contexto & Objetivo

O admin xgestão ([XG06](06-admin-xgestao.md), [XG32](32-obras-por-assinante-admin.md)) já tem
painel, obras por assinante, detalhe da obra e financeiro da plataforma. Falta o que responde à
pergunta do Ramon: **"o que cada empreiteira está fazendo e quais obras precisam de atenção"**,
sempre com dado vindo do banco.

Regra visual: **sem identidade nova.** Reaproveitar tabelas, cards e filtros que já existem no
admin. Se o padrão desejado só existir no admin do marketplace, copiar para o xgestão; nunca
editar o do marketplace.

## 2. Personas

- **Admin / superadmin**: acompanha a base inteira, exporta, identifica obras e assinantes em risco.

## 3. Fluxo ponta-a-ponta

1. Painel: big numbers reais, incluindo **obras atrasadas** e **obras paradas**.
2. Clica no indicador → lista de obras já filtrada.
3. Lista de obras mostra prazo e valor pago; ordena e filtra por situação.
4. Assinantes: uso do plano, último acesso, situação da cobrança, fim do teste.
5. Exporta CSV de qualquer uma das listas.

## 4. Telas envolvidas

- [app/admin/xgestao/page.tsx](../../app/admin/xgestao/page.tsx) — painel
- [app/admin/xgestao/obras/page.tsx](../../app/admin/xgestao/obras/page.tsx) — lista de obras
- [app/admin/xgestao/obras/[id]/page.tsx](../../app/admin/xgestao/obras/[id]/page.tsx) — detalhe
- [app/admin/xgestao/assinantes/page.tsx](../../app/admin/xgestao/assinantes/page.tsx) — assinantes

## 5. Componentes-chave

- [features/xgestao/admin/server/dashboard.ts](../../features/xgestao/admin/server/dashboard.ts) — indicadores
- [features/xgestao/admin/server/obras.ts](../../features/xgestao/admin/server/obras.ts) — já devolve `dataPrevisao`/`valorPago` (`:23-26`), a tela não mostra
- [features/xgestao/admin/server/obra-detalhe.ts](../../features/xgestao/admin/server/obra-detalhe.ts) — lê um link público só (`:108`); a XG30 permite vários
- [features/xgestao/admin/server/escopo.ts](../../features/xgestao/admin/server/escopo.ts) — recorte xgestão (não pode vazar obra do marketplace)

## 6. Schema (Drizzle)

Sem tabela nova prevista. Fontes reais: `users.last_login_at`, `obras.data_previsao`,
`financeiro` (valor pago real, já que `obras.valor_pago` não tem escritor, ver XG22),
registros da obra (etapas, diário, financeiro, fotos) para "última atividade", `assinaturas`.

## 7. Endpoints

- `GET /api/admin/xgestao` — novos indicadores (atrasadas, paradas, no prazo)
- `GET /api/admin/xgestao/obras` — filtros `situacao=atrasada|parada|no_prazo`, ordenação
- `GET /api/admin/xgestao/assinantes` — uso do plano, último acesso, cobrança, fim do teste
- `GET /api/admin/xgestao/{obras,assinantes,financeiro}/export` — CSV

## 8. Mocks a remover

Nenhum. `fimTeste: null` fixo (`dashboard.ts:189,386`) vira dado real com a [XG35](35-teste-gratis-e-fim-do-teste.md).

## 9. Checklist de implementação

- [x] **Definições escritas antes de codar** (registrar no §13):
      atrasada = `data_previsao` < hoje e obra não concluída;
      parada = sem nenhum registro (etapa, diário, financeiro, foto) há N dias, N configurável;
      valor pago = soma real em `financeiro`, não `obras.valor_pago`
- [x] Painel: cards "Obras atrasadas" e "Obras paradas" clicáveis (abrem a lista filtrada); "Obras ativas" leva à lista. _("No prazo" ficou como filtro da lista, não card)_. Antes: (substituem o "Progresso médio" removido na [XG34](34-zero-percentual-dados-reais.md)), clicáveis
- [x] Lista de obras: colunas Prazo (vermelho se atrasada), Custo real e Última atividade; filtro por situação (`?situacao=` também na URL)
- [x] Assinantes: uso do plano (obras ativas / limite), último acesso, situação da cobrança, fim do teste
- [x] Detalhe da obra: todos os links públicos ativos, não só o primeiro
- [x] Exportação CSV de obras (com os filtros da tela) e assinantes. _(financeiro fica para depois: a tela de financeiro já mostra os números)_
- [x] Guard padronizado em todas as rotas `/api/admin/xgestao/**` (XG33 AJ-06)
- [ ] _(rodada final)_ Testes de integração: cada indicador bate com SQL direto num cenário semeado; obra do
      marketplace nunca aparece

## 10. Critérios de aceite

1. Cada número do painel tem SQL de conferência documentado e bate com o banco.
2. Clicar em "Atrasadas" abre a lista só com obras atrasadas.
3. CSV abre no Excel com acentos corretos (UTF-8 com BOM) e as mesmas linhas da tela filtrada.
4. Nenhuma obra do marketplace aparece em tela nem em CSV.

## 11. Riscos / Pontos de atenção

- "Parada" depende de N dias: sugestão 14, configurável na plataforma.
- `obras.valor_pago` sem escritor (dívida da XG22): o admin **não** pode usá-la.
- Exportação expõe dado de cliente: só admin, com audit log.

## 12. Links cruzados

- Depende de: [XG34](34-zero-percentual-dados-reais.md), [XG35](35-teste-gratis-e-fim-do-teste.md) (fim do teste)
- Relacionadas: [XG06](06-admin-xgestao.md), [XG32](32-obras-por-assinante-admin.md)

## 13. Gaps descobertos durante execução

- 2026-10-04: jornada criada a partir da auditoria do admin.
- 2026-10-04: implementação. Regras em `features/xgestao/admin/server/situacao.ts`: atrasada = previsão vencida e não concluída; parada = em andamento sem registro há N dias (`platform_settings.xgestao.diasObraParada`, padrão 14); "registro" = diário, financeiro, foto, ocorrência, documento, etapa alterada ou checklist marcado. `obras.data_previsao` é TEXT: convertido só quando casa `YYYY-MM-DD` (fora do padrão vira NULL, não derruba a consulta). SQL validado no banco de dev: 1.002 obras próprias, 0 atrasadas, 42 paradas (14 dias), custo real total R$ 117.793,72.
- 2026-10-04: uso do plano no admin segue a regra do limite de criação (obras não concluídas), não "em andamento". Teste grátis não entra na receita recorrente do financeiro.
- 2026-10-04: CSV com `;`, vírgula decimal e BOM (Excel pt-BR) e neutralização de fórmula (`=`,`+`,`-`,`@`). Cada exportação grava `admin.xgestao.export` em `audit_logs`. Rota `GET /api/admin/xgestao/export?tipo=obras|assinantes`.
