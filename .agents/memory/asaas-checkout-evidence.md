---
name: Evidência do checkout hospedado Asaas
description: Confirmação oculta e componentes Atlas podem enganar leituras automatizadas do checkout.
---

Não considerar texto “Seu pagamento foi confirmado com sucesso” encontrado no DOM como comprovação de pagamento.

**Why:** o texto já existia em um elemento oculto; a captura mostrava o formulário inicial e consultas independentes não encontraram cliente, cobrança ou entrega de webhook para a fixture.

**How to apply:** exigir confirmação do provedor, entrega processada e plano persistido. Conferir a imagem/estado realmente apresentado. Presença de texto, `allTextContents` ou um clique sem erro não demonstram aprovação.

Os componentes Atlas podem manter botões/opções de painéis recolhidos no DOM; selecionar o primeiro botão por papel pode tentar clicar em conteúdo interceptado por outro painel.

**Why:** botões recolhidos de identificação e opções da cidade apareciam nas consultas quando a tela já estava no cartão.

**How to apply:** observar a etapa atual e limitar o seletor ao painel correto. Não usar clique forçado nem repetir a cobrança para resolver um problema de seleção.