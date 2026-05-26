# Jornada — Perfis & Configurações

> Status: revisão | Prioridade: média | Wave: 3
> Última atualização: 2026-05-25

## 1. Contexto & Objetivo
Permitir que cada persona mantenha seus dados (PF/PJ, contato, especialidade no caso do empreiteiro, foto, preferências de notificação) e gerencie senha/sessão. É o "centro do usuário" — alimenta apresentação no marketplace (J04) e contato em obras (J05/J08/J13).

## 2. Personas
- **Contratante**: dados pessoais/empresa, preferências.
- **Empreiteiro**: dados + especialidade + portfólio + avaliação visível.
- **Admin**: configurações globais da plataforma (separadas das pessoais).

## 3. Fluxo ponta-a-ponta
1. Usuário entra em `configuracoes`.
2. Edita campos por seção (perfil, segurança, notificações, faturamento).
3. Salva → API persiste em `users` + `clientes`/`empreiteiras` correspondente.
4. Mudanças refletem em locais de exibição (avatar no header, card no marketplace, etc.).

## 4. Telas envolvidas
- [app/contratante/configuracoes/](../../app/contratante/configuracoes/)
- [app/empreiteiro/configuracoes/](../../app/empreiteiro/configuracoes/)
- [app/admin/configuracoes/](../../app/admin/configuracoes/)

## 5. Componentes-chave
- [features/contratante/components/](../../features/contratante/components/) (form sections)
- [features/empreiteiro/components/](../../features/empreiteiro/components/)
- [features/admin/shared/](../../features/admin/shared/)

## 6. Schema (Drizzle)
Existentes: `users` (name, email, phone, image, avatarUrl), `clientes` (cnpj_cpf, tipo), `empreiteiras` (especialidade, avaliacao).

**A criar/avaliar**:
- Tabela `user_preferencias` (userId, key, value) — para flags de notificação por canal/evento.
- Coluna `bio`/`portfolio` em `empreiteiras` (texto livre + URLs de imagens).

## 7. Endpoints
- `GET/PATCH /api/contratante/perfil`
- `GET/PATCH /api/empreiteiro/perfil`
- `POST /api/auth/change-password`
- `GET/PATCH /api/admin/configuracoes`
- `POST /api/upload/avatar` (storage de imagens — definir provider)

## 8. Mocks a remover
- Auditar uso de mocks em forms de configuração nas três personas (geralmente lêem do mock central).

