# Jornada — Ajustes Finos de UX: Nova Obra (Contratante)

> Status: pronto | Prioridade: média | Wave: 8
> Última atualização: 2026-07-06

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
- [features/contratante/components/ContratanteLayout.tsx](../../features/contratante/components/ContratanteLayout.tsx) — container de scroll (item 3)
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
Nenhum.

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

## 10. Critérios de aceite
1. UF: abrir o select → cabe na tela com barra de rolagem interna, não estoura o viewport.
2. CEP: digitar `02939000` → exibe `02939-000`; cidade "São Paulo", UF "SP" e endereço preenchidos; toast aparece. Campo visivelmente mais estreito.
3. Scroll: rolar a página → **uma** única barra de rolagem (sem barra dupla).
4. Anexos: o texto mostra `(.png, .jpg, .jpeg, .webp, .pdf)`; anexar `.svg` → rejeitado com toast; `.png`/`.pdf` válido é aceito.
5. Selects opcionais: escolher Modalidade → aparece "x"; clicar "x" → volta a "Selecione".
6. Rascunho: "Salvar rascunho" com nome/endereço vazios → toast destrutivo + campos em vermelho; preenchendo os dois e salvando → sucesso e redireciona para Minhas Obras.
7. `npm run check` limpo; `data-testid` preservados (E2E de nova-obra seguem válidos).

## 11. Riscos / Pontos de atenção
- `max-h-72` é aplicado por instância — se novos selects forem adicionados nesta tela, lembrar do teto.
- Trocar `h-screen` por `h-svh`+`overflow-hidden` no layout afeta todas as páginas do contratante: validar que nenhuma delas dependia do body rolar (o `<main>` já era o dono do scroll, então o risco é baixo).
- CEP formatado no payload: se o schema estrito do servidor só aceitar dígitos, enviar cru — verificar em `insertObraSchema`.
- Validação de tipo no cliente é UX; a autoridade continua sendo o servidor (`validateUpload`).

## 12. Links cruzados
- Irmã de: [J38](38-ajustes-finos-ux-personas.md) (ajustes finos UX empreiteiro & contratante), [J34](34-ajustes-finos-ux-admin.md) (visão admin).
- Reusa / relacionada a: [J03](03-cadastro-obra.md) (cadastro de obra — mesma tela e fluxo de rascunho).

## 13. Gaps descobertos durante execução
> Doc viva. Uma linha por item, com data.

- 2026-07-06: Jornada criada. Lote inicial de 6 ajustes na Nova Obra do contratante (UF, máscara de CEP, duplo scroll, anexos, selects opcionais limpáveis, feedback do salvar rascunho). Guarda-chuva para próximos refinamentos das telas do contratante.
- 2026-07-06: Durante a verificação, o E2E `j03-nova-obra` falhava por um bug pré-existente do próprio spec: o helper de cleanup (`beforeEach`) apontava para `http://127.0.0.1:5000` (workflow de dev) enquanto o Playwright sobe o servidor na porta E2E (3010). O cleanup falhava em silêncio, as obras de teste se acumulavam e estouravam o limite de 1 obra aberta do plano free (POST /api/obras → 402 `LIMITE_PLANO`). Corrigido `BASE` para derivar de `E2E_BASE_URL`/`E2E_PORT`. O fluxo de publicação em si estava correto (CEP mascarado, cidade/UF autofill, todos os selects submetendo) — confirmado por dump dos campos antes do submit.
