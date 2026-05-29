---
description: Auditoria de segurança nos arquivos alterados via security-auditor
---

Invoque o agent `security-auditor` para auditar os arquivos alterados na branch atual (`git diff origin/main...HEAD`).

Foque em:
- NextAuth (bypass de sessão, callbacks)
- API routes e server actions (auth check, IDOR)
- Queries Drizzle (input do usuário, raw SQL)
- Forms (validação Zod no server)
- XSS (`dangerouslySetInnerHTML`, render de markdown)

Output: lista de achados com severidade HIGH/MEDIUM/LOW e fix proposto.
