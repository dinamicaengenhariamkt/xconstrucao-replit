---
name: sdd
description: Spec-Driven Development workflow for structured planning before coding. Use when starting new features, refactoring, or any development that benefits from clear requirements, design diagrams, and atomic tasks. Reduces token waste by defining scope upfront.
---

# SDD - Spec-Driven Development

Metodologia para economizar tokens e melhorar qualidade de código através de planejamento estruturado.

## Workflow

```
1. Requirements (EARS) → 2. Design (Mermaid) → 3. Tasks → 4. Implementação
```

## Quando Usar

- ✅ Nova feature ou módulo
- ✅ Refatoração significativa
- ✅ Integração com API externa
- ✅ Mudanças que afetam múltiplos arquivos
- ❌ Fix simples de bug (1-2 arquivos)
- ❌ Ajustes de estilo/CSS

## Passo 1: Requirements (EARS)

Criar `specs/{feature-slug}/requirements.md` usando formato EARS:

```markdown
# REQ-1: [Título]
**WHEN** [evento/trigger]
**THE SYSTEM SHALL** [ação obrigatória]
**SO THAT** [benefício/resultado]

## Acceptance Criteria
- [ ] AC-1.1: [critério verificável]
- [ ] AC-1.2: [critério verificável]
```

Ver `templates/requirements.md` para template completo.

## Passo 2: Design (Mermaid)

Criar `specs/{feature-slug}/design.md` com diagramas:

```markdown
# DES-1: Arquitetura [Título]
> Traces: REQ-1

## Diagrama de Componentes
[mermaid diagram]

## Fluxo de Dados
[mermaid sequence diagram]

## Impacto
- Arquivos afetados: [lista]
- Dependências: [lista]
```

Ver `templates/design.md` para template completo.

## Passo 3: Tasks Atômicas

Criar `specs/{feature-slug}/tasks.md`:

```markdown
## Fase 1: Setup
- [ ] TASK-1: [ação específica] (traces: DES-1)
- [ ] TASK-2: [ação específica] (traces: DES-1)

## Fase 2: Implementação
- [ ] TASK-3: [ação específica] (traces: DES-2)
```

Regras:
- Uma task = uma ação clara
- Cada task rastreia um design
- Marcar [x] ao completar

## Passo 4: Implementação

Seguir tasks em ordem, atualizando status:

```markdown
- [x] TASK-1: Criar schema do banco ✅
- [x] TASK-2: Implementar repository ✅
- [ ] TASK-3: Criar endpoint API (em progresso)
```

## Estrutura de Pastas

```
projeto/
└── specs/
    └── {feature-slug}/
        ├── requirements.md
        ├── design.md
        └── tasks.md
```

## Economia de Tokens

| Sem SDD | Com SDD |
|---------|---------|
| Múltiplas tentativas | Escopo claro desde início |
| Retrabalho frequente | Tasks atômicas focadas |
| Contexto perdido | Rastreabilidade REQ→DES→TASK |

## Quick Start

Para iniciar uma feature nova:

1. Criar pasta: `specs/{feature-slug}/`
2. Copiar templates de `skills/sdd/templates/`
3. Preencher requirements primeiro
4. Design só após requirements aprovados
5. Tasks só após design aprovado

## Nível de Detalhe das Tasks

| Contexto | Nível | Quando |
|----------|-------|--------|
| **Básico** | Lista simples | Eu executo, conheço o projeto |
| **Detalhado** | Código inline + TDD | Sub-agente executa, projeto novo |

Ver `references/detailed-tasks.md` para formato detalhado com código inline.
