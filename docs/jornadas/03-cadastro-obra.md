# Jornada — Cadastro de Obra

> Status: revisão | Prioridade: alta | Wave: 1
> Última atualização: 2026-05-05

## 1. Contexto & Objetivo
Contratante registra uma obra na plataforma — escopo, prazo, orçamento, endereço, fotos. É o gatilho que destrava o marketplace (J04) e tudo que vem depois (candidatura, execução, pagamento).

## 2. Personas
- **Contratante**: cria, lista, edita, conclui obras próprias.
- **Empreiteiro**: vê em J04 (somente leitura, com flag de "disponível").
- **Admin**: vê todas, modera, intervém em casos.

## 3. Fluxo ponta-a-ponta
```mermaid
flowchart LR
  C[Contratante /nova-obra] --> P[POST /api/obras]
  P --> O[(obras)]
  O --> M[/contratante/minhas-obras]
  O --> Mk[Marketplace J04]
```

1. Contratante abre `/contratante/nova-obra`.
2. Preenche formulário (nome, tipo, complexidade, descrição, CEP/endereço, datas, orçamento estimado).
3. `POST /api/obras` (ou `/api/contratante/minhas-obras`) cria row em `obras` com `clienteId` do usuário logado.
4. Redireciona para `/contratante/minhas-obras` listando a recém-criada.
5. Obra fica visível em J04 com status `planejamento`.

## 4. Telas envolvidas
- [app/contratante/nova-obra/](../../app/contratante/nova-obra/) — formulário
- [app/contratante/minhas-obras/](../../app/contratante/minhas-obras/) — lista + detalhe
- [app/admin/obras/](../../app/admin/obras/) — visão admin (todas as obras)

## 5. Componentes-chave
- [features/contratante/nova-obra/](../../features/contratante/nova-obra/) — form, hooks, types
- [features/contratante/minhas-obras/](../../features/contratante/minhas-obras/) — list, detalhe
- [features/contratante/detalhes-obra/](../../features/contratante/detalhes-obra/)
- [features/obras/](../../features/obras/) — service + schemas compartilhados

## 6. Schema (Drizzle)
Tabela `obras` em [shared/db/schema.ts](../../shared/db/schema.ts):
`id, nome, endereco, clienteId, empreiteiraId (null até J05), status, valorTotal, valorPago, progresso, dataInicio, dataPrevisao`.

**A avaliar** (campos pedidos pelo formulário mas não no schema atual):
- `tipo` (residencial/comercial/reforma/...), `complexidade`, `descricao`, `cep`, `cidade`, `estado`.
- Anexos (fotos do local, documentos): nova tabela `obra_anexos`.

## 7. Endpoints
- `GET/POST /api/obras` — [app/api/obras/route.ts](../../app/api/obras/route.ts)
- `GET/PATCH/DELETE /api/obras/[id]`
- `GET /api/contratante/minhas-obras` — [app/api/contratante/minhas-obras/](../../app/api/contratante/minhas-obras/)
- `POST /api/upload/obra-anexo` (a criar)

## 8. Mocks a remover
- [features/contratante/minhas-obras/mocks/](../../features/contratante/minhas-obras/mocks/) — auditar se ainda é usado em fallback de detalhe.
- Mock de detalhe ([obra-detalhe.mock.ts](../../features/contratante/minhas-obras/mocks/obra-detalhe.mock.ts)) — a substituir por `/api/obras/[id]`.

## 9. Checklist de implementação
- [ ] Confirmar que `POST /api/obras` está vinculando ao `clienteId` do usuário logado (e não pegando do body)
- [ ] Estender schema `obras` com `tipo`, `complexidade`, `descricao`, `cep`, `cidade`, `estado` (migration)
- [ ] Criar tabela `obra_anexos` + endpoint de upload
- [ ] Substituir uso de [obra-detalhe.mock.ts](../../features/contratante/minhas-obras/mocks/obra-detalhe.mock.ts) por fetch real
- [ ] Validar campos obrigatórios com `insertObraSchema` no backend
- [ ] Listar paginado em `/contratante/minhas-obras` (não puxar tudo)
- [ ] Edição de obra (PATCH) na tela de detalhe

## 10. Critérios de aceite
1. Logado como contratante, criar obra → aparece em "minhas-obras" e em J04 para empreiteiros.
2. `SELECT * FROM obras WHERE cliente_id = '<uid>'` retorna a obra recém-criada.
3. Tentar criar obra sem login → bloqueado.
4. Editar valor total → ver atualizado no admin (J09 quando pronto).

## 11. Riscos / Pontos de atenção
- Decidir o que torna obra visível em J04: status `planejamento` vai pro marketplace? ou precisa flag explícita `publicada`?
- Anexos: tamanho máximo, tipos permitidos, antivírus se for documento sensível.
- Geolocalização do endereço (futuro): não bloquear esta jornada por isso.

## 12. Links cruzados
- Depende de: J01.
- Alimenta: J04, J05, J06, J07, J08.

## 13. Gaps descobertos durante execução
> Doc viva. Registrar aqui o que apareceu no caminho e não estava no roteiro original. Uma linha por item, com data.

- _Sem registros ainda._
