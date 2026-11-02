---
name: Precisão e consistência financeira do xgestão
description: Valores completos e verificação de atualização entre detalhe, carteira e dashboard.
---

Os valores financeiros do xgestão devem preservar centavos e refletir a mesma informação no detalhe da obra, em Minhas Obras e no dashboard. Essas revisões não autorizam mudar a apresentação ou as regras do marketplace.

**Why:** em 2026-11-02, o usuário pediu expressamente uma auditoria de valores completos, validações e propagação das alterações entre essas telas.

**How to apply:** revisar entrada monetária brasileira, serialização decimal, persistência e apresentação em conjunto, sem confundir arredondamento visual com perda no banco.

Uma verificação de sincronização deve carregar a tela de origem antes da edição e navegar de volta sem reiniciar toda a aplicação.

**Why:** recarregar a página elimina o cache do navegador e pode esconder informação desatualizada durante a navegação normal.

**How to apply:** combinar teste de persistência após recarga com teste de navegação autenticada que mantém o cache previamente carregado.
