---
name: Herança visual do xgestão
description: Regra de produto para manter o xgestão visualmente alinhado ao marketplace sem misturar os dois escopos.
---

O xgestão deve ser uma versão enxuta da experiência autenticada do empreiteiro no marketplace, não uma identidade visual paralela. Preserve marca, logo, proporções do shell, sidebar, top bar, hierarquia de conteúdo, estados e componentes já aprovados; retire apenas funções que não pertencem à gestão própria.

**Why:** O usuário rejeitou um shell xgestão redesenhado porque ele descaracterizou o produto existente, inclusive substituindo o logo por um símbolo genérico. A expectativa confirmada é reaproveitar o frontend aprovado, sem alterar o marketplace.

**How to apply:** Em qualquer tela ou fluxo xgestão, comece pela implementação equivalente do empreiteiro. Prefira componentes compartilhados com variantes/props ou componentes xgestão isolados que reproduzam o padrão. Nunca exponha obras, ações ou dados do marketplace apenas por causa do reuso visual.