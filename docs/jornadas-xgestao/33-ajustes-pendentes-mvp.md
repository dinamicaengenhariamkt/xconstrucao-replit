# Jornada — XG33: ajustes pendentes do MVP (backlog vivo)

> Status: parcial (roteiro de obra aprovado; Asaas real e publicação legal bloqueados) | Prioridade: alta | Wave: xgestão-33
> Última atualização: 2026-10-04

Homologação atual: [relatório por requisito e execução](40-relatorio-homologacao-mvp.md). AJ-05 teve os três cenários de exclusão executados e passou; AJ-07 teve criação, edição, capa/PDF reais, recarga e exclusão em desktop/celular aprovadas. A inspeção visual completa das demais telas e AJ-02 não estão sendo declarados concluídos.

## 1. Contexto & Objetivo

Auditoria de 2026-10-04 cruzou XG01 a XG32 com o código. As telas estão entregues; o que falta
são ajustes soltos, finos ou médios, que não justificam uma jornada cada. Esta jornada é o
**lugar único** para eles: cada item tem ID (`AJ-NN`), prioridade e checkbox. Ajuste novo que
aparecer no teste entra aqui, no fim da lista, com data.

Regra que vale para todos os itens: **o produto em foco é o xgestão.** Nada no marketplace é
alterado ou apagado. Se um item precisar de tela ou componente que só existe no marketplace,
copia-se para o xgestão mantendo a identidade visual atual.

## 2. Personas

- **Assinante xgestão (empreiteiro dono)**: paga, gere obras, compartilha link.
- **Membro da empresa**: gestor ou colaborador convidado ([XG31](31-multiusuario-empresa.md)).
- **Admin da plataforma**: acompanha assinantes e obras ([XG06](06-admin-xgestao.md)).

## 3. Fluxo ponta-a-ponta

Não há fluxo único. Cada item abaixo descreve seu próprio "antes → depois".

## 4. Telas envolvidas

- [app/planos/sucesso/page.tsx](../../app/planos/sucesso/page.tsx) — retorno do checkout (hoje do marketplace)
- [app/xgestao/configuracoes](../../app/xgestao/configuracoes) — aba Plano, destino correto do retorno
- [features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx](../../features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx) — `href="#"`

## 5. Componentes-chave

- [features/planos/assinatura-service.ts](../../features/planos/assinatura-service.ts) — monta o `successUrl` do checkout
- [features/xgestao/components/XGestaoPlanosSection.tsx](../../features/xgestao/components/XGestaoPlanosSection.tsx) — dispara o checkout xgestão

## 6. Schema (Drizzle)

Nenhuma alteração prevista. AJ-05 pode exigir FKs reais (decidir no item).

## 7. Endpoints

- `POST /api/assinaturas/checkout` — `successUrl` passa a depender da persona
- `POST /api/webhooks/gateway` — só verificação (AJ-02)

## 8. Mocks a remover

Nenhum mock encontrado nas rotas do xgestão (`features/xgestao`, `app/xgestao`, `app/admin/xgestao`,
`app/publico`, `app/api/xgestao`). Regra mantida: **nenhum dado de tela vem de mock**.

## 9. Checklist de implementação

### Alta (antes de liberar para testadores)

- [x] **AJ-01 · Retorno do checkout cai no marketplace.** _(2026-10-04: `successUrl` por persona em `assinatura-service.ts`; nova tela `app/xgestao/planos/sucesso/page.tsx` lê `?persona=xgestao` e volta para `/xgestao/dashboard`; marketplace intocado. Validação real fica no AJ-02.)_ `successUrl` fixo em `/planos/sucesso`
      ([assinatura-service.ts:231](../../features/planos/assinatura-service.ts)); a página consulta
      `/api/perfil/plano` sem `?persona=xgestao` ([sucesso/page.tsx:20](../../app/planos/sucesso/page.tsx))
      e o botão leva para `/empreiteiro/dashboard` (`:82`). Fazer: persona xgestão volta para uma
      tela do xgestão (rota própria sob `/xgestao`, copiando a de sucesso), lendo o plano xgestão e
      levando para `/xgestao/dashboard`. Fluxo do marketplace intocado.
- [ ] **AJ-02 · Troca de plano ponta a ponta no sandbox.** _(2026-10-04: checkout criado com sucesso no dev (Basic, R$ 89; a página do Asaas abre com os dados certos). O pagamento automatizado é barrado pelo reCAPTCHA do Asaas, precisa ser feito por uma pessoa. **Bloqueio:** a conta Asaas sandbox desta chave tem 0 webhooks cadastrados, então nenhum pagamento ativa plano até cadastrar `POST /api/webhooks/gateway` com token.)_ Assinar com cartão de teste do Asaas e
      confirmar no banco: `assinaturas` com `persona='xgestao'` ativa e limite novo valendo.
      Observação: no shell do workspace a variável `ASAAS_WEBHOOK_TOKEN` não aparece (pode estar só
      nos secrets do deploy). O teste é que decide; se o plano não ativar, conferir o secret.