## 9. Checklist de implementação
- [x] Endpoint `PATCH /api/contratante/perfil` persistindo em `users` + `clientes` _(Task #14)_
- [x] Endpoint `PATCH /api/empreiteiro/perfil` persistindo em `users` + `empreiteiras` _(Task #14)_
- [x] Trocar senha autenticado (com confirmação da senha atual) _(Task #19)_
- [x] Upload de avatar — Cloudflare R2 com presign + commit _(Task #26)_
- [x] Preferências de notificação persistidas em `user_preferencias` _(Task #14)_
- [x] Tela admin de configurações globais → `platform_settings` (Geral/Plataforma/Segurança/Integrações/Notificações) _(Task #14)_
- [x] Liberar superadmin nos gates `role !== "admin"` (perfil/admin, /admin/configuracoes, integrações, aprovação) _(Task #31)_
- [x] Zona de atuação do empreiteiro (UFs + cidades) editável + flag `naMinhaZona` server-side no marketplace _(Task #87)_
- [x] Filtro "Só na minha zona" + ordenação por zona match no marketplace (prioriza obras compatíveis) _(Task #93)_
- [x] Cidades da zona de atuação validadas contra base IBGE + match SQL accent-insensitive (sem duplicata "São Paulo"/"Sao Paulo") _(Task #95)_
- [ ] Excluir conta / desativar (soft delete) — apenas admin via aba Usuários hoje (Task #20). Self-service ainda não existe.

## 10. Critérios de aceite
1. Editar nome/foto de contratante → recarregar → ver mudança no header.
2. Editar especialidade de empreiteiro → ver mudança no card do marketplace (J04).
3. Trocar senha → logout → login com a nova.
4. Desligar notificação de "candidatura recebida" → criar candidatura → confirmar que não veio email/in-app.

## 11. Riscos / Pontos de atenção
- Storage de avatar: decidir antes provider e tamanho máximo.
- Preferências de notificação: ter padrão sane se a tabela estiver vazia.

## 12. Links cruzados
- Depende de: J01.
- Alimenta: J04 (card empreiteiro), J13 (preferências).

## 13. Gaps descobertos durante execução
> Doc viva. Registrar aqui o que apareceu no caminho e não estava no roteiro original. Uma linha por item, com data.

- 2026-05-25 (Task #31): 5 endpoints administrativos usavam `role !== "admin"` literal e barravam superadmin → aba Perfil do `/admin/configuracoes` ficava em Skeleton infinito; aprovação de cliente/empreiteira e PATCH em `/api/admin/configuracoes` + rotação de API key devolviam 403. Resolvido com helper `isAdminLike()` em `features/auth/api/auth-utils.ts` aplicado nos 5 endpoints.
- 2026-05-25 (Task #31): `app/api/auth/oauth-convert/route.ts:59` mantém o gate antigo de propósito — comportamento desejado para superadmin em conversão OAuth não é óbvio; **gap aberto** (avaliar em uma próxima task da J01).
- 2026-05-25 (Task #31): Aba **Plano & Uso** das visões contratante/empreiteiro segue só-leitura (sem billing real) — **gap aberto**, escopo natural da J11 (Planos & Assinatura).
- 2026-05-25 (Task #31): Em produção, `audit_logs` com `action='cli.bootstrap-superadmin'` está com 0 linhas (o bootstrap rodado via SQL Console pulou o INSERT final). Puramente histórico — não bloqueia, mas o helper `scripts/bootstrap-superadmin.ts` deveria reentregar idempotente.
- 2026-05-25 (Task #32): Self-service de **desativar/excluir conta** ainda não existe — hoje só admin via aba Usuários (Task #20). Gap registrado pra próxima task da J02 (rota `POST /api/auth/desativar-conta` + confirmação por senha + soft-delete já que `users.ativo` existe).
- 2026-05-25 (Task #41): J04 quer filtrar marketplace por `especialidade` do empreiteiro e por `zonaAtuacao` (raio/UFs cobertos), mas hoje `empreiteiras` só tem `especialidade` text + `especialidades text[]` + `raioKm` (uma cidade-base + raio). Faltam colunas tipo `zonaAtuacaoUfs text[]` e `zonaAtuacaoCidades text[]` (ou índice geo) pra o match marketplace ser server-side. Por ora J04 vai filtrar só por UF/cidade da obra; bater contra perfil do empreiteiro fica como evolução desta jornada. _Resolvido parcialmente (Task #87): colunas `zonaAtuacaoUfs`/`zonaAtuacaoCidades` adicionadas + UI editável + flag `naMinhaZona` no payload do marketplace. Geo/raio em km segue aberto._
- 2026-05-26 (Task #87): Marketplace hoje só **exibe** o selo "Na minha zona" — falta toggle de filtro "só mostrar obras na minha zona" + ordenação que empurra zone-match pro topo. Decisão consciente da Task #87 (mantém payload e UI mínimos); evolução natural quando J04 abrir filtros avançados. _Resolvido (Task #93): toggle "Só na minha zona" em `/empreiteiro/novas-obras` envia `?na_minha_zona=true` para `/api/obras`; ordenação padrão passa a priorizar `naMinhaZona DESC` no SQL quando o perfil tem zona configurada; empty-state com link para `/empreiteiro/configuracoes` quando o toggle está ligado sem zona configurada._
- 2026-05-26 (Task #87): Cidade é tag-input livre (sem normalização) — "São Paulo" e "Sao Paulo" contam como cidades diferentes. Match no SQL faz `LOWER(TRIM())` mas não remove acentos. Backlog: usar dicionário IBGE (mesma fonte que J03 já adota no autocomplete de obra) para fechar o input. Notificação "nova obra na sua zona" continua sendo J13. _Resolvido (Task #95): input migrado para autocomplete IBGE (`GET /api/cidades` via `shared/lib/ibge-municipios.ts`), PATCH `/api/perfil/empreiteiro` valida zonaAtuacaoCidades contra a base IBGE (422 em cidade desconhecida) e canonicaliza o nome com acento; match SQL em `/api/obras` agora usa `TRANSLATE()` pra ser accent-insensitive em ambos os lados. J03 na verdade nunca teve autocomplete IBGE (era ViaCEP), mas a nova fonte é reaproveitável._
- 2026-05-26 (Task #95): Sem extensão `unaccent` no Postgres — accent-insensitivity feita via `TRANSLATE()` com lista explícita de acentos PT-BR. Funciona, mas se aparecer caractere fora dessa lista (ex.: cedilha maiúsculo Ç em obra cadastrada com grafia rara), pode escapar. Migrar pra `CREATE EXTENSION unaccent` quando a infra permitir (Replit/Neon costuma aceitar). Cidade ambígua entre UFs (ex.: Campinas/SP vs Campinas/MG) ainda é gravada só pelo nome — UI mostra "Nome — UF" pra desambiguar, mas a coluna persiste só "Nome". Backlog: armazenar `{nome, uf}` quando essa diferença importar (não bloqueia nenhuma jornada hoje).
