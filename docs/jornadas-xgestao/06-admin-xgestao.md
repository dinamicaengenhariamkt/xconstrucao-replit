# Jornada — XG06: Visão administrativa do xgestão

> Status: concluída | Prioridade: média | Wave: xgestão-6
> Última atualização: 2026-08-31

## 1. Contexto & Objetivo

O administrador precisa acompanhar o xgestão como produto distinto — quem são os assinantes, quantas obras gerenciam, como está a operação e quais valores estão registrados — sem alterar a visão completa do marketplace.

**Escopo deliberadamente filtrado.** A visão xgestão não espelha a suíte administrativa global: reúne somente assinantes, obras próprias, progresso, status, valores da obra, planos, links e alertas operacionais derivados de dados persistidos.

## 2. Personas

- **Admin / Superadmin**: acompanha a base de assinantes do xgestão.

## 3. Fluxo ponta-a-ponta

```mermaid
flowchart LR
  A[Admin] --> B[/admin/xgestao/]
  B --> C[(user_roles + empreiteiras + obras + assinaturas)]
  C --> D[Dashboard + obras + alertas + assinantes]
```

## 4. Telas envolvidas

- [app/admin/xgestao/page.tsx](../../app/admin/xgestao/page.tsx) — página enxuta de acompanhamento do xgestão.
- [app/admin/obras/page.tsx](../../app/admin/obras/page.tsx) — mantém a visão operacional global do marketplace.

## 5. Componentes-chave

- Constantes de navegação do admin — entrada xgestão visível para os escopos global e xgestão.
- Componentes de tabela e KPI já existentes em [features/admin/](../../features/admin/) — reaproveitar, não recriar.
- Escopo administrativo — `adminEscopo="global"` preserva o painel existente; `adminEscopo="xgestao"` usa uma allowlist positiva e não abre as seções do marketplace.
- Contexto visual — dentro de `/admin/xgestao`, o shell mostra somente o produto xgestão, sem retorno direto, menu, busca, notificações ou atalhos globais misturados.

## 6. Schema (Drizzle)

**Nenhuma alteração.** O discriminador de produto sai de graça do modelo:

| Produto | Predicado |
|---|---|
| Marketplace | `cliente_id IS NOT NULL` |
| xgestão | `cliente_id IS NULL AND empreiteira_id IS NOT NULL` |

Não é preciso coluna nova.

## 7. Endpoints

- `GET /api/admin/xgestao` — indicadores, obras recentes, alertas operacionais e assinantes, protegidos pelo escopo administrativo.
- `GET /api/admin/obras` — permanece disponível ao administrador global; a visão xgestão não depende dessa rota compartilhada.

## 8. Conteúdo administrativo

Lista de assinantes, com: nome da empreiteira, e-mail, quantidade de obras, plano/tier atual, fim do período de teste, data de entrada.

Indicadores: assinantes, obras ativas, progresso médio, orçamento gerenciado, valor registrado como pago, distribuição de status e planos e links públicos ativos.

Obras recentes: nome, empreiteira, cidade/UF, status, progresso, orçamento e presença de link público. A lista inclui exclusivamente obras próprias de empreiteiras cujo usuário mantém o entitlement xgestão.

Alertas operacionais: ocorrências abertas, lançamentos de obra atrasados e obras pausadas. São sinais derivados das tabelas operacionais, não notificações artificiais nem a central global do marketplace.

> **Escopo confirmado:** a visão administrativa xgestão é deliberadamente enxuta, somente leitura e sem chat, relatórios, configurações globais ou operações financeiras do marketplace. O administrador global continua vendo tudo como antes.
>
> **Ajuste de 2026-08-30:** o contador de *links públicos ativos* depende de [XG04](04-link-publico-obra.md). Não incluir painel de quota SINAPI enquanto [XG07](07-integracao-sinapi.md) estiver congelada.

## 9. Checklist de implementação