- [x] **AJ-03 · Links mortos.** _(2026-10-04: falso positivo. Os três `href="#"` são a paginação shadcn com `preventDefault`; funcionam.)_ `href="#"` em
      [MinhasObrasView.tsx:359,377,392](../../features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx).
      Ligar ao destino real ou remover no modo xgestão.
- [x] **AJ-04 · Registro invisível.** _(2026-10-04: sem problema. O único gatilho do modal é `onRegistrar` dentro de `AtualizacoesTab`, que `tabsVisiveis()` oculta na obra própria; o modal fica montado mas inalcançável.)_ `RegistrarMedicaoModal` continua montado no console
      (`app/empreiteiro/minhas-obras/[id]/page.tsx:1388`) com a aba Atualizações oculta na obra
      própria. Confirmar se algum botão ainda grava em `medicoes` sem o dono enxergar; se sim,
      esconder o gatilho na obra própria.

### Média

- [x] **AJ-05 · Exclusão de obra deixa órfãos.** _(2026-10-04: DELETE de `app/api/obras/[id]/route.ts` passa a apagar também `xgestao_membro_obras` (sem FK no banco de dev), `obra_share_links`, `obra_aditivos` e `obra_checklist_marcacoes`, na mesma transação. Ficam de fora tabelas só do marketplace (chat, disputas, contrato) e `atividades`/`surveys`, cuja FK prevista é SET NULL. Falta rodar `xgestao-excluir-obra.integration.spec.ts`.)_ FKs `onDelete: cascade` declaradas no Drizzle não
      existem no Postgres (tabelas nascem dos bootstraps). O DELETE limpa só financeiro, candidaturas
      e split. Levantar tabelas filhas (etapas, anexos, fotos, share links, membros por obra) e
      limpar na mesma transação.
- [x] **AJ-06 · Guard inconsistente no admin.** _(2026-10-04: raiz usa `requireAdminXgestao` + `adminJson`; comportamento igual, 403 para não-admin.)_ `app/api/admin/xgestao/route.ts:10` usa só
      `isAdminLike`; as sub-rotas usam `requireAdminXgestao`. Padronizar.
- [ ] **AJ-07 · Rodada de verificação visual.** _(2026-10-04, parcial: varredura automatizada de 30 telas (público, dono, admin) em desktop 1366 e celular 390: 0 erros de console, 0 requisições com erro, 0 rolagem horizontal, todos os links internos 200, redirects `/xgestao`→dashboard e `/xgestao/planos`→aba Plano corretos. Corrigido: a oferta do teste grátis abria sobre o tour guiado no console; agora só no dashboard. Falta a passada manual dos fluxos que exigem clique: criar obra, upload, excluir.)_ Todos os "falta verificação visual" de XG12 a XG32.
      A anotação anterior sobre Chromium indisponível foi superada: o navegador fornecido pelo
      workspace executou o roteiro interativo em desktop/celular. Demais verificações visuais
      pendentes continuam separadas; não exigir outro computador para esse roteiro já aprovado.

### Baixa / pós-MVP

- [ ] **AJ-08 · Link público mais robusto.** Rate limit em memória
      ([rate-limit.ts:6](../../features/auth/api/rate-limit.ts)) não vale entre instâncias do
      autoscale; token salvo em texto puro. Mover contador para o banco e guardar hash do token.
- [x] **AJ-09 · Docs desatualizados.** _(2026-10-04: nota datada nos gaps de XG10, XG12 e XG18; README da XG31 já corrigido.)_ XG10 (409 do progresso revertido pela XG23), XG12 (abas
      ocultas, tour `console-v4`), XG18 (mapa removido pela XG26), README (XG31 "Fase B adiada",
      mas está implementada).

### Virada de chave (só quando o Ramon der o OK de lançamento)

- [→] **AJ-10 · Limite do Freemium** e **AJ-11 · Pagamento real** foram movidos para a
      [XG39](39-virada-de-chave-lancamento.md), que reúne tudo que só liga no lançamento.

## 10. Critérios de aceite

1. Assinante xgestão paga no sandbox, volta para uma tela do xgestão e vê o plano novo.
2. `SELECT tier, status, persona FROM assinaturas WHERE persona='xgestao' ORDER BY created_at DESC LIMIT 5;` mostra a assinatura ativa.
3. Nenhum `href="#"` nas telas do xgestão.
4. Excluir uma obra de teste não deixa linha com `obra_id` inexistente nas tabelas filhas.

## 11. Riscos / Pontos de atenção

- AJ-01 toca serviço compartilhado com o marketplace: a mudança é **condicional à persona**; o
  caminho do marketplace precisa sair byte a byte igual.
- AJ-05 mexe em exclusão: testar só em dado de teste, dentro de transação.

## 12. Links cruzados

- Depende de: [XG03](03-planos-limites-trial.md), [XG31](31-multiusuario-empresa.md)
- Relacionadas: [XG34](34-zero-percentual-dados-reais.md), [XG35](35-teste-gratis-e-fim-do-teste.md),
  [XG36](36-admin-xgestao-fechamento.md), [XG37](37-equipe-empresa-fechamento.md),
  [XG38](38-termos-privacidade-no-ar.md)

## 13. Gaps descobertos durante execução

- 2026-10-04: jornada criada a partir da auditoria XG01-XG32.
