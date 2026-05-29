---
description: Inicia workflow SDD para uma task da jornada
argument-hint: <numero da task, ex: 96>
---

Vamos iniciar a task #$ARGUMENTS usando o workflow SDD.

Passos:

1. Leia `.claude/skills/sdd/SKILL.md` se ainda não estiver no contexto
2. Localize a task #$ARGUMENTS nas jornadas em `docs/jornadas/`. Se não encontrar, peça contexto antes de prosseguir
3. Aplique SDD:
   - **Requirements** em formato EARS
   - **Design** com diagrama Mermaid se houver fluxo
   - **Tasks atômicas** numeradas
4. **Pare antes de implementar.** Quero aprovar o design antes de gerar código.
