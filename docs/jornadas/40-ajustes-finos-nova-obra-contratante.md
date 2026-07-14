# Jornada — Ajustes Finos de UX: Nova Obra (Contratante)

> Status: em andamento | Prioridade: alta | Wave: 8
> Última atualização: 2026-07-13
>
> Itens 1–16 concluídos e verificados. **Item 9 (upload R2) validado junto ao Replit** — credencial autentica, upload real chega ao bucket. Itens 10–16 (adapter/GET agregam dados reais, vazamentos financeiros corrigidos, itens 14/15 cobertos por E2E que passa em API-shape). Novos ajustes finos do contratante em andamento: Itens 17–20 (máscara de data, número no endereço + Maps, hover dos cards, capa no cadastro).

## 1. Contexto & Objetivo
Lote de ajustes finos de UX na tela **Nova Obra** do contratante (`/contratante/nova-obra`),
identificados em uso real. Irmã da J34 (visão admin) e J38 (empreiteiro & contratante) — **não é
feature nova**: é consistência e correção pontual, reusando o que já existe (`CepInput`, `masks.ts`,
o `Select` shadcn). Nenhuma regra de negócio muda: a API de criação de obra, o ViaCEP e o upload
continuam iguais. Esta jornada é o **guarda-chuva** dos próximos refinamentos das telas do
contratante, que serão adicionados como novos itens conforme surgirem.

## 2. Personas
- **contratante**: cadastra/edita obra na tela Nova Obra (endereço via CEP, escopo, anexos, rascunho).

## 3. Fluxo ponta-a-ponta
Sem fluxo de dados novo. Correções de apresentação, máscara de entrada e feedback de validação sobre
serviços já existentes (ViaCEP, `POST /api/obras`, upload de anexos).

## 4. Telas envolvidas
- [app/contratante/nova-obra/page.tsx](../../app/contratante/nova-obra/page.tsx) — formulário de nova obra (itens 1, 2, 4, 5, 6)
- [features/contratante/components/ContratanteLayout.tsx](../../features/contratante/components/ContratanteLayout.tsx) — container de scroll (itens 3, 8)
- [app/empreiteiro/novas-obras/[id]/aplicar/page.tsx](../../app/empreiteiro/novas-obras/[id]/aplicar/page.tsx) — candidatura do empreiteiro; upload de anexos com "Falha de rede no upload" (item 9)
- [features/obras/adapters.ts](../../features/obras/adapters.ts) — adapter do detalhe da obra com placeholders hardcoded (itens 10–14)
- [app/api/obras/[id]/route.ts](../../app/api/obras/[id]/route.ts) — GET não agrega entidades relacionadas (itens 10, 12, 13)
- [app/contratante/minhas-obras/[id]/page.tsx](../../app/contratante/minhas-obras/[id]/page.tsx) — detalhe da obra do contratante (hero/KPIs/abas — itens 10–15)
- [features/contratante/minhas-obras/components/CandidaturasCard.tsx](../../features/contratante/minhas-obras/components/CandidaturasCard.tsx) — parse de valores unitários (item 11)
- [app/api/contratante/candidaturas/[id]/aceitar/route.ts](../../app/api/contratante/candidaturas/[id]/aceitar/route.ts) — aceite não propaga valor/chat (itens 12, 14)
- [features/financeiro/lancamentos-service.ts](../../features/financeiro/lancamentos-service.ts) — quitação não atualiza `obras.valorPago` (item 15)
- [features/admin/obras/api/admin-obra-detalhe-service.ts](../../features/admin/obras/api/admin-obra-detalhe-service.ts) — detalhe admin com medições/valorPago hardcoded (item 16)
- [tests/e2e/j03-nova-obra-aparece-imediato.spec.ts](../../tests/e2e/j03-nova-obra-aparece-imediato.spec.ts) — correção da porta de cleanup (item 7)

## 5. Componentes-chave (reuso)
- [features/perfil/components/CepInput.tsx](../../features/perfil/components/CepInput.tsx) — input de CEP com máscara `00000-000` + busca ViaCEP + loading + "não encontrado"
- [shared/lib/masks.ts](../../shared/lib/masks.ts) — `formatCep`, `unformatCep`, `isCepValid`, `lookupCep`
- [shared/components/ui/select.tsx](../../shared/components/ui/select.tsx) — `Select` (Radix); teto de altura via `max-h-72` por instância
- [shared/lib/storage/validation.ts](../../shared/lib/storage/validation.ts) — `KIND_RULES` (allowlist de MIME espelhada no cliente)

## 6. Schema (Drizzle)
Nenhuma alteração.

## 7. Endpoints
Nenhum novo. `POST /api/obras` e o pipeline de upload (`/api/uploads/presign` → PUT → `/api/obras/:id/anexos`) inalterados.

## 8. Mocks a remover
Originalmente nenhum (jornada de UX). Na auditoria ponta-a-ponta (Itens 10–16) e na validação de 2026-07-13, os placeholders do detalhe da obra foram removidos (candidaturas/medições/empreiteiro/capa/valorPago/tarefas/checklists/equipe → dados reais). Restam, fora do escopo desta jornada, dois gaps honestos que exibem `—`/vazio (não número falso): macro-indicadores do Caixa admin (API externa) e documentos do cliente na admin (sem tabela). Ver Gaps.

## 9. Checklist de implementação

### Item 1 — Dropdown de UF (e demais selects) estourando a tela
- [x] Aplicar `className="max-h-72"` no `<SelectContent>` das instâncias desta tela (UF, Tipo, Modalidade, Materiais por, tipo-anexo). Causa: `SelectContent` usa `max-h-[--radix-select-content-available-height]` (≈ viewport inteiro); o `overflow-y-auto` já existe, só faltava o teto. Sem alterar o default global de `select.tsx`.