- [x] Confirmar o escopo mínimo com o cliente
- [x] `GET /api/admin/xgestao`
- [x] `app/admin/xgestao/page.tsx` com a lista e os 4 contadores
- [x] Entrada na navegação do admin
- [x] Filtro `produto` em `/admin/obras`
- [x] Verificar que a listagem de obras do admin continua correta para o marketplace
- [x] Isolar visualmente o menu xgestão sem alterar a autorização do marketplace
- [x] Expandir indicadores operacionais e financeiros usando dados reais do recorte xgestão
- [x] Exibir obras recentes e alertas operacionais sem depender de APIs globais
- [x] Remover o retorno direto ao marketplace do shell xgestão

## 10. Critérios de aceite

1. Admin acessa `/admin/xgestao` e vê a lista de assinantes com obras, plano e fim do teste.
2. Indicadores de obras, progresso, orçamento, valores pagos, status, planos e links batem com o banco.
3. Em `/admin/obras`, filtrar por produto separa corretamente obras de marketplace das de xgestão.
4. Sem filtro, a listagem continua mostrando tudo, como hoje.
5. Verificação: a contagem da tela bate com `SELECT COUNT(*) FROM user_roles WHERE role = 'xgestao'`.
6. Um administrador global ou superadmin continua chegando a `/admin/financeiro` e acessando as seções do marketplace.
7. Um administrador com `adminEscopo="xgestao"` chega a `/admin/xgestao`, não recebe cadastro administrativo público e é bloqueado server-side fora da allowlist xgestão.
8. Um admin ou superadmin que entra pela tela contextual do xgestão é reconhecido sem precisar trocar para uma tela de login separada e chega a `/admin/xgestao`.
9. Em `/admin/xgestao`, moderação, financeiro, anúncios, leads, saúde, busca, notificações, configurações e demais operações globais não aparecem no shell.
10. Um admin global ou superadmin continua vendo o menu completo ao voltar para uma rota administrativa do marketplace.
11. A lista operacional contém somente obras próprias de usuários que mantêm o entitlement xgestão.
12. Os alertas resumem ocorrências abertas, pagamentos de obra atrasados e obras pausadas sem consultar a central global de notificações.

## 11. Riscos / Pontos de atenção

- **Risco de escopo, não técnico.** A visão permanece resumida e somente leitura para não virar uma segunda suíte administrativa.
- Um empreiteiro pode ser assinante do xgestão **e** ter atividade no marketplace. A lista deve deixar claro que enxerga o recorte xgestão, não o usuário inteiro.
- Superadmin é sempre global; para uma operação restrita, criar uma conta `admin` separada com `adminEscopo="xgestao"` em vez de rebaixar o superadmin.

## 12. Links cruzados

- Depende de: XG01 (role aditiva), XG03 (planos), XG04 (contagem de links ativos)
- Relacionada: J09/J18 (financeiro admin), J33 (saúde da plataforma)

## 13. Gaps descobertos durante execução

> Doc viva. Registrar aqui o que apareceu no caminho e não estava no roteiro original. Uma linha por item, com data.

- **2026-08-30 — contexto de acesso:** role continua sendo `admin`/`superadmin`; o recorte xgestão é uma dimensão adicional. O destino pós-login e o guard server-side precisam considerar `adminEscopo`, enquanto valores ausentes continuam globais por compatibilidade.
- **2026-08-30 — preservação do marketplace:** o painel global não é duplicado nem reconfigurado. A visão xgestão usa uma allowlist própria e não recebe acesso indireto a configurações, planos ou operações financeiras do marketplace.
- **2026-08-31 — login único do produto:** `/login?perfil=xgestao` aceita a autenticação de admin/superadmin e empreiteiro; o contexto só define o destino seguro, nunca a permissão, que continua baseada em role, escopo e entitlement no servidor.
- **2026-08-31 — shell por contexto:** a rota `/admin/xgestao` usa navegação mínima mesmo para admin global ou superadmin. Isso é separação visual de produto, não autorização; o retorno direto ao marketplace foi removido e contas restritas continuam presas à allowlist server-side.
- **2026-08-31 — painel enriquecido:** a expansão usa uma projeção própria baseada no entitlement xgestão. Valores financeiros pertencem às obras do produto; caixa, cobranças e notificações globais do marketplace permanecem fora.
