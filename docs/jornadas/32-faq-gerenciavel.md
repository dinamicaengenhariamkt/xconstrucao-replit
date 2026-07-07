# Jornada — FAQ Gerenciável (Admin CRUD + Leitura por Visão)

> Status: pronto | Prioridade: alta | Wave: 7
> Última atualização: 2026-06-08
>
> **Criada em 2026-06-08** ao avaliar prontidão de produção. Corrige uma **dívida
> pré-existente**: o FAQ tinha base real semeada (perguntas dos sócios da
> X-Construção) mas o sistema não a exibia nas visões nem permitia o admin
> gerenciá-la. Esta jornada liga as pontas.

## 1. Contexto & Objetivo
A tabela `faq` ([shared/db/schema.ts](../../shared/db/schema.ts)) e o seed real
(~29 perguntas em [server/bootstrap-faq.ts](../../server/bootstrap-faq.ts), conteúdo
fornecido pelos sócios) já existiam. Mas três pontas estavam soltas, fazendo o FAQ
**fingir funcionar**:
1. O admin tinha tela e modal "Nova Pergunta", mas o submit era um `// TODO` — não persistia. `/api/admin/faq` só tinha **GET**.
2. `/api/contratante/faq` era um **stub que retornava `[]`** → contratante via FAQ vazia.
3. `/api/empreiteiro/faq` **não existia** → empreiteiro via FAQ vazia/erro.

Objetivo: tornar o FAQ **totalmente gerenciável pelo admin** (criar/editar/excluir)
e **visível corretamente** para contratante e empreiteiro, respeitando a segmentação
por `visao`.

> **Nota sobre "FAQ do admin":** o enum `faq_visao` tem apenas
> `contratante | empreiteiro | ambos`. Não há audiência "admin" — o admin é o
> **gestor** do FAQ (CRUD das perguntas das duas personas), não um leitor de FAQ
> próprio. A pergunta marcada `ambos` aparece para os dois.

## 2. Personas
- **Admin (gestor)**: cria, edita, ativa/desativa e exclui perguntas; define a
  `visao` (contratante/empreiteiro/ambos), categoria e ordem.
- **Contratante (leitor)**: vê perguntas com `visao IN (contratante, ambos)` e `ativo`.
- **Empreiteiro (leitor)**: vê perguntas com `visao IN (empreiteiro, ambos)` e `ativo`.

## 3. Fluxo ponta-a-ponta
```mermaid
flowchart LR
  A[Admin /admin/faq] -->|cria/edita/exclui| API[(POST/PATCH/DELETE /api/admin/faq)]
  API --> DB[(faq: question, answer, category, visao, ordem, ativo)]
  DB --> C[GET /api/contratante/faq filtra visao∈contratante,ambos]
  DB --> E[GET /api/empreiteiro/faq filtra visao∈empreiteiro,ambos]
  C --> CV[/contratante/faq]
  E --> EV[/empreiteiro/faq]
```

## 4. Telas envolvidas
- [app/admin/faq/page.tsx](../../app/admin/faq/page.tsx) — listagem + criar/editar/excluir (modal já existe, passa a persistir).
- [app/contratante/faq/page.tsx](../../app/contratante/faq/page.tsx) e
  [app/empreiteiro/faq/page.tsx](../../app/empreiteiro/faq/page.tsx) — passam a
  exibir dados reais (já consomem os hooks; só recebem dados quando os endpoints
  são corrigidos).

## 5. Componentes-chave
- [NovaPerguntaModal.tsx](../../features/admin/faq/components/NovaPerguntaModal.tsx) — form (question/answer/category/visao/ordem/ativo); o `onSubmit` passa a chamar as mutations.
- [faq-service.ts](../../features/admin/faq/api/faq-service.ts) — ganha `criarFaqAdmin`/`editarFaqAdmin`/`deletarFaqAdmin` + `listarFaqPorVisao`.
- [use-faq.ts](../../features/admin/faq/hooks/use-faq.ts) — ganha `useCriarFaq`/`useEditarFaq`/`useDeletarFaq` (React Query, invalida `['admin','faq']`).

