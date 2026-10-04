# Relatório parcial de homologação do MVP xgestão

**Data:** 2026-10-04 — desenvolvimento, não produção.

## Resultado executivo

**O MVP não está liberado para lançamento comercial.** O ciclo real do Asaas sandbox ainda não foi comprovado. As minutas v2 não foram publicadas e há uma divergência de cancelamento a decidir. A homologação permanece aberta para esses bloqueios, sem confundir testes manuais de assinatura com pagamento externo.

Não foram ativados limites comerciais, alterada a cobrança de produção, publicados termos, forçado reconsentimento, migrado banco ou excluídos dados preexistentes para facilitar a rodada.

## Evidências por requisito

| Requisito | Resultado observado | Limite da evidência |
|---|---|---|
| Teste gratuito Pro por 90 dias | Aprovado em integração: início voluntário, duas tentativas simultâneas geram um único teste, `enterprise` interno = Pro comercial; fim retorna ao Free e impede repetição. | Não é pagamento Asaas. Barras e aviso de fim não receberam uma nova rodada interativa específica. |
| Preservação no fim do teste | Obra, membro da equipe da obra e anexo por link permanecem; aviso fica pendente até confirmar “Continuar no Free”; evento de expiração ocorre uma vez. | O documento dessa fixture é um link, não um binário enviado ao R2. |
| Contratação durante o teste | Assinatura Basic comercial (`pro` interno) pelo gateway manual permanece ativa mesmo após o prazo antigo; cancelamento manual retorna ao Free, sem novo teste. Marketplace permanece Free. | Compra, troca, cancelamento e repetição de evento vindos do Asaas continuam bloqueados. |
| Criar, editar e excluir obra — AJ-07 | Aprovado por interação real em desktop 1440×900 e celular 390×844: login normal, criação, edição, recarga e exclusão com confirmação. | Contas novas têm cadastro/perfil/onboarding preparados pela fixture; esse roteiro não homologa o onboarding. |
| Upload e persistência — AJ-07 | PNG e PDF reais enviados ao R2 pela origem pública do preview; documento reaparece após recarregar e imagem é carregada pelo navegador. | Não houve simulação do upload nem alteração do CORS do bucket. Não constitui auditoria de armazenamento físico ou de coleta de arquivos no R2. |
| Exclusão segura — AJ-05 | Suíte anterior de exclusão passou. Nos dois roteiros interativos, obra não existe mais, leitura retorna 404 e não há filhos nas oito tabelas verificadas: anexos, diário, equipe, etapas, fotos, links, tarefas e financeiro. | Somente IDs criados pela própria fixture são removidos. Registros históricos com `SET NULL` e objetos físicos do R2 não são tratados como exclusão imediata universal. |
| Admin sem percentual agregado | Integração existente e unidade passaram: indicadores não contêm `progressoMedio`; lista não contém progresso; leitura de detalhe preserva a convenção atual, sem inventar agregado a partir de tarefas. | O menu agora testa as quatro páginas existentes e exige destinos xgestão. Não foi refeita uma inspeção visual autenticada de todas as páginas do admin. |
| Admin: atrasadas, paradas, custo pago, prazo, trial e CSV | Aprovado em integração adicional: obra descartável incrementa atrasadas/paradas em 1; custo pago aumenta R$ 321, iguais na lista e no detalhe; prazo persiste; assinante aparece em teste Pro; CSV inclui assinante, teste e ano do vencimento. | Exportação foi conferida por HTTP; não foi repetida inspeção visual autenticada das páginas do admin nem de toda a tabela exportada. |
| Equipe e isolamento — XG37 | Cenário extenso de dono, gestor e colaborador passou: grants por obra/área, restrição de cobrança, exclusão do marketplace, revogação imediata e admin somente leitura. Demais regressões de acesso passaram na rodada ampla. | Duas medições e dois lançamentos sintéticos precisavam ser persistidos para que as antigas assertivas realmente testassem inclusão/exclusão. Não foram afrouxadas as restrições da aplicação. |
| Minutas e consentimento — XG38 | Minutas v2 revisadas como dados inertes: trial, equipe, links por público, Free distinto de Basic e proteção da assinatura paga. Dados ausentes e divergência de cancelamento listados abaixo. | Não publicadas. Novo aceite de uma v2 publicada não foi executado; não há certificação jurídica por advogado. |
| Asaas real — AJ-02 | Ambiente compartilhado consultado: `ASAAS_ENVIRONMENT=sandbox`, gateway Asaas e credencial existente; consulta autenticada GET `/webhooks` retornou zero webhooks. `ASAAS_WEBHOOK_TOKEN` ausente no desenvolvimento. | Não foram criados checkout, webhook ou pagamento real nesta rodada. A ausência no ambiente publicado não foi revalidada. |
| XG39 e AJ-08 | Intactos e fora da ativação desta rodada. | Limites reais, pagamentos de produção, hash de tokens e rate limit distribuído não foram ligados. |

## Rodadas executadas

Os resultados abaixo são **por execução**, não uma alegação de que tudo passou em uma única rodada.

