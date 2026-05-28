# Tasks Detalhadas - Complemento ao SDD

> Baseado em: obra/superpowers/writing-plans
> Uso: Quando tasks.md precisam de mais detalhe (sub-agentes, projetos complexos)

## Quando Usar Tasks Detalhadas

- ✅ Delegando para sub-agentes (precisam contexto completo)
- ✅ Projetos com múltiplos contribuidores
- ✅ Código complexo que precisa de referência inline
- ❌ Tasks simples onde o executor conhece o codebase

## Header de Plano (opcional)

Para projetos maiores, adicionar no início do tasks.md:

```markdown
# [Feature Name] - Implementation Plan

**Goal:** [Uma frase descrevendo o que será construído]

**Architecture:** [2-3 frases sobre a abordagem]

**Tech Stack:** [Tecnologias/bibliotecas principais]

---
```

## Granularidade de Tasks

**Cada step = uma ação (2-5 minutos):**

```markdown
### Task N: [Nome do Componente]

**Files:**
- Create: `exact/path/to/file.ts`
- Modify: `exact/path/to/existing.ts:123-145`
- Test: `tests/exact/path/to/test.ts`

- [ ] **Step 1: Escrever teste que falha**
\`\`\`typescript
describe('ComponentX', () => {
  it('should do Y', () => {
    const result = functionX(input);
    expect(result).toBe(expected);
  });
});
\`\`\`

- [ ] **Step 2: Rodar teste para verificar falha**
Run: `npm test -- --grep "ComponentX"`
Expected: FAIL com "functionX is not defined"

- [ ] **Step 3: Implementar código mínimo**
\`\`\`typescript
export function functionX(input: string): string {
  return expected;
}
\`\`\`

- [ ] **Step 4: Rodar teste para verificar sucesso**
Run: `npm test -- --grep "ComponentX"`
Expected: PASS

- [ ] **Step 5: Commit**
\`\`\`bash
git add .
git commit -m "feat: add functionX"
\`\`\`
```

## Checklist de Qualidade

Cada task deve ter:
- [ ] Paths exatos de arquivos
- [ ] Código completo (não "adicionar validação")
- [ ] Comandos exatos com output esperado
- [ ] Commit ao final de cada task

## Princípios

- **DRY** - Don't Repeat Yourself
- **YAGNI** - You Aren't Gonna Need It
- **TDD** - Test-Driven Development (quando aplicável)
- **Commits frequentes** - Cada task = 1 commit

## Integração com SDD

```
SDD Workflow:
┌─────────────────┐
│ 1. Requirements │  ← EARS format (alto nível)
│    (O QUE)      │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 2. Design       │  ← Mermaid diagrams
│    (COMO)       │
└────────┬────────┘
         ▼
┌─────────────────┐
│ 3. Tasks        │  ← Básico ou Detalhado
│    (FAZER)      │     
│                 │  Básico: lista simples
│                 │  Detalhado: código inline + TDD
└─────────────────┘
```

Escolher nível de detalhe baseado em:
- **Básico:** Eu mesmo executo, conheço o projeto
- **Detalhado:** Sub-agente executa, ou projeto novo
