# EARS - Easy Approach to Requirements Syntax

Referência rápida do formato EARS para requisitos.

## Padrões Básicos

### 1. Ubiquitous (sempre verdade)
```
THE SYSTEM SHALL {ação}
```
Exemplo: "THE SYSTEM SHALL encrypt all passwords using bcrypt"

### 2. Event-Driven (quando algo acontece)
```
WHEN {evento}
THE SYSTEM SHALL {ação}
```
Exemplo: "WHEN user submits form THE SYSTEM SHALL validate all fields"

### 3. State-Driven (enquanto em estado)
```
WHILE {estado}
THE SYSTEM SHALL {ação}
```
Exemplo: "WHILE user is logged in THE SYSTEM SHALL show dashboard"

### 4. Conditional (se condição)
```
IF {condição}
THE SYSTEM SHALL {ação}
```
Exemplo: "IF payment fails THE SYSTEM SHALL show error message"

### 5. Complex (combinado)
```
IF {condição}
WHEN {evento}
THE SYSTEM SHALL {ação}
```
Exemplo: "IF user is admin WHEN delete is clicked THE SYSTEM SHALL require confirmation"

## Palavras-Chave

| Palavra | Uso |
|---------|-----|
| SHALL | Obrigatório |
| SHOULD | Recomendado |
| MAY | Opcional |
| SHALL NOT | Proibido |

## Acceptance Criteria

Cada requisito deve ter critérios verificáveis:

```markdown
### Acceptance Criteria
- [ ] AC-1.1: Campo email aceita formato válido
- [ ] AC-1.2: Botão submit fica desabilitado até validação
- [ ] AC-1.3: Mensagem de sucesso aparece após envio
```

## Boas Práticas

1. **Um requisito = uma funcionalidade**
2. **Evitar ambiguidade** (não usar "rápido", "fácil")
3. **Ser específico** ("em menos de 2 segundos" ao invés de "rapidamente")
4. **Testar cada AC** (se não pode testar, reescreva)

## Anti-Padrões

❌ "O sistema deve ser user-friendly"
✅ "THE SYSTEM SHALL complete checkout in max 3 steps"

❌ "O sistema deve ser rápido"
✅ "THE SYSTEM SHALL respond within 200ms for API calls"

❌ "O sistema deve funcionar bem"
✅ "THE SYSTEM SHALL handle 1000 concurrent users"