| Rodada | Resultado | Registro local |
|---|---|---|
| Unidade xgestão/admin, após correção do menu | 44 aprovados | `/tmp/xgestao-final-unit-fixed.log` |
| Configuração de visibilidade do marketplace | 2 aprovados | `/tmp/xgestao-final-config.log` |
| Indicadores/progresso | 17 aprovados | `/tmp/xgestao-final-indicadores.log` |
| Contrato do gateway Asaas | 2 aprovados | `/tmp/xgestao-final-gateway.log` |
| API ampla inicial | 61 aprovados, 1 ignorado, 6 falhas | `/tmp/xgestao-final-api.log` |
| Reexecução das 6 falhas iniciais | 4 aprovados, 2 falhas restantes | `/tmp/xgestao-final-recheck.log` |
| Reexecução de obra/equipe e primeiro navegador | Obra aprovada; equipe e ambos uploads locais falharam | `/tmp/xgestao-final-targeted.log` |
| Nova origem pública, tentativa com cache inconsistente | Servidor E2E não iniciou em 300 s; nenhum caso executado | `/tmp/xgestao-final-public.log` |
| Rodada isolada após reparar o cache de testes | 5 aprovados: equipe, 2 trial, desktop e celular; 1 falha da nova fixture admin | `/tmp/xgestao-final-evidence.log` |
| Admin específico, fixture com pagador corrigido | 1 aprovado em 48,3 s | `/tmp/xgestao-final-admin.log` |
| TypeScript após rodada final | Aprovado, saída 0 | `/tmp/xgestao-final-types-delivery.log` |

Casos já aprovados não foram reiniciados por alterações apenas na fixture admin. A suíte comum mantém `PAYMENT_GATEWAY=manual` e as guardas anti-produção.

## Falhas reproduzidas e correções pontuais

- Menu: expectativa antiga de uma página contrariava as quatro páginas xgestão já existentes; corrigida a expectativa e acrescentada a verificação de contexto dos destinos.
- Percentuais: expectativas antigas derivavam progresso geral de tarefas ou alteravam o percentual manual da etapa. A correção segue o comportamento aprovado: agregado não reaparece e a etapa mantém seu percentual manual.
- Perfil e navegação: expectativa de redirect passou a incluir o perfil/contexto xgestão; leitura de perfil usa contexto de requisição independente, evitando a limitação de cookies Secure no adaptador HTTP do teste.
- Equipe: os marcadores de medição/financeiro eram assertados, mas nunca inseridos. As fixtures passaram a criar os registros, incluindo o valor de R$ 97 previsto nas assertivas de exclusão do marketplace.
- Admin: a saída paga não identificava `pagadorUserId`. R$ 0 era a resposta correta para aquela fixture incompleta; o teste agora identifica o próprio responsável como pagador, sem alterar o cálculo da aplicação.
- Upload: a origem loopback falhou antes do commit ao R2. Os mesmos passos completos passaram pela origem pública do preview. Isso não prova, por si só, defeito de produção; nenhuma política do bucket foi modificada.
- Ambiente de testes: copiar o cache de um Next ativo deixou tipos gerados inconsistentes e uma inicialização sem sucesso. Foi limpo somente o cache gerado do E2E parado, removida a cópia do cache ativo e preservado o stderr em arquivo local. A rodada seguinte iniciou e executou os casos. Nenhum cache ou dado de produção foi limpo.

## Bloqueios e informações necessárias

### 1. Ciclo real do Asaas sandbox

É necessário configurar a autenticação do webhook pelo fluxo seguro de secrets, cadastrar um webhook sandbox no destino público correto e só então comprovar:

1. Cadastro e checkout do assinante descartável.
2. Confirmação de pagamento entregue pelo provedor.
3. Assinatura ativa, plano correto e retorno ao xgestão.
4. Troca de plano, cancelamento e evento repetido sem alteração do marketplace.

O bloqueio histórico de reCAPTCHA **não foi novamente reproduzido**: a configuração do webhook bloqueou essa etapa antes do checkout. Se o provedor exigir interação humana, ela deverá ser solicitada, não contornada.

### 2. Identificação legal e publicação

Faltam confirmação do operador do xgestão, razão social, CNPJ, endereço completo, CEP, cidade/UF, comarca, telefone, e-mail de contato, nome/e-mail do encarregado de dados e data de publicação. Os prazos em colchetes também precisam de confirmação; o trial de 90 dias não aprova automaticamente outros prazos contratuais ou de retenção.

Não presumir que o CNPJ de outra empresa mencionado em documentação anterior identifica o operador do produto.

### 3. Política de cancelamento

A seção 5.4 da minuta promete acesso até o fim do ciclo já pago. O serviço atual chama o cancelamento do gateway e marca a assinatura cancelada imediatamente. É necessário decidir a política comercial e alinhar texto, implementação e testes antes de publicar a cláusula. Não houve alteração de cobrança, reembolso ou prazo de acesso nesta homologação.

## Próxima decisão

Continuar a homologação real do Asaas após configurar o token seguro. Manter AJ-02 bloqueado até existir evidência do provedor; manter publicação legal e XG39 dependentes de decisões/autorização próprias.

As evidências persistidas são os logs e resultados dos testes. As capturas efetuadas nos casos aprovados não foram encontradas no diretório final; não é entregue um pacote de imagens privadas. A captura independente do preview mostrou a página pública de login, não uma sessão autenticada. Logs e traces são locais e podem ser temporários; não são publicados com este relatório, pois podem conter URLs de mídia assinadas. Este documento não apresenta chaves, tokens, cookies ou dados pessoais de usuários reais.