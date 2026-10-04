# Jornada — XG37: fechamento da equipe da empresa (isolamento e cobertura)

> Status: parcial (dono/gestor/colaborador e revogação aprovados em integração) | Prioridade: alta | Wave: xgestão-37
> Última atualização: 2026-10-04

Cenário extenso de grants, áreas, cobrança, marketplace e revogação executado e aprovado. Corrigida a preparação das medições/lançamentos sintéticos que as antigas assertivas esperavam sem criá-los; nenhuma permissão da aplicação foi alterada para fazer o teste passar. [Evidências](40-relatorio-homologacao-mvp.md).

## 1. Contexto & Objetivo

A [XG31](31-multiusuario-empresa.md) entregou gestor e colaborador com acesso por obra e
permissões por área. Foi uma das últimas implementações, e o próprio doc deixa testes em aberto.
Esta jornada fecha o que falta para garantir duas coisas: **o membro vê tudo que deve ver da
obra liberada** e **ninguém de uma empresa enxerga nada de outra**.

## 2. Personas

- **Dono**: convida, define acesso por obra e por área, revoga.
- **Gestor**: vê e edita todas as obras da empresa.
- **Colaborador**: só as obras atribuídas, com visualizar ou editar.

## 3. Fluxo ponta-a-ponta

1. Classificar as 25 consultas que usam `eq(empreiteiras.userId, …)` (lista no §9).
2. Corrigir as que deveriam reconhecer membros e não reconhecem.
3. Escrever os testes que a XG31 §7 deixou abertos.
4. Fechar as pendências de decisão da XG31 §8.

## 4. Telas envolvidas

- [app/xgestao/equipe](../../app/xgestao/equipe) — gestão da equipe (só dono)
- Console da obra e aba Financeiro, do ponto de vista do membro

## 5. Componentes-chave

- [features/xgestao/equipe/server/access.ts](../../features/xgestao/equipe/server/access.ts) — helper de resolução da empresa
- [features/obras/api/access.ts](../../features/obras/api/access.ts) — `findObraAccess`
- [features/financeiro/lancamentos-service.ts](../../features/financeiro/lancamentos-service.ts) — `:305` filtra pelo dono (membro não vê lançamentos legados)
- [scripts/obra-route-access-guard.test.ts](../../scripts/obra-route-access-guard.test.ts) — guarda estática existente

## 6. Schema (Drizzle)

Nenhuma prevista. Observação: `xgestao_membros` nasce só no bootstrap; a migration 0009 faz apenas
`ALTER`. Avaliar migration documental de criação.

## 7. Endpoints

Rotas de conteúdo da obra (`/api/obras/[id]/**`, `/api/xgestao/obras/[id]/**`) e rotas exclusivas
do dono (plano, cobrança, empresa, membros).

## 8. Mocks a remover

Nenhum.

## 9. Checklist de implementação

- [x] Classificar as 25 ocorrências de `eq(empreiteiras.userId`: (a) marketplace, fora de escopo;
      (b) exclusiva do dono, correta; (c) deveria aceitar membro, **corrigir**. Ponto de partida:
      `lancamentos-service.ts:305` (c provável), `uploads/commit/route.ts:191` (avatar da empresa:
      provavelmente b), `perfil/plano/route.ts` (b), `atividades/route.ts:197` (avaliar)
- [x] Nenhuma ocorrência (c): todas são marketplace, admin ou exclusivas do dono, e os chamadores do xgestão já passam pelo helper (tabela no §13)
- [ ] _(rodada final)_ Teste: membro **não** acessa obra de outra empresa (404) em todas as rotas de detalhe
- [ ] _(rodada final)_ Teste: membro **não** altera plano, cobrança, empresa nem usuários (403). Verificado por leitura: checkout, cancelar, plano xgestão, membros, teste grátis e perfil da empresa já devolvem 403 para membro
- [ ] _(rodada final)_ Teste unitário do helper `access.ts`
- [ ] _(rodada final)_ Teste: colaborador com área restrita não recebe dados da área no payload (não só na tela)
- [ ] Link público: confirmar com o Ramon se membro pode criar/revogar (XG31 §8 item 2) e aplicar
- [ ] README da XG31 corrigido ("Fase B adiada" → implementada)

## 10. Critérios de aceite

1. Suíte de integração com os casos acima passando.
2. Tabela de classificação das 25 consultas registrada no §13.
3. Membro de teste da empresa A, com obra liberada, vê etapas, financeiro (conforme área), fotos e
   documentos; tentando ID de obra da empresa B recebe 404.

## 11. Riscos / Pontos de atenção

- **Limite de usuários por plano:** sai desta jornada. Vai preparado, mas desligado, na
  [XG39](39-virada-de-chave-lancamento.md) (fase de teste não limita).
- Restrição de área tem que valer no **servidor**; esconder só na tela vaza pelo payload.

## 12. Links cruzados

- Depende de: [XG31](31-multiusuario-empresa.md)
- Relacionada: [XG33](33-ajustes-pendentes-mvp.md), [XG35](35-teste-gratis-e-fim-do-teste.md) (membro herda o plano do dono)

## 13. Gaps descobertos durante execução

- 2026-10-04: jornada criada a partir da auditoria da XG31.
- 2026-10-04: varredura das 25 consultas `eq(empreiteiras.userId, …)`: nenhuma concede ou nega acesso indevido a membro. `lancamentos-service.ts:305` recebe o `donoUserId` dos chamadores e filtra por obra/área/categoria depois; `uploads/commit:191` é o avatar pessoal (para membro o UPDATE não afeta linha); `atividades:197` é o ramo do dono, o membro cai no ramo com `findObraAccess`.
- 2026-10-04: achado fora do grep, corrigido: `/xgestao/configuracoes` não olhava o papel. O membro abria "Minha Empresa" e "Plano & Uso" (403, formulário vazio) e via o link "Plano e uso" na topbar e o card de upgrade na sidebar. Agora o membro vê Perfil (leitura, dados da própria conta), Notificações e Segurança; topbar e sidebar escondem o plano e não chamam `/api/perfil/plano` para ele.
- 2026-10-04: gap aberto: membro não tem onde editar o próprio nome/telefone (não existe rota pessoal; `/api/perfil/empreiteiro` é da empresa). Fica para depois do MVP.
- 2026-10-04: ponto menor registrado: a exportação LGPD do membro (`/api/auth/exportar-dados`) não inclui o vínculo em `xgestao_membros` nem os acessos por obra.