### Item 2 — CEP: máscara + largura + preservar ViaCEP
- [x] Substituir o `<Input>` do CEP pelo `<CepInput>` (máscara `00000-000`, busca ViaCEP embutida)
- [x] `onAutofill` preenche cidade/UF (sempre) e endereço (só se vazio), mantendo os toasts de ajuste (`onCepAutofill`). O `CepInput` já mostra "buscando…" e "CEP não encontrado" internamente
- [x] Remover o `useEffect` de ViaCEP inline e o state `cepLoading` (o `CepInput` gerencia)
- [x] `cleanPayload` envia o CEP formatado (`formatCep`); `CEP_REGEX = /^\d{5}-?\d{3}$/` aceita o hífen (verificado em `features/obras/schemas/index.ts`)
- [x] Reduzir a largura do campo (`max-w-[10rem]`), preservando `data-testid="input-cep"`

### Item 3 — Duas barras de rolagem
- [x] Em `ContratanteLayout.tsx`, trocar `flex h-screen w-full` por `flex h-svh w-full overflow-hidden` no wrapper externo. Causa: `SidebarProvider` usa `min-h-svh` (cresce além do viewport → barra do body) enquanto o `<main overflow-auto>` já rola. `overflow-hidden` deixa o `<main>` como único scroll.

### Item 4 — Anexos: extensões no texto + validação client-side
- [x] Texto de ajuda com as extensões em fonte menor: `(.png, .jpg, .jpeg, .webp, .pdf)`
- [x] Em `onPickFiles`, validar `f.type` contra allowlist `TIPOS_MIME_PERMITIDOS` (`image/png`, `image/jpeg`, `image/webp`, `application/pdf`); tipo fora (ex.: SVG) → pular + toast destrutivo. Espelha `KIND_RULES` do servidor (feedback imediato, o servidor segue como fonte de verdade)

### Item 5 — Selects opcionais sem opção de limpar (botão "x")
- [x] Componente `ClearableSelect` (na própria page): nos selects opcionais (Tipo, Modalidade, Materiais por), quando houver valor, exibe botão "x" que chama `field.onChange('')` (volta a "Selecione"). Não aplicado à UF (parte do endereço, vem do CEP) nem ao tipo-anexo (tem default 'outros')

### Item 6 — "Salvar rascunho" sem feedback quando faltam obrigatórios
- [x] Rascunho valida só `['nome','endereco']` via `form.trigger([...])`; se faltar, toast destrutivo "Para salvar o rascunho, preencha o nome e o endereço da obra." + erros inline nativos nos campos. Publicação mantém `form.trigger()` completo. Causa antiga: `submit('rascunho')` validava todo o schema e fazia `return` silencioso (só visível no Network)

### Item 7 — Correção do E2E `j03-nova-obra` (descoberto na verificação)
- [x] `tests/e2e/j03-nova-obra-aparece-imediato.spec.ts`: cleanup (`beforeEach`) apontava fixo para `:5000` (dev) em vez da porta E2E (3010) → obras de teste acumulavam e estouravam o limite do plano free. `BASE` passou a derivar de `E2E_BASE_URL`/`E2E_PORT`. Sem essa correção não era possível validar o fluxo de publicação. Ambos os testes (rascunho + publicar) passam.

### Item 8 — Overflow residual dentro da `main` (barra dupla / faixa branca)
- [x] Em `ContratanteLayout.tsx`, passar `className="h-svh min-h-0 overflow-hidden"` ao `<SidebarProvider>` e adicionar `min-h-0` à coluna flex interna (`div.flex.flex-col.flex-1.overflow-hidden`). Causa: mesmo após o Item 3, o wrapper mais externo do primitivo shadcn (`shared/components/ui/sidebar.tsx`) mantinha `min-h-svh` (min-height cresce além do viewport → barra no `body` que vaza com faixa branca abaixo do rodapé), e a coluna do meio sem `min-h-0` não deixava o `overflow-auto` da `<main>` limitar à altura disponível. `min-h-0` sobrescreve o `min-h-svh` do primitivo (via tailwind-merge, sem `!important`); `h-svh`+`overflow-hidden` travam o wrapper em 1 viewport. Distinto do Item 3, que já havia colocado `h-svh`+`overflow-hidden` no wrapper *interno* — aqui neutraliza-se o `min-h-svh` do wrapper do `SidebarProvider`, sem alterar o default global de `sidebar.tsx`. `<main>` fica como único scroll.

### Item 9 — Upload de anexos R2 (candidatura do empreiteiro): "Falha de rede no upload" ✅
> **Concluído e validado junto ao Replit (2026-07-13).** Cliente reportou erro ao anexar foto/documento na tela `/empreiteiro/novas-obras/[id]/aplicar` (card "Documentos Adicionais", kind `candidatura_anexo`). Fluxo: presign → **PUT direto do browser ao R2** → commit ([features/shared/hooks/use-uploads.ts](../../features/shared/hooks/use-uploads.ts)). A mensagem vinha do `xhr.onerror` do PUT (`use-uploads.ts:65`).
>
> **Causa raiz (comprovada por teste server-side contra o R2):** a **credencial R2 estava inválida** — TODA operação retornava `SignatureDoesNotMatch`/401, inclusive `ListBuckets`. Após regerar o token no Cloudflare e reiniciar o app (o `S3Client` é cacheado em módulo, `shared/lib/storage/r2.ts:13-14`, então trocar a secret exige restart), o upload passou a funcionar. Validado em uso real junto ao Replit — o objeto chega ao bucket (`public/obras/{obraId}/anexos/...`).

