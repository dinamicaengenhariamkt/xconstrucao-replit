# Jornada — XG32: obras por assinante no admin xgestão

> Status: pronto (verificação visual autenticada pendente) | Prioridade: média | Wave: xgestão-32
> Última atualização: 2026-09-28

## 1. Contexto & Objetivo

O administrador precisa localizar e acompanhar as obras de uma **empreiteira assinante do
xgestão** sem sair da listagem administrativa de obras. A jornada acrescenta um seletor de
assinante à tela existente de Obras e audita os números do dashboard para confirmar que o
recorte e seus indicadores correspondem a dados reais.

O cliente desta visão é a empreiteira assinante. Não é o contratante nem uma empreiteira
identificada apenas por ter obras no marketplace. A tela global `/admin/obras` continua
intacta; não se cria uma segunda página nem se mistura o recorte dos produtos.

## 2. Personas

- **Admin / Superadmin**: escolhe um assinante e inspeciona suas obras na listagem existente.
- **Empreiteira assinante do xgestão**: é o escopo dos dados exibidos; não opera esta tela.

## 3. Fluxo ponta-a-ponta

```mermaid
flowchart LR
  A[Admin xgestão] --> B[/admin/xgestao/obras]
  B --> C[Seletor de assinante]
  C --> D[GET /api/admin/xgestao/obras?empreiteira_id=...]
  D --> E[(Obras próprias do assinante xgestão)]
  E --> F[Lista na mesma tela]
  G[/admin/xgestao/] --> H[Auditoria dos indicadores]
```

Sem assinante selecionado, a lista preserva a visão de todas as obras do xgestão. Ao
selecionar uma empreiteira, a lista é filtrada por ela; limpar a seleção restaura a visão
geral. O dashboard é auditado separadamente: a auditoria verifica origem, recorte e
consistência dos indicadores, sem presumir que estejam corretos antes da verificação.

## 4. Telas envolvidas

- [app/admin/xgestao/obras/page.tsx](../../app/admin/xgestao/obras/page.tsx) — mantém a lista, busca, filtros e paginação; recebe o seletor de assinante na mesma tela.
- [app/admin/xgestao/page.tsx](../../app/admin/xgestao/page.tsx) — dashboard existente, sujeito a auditoria de dados e indicadores.
- [app/admin/xgestao/assinantes/page.tsx](../../app/admin/xgestao/assinantes/page.tsx) — referência da base de assinantes e dos dados de identificação.
- [app/admin/obras/page.tsx](../../app/admin/obras/page.tsx) — fora de escopo; a listagem global do marketplace não muda.

## 5. Componentes-chave

- [features/xgestao/admin/server/assinantes.ts](../../features/xgestao/admin/server/assinantes.ts) — verificar o serviço existente de assinantes e reutilizar a fonte/semântica de assinante, sem criar uma definição concorrente.
- [features/xgestao/admin/](../../features/xgestao/admin/) — localizar e reutilizar os hooks/componentes da listagem e do dashboard; não duplicar tabela, filtros ou KPIs.
- O seletor deve distinguir empreiteiras com entitlement xgestão dos usuários/empreiteiras do marketplace, e apresentar identificação suficiente para diferenciar homônimos.

## 6. Schema (Drizzle)

**Nenhuma alteração prevista.** O relacionamento já é expresso por `empreiteiras`, `obras`,
`user_roles` e assinaturas. Confirmar na auditoria que o seletor usa a mesma regra de
assinante/entitlement aplicada pelo admin xgestão, e que a lista de obras mantém o recorte
de obra própria (`cliente_id IS NULL` e `empreiteira_id` correspondente).

Não adicionar coluna, tabela ou migration para representar um filtro de interface.

## 7. Endpoints

