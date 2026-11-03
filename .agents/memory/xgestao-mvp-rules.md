---
name: Diretrizes do MVP xgestão
description: Decisões confirmadas sobre teste gratuito e autorização da ativação comercial.
---

Para a nova oferta, o usuário confirmou Premium completo por 90 dias e Basic pago de R$ 99/mês após o teste. Ao fim do trial sem pagamento, somente leitura, preservando os dados; não presumir retorno ao Free nem cobrança automática.

**Why:** o usuário confirmou a nova oferta ao revisar as imagens de monetização em 2026-11-02; ela substitui Pro seguido de Free gratuito. O pedido de implantação subsequente autorizou aplicar a oferta no xgestão, não apenas planejá-la.

**How to apply:** aplicar as regras nas telas e no servidor, mantendo o marketplace isolado. O fim do teste sem pagamento deve preservar os dados em somente leitura; distinguir código implantado, testes executados e homologação externa.

Os limites de equipe da nova oferta são por empresa assinante e incluem o titular: Basic é titular + 1 convidado; Basic Plus tem 5 pessoas no total; Premium, 15.

**Why:** o usuário confirmou a inclusão do titular e a contagem por empresa assinante em 2026-11-02.

**How to apply:** não oferecer 5 ou 15 convidados além do titular nem duplicar a contagem de uma pessoa que participa de várias obras da empresa. Convites pendentes reservam vaga; prestadores sem acesso ao sistema não ocupam vaga.

**Why das reservas:** o usuário confirmou que convites pendentes reservam vaga e prestadores sem acesso não contam na cota.

No link público, os valores autorizados são contrato, recebimentos e saldo, somente nos planos que permitem o recurso.

**Why:** o usuário delimitou os campos públicos em 2026-11-02.

**How to apply:** intersectar capacidade do plano com as permissões e seções do link; não ampliar a exposição para custos, margem, PIX ou contratos da equipe.

O usuário autorizou aplicar os planos e limites operacionais do xgestão e auditar campos, persistência, contexto, telas e administração. Publicação e Asaas de produção continuam para uma etapa posterior com autorização específica. AJ-08 fica fora do caminho crítico do MVP.

**Why:** o usuário pediu expressamente a implementação com máximo cuidado e a auditoria, deixando a troca do Asaas para depois dos planos.

**How to apply:** não reinterpretar o tier gratuito do marketplace como Basic pago. Testes sandbox não autorizam publicação, Asaas de produção, reconsentimento de usuários reais ou limpeza de dados. Não substituir evidência real de pagamento/webhook por ativação manual.

O SINAPI permanece congelado e fora desta entrega, inclusive no Premium e no teste gratuito. A API ainda precisa ser validada.

**Why:** o usuário confirmou que não haverá integração SINAPI agora, apesar de sua menção nas imagens dos planos.

**How to apply:** não prometer SINAPI como recurso disponível nem tratar sua retomada como pré-requisito para entregar os novos planos; qualquer retomada é uma decisão futura.

Segundo o usuário, em 2026-11-02 os cadastros e assinaturas atuais eram usados para testes e não havia assinantes pagos reais.

**Why:** o usuário esclareceu a natureza da base ao definir a transição dos planos.

**How to apply:** não inferir autorização de exclusão de dados ou alteração de contratos externos. Testes internos ativos podem acompanhar o Premium preservando o vencimento original; assinaturas manuais/externas históricas não são reclassificadas automaticamente. Revalidar a natureza da base antes da ativação de produção.