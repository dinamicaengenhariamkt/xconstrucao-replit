# XG44 — Admin: visão por assinante (Lote A)

**Status:** implementado no dev em 10/11/2026, sem commit (Ramon commita pelo Replit).
**Pedido:** Ramon, 10/11/2026. Admin sem plano; visão macro na home e micro em páginas
próprias, com links entre elas. Lotes B (funil do teste, cancelamentos, receita por plano)
e C (engajamento e histórico mensal) ficam para depois.

## 1. Páginas

| Página | O que mostra | Leva a |
|---|---|---|
| `/admin/xgestao` (home) | Indicadores de antes + **Situação das assinaturas** (contagem por situação) + **Assinantes que pedem atenção** (até 6, do mais urgente). A tabela completa de assinantes saiu da home | Lista filtrada por situação; detalhe do assinante |
| `/admin/xgestao/assinantes` | Lista com filtro por situação na URL (`?situacao=em_teste`, `atencao`, …), busca por empresa/responsável/e-mail, plano e situação com prazo, uso dos 3 limites, obras, orçamento, atrasos | Detalhe do assinante |
| `/admin/xgestao/assinantes/[id]` (novo) | Plano e situação, uso do plano, saúde das obras, obras com situação/custo/links, lucro das obras, equipe, histórico da assinatura e eventos | Cada obra; lista de obras filtrada |
| `/admin/xgestao/obras/[id]` | Como antes; o nome da empresa agora leva ao detalhe do assinante | Detalhe do assinante |

## 2. Situação do assinante

Calculada em `features/xgestao/admin/lib/situacao-assinante.ts` a partir de
`assinaturaXgestaoVigente` (a mesma regra da escrita e da aba Plano). A assinatura
considerada é escolhida na mesma ordem de `situacaoPlanoXgestao` (ativa > inadimplente >
demais; a mais recente).

| Código | Quando | Data mostrada |
|---|---|---|
| `em_teste` | Teste dentro do prazo | Fim do teste |
| `teste_tolerancia` | Teste vencido há menos de 24h | Momento do bloqueio |
| `pago` | Assinatura paga ativa | Próxima cobrança |
| `cancelamento_agendado` | Cancelou, ainda no período pago | Fim do acesso |
| `inadimplente` | Pagamento recusado, dentro dos 7 dias | Fim da carência |
| `somente_leitura` | Sem plano vigente | Motivo: teste encerrado, cancelada, carência esgotada, sem plano pago |
| `sem_teste` | Nunca abriu o xgestão (o teste começa no 1º acesso) | — |

## 3. Uso do plano

Mesma contagem que o app usa para liberar ou recusar um cadastro:

- **Obras:** não concluídas, contra `obrasAtivas`.
- **Pessoas:** titular + membros ativos + convites pendentes (`contarVagasEquipe`), contra `pessoasEmpresa`.
- **Links:** links ativos e não expirados na obra que tem mais links, contra `linksPorObra`
  (Premium sem limite; catálogo antigo com o teto técnico de 5).

Níveis: livre, perto (≥ 80%), no limite, acima (rebaixou de plano), sem limite, bloqueado
(somente leitura).

## 4. Atenção

Do mais grave ao menos grave: pagamento pendente, teste na tolerância, acima do limite
(críticos); teste acabando em até 7 dias, cancelamento agendado (atenção); no limite, perto
do limite, somente leitura com obras cadastradas (informativos, oportunidade de upgrade ou
remarketing).

## 5. API

- `GET /api/admin/xgestao` acrescenta `assinaturas: { resumo, atencao }`.
- `GET /api/admin/xgestao/assinantes` acrescenta por linha `situacao`, `usoPlano`,
  `consolidado` e `atencao`; os campos antigos seguem iguais.
- `GET /api/admin/xgestao/assinantes/:id` (novo): só admin; `:id` é o usuário titular,
  validado como UUID antes do banco; 404 para membro de equipe, conta sem xgestão ou id
  inexistente. Eventos saem só com tipo e data, sem o payload do gateway.
- `GET /api/admin/xgestao/export?tipo=assinantes`: coluna Situação com o rótulo novo e
  colunas novas no fim (prazo, pessoas, links, orçamento, custo real, atrasos, ocorrências,
  pagamentos atrasados, atenção).

## 6. Testes

- Unitário: `tests/unit/xgestao-admin-assinantes.test.ts` (situação, escolha da assinatura,
  uso, limites, atenção, resumo, rótulos, estrutura das páginas).
- Integração: `tests/e2e/integration/xgestao-admin-assinantes.integration.spec.ts` (números
  conferidos com dados conhecidos, jornada teste → tolerância → somente leitura → pago →
  cancelamento → inadimplente, acesso e 404).
- Navegador: `tests/e2e/xgestao-admin-assinantes.browser.spec.ts` (home → lista filtrada →
  detalhe → obra → volta, 404 e celular).