- `GET /api/admin/xgestao/assinantes` — fonte existente a verificar/reutilizar para as opções do seletor.
- `GET /api/admin/xgestao/obras` — rota existente; `empreiteira_id` deve filtrar as obras do assinante selecionado sem remover busca, status ou paginação.
- `GET /api/admin/xgestao` — rota existente do dashboard, sujeita à auditoria; qualquer divergência encontrada deve ser corrigida no serviço xgestão correspondente, não na rota global do marketplace.

Não usar `/api/admin/obras` para implementar o filtro xgestão. A rota compartilhada não
substitui a autorização nem o recorte por produto definidos em XG06.

## 8. Comportamento e estados

### Seletor e lista de obras

- **Inicial/carregando opções:** indicar carregamento do seletor; não apresentar uma lista filtrada como se já correspondesse a uma escolha.
- **Todas as obras:** estado inicial sem seleção; mostra o conjunto xgestão existente, respeitando busca, status e paginação.
- **Assinante selecionado:** atualiza a mesma listagem com obras próprias daquela empreiteira assinante; estado selecionado deve ficar visível e ser removível.
- **Sem obras para o assinante:** estado vazio específico, com identificação do assinante e ação para limpar o filtro; não substituir silenciosamente por todas as obras.
- **Nenhum assinante disponível:** seletor vazio com mensagem clara; a tela ainda explica o estado da lista sem inventar opções.
- **Erro ao carregar opções ou obras:** mostrar erro explícito e permitir nova tentativa; não tratar falha como lista vazia.
- **Combinação de filtros:** manter busca e status dentro do assinante selecionado; ao mudar ou limpar o assinante, reiniciar a página se necessário para evitar uma página fora do intervalo.

### Dashboard — auditoria

O dashboard conta **acessos xgestão** pelo entitlement `user_roles`, inclusive perfis sem
empreiteira. O seletor de obras e a tela de assinantes enumeram somente empreiteiras com
perfil concluído; por isso a interface mostra os dois totais separadamente. Não se elimina
um acesso legítimo para forçar igualdade entre os números.

| Indicador | Fonte e semântica verificadas |
|---|---|
| Acessos xgestão / distribuição de planos | Entitlements xgestão; tier da assinatura xgestão ativa mais recente, senão free. Mesmo sem empresa cadastrada, uma assinatura ativa mantém seu tier. |
| Empreiteiras com perfil concluído | Entitlements que têm registro em `empreiteiras`; esse conjunto delimita as obras. |
| Obras gerenciadas, ativas, progresso médio, orçamento gerenciado e valor pago | Agregação de obras próprias (`cliente_id IS NULL`, empreiteira com entitlement); ativas = `em_andamento`; orçamento e valor pago são valores de obras, **não** receita da plataforma. |
| Distribuição de status / obras recentes | O mesmo recorte de obras; obras recentes são apenas a amostra limitada no dashboard, não o total. |
| Links públicos ativos | Contagem de **links** não expirados/não revogados do recorte, não de obras com link. |
| Ocorrências, pagamentos atrasados e obras pausadas | Respectivas tabelas de ocorrências/financeiro e status, vinculadas somente às obras do recorte. |

A listagem de obras calcula o total em consulta `count` separada da agregação do dashboard.
O teste de integração criou duas empreiteiras assinantes, duas obras próprias por empresa e
uma obra de marketplace com a mesma busca: a lista retornou 4, 2 por filtro; o dashboard
retornou 2 por empreiteira e pelo menos 4 obras no total (pode haver dados anteriores).
Busca, paginação, permissões e isolamento foram verificados pela suíte de API (5 testes).

## 9. Checklist de implementação

