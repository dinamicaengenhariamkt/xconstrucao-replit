---
name: superpowers-lite
description: Workflow estruturado de desenvolvimento com HARD-GATEs, verificação obrigatória e TDD. Use para qualquer tarefa de código que não seja trivial (> 10 linhas). Garante qualidade e economia de tokens através de planejamento antes de implementação.
---

# Superpowers Lite

Workflow de desenvolvimento estruturado baseado no [Superpowers](https://github.com/obra/superpowers).

**Objetivo:** Maximizar qualidade e economizar tokens através de planejamento rigoroso.

---

## 🚫 IRON LAWS (INVIOLÁVEIS)

```
1. NÃO CODAR SEM DESIGN APROVADO
2. NÃO AFIRMAR "FUNCIONA" SEM VERIFICAR
3. NÃO PULAR ETAPAS "SÓ DESSA VEZ"
```

Violar a letra dessas regras é violar o espírito. Sem exceções.

---

## 📋 WORKFLOW COMPLETO

### FASE 1: DESIGN (HARD-GATE)

<HARD-GATE>
NÃO escreva código, crie arquivos, ou tome qualquer ação de implementação 
até apresentar um design E o usuário aprovar explicitamente.
</HARD-GATE>

**Checklist obrigatório:**

1. [ ] **Explorar contexto** - Ler arquivos relevantes, commits recentes
2. [ ] **Perguntar** - Uma pergunta por vez até entender completamente
3. [ ] **Propor 2-3 abordagens** - Com trade-offs e recomendação
4. [ ] **Apresentar design** - Em seções curtas para aprovação
5. [ ] **Obter aprovação explícita** - "Aprovo", "Pode fazer", "Go"

**Anti-pattern:** "Isso é simples demais pra precisar de design"
→ Projetos "simples" são onde suposições não examinadas causam mais retrabalho.

---

### FASE 2: PLANEJAMENTO

Após aprovação do design, criar plano de implementação:

```markdown
# [Feature] - Plano de Implementação

**Objetivo:** [Uma frase]
**Arquitetura:** [2-3 frases]

## Tasks

### Task 1: [Nome]
- [ ] Passo 1 (2-5 min)
- [ ] Passo 2 (2-5 min)
- [ ] Verificar: [comando]
- [ ] Commit

### Task 2: [Nome]
...
```

**Regras do plano:**
- Cada passo é UMA ação (2-5 minutos)
- Cada task tem verificação explícita
- Assume implementador sem contexto do projeto
- DRY, YAGNI, TDD

---

### FASE 3: IMPLEMENTAÇÃO (TDD)

Para cada task:

```
1. RED    - Escrever teste que falha
2. VERIFY - Rodar teste, confirmar que falha
3. GREEN  - Código MÍNIMO para passar
4. VERIFY - Rodar teste, confirmar que passa
5. REFACTOR - Limpar mantendo testes verdes
6. COMMIT - Commit atômico
```

**Iron Law do TDD:**
```
NÃO ESCREVA CÓDIGO DE PRODUÇÃO SEM TESTE FALHANDO PRIMEIRO
```

Escreveu código antes do teste? Delete. Comece de novo.

---

### FASE 4: VERIFICAÇÃO (OBRIGATÓRIA)

<HARD-GATE>
NÃO afirme que algo funciona, está pronto, ou passou
sem EXECUTAR o comando de verificação E mostrar o output.
</HARD-GATE>

**Antes de qualquer claim:**

| Claim | Requer | NÃO é suficiente |
|-------|--------|------------------|
| "Testes passam" | Output: 0 failures | "Devem passar" |
| "Build ok" | Exit code 0 | "Parece ok" |
| "Bug corrigido" | Teste do sintoma passa | "Mudei o código" |
| "Pronto" | Checklist 100% | "Quase tudo" |

**Red flags - PARE:**
- Usando "deve", "provavelmente", "parece"
- Satisfação antes de verificar ("Ótimo!", "Pronto!")
- Pensando "só dessa vez"

---

## 🔄 TWO-STAGE REVIEW (Opcional - Subagentes)

Quando usar subagentes, implementar revisão em duas etapas:

### Stage 1: Spec Review
```
O código implementa EXATAMENTE o que a spec pede?
- [ ] Todos os requisitos cobertos
- [ ] Nenhum requisito faltando
- [ ] Nenhuma funcionalidade extra (YAGNI)
```

### Stage 2: Quality Review
```
O código está bem escrito?
- [ ] Legível e manutenível
- [ ] Sem code smells
- [ ] Testes adequados
- [ ] Documentação se necessário
```

---

## 🐛 DEBUGGING SISTEMÁTICO

Quando encontrar bug/erro:

```
FASE 1: INVESTIGAR (antes de qualquer fix)
1. Ler mensagem de erro COMPLETAMENTE
2. Reproduzir consistentemente
3. Isolar causa raiz

FASE 2: HIPÓTESE
4. Formular hipótese específica
5. Descrever teste que comprova/refuta

FASE 3: FIX
6. Implementar fix mínimo
7. Verificar que resolve
8. Verificar que não quebra outras coisas
```

**Iron Law:** NÃO TENTE FIXES SEM INVESTIGAR PRIMEIRO

---

## 📊 QUANDO USAR CADA NÍVEL

| Complexidade | Exemplo | Abordagem |
|--------------|---------|-----------|
| **Trivial** | Typo, cor CSS | Fazer direto |
| **Simples** | < 10 linhas | Design mental, verificar |
| **Médio** | Componente, endpoint | FASE 1-4 completas |
| **Complexo** | Feature, integração | Todas as fases + subagentes |

---

## ✅ CHECKLIST RÁPIDO

Antes de começar:
- [ ] Entendi o que precisa ser feito?
- [ ] Tenho aprovação do design?

Durante:
- [ ] Estou seguindo o plano?
- [ ] Testes primeiro?

Antes de entregar:
- [ ] Executei verificação?
- [ ] Mostrei evidência?
- [ ] Commitei?

---

## 🚀 BENEFÍCIOS

1. **Menos retrabalho** - Design primeiro = menos surpresas
2. **Economia de tokens** - Plano claro = execução direta
3. **Qualidade garantida** - TDD + Verificação = funciona de verdade
4. **Autonomia** - Subagentes podem trabalhar horas sem desviar

---

*Baseado em [Superpowers](https://github.com/obra/superpowers) por Jesse Vincent*