## 6. Schema (Drizzle)
- **Sem schema novo.** Tabela `faq` já existe (`question, answer, category, visao
  enum [contratante|empreiteiro|ambos], ordem, ativo, criadoEm, atualizadoEm`).
  Seed real idempotente (`ON CONFLICT (id) DO NOTHING`) — **conteúdo dos sócios
  preservado**.

## 7. Endpoints
- A alterar: `GET /api/admin/faq` (existe) + **POST** (novo, criar).
- A criar: `PATCH /api/admin/faq/[id]` (editar) + `DELETE /api/admin/faq/[id]` (excluir).
- A corrigir: `GET /api/contratante/faq` (era stub `[]`) → filtra `visao IN (contratante, ambos) AND ativo`.
- A criar: `GET /api/empreiteiro/faq` → filtra `visao IN (empreiteiro, ambos) AND ativo`.
- Guard admin: `isAdminLike`; leitura das visões pode ser autenticada (área logada). Auditoria via `recordAudit` nas mutações.

## 8. Mocks a remover
- O stub `/api/contratante/faq` (retornava `[]`) e a ausência de `/api/empreiteiro/faq` — substituídos por leitura real filtrada.
- O `// TODO` do `NovaPerguntaModal` — substituído por mutation real.

## 9. Checklist de implementação
- [ ] `POST /api/admin/faq` (Zod + insert + audit) + `criarFaqAdmin`
- [ ] `PATCH`/`DELETE /api/admin/faq/[id]` + `editarFaqAdmin`/`deletarFaqAdmin`
- [ ] `GET /api/contratante/faq` real (filtro por visão) + `GET /api/empreiteiro/faq` (novo)
- [ ] `useCriarFaq`/`useEditarFaq`/`useDeletarFaq` (invalidate `['admin','faq']`)
- [ ] Ligar `NovaPerguntaModal.onSubmit` (criar vs editar) + exclusão na page
- [ ] Preservar seed real (não sobrescrever)

## 10. Critérios de aceite
1. `/contratante/faq` e `/empreiteiro/faq` exibem as perguntas semeadas conforme a visão (hoje voltam vazio).
2. Admin cria pergunta `ambos` → aparece na listagem admin **e** nas duas visões.
3. Admin cria pergunta `contratante` → aparece só no contratante.
4. Admin edita uma pergunta → reflete nas visões; exclui → some.
5. Pergunta com `ativo=false` não aparece nas visões (mas aparece no admin).
6. Query de verificação: `SELECT visao, count(*) FROM faq GROUP BY visao` reflete o conteúdo; o seed real continua presente.

## 11. Riscos / Pontos de atenção
- **Conteúdo é real (sócios):** não inventar/alterar texto; o seed usa `ON CONFLICT
  DO NOTHING` — edições do admin nunca são sobrescritas no reboot.
- **Não confiar no client:** `visao`/`ativo` validados server-side; mutações só admin.
- **Segmentação correta:** `ambos` aparece para os dois; teste os 3 valores.
- Reordenação drag-and-drop fica como melhoria futura (campo `ordem` já é editável no form).

## 12. Links cruzados
- Relacionada: J26 (config da plataforma — toggle do módulo FAQ), J01 (áreas logadas).
- Reusa: tabela `faq` + seed (J12-era), padrão de CRUD admin (anunciantes/clientes).

## 13. Gaps descobertos durante execução
> Doc viva. Registrar aqui o que apareceu no caminho.

- **2026-06-08** — Jornada criada ao avaliar prontidão de produção. Confirmado: FAQ
  tinha base real mas três pontas soltas (admin não salvava; leitura de contratante
  era stub `[]`; leitura de empreiteiro inexistente). Sem audiência "admin" no enum
  (admin é gestor). Implementada na mesma leva, CRUD completo + leitura por visão.