- [x] **Credencial validada.** Token R2 regerado no Cloudflare com permissão **Object Read & Write**; app reiniciado (para descartar o cache de módulo do `S3Client`). Upload real testado e confirmado junto ao Replit — o arquivo chega ao bucket. _(validado 2026-07-13)_
- [x] **Checksum do SDK:** `requestChecksumCalculation`/`responseChecksumValidation` = `"WHEN_REQUIRED"` no `S3Client` de `shared/lib/storage/r2.ts`. _(Task #96)_
- [x] **Separação dev/prod:** env `R2_KEY_PREFIX` suportada em `shared/lib/storage/key-builder.ts` — `buildKey` prefixa e `validateKeyForOwner` faz strip antes dos checks de segment count (operação pareada, sem risco de rejeitar keys válidas). _(Task #96)_
- [x] **CORS do bucket:** `scripts/r2-setup-cors.mjs` criado (PutBucketCorsCommand: AllowedMethods PUT/GET/HEAD, origens dev+prod, AllowedHeaders Content-Type, ExposeHeaders ETag). _(Task #96)_
- [x] **Mensagem amigável ao usuário final:** `use-uploads.ts` (`putWithProgress`) — onerror → "Não foi possível enviar o arquivo. Verifique sua conexão e tente novamente."; onload com status ≥300 → "Não foi possível enviar o arquivo (${status}). Tente novamente." Hook expõe `uploadError` e `retry()` para todas as telas com `useUpload`. _(Task #96)_

---

> **Itens 10–16 — Auditoria ponta-a-ponta do fluxo da obra (hardcodes + vazamentos financeiros).**
> Origem: 5 bugs reportados em vídeo pelo cliente + auditoria read-only (3 frentes) que revelou quebras estruturais no modelo financeiro por-obra. **Todos pendentes** — implementação junto com o R2 (Item 9). Raiz arquitetural comum: `GET /api/obras/[id]` ([app/api/obras/[id]/route.ts](../../app/api/obras/[id]/route.ts)) retorna só a row da obra + anexos, e o adapter [features/obras/adapters.ts](../../features/obras/adapters.ts) preenche o resto com constantes vazias/zero. Uploads de foto (medição/proposta/capa) usam o mesmo pipeline R2 → mesma causa do Item 9 (não duplicar).

### Item 10 — [CRÍTICO] Detalhe da obra montado por adapter com placeholders
- [x] `GET /api/obras/[id]` passar a agregar entidades reais e `dbToObraContratanteDetalhe`/`dbToObraContratante` ([features/obras/adapters.ts](../../features/obras/adapters.ts)) deixar de hardcodar. Campos afetados (linha → origem real):
  - `candidaturas: 0` (l.160) → COUNT de `candidaturas` pendentes da obra. **Crítico:** hero/KPI dizem sempre "0 propostas", contradizendo o `CandidaturasCard` real logo abaixo.
  - `financeiro.medicoes: []` (l.208) → tabela `medicoes` via `listMedicoesForObra(obraId)` (já existe e correto em [app/api/contratante/medicoes/_shared.ts:81](../../app/api/contratante/medicoes/_shared.ts) — só não é chamado). **Crítico:** aba Financeiro + alvos de Disputa vazios. (Este é o "medição some" do vídeo 1; "Ocorrências" é outra entidade — não é bug.)
  - `imagemUrl: DEFAULT_IMG` (l.150,237) → `obras.fotoCapaFileId`/`obra_fotos` (ver Item 13).
  - `empreiteiro.nome/iniciais` (l.157-158) → JOIN real (ver Item 12).
  - KPIs `diasRestantes: 0` (l.195) → `obras.dataPrevisao` − hoje; `tarefasConcluidas/Total: 0` (l.196-197) → agregação etapas/medições. Aparecem na cara do usuário no header.
  - `etapas/timeline/ocorrencias: []` (l.198,200,201) → tabelas respectivas (consumidos por `TabVisaoGeral`); `equipe: []` (l.202) e `checklists: []` (l.211) → abas Equipe/Checklists ficam mortas.
  - `financeiro.aditivos: 0` (l.205) → financeiro escopo obra (J10). Gap conhecido (sem tabela de aditivos ainda).
- [x] Remover acoplamentos ao hardcode: a string mágica `obra.empreiteiro.nome === 'Aguardando'` em [minhas-obras/[id]/page.tsx:114](../../app/contratante/minhas-obras/[id]/page.tsx) (usar flag real, ex.: `!empreiteiraId`) e o `Math.random()` como fallback de key em [CandidaturasCard.tsx:110](../../features/contratante/minhas-obras/components/CandidaturasCard.tsx).
- [x] **(fechado na validação 2026-07-13)** Restos que a 1ª implementação deixou hardcoded no detalhe e chegavam ao usuário: hero de **tarefas** mostrava `0/0` e abas **Checklists**/**Equipe** vinham vazias (adapter devolvia `tarefasConcluidas/Total:0`, `checklists/equipe:[]`). Corrigido: cada um consome sua **rota dedicada já existente** via novo hook [use-obra-detalhe-extra.ts](../../features/contratante/minhas-obras/hooks/use-obra-detalhe-extra.ts) (`/api/obras/[id]/{tarefas,checklists,equipe}`) — fonte única por entidade, sem inflar o GET nem duplicar fonte. `TabEquipe` agora recebe `equipe` (não `obra`) e ganhou empty-state. A string `'Aguardando'` virou a flag real `empreiteiroVinculado` no adapter; o `Math.random()` do parse de atividades virou id estável por índice. **Nota:** `etapas/timeline/ocorrencias/fotos` do adapter continuam `[]` **mas são código morto** — as abas correspondentes já buscam dados reais por hooks próprios (`EtapasJ06Card`, `useAtividadesObra`, `OcorrenciasJ06Card`, `TabFotos`), então não havia gap ali. `aditivos:0` segue como gap de schema (sem tabela de aditivos).

### Item 11 — Proposta: valores unitários exibidos como R$ 0,00 (vídeo 2)
- [x] Corrigir o parse em [CandidaturasCard.tsx:113](../../features/contratante/minhas-obras/components/CandidaturasCard.tsx#L113): `Number(a.valor.replace(/[^\d,.-]/g,'').replace(',','.'))`. Para `"R$ 1.500,00"` → `"1.500.00"` → `NaN → 0`. **Todo valor ≥ R$ 1.000 (com separador de milhar) vira R$ 0,00**; só o total (campo numérico separado) aparece certo. Fix: remover o ponto de milhar antes de trocar a vírgula por ponto (ou reusar util de máscara BR). Os itens JÁ são salvos (`candidaturas.atividades` JSON) e a UI de "Detalhamento" JÁ existe — é só o parse. Considerar também normalizar o valor no submit do empreiteiro ([aplicar/page.tsx](../../app/empreiteiro/novas-obras/[id]/aplicar/page.tsx)).

### Item 12 — Empreiteiro contratado sem dados + chat não funciona (vídeo 3)
- [x] **Dados reais:** `GET /api/obras/[id]` fazer JOIN `empreiteiras`+`users` por `obras.empreiteiraId` e o adapter parar de hardcodar `{ nome:'Empreiteira contratada', iniciais:'EC' }` (l.157-158). Os dados existem (`empreiteiras.nome/responsavel/email/telefone`); `ContatoEmpreiteiroCard` já renderiza esses campos — só recebe vazio hoje.
- [x] **Chat:** o aceite cria a thread via `garantirChatThread` em `after()` best-effort ([aceitar/route.ts:243](../../app/api/contratante/candidaturas/[id]/aceitar/route.ts)) — adicionar reconciliação/lazy-create se a thread não existir. Corrigir o botão "Enviar Mensagem" do `ContatoEmpreiteiroCard.tsx` que usa a **store errada** (`@features/empreiteiro/xchat/store/chat-store`), criando conversa efêmera local que a página do contratante nunca lê → deve criar/abrir a `chat_thread` real.

### Item 13 — Botão para trocar a foto de capa da obra (vídeo 4, sugestão)
- [x] Adicionar botão-ícone (pincel/editar) sobre o hero em [minhas-obras/[id]/page.tsx:163](../../app/contratante/minhas-obras/[id]/page.tsx) para trocar a capa. Reusar `FileUploader` ([features/shared/components/FileUploader.tsx](../../features/shared/components/FileUploader.tsx)) com `kind: 'obra_foto'` / padrão avatar de [configuracoes/page.tsx:215-336](../../app/contratante/configuracoes/page.tsx). Persistir em `obras.fotoCapaFileId` (**coluna já existe** — [shared/db/schema.ts:222](../../shared/db/schema.ts); hoje só usada pelo admin/J25) via ajuste no `PATCH /api/obras/[id]` (que hoje não trata esse campo). Adapter resolver `fotoCapaFileId`→URL (padrão em [obras-destaque-service.ts:178](../../features/admin/obras-destaque/api/obras-destaque-service.ts)) em vez de `DEFAULT_IMG`. **Depende do R2 (Item 9)** para o upload funcionar.

### Item 14 — [CRÍTICO / Vazamento V1] Valor da obra não reflete a proposta aceita (vídeo 5)
- [x] Na transação de aceite ([aceitar/route.ts:108-111](../../app/api/contratante/candidaturas/[id]/aceitar/route.ts)), adicionar `valorTotal: cand.valorProposta` ao `.set({...})` da obra (hoje grava só `empreiteiraId`+`status`). O valor aceito existe em `candidaturas.valorProposta` ([schema.ts:287](../../shared/db/schema.ts)) mas nunca é propagado → contratante planejou 350k, fechou 300k, e todas as telas seguem mostrando 350k. Alinha com o lock `OBRA_LOCKED_AFTER_BIND` ([obras/[id]/route.ts:164-178](../../app/api/obras/[id]/route.ts)) que já congela `valorTotal` pós-vínculo (hoje congela no valor errado). **Efeito colateral que também some:** obra com `valorTotal=0` bloqueia aprovação de medição (422 em [aprovar/route.ts:99](../../app/api/contratante/medicoes/[id]/aprovar/route.ts)).

### Item 15 — [CRÍTICO / Vazamento V2] `obras.valorPago` nunca é escrito
- [x] Fazer a quitação de pagamento (e/ou aprovação de medição) **recomputar `obras.valorPago`**. Hoje **nenhum código escreve `obras.valorPago`** (só `server/seed.ts`): `quitarLancamento` ([features/financeiro/lancamentos-service.ts](../../features/financeiro/lancamentos-service.ts)) marca `financeiro.status='pago'` mas não incrementa o agregado da obra. Resultado: "total pago / saldo / a receber / % recebido" por obra = **R$ 0 em toda parte** (contratante, empreiteiro, admin), mesmo com pagamentos reais na tabela `financeiro`. Reusar o padrão de `recomputeObraProgresso` (recompute a partir da tabela `financeiro`, não incremento avulso). A espinha dorsal aprovação→lançamento→progresso→quitação está correta sobre `financeiro`; o que vaza é a projeção nas colunas agregadas da obra.

### Item 16 — Alinhar visão ADMIN dos valores da obra
- [x] A tela admin **principal** `/admin/obras/[id]` tem hardcode próprio ([admin-obra-detalhe-service.ts:114-117](../../features/admin/obras/api/admin-obra-detalhe-service.ts): `medicoes:[]`, `valorPago:0`, `aditivos:0`) porque `GET /api/admin/obras/[id]` não consulta medições/financeiro — embora `app/api/admin/obras/[id]/medicoes/route.ts` exista e não seja usado. Passar a consumir dados reais, alinhando com `/admin/financeiro/obras/[id]` (que já é real). Beneficia-se dos Itens 14/15 (valorTotal/valorPago vivos) → os agregados admin (`clientes-admin-service.ts:56,102`, `empreiteiras-admin-service.ts:50`, `caixa-service.ts:706`) deixam de mostrar 0.
- [x] Garantir que "Ver como cliente" (impersonation) herde as correções do adapter (Item 10) — hoje reexibe os bugs do adapter do contratante. Gaps menores a anotar: `crescimentoPercent:0` (`caixa-service.ts:371,386`), documentos do cliente `[]` (`clientes-admin-service.ts:277-280`), indicadores macro placeholder (`macro-impacto-placeholder.ts`).

---

> **Itens 17–20 — Lote de ajustes finos pós-cadastro (reportado em uso real, 2026-07-13).** Após validar o upload (Item 9) junto ao Replit, o cliente reportou 4 refinamentos ao cadastrar uma obra como contratante: datas exibidas em ISO cru, endereço sem número (Google Maps abrindo local aproximado), cards de Minhas Obras sem o efeito hover padrão, e ausência de upload de capa no formulário. Nenhuma regra de negócio nova — consistência + 2 campos de endereço + capa opcional.

### Item 17 — Máscara de data amigável (DD/MM/AAAA) no projeto
- [x] Datas apareciam como ISO cru (ex.: `2026-07-18`) nas telas do contratante. **Fonte:** [features/obras/adapters.ts](../../features/obras/adapters.ts) passava `o.dataInicio`/`o.dataPrevisao` direto. Corrigido reusando `formatDate` de [shared/lib/formatters.ts](../../shared/lib/formatters.ts) (já gera DD/MM/AAAA pt-BR e trata o shift de fuso de `YYYY-MM-DD`) — formatar na fonte conserta o grid (`ObraCard`), `TabVisaoGeral`, detalhe e Financeiro/Documentos de uma vez.
- [x] Varredura: consolidados os `formatDate`/`formatData` locais duplicados (contratante `CandidaturasCard`; empreiteiro/admin: clientes, caixa, empreiteiras, marketplace-leads, disputas, obra-detalhe services) para o formatter compartilhado. **Não** alterados campos `prazo` de texto livre ("6 meses", "Vence em 3 dias"), inputs `<input type="date">` (precisam de YYYY-MM-DD), nem datas usadas em query/ordenação.

### Item 18 — Endereço com número obrigatório + Google Maps preciso
- [x] Adicionadas colunas `numero`/`complemento` em `obras` ([shared/db/schema.ts](../../shared/db/schema.ts); aplicar via `npm run db:push`). Form [nova-obra/page.tsx](../../app/contratante/nova-obra/page.tsx): `endereco` vira "Logradouro", novos campos "Número" e "Complemento". `numero` é **obrigatório ao publicar** ([features/obras/schemas/index.ts](../../features/obras/schemas/index.ts) `superRefine`, mesmo padrão do CEP/UF); opcional no rascunho.
- [x] Link "Abrir no Google Maps" ([LocalizacaoCard.tsx](../../features/shared/components/LocalizacaoCard.tsx) e [ObraDetalheContent.tsx](../../features/empreiteiro/novas-obras/components/ObraDetalheContent.tsx)) passa a montar a query com rua **+ número** + cidade/UF + CEP → pino mais próximo do real. Adapter/`build-detalhe-server` propagam `numero`/`complemento` (antes `bairro:''` fixo).

### Item 19 — Cards de Minhas Obras com hover padrão (efeito luminous)
- [x] O `ObraCard` ([features/shared/components/ObraCard/ObraCard.tsx](../../features/shared/components/ObraCard/ObraCard.tsx)) já tinha lift/shadow, mas faltava a linguagem visual dos cards do dashboard (`LuminousHoverCard`): linha `primary` fina no topo + gradiente sutil no hover. Grafados os mesmos spans `group-hover` no card (vale para contratante e empreiteiro, que compartilham o componente).

### Item 20 — Upload de imagem de capa opcional no cadastro + organização no R2
- [x] Novo campo opcional "Imagem de capa" em [nova-obra/page.tsx](../../app/contratante/nova-obra/page.tsx) (preview + trocar/remover). Valida no cliente: só imagem, ≤8MB, dimensão mín. 1200×675 (~16:9) lendo `naturalWidth/Height` → rejeita imagem pequena/pixelada. No submit, sobe via `useUpload({ kind: 'obra_capa' })` e vincula em `obras.fotoCapaFileId` (`PATCH /api/obras/[id]`). Se não enviar, mantém placeholder + troca posterior (Item 13).
- [x] **Organização no bucket R2 (pedido do cliente):** novo `kind` **`obra_capa`** em [key-builder.ts](../../shared/lib/storage/key-builder.ts)/[validation.ts](../../shared/lib/storage/validation.ts) grava em `public/obras/{userId}/capa/{ts}-capa.{ext}` — sub-pasta `capa/` irmã de `anexos/`, nome fixo `capa` (legível ao navegar no bucket, não o genérico `-upload`). `buildKey` + `validateKeyForOwner` pareados; presign/commit aceitam o kind.
- [x] **Hardening de segurança (IDOR) descoberto na revisão:** o `PATCH /api/obras/[id]` gravava `fotoCapaFileId` sem checar a posse do arquivo — um contratante poderia apontar a capa da própria obra para o arquivo **privado** de outro usuário e lê-lo pela signed URL que o GET resolve. Adicionada validação: o `userFiles.id` precisa pertencer ao requester (ou ser admin), espelhando o `invalid_capa` do admin/J25 → 422 "Capa inválida.". Fecha também o mesmo furo no fluxo de troca de capa do Item 13.

## 10. Critérios de aceite
1. UF: abrir o select → cabe na tela com barra de rolagem interna, não estoura o viewport.
2. CEP: digitar `02939000` → exibe `02939-000`; cidade "São Paulo", UF "SP" e endereço preenchidos; toast aparece. Campo visivelmente mais estreito.
3. Scroll: rolar a página → **uma** única barra de rolagem (sem barra dupla).
4. Anexos: o texto mostra `(.png, .jpg, .jpeg, .webp, .pdf)`; anexar `.svg` → rejeitado com toast; `.png`/`.pdf` válido é aceito.
5. Selects opcionais: escolher Modalidade → aparece "x"; clicar "x" → volta a "Selecione".
6. Rascunho: "Salvar rascunho" com nome/endereço vazios → toast destrutivo + campos em vermelho; preenchendo os dois e salvando → sucesso e redireciona para Minhas Obras.
7. `npm run check` limpo; `data-testid` preservados (E2E de nova-obra seguem válidos).
8. Overflow: em `/contratante/nova-obra` (form longo), rolar → **uma** única barra (dentro da `<main>`), **sem** barra no `body` e **sem** faixa branca abaixo do rodapé. Validar em ≥1 página curta do contratante (sem clipping) e nas telas sensíveis (`configuracoes` com nav sticky, `planos` com `min-h-full`, `chat`/xchat com painéis internos) — todas sem quebra. No mobile: sidebar como Sheet e header sticky preservados.
9. Upload (item 9): com o token R2 novo e os fixes aplicados, anexar `.jpeg` (109 KB) e `.pdf` em `/empreiteiro/novas-obras/[id]/aplicar` → sobem sem erro e ficam vinculados à candidatura no submit. Validação server-side: `ListBuckets` + presign+PUT em `_diag/` retornam 2xx (sem `SignatureDoesNotMatch`) e a URL assinada não contém `checksum`. Com `R2_KEY_PREFIX=dev`, uploads de dev caem em `dev/...` e `validateKeyForOwner` aceita a key prefixada. Simular falha (rede/credencial) → UI mostra mensagem amigável + opção de tentar novamente, com detalhe técnico só no console.
10. Detalhe da obra (item 10): abrir uma obra com candidaturas/medições reais → hero mostra o nº real de propostas (não "0"), a aba Financeiro lista as medições, os KPIs (dias restantes, tarefas) refletem dados reais, e as abas Equipe/Checklists/Visão Geral não ficam vazias por hardcode. Nenhum campo do detalhe é placeholder.
11. Proposta (item 11): empreiteiro cria proposta com item de R$ 1.500,00 → no "Detalhamento" do contratante aparece R$ 1.500,00 (não R$ 0,00); o total continua coerente com a soma.
12. Empreiteiro contratado (item 12): após aceite, o card/detalhe mostra nome e telefone reais do empreiteiro (clicável), e o chat do contratante lista a conversa com ele; "Enviar Mensagem" abre a thread real.
13. Foto de capa (item 13): no detalhe da obra há botão de trocar capa; enviar uma imagem (após R2 ok) → a foto passa a aparecer no hero (não mais a imagem padrão).
14. Valor aceito (item 14): aceitar proposta de R$ 300.000 numa obra planejada em R$ 350.000 → contratante, empreiteiro e admin passam a exibir R$ 300.000; medição fica aprovável mesmo sem valor manual.
15. valorPago vivo (item 15): aprovar medição e quitar o pagamento → "total pago / saldo / a receber / % recebido" por obra refletem o valor real (≠ R$ 0) em contratante, empreiteiro e admin.
16. Visão admin (item 16): `/admin/obras/[id]` exibe medições e financeiro reais, coerente com `/admin/financeiro/obras/[id]`; "Ver como cliente" mostra o mesmo que o contratante real vê.
17. Datas (item 17): em `/contratante/minhas-obras` (grid + detalhe) as datas aparecem como `18/07/2026`, não `2026-07-18`. Campos `prazo` de texto livre ("Vence em 3 dias") e inputs de data (YYYY-MM-DD) permanecem intactos. `npm run check` limpo.
18. Endereço/Maps (item 18): em `/contratante/nova-obra`, **publicar** sem número → erro inline "Número do endereço é obrigatório"; com número → publica. No detalhe da obra, "Abrir no Google Maps" abre o endereço com o número (pino no local, não aproximado).
19. Cards (item 19): passar o mouse num card de Minhas Obras → linha primary no topo + gradiente sutil + lift, alinhado aos cards do dashboard.
20. Capa (item 20): no cadastro, imagem < 1200×675 → rejeitada com toast; imagem 16:9 grande → aceita, e após salvar a capa aparece no hero/grid (não o placeholder). Sem enviar → placeholder + troca posterior seguem funcionando. No bucket R2 o objeto cai em `public/obras/{userId}/capa/{ts}-capa.{ext}` (legível, ao lado de `anexos/`).

## 11. Riscos / Pontos de atenção
- `max-h-72` é aplicado por instância — se novos selects forem adicionados nesta tela, lembrar do teto.
- Trocar `h-screen` por `h-svh`+`overflow-hidden` no layout afeta todas as páginas do contratante: validar que nenhuma delas dependia do body rolar (o `<main>` já era o dono do scroll, então o risco é baixo).
- Item 8 (`min-h-0`+`overflow-hidden` no wrapper do `SidebarProvider`) também afeta todas as telas do contratante (shell compartilhado). Risco baixo: auditadas as 14 páginas — todas roteiam conteúdo pela `<main>` já existente, nenhuma depende do scroll do body nem tem `fixed`/`sticky` ancorado ao wrapper. As 3 sensíveis (`configuracoes`, `planos`, `chat`) resolvem altura contra a `<main>` e seguem íntegras. **Manter o `div.h-svh` interno**: se algum dia for removido no mesmo arquivo, reauditar essas 3.
- CEP formatado no payload: se o schema estrito do servidor só aceitar dígitos, enviar cru — verificar em `insertObraSchema`.
- Validação de tipo no cliente é UX; a autoridade continua sendo o servidor (`validateUpload`).
- Item 9 (upload R2) está **bloqueado** pela credencial: nada de código será mexido até o token R2 novo chegar (decisão do cliente). Ao aplicar o prefixo dev/prod, lembrar que `buildKey`/`validateKeyForOwner` são pareados — mudar um sem o outro faz o commit rejeitar toda key (`validateKeyForOwner` confere `segments.length` fixo por kind). O escopo do token é a conta toda (cobre um futuro bucket de dev).
- Itens 10–16: várias abas do detalhe da obra **contornam** o adapter com hooks próprios (Timeline, Fotos, Ocorrências, Etapas, Saúde, Candidaturas). Ao corrigir o adapter/GET (Item 10), garantir que não haja **dupla fonte** conflitante — decidir se o GET vira a fonte única ou se cada aba segue com seu hook, evitando números divergentes. Itens 14 e 15 mexem em dinheiro (aceite e quitação): fazer dentro de transação, idempotente, e cobrir com teste de regressão. Item 15 deve **recomputar** `obras.valorPago` a partir da tabela `financeiro` (fonte de verdade), nunca incremento avulso, para não divergir em reprocessamento.

## 12. Links cruzados
- Irmã de: [J38](38-ajustes-finos-ux-personas.md) (ajustes finos UX empreiteiro & contratante), [J34](34-ajustes-finos-ux-admin.md) (visão admin).
- Reusa / relacionada a: [J03](03-cadastro-obra.md) (cadastro de obra — mesma tela e fluxo de rascunho).

## 13. Gaps descobertos durante execução
> Doc viva. Uma linha por item, com data.

- 2026-07-06: Jornada criada. Lote inicial de 6 ajustes na Nova Obra do contratante (UF, máscara de CEP, duplo scroll, anexos, selects opcionais limpáveis, feedback do salvar rascunho). Guarda-chuva para próximos refinamentos das telas do contratante.
- 2026-07-13: Overflow residual (Item 8): mesmo após o Item 3, restava barra dupla na Nova Obra — a `<main>` rolava internamente E o `body` vazava (faixa branca abaixo do rodapé). Causa: o wrapper mais externo do `SidebarProvider` (primitivo shadcn) mantinha `min-h-svh`, deixando o documento crescer além de 1 viewport, e a coluna flex do meio não tinha `min-h-0`. Corrigido só no shell `ContratanteLayout.tsx` (`className="h-svh min-h-0 overflow-hidden"` no `SidebarProvider` + `min-h-0` na coluna), sem tocar o primitivo. Auditadas as 14 páginas do contratante (todas SAFE — a de chat, de maior risco, fica mais robusta com o `min-h-0`).
- 2026-07-13: Upload R2 quebrado (Item 9): cliente reportou "Falha de rede no upload" ao anexar arquivo na candidatura do empreiteiro (`/empreiteiro/novas-obras/[id]/aplicar`). Investigação server-side contra o R2 real provou que a **credencial está inválida** — `SignatureDoesNotMatch` (403) em toda operação, inclusive `ListBuckets` e assinatura SigV4 manual (descarta CORS/checksum/endpoint como causa raiz). O print do cliente traz os mesmos valores do ambiente → precisam ser **regerados** no Cloudflare. Além da credencial, mapeados 4 ajustes que também precisam entrar (senão quebram assim que a credencial voltar): checksum do SDK 3.1045 (`WHEN_REQUIRED`), separação dev/prod via `R2_KEY_PREFIX`, script de CORS versionado, e mensagem amigável no erro de upload. **Decisão: só anotado agora**; código será feito quando o cliente tiver acesso ao bucket e passar os tokens (Claude atualiza as secrets do Replit).
- 2026-07-13: Auditoria ponta-a-ponta do fluxo da obra (Itens 10–16), a partir de 5 bugs reportados em vídeo + varredura read-only (3 frentes). Descobertas: (a) o detalhe da obra do contratante é montado por `features/obras/adapters.ts` com dezenas de placeholders (candidaturas:0, medicoes:[], empreiteiro "Empreiteira contratada", imagemUrl Unsplash, KPIs dias/tarefas:0, equipe/checklists/timeline/ocorrencias:[]), porque `GET /api/obras/[id]` só retorna a row + anexos e não agrega entidades já existentes no banco; (b) **vazamento V1** — o aceite de candidatura não propaga `candidaturas.valorProposta` para `obras.valorTotal` (valor exibido fica no planejado, e obra com valorTotal=0 chega a bloquear aprovação de medição); (c) **vazamento V2** — `obras.valorPago` NUNCA é escrito por nenhum código (só seed), então "pago/saldo/a receber" por obra é R$ 0 em contratante, empreiteiro E admin, apesar de os pagamentos serem reais na tabela `financeiro`; (d) a tela admin principal `/admin/obras/[id]` tem hardcode próprio (medicoes:[]/valorPago:0/aditivos:0) e diverge de `/admin/financeiro/obras/[id]` (real); (e) o parse de valores unitários da proposta zera qualquer valor ≥ R$ 1.000 (bug de separador de milhar). A espinha dorsal aprovação→lançamento `financeiro`→progresso→quitação está correta sobre a tabela `financeiro`; o que "vaza" é a projeção nas colunas agregadas da obra. **Decisão: só anotado (Itens 10–16)**; implementação junto com o R2. Nenhum código alterado nesta sessão.
- 2026-07-13 (validação independente): auditoria read-only + testes empíricos confirmaram o estado real vs. o que a implementação anterior marcou como feito. **Itens 11, 12, 14, 15, 16 realmente feitos** (14/15 com E2E que passa em API-shape/data — o único teste que falha é o de UI, por falta da lib de sistema `libatspi.so.0` no sandbox de validação, não é bug do código). **Item 10 estava PARCIAL**: GET/adapter já agregavam candidaturas/medições/empreiteiro/capa/valorPago, mas o hero de tarefas (`0/0`) e as abas Checklists/Equipe (`[]`) seguiam hardcoded e chegavam ao usuário — **fechado nesta sessão** (hook `use-obra-detalhe-extra.ts` consumindo as rotas dedicadas já existentes; flag `empreiteiroVinculado`; id estável no parse de atividades; `dbToNovaObra` usando `fotoCapaUrl`/`candidaturasCount` quando disponíveis). **Bug pré-existente corrigido:** o handler de troca de capa (Item 13) usava `result.fileId` (inexistente em `CommitResponse`) — o correto é `result.id`; quebrava `npm run check`. Após a sessão: **`npm run check` limpo (0 erros)**. **Item 9 (R2) reaberto**: credencial ainda retorna 401 em toda operação contra o bucket real — provável processo com chave antiga (cache de módulo do `S3Client`, exige restart) e/ou token sem permissão de Object; bucket em 0 B. Validação só pelo app do Replit reiniciado.
- 2026-07-13 (varredura de mocks no portal): auditoria ampla de código de produção (fora de testes/seed, excluindo pagamento/asaas) — **nenhum dado falso chega ao usuário**. Dashboards/KPIs/big-numbers de admin/contratante/empreiteiro/compartilhado persistem de verdade (Drizzle). Dois gaps honestos que **não enganam** (mostram `—`/vazio, não número fabricado), anotados aqui para rastreio, não como bug: (a) **macro-indicadores do Caixa admin** (`features/admin/caixa/macro-impacto-placeholder.ts`, Selic/IPCA/Dólar etc.) são placeholder `—` aguardando **API externa** (Banco Central/IBGE) — já registrado na J09; (b) **documentos do cliente na admin** (`features/admin/clientes/api/clientes-admin-service.ts:277-279`) retorna `[]` porque **não existe tabela** `cliente_documentos` no schema. Ambos dependem de trabalho futuro (integração externa / nova tabela), fora do escopo desta jornada.
- 2026-07-06: Durante a verificação, o E2E `j03-nova-obra` falhava por um bug pré-existente do próprio spec: o helper de cleanup (`beforeEach`) apontava para `http://127.0.0.1:5000` (workflow de dev) enquanto o Playwright sobe o servidor na porta E2E (3010). O cleanup falhava em silêncio, as obras de teste se acumulavam e estouravam o limite de 1 obra aberta do plano free (POST /api/obras → 402 `LIMITE_PLANO`). Corrigido `BASE` para derivar de `E2E_BASE_URL`/`E2E_PORT`. O fluxo de publicação em si estava correto (CEP mascarado, cidade/UF autofill, todos os selects submetendo) — confirmado por dump dos campos antes do submit.
- 2026-07-13: **Item 9 (upload R2) validado e fechado** — token R2 regerado no Cloudflare (permissão Object Read & Write) + app reiniciado (descarta o cache de módulo do `S3Client`). Upload real testado junto ao Replit: o objeto chega ao bucket (`public/obras/{userId}/anexos/...`). Sai da condição de bloqueado.
- 2026-07-13: **Lote Itens 17–20 (ajustes finos pós-cadastro)**, reportados em uso real. (17) Datas exibidas em ISO cru → formatadas na fonte (`adapters.ts`) via `formatDate` compartilhado + varredura das duplicatas em contratante/empreiteiro/admin (preservando `prazo` texto livre e inputs de data). (18) Endereço ganhou `numero` (obrigatório ao publicar) + `complemento` — novas colunas em `obras` (aplicar `npm run db:push`), form/schema/adapter atualizados; Google Maps monta a query com o número → pino preciso. (19) `ObraCard` recebeu o realce luminous (linha primary no topo + gradiente no hover), alinhando aos cards do dashboard. (20) Upload de **capa opcional** no cadastro com validação de dimensão mín. 1200×675 (~16:9); novo `kind` R2 `obra_capa` grava organizado em `public/obras/{userId}/capa/{ts}-capa.{ext}` (legível, irmão de `anexos/`). **Pendência operacional:** rodar `npm run db:push` para criar as colunas `numero`/`complemento` no banco antes de publicar obras com o novo campo.