- [x] Auditar as fontes e regras de elegibilidade de assinante usadas no endpoint e na tela de assinantes.
- [x] Confirmar que as opções do seletor contêm somente empreiteiras com entitlement xgestão, nome e e-mail para diferenciar homônimos.
- [x] Adicionar o seletor à tela existente `app/admin/xgestao/obras/page.tsx`, sem criar página ou alterar `/admin/obras`.
- [x] Conectar seleção/limpeza ao filtro `empreiteira_id` da rota xgestão existente, preservando busca, status e paginação.
- [x] Implementar e revisar estados de carregamento, sem opções, sem obras, erro e tentativa novamente.
- [x] Auditar os indicadores de `app/admin/xgestao/page.tsx` até suas consultas/fontes persistidas; corrigir divergências encontradas e registrar evidências.
- [x] Verificar que obras de marketplace e obras de outra empreiteira não aparecem no filtro de um assinante.
- [x] Cobrir escopo, contagens, filtros, paginação e autorização com testes de integração de API (5 aprovados) e tipagem (`npm run check` aprovado).
- [x] Atualizar status deste documento e o índice do README após implementação e verificação.
- [ ] Verificar visualmente o seletor com sessão administrativa em navegador (o preview sem sessão abre o login).

## 10. Critérios de aceite

1. O admin xgestão encontra o seletor dentro da tela existente de Obras; não precisa navegar para uma nova página.
2. Sem seleção, a listagem mantém todas as obras do recorte xgestão e os filtros existentes.
3. Selecionar uma empreiteira assinante restringe a lista às obras próprias dela (`cliente_id IS NULL` e `empreiteira_id` selecionado); limpar a seleção restaura a listagem geral.
4. A lista de opções não inclui empreiteiras do marketplace sem entitlement xgestão; a identidade apresentada permite distinguir assinantes.
5. Busca, filtro de status e paginação continuam funcionando em combinação com o assinante selecionado.
6. Assinante sem obras, ausência de assinantes e falha de carregamento têm estados distintos e mensagens explícitas; uma falha não é apresentada como lista vazia.
7. A seleção não concede acesso a obras fora do recorte xgestão; IDs arbitrários não ampliam os dados retornados pelo servidor.
8. A auditoria do dashboard rastreia cada indicador à fonte e valida sua definição e recorte contra dados persistidos. Divergências encontradas são corrigidas e verificadas; nenhum indicador é declarado correto sem evidência.
9. A alteração não muda a tela `/admin/obras`, o dashboard global, nem as permissões ou os dados do marketplace.

## 11. Riscos / Pontos de atenção

- **Assinante não é sinônimo de empreiteira.** Usar apenas `empreiteira_id` para montar as opções pode incluir usuários sem entitlement xgestão; a elegibilidade precisa seguir a regra administrativa existente.
- **Filtro é conveniência, não autorização.** O servidor continua responsável por validar admin/escopo e aplicar o recorte de produto mesmo quando recebe um `empreiteira_id`.
- **Contagens inconsistentes:** métricas do dashboard podem usar definições distintas (obras próprias, obras ativas, assinantes com entitlement). Registrar denominador e predicado em vez de “corrigir” para um total presumido.
- **Não duplicar produto:** `/admin/obras` e seus dados de marketplace ficam fora da mudança.

## 12. Links cruzados

- Depende de: [XG06](06-admin-xgestao.md) (admin xgestão, lista de obras, assinantes e dashboard), [XG03](03-planos-limites-trial.md) (planos/entitlement)
- Relacionada: [XG31](31-multiusuario-empresa.md) (empresa e usuários; não confundir membro com assinante)

## 13. Gaps descobertos durante execução

> Doc viva. Registrar aqui o que aparecer durante a auditoria/implementação, com data e evidência.

- O retorno sem empreiteiras do dashboard antes classificava todos os acessos como free.
  Agora o tier é resolvido antes de retornar o estado vazio. O cadastro via API dos testes
  cria automaticamente uma empreiteira, portanto esse caso de assinatura ativa sem perfil
  ainda precisa de um teste próprio com fixture isolada.
- O preview sem autenticação não permite conferir visualmente a tela administrativa. O fluxo
  do seletor foi verificado por tipagem e pela API, mas falta teste de navegador autenticado.