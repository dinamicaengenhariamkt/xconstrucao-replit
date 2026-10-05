---
name: CA do sistema para a origem pública no Node
description: Verificação TLS do domínio de desenvolvimento no Node pode precisar da CA confiada pelo sistema.
---

Para chamadas Node à origem pública de desenvolvimento, usar a CA confiável do sistema quando o certificado não for verificado pelo bundle padrão do Node.

**Why:** Node falhou com `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, enquanto curl verificou o mesmo destino; fornecer o bundle do sistema permitiu as sondagens HTTPS autenticadas, sem desativar TLS.

**How to apply:** verificar a existência de `/etc/ssl/certs/ca-certificates.crt` e fornecer `NODE_EXTRA_CA_CERTS` por processo antes de iniciar Node/Playwright. Não usar `NODE_TLS_REJECT_UNAUTHORIZED=0` nem generalizar essa falha como queda do app.