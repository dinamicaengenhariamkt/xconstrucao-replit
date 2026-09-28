---
name: Ordem de FK composta no Publish
description: Dependências entre unicidade nova e FK composta no diff automático de bancos já existentes.
---

Quando uma FK composta aponta para uma combinação que ainda não é única em uma tabela existente de produção, o diff automático de publicação pode tentar criar a FK antes da nova restrição de unicidade. O PostgreSQL rejeita a FK mesmo que cada linha do pai tenha identificador primário único.

**Why:** O diff observável da publicação ordenou a FK do vínculo antes da unicidade composta no pai; a validação em uma cópia descartável de produção falhou sem alterar produção. A unicidade e a FK já coexistiam normalmente no desenvolvimento, por isso checar só o esquema local não detectava o problema.

**How to apply:** Comparar metadados de restrições nos dois ambientes e recalcular o diff antes de agir. Se a ordem for a causa, separar a publicação da unicidade no pai e a da FK dependente em duas etapas por alterações autorizadas somente no desenvolvimento. Conferir os dados, não truncar a tabela pai, não adicionar DDL ao deploy/inicialização e restaurar a FK no desenvolvimento somente depois de confirmar que a primeira publicação instalou a unicidade em produção.