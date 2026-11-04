# XG42 — Auditoria de planos, persistência e contexto

## 1. Escopo e limites desta revisão

Aplicar a oferta aprovada na XG41 e revisar o xgestão inteiro, incluindo suas
telas administrativas. Não alterar regras comerciais, telas ou identidade do
marketplace. Reutilizar a identidade visual já existente do xgestão.

Esta jornada separa implementação, teste de API, teste visual autenticado e
validação externa. Uma categoria aprovada não substitui as demais e não significa
“ausência absoluta de bugs”.

**Não autoriza publicação, troca do ambiente Asaas ou exclusão de dados.**
O checkout/webhook real do Asaas continua pendente de evidência externa.
SINAPI permanece congelado, inclusive no teste Premium.

## 2. Contrato comercial implementado

| Regra | Basic | Basic Plus | Premium |
|---|---:|---:|---:|
| Mensalidade | R$ 99 | R$ 179 | R$ 299 |
| Obras ativas | 1 | 3 | 10 |
| Pessoas por empresa, incluindo titular | 2 | 5 | 15 |
| Links ativos por obra | 1 | 3 | Ilimitados |
| Valores no link público | Não | Contrato, recebimentos e saldo | Contrato, recebimentos e saldo |

- Teste voluntário: **Premium por 90 dias**, sem cobrança automática.
- Sem plano pago vigente, inclusive depois do teste: **somente leitura** dos
  dados operacionais. A contratação e os dados cadastrais necessários continuam
  acessíveis.
- Convites pendentes reservam vaga. Aceitar o convite não conta a pessoa de novo.
  Revogar o acesso/convite libera a vaga. Prestadores sem login não ocupam vaga.
- Uma pessoa em várias obras ocupa uma única vaga na empresa.
- Os três planos usam identificadores próprios: `basic`, `basic_plus`, `premium`.
  Não se reaproveita `free` para um plano pago.
- Os planos históricos continuam identificáveis; não há alteração silenciosa de
  contratos externos de teste. A oferta nova é a única oferecida para contratação
  xgestão. Somente o ciclo mensal foi aprovado.
- Testes internos já ativos passam ao Premium sem reiniciar seu prazo. A mudança
  é idempotente e deixa evento de auditoria; não altera assinaturas Asaas/manuais.

## 3. Preservação e excesso de cota

- Não apagar obras, anexos, documentos, equipe ou lançamentos por vencimento.
- Serializar criação de obras e convites para impedir que solicitações
  simultâneas ocupem a mesma última vaga.
- Reabrir obra concluída também precisa de vaga de obra ativa.
- Registros e acessos preexistentes não são excluídos automaticamente ao reduzir
  o plano; novas inclusões acima da cota são bloqueadas.
- Links já emitidos não podem conservar acesso a valores financeiros quando o
  plano atual não permite essa seção. A projeção pública intersecta o plano
  atual, as seções do link e as permissões de cada conteúdo.
- Custos internos, margem, PIX e contratos de prestadores não fazem parte dessa
  autorização pública.

## 4. Matriz da auditoria

Em cada área, conferir: preenchimento inicial, criar, editar, limpar campo
opcional, cancelar, excluir/revogar quando aplicável, erro de validação, falha de
permissão, persistência após recarregar e retorno depois de visitar outra tela.

| Área | Pontos a conferir |
|---|---|
| Entrada e contexto | login xgestão, links diretos, onboarding, retorno, troca de tela sem cair no marketplace |
| Dashboard | números reais, centavos, obras paradas/concluídas, criação e bloqueio por plano |
| Minhas obras | criar/editar, endereço, status, datas, valor do contrato, limite e concorrência |
| Detalhe da obra | titular/membro, abas permitidas, estados vazios, leitura e bloqueios de escrita |
| Etapas | criar/editar/excluir, percentual e progresso imediato da obra própria |
| Cronograma | datas, ordenação, conclusão e persistência ao navegar |
| Fotos | upload, legenda, publicação, privacidade e recarga |
| Diário | campos obrigatórios, datas, edição/exclusão e visibilidade pública |
| Ocorrências | abertura, classificação, tratamento e privacidade |
| Checklists/tarefas | inclusão, edição, conclusão, exclusão e progresso |
| Documentos | upload/link, tipo, alteração, exclusão, isolamento e cota de armazenamento |
| Timeline | refletir os eventos reais sem duplicação ou dados de outra empresa |
| Financeiro | contrato, aditivos/supressões, receitas, despesas, recebimentos, saldo e cache |
| Prestadores da obra | contatos, PIX, contrato, documento/link e distinção de quem tem login |
| Equipe da empresa | convite, reenvio, senha inicial, aceite, edição, revogação, vagas e escopo por obra |
| Compartilhamento | criar/revogar links, cotas, seções e projeção pública por plano |
| Configurações | empresa, usuário, senha, plano/uso, retorno entre abas e cobrança separada |
| Admin xgestão | dashboard, assinantes, obras/detalhe, financeiro, CSV, nomes dos planos e trial sem MRR |

## 5. Ajustes encontrados nesta rodada

- Aplicar a cota também ao reabrir uma obra concluída, não apenas ao criá-la.
- Não permitir que um link antigo conserve a seção financeira após mudança de
  plano.
- Retirar edição operacional depois do vencimento também nas rotas do servidor;
  esconder um botão não basta.
- Conferir o plano da empresa para membros sem lhes abrir dados de cobrança do
  titular.
- Identificar os novos planos no admin, distinguindo-os dos planos anteriores.
- Não mostrar capacidades booleanas ou “links por obra” como uso agregado da
  empresa. Mostrar obras ativas e pessoas com os valores reais.
- Interpretar corretamente centavos e separadores nos aditivos e contratos dos
  prestadores, além dos campos financeiros já ajustados na XG41.
- Rejeitar subcentavos nas APIs desses contratos/aditivos de obras próprias.
- Aguardar o resultado da gravação do prestador antes de fechar o formulário;
  manter os dados e apresentar a falha quando a gravação não acontece.

Os comportamentos compartilhados com o marketplace recebem essas mudanças
somente quando a obra é própria do xgestão.

## 6. Evidências e reprodução

### Automatização disponível

- `tests/unit/xgestao-acesso-plano.test.ts`: vigência, expiração e isolamento.
- `tests/unit/xgestao-oferta-comercial.test.ts`: oferta e SINAPI congelado.
- `tests/unit/xgestao-equipe-vagas.test.ts`: titular, convidados e deduplicação.
- `tests/unit/xgestao-dinheiro.test.ts`: moeda, centavos, sinal e cache.
- `tests/e2e/integration/xgestao-nova-oferta.integration.spec.ts`: contratação
  manual isolada, três planos, cotas, concorrência, vencimento e retomada.
- Integrações operacionais: financeiro, documentos, atualizações,
  etapas/cronograma, obras/exclusão, compartilhamento, dashboard e membros.
- Navegador autenticado: `tests/e2e/xgestao-homologacao.browser.spec.ts`,
  desktop e celular, usando login normal pela origem pública.

As fixtures operacionais iniciam explicitamente o teste. Testes do início
voluntário podem criar a conta sem iniciá-lo. Não mudar o comportamento de login
da aplicação para preparar testes.

### Resultado desta execução

**Implementação e auditoria funcional desta etapa executadas. Homologação externa do Asaas ainda pendente.**

Resultados consolidados, sem contar novamente os casos reexecutados:

- **53 cenários de API aprovados:** catálogo e contratação mensal dos três planos, recusa do ciclo anual, cotas de obras/equipe/links, concorrência pela última vaga, ausência de usuário órfão após convite recusado, trial voluntário e vencimento, somente leitura, contratação posterior, downgrade e privacidade do link já emitido, permissões de membros, financeiro, etapas/cronograma, documentos, atualizações, obras, dashboard e administrador. Incluem a regressão de isolamento das regras do marketplace.
- **9 cenários de navegador aprovados**, com login normal: oferta e vencimento do teste, equipe e reservas, edição financeira e atualização entre telas, criação/edição/recarregamento/exclusão de obra descartável, capa e PDF, em desktop e celular. O cenário de administrador percorreu dashboard, assinantes, obras, financeiro e detalhe da obra.
- **39 testes unitários aprovados:** oferta comercial, vigência do acesso, contagem de pessoas e tratamento de dinheiro, incluindo centavos, agrupamentos, valores grandes e aditivos com sinal.
- **Checagem TypeScript aprovada** (`npm run check`), após geração estável dos tipos.

A rodada corrigiu também a preparação dos testes: ativação voluntária antes de criar obras, espera pelo aviso de fim do trial e limpeza dos recebimentos da própria obra descartável antes de excluí-la. O excesso de logins acionou a proteção real (429); houve também um estado temporário de desenvolvimento com resposta HTML 404 no login. O servidor foi estabilizado e a conferência móvel passou, sem desligar a autenticação, alterar cookies ou enfraquecer a proteção.

**Limites da evidência:** os casos foram executados em desenvolvimento, usando gateway manual para as contratações automatizadas. A cobertura combina APIs, inspeção e jornadas visuais críticas; não é uma garantia de ausência de todo bug nem uma exploração visual de cada combinação possível de papel, campo e estado. Não houve publicação por esta execução, troca do Asaas para produção ou comprovação de pagamento/webhook externo.

## 7. Liberação posterior

1. Encerrar a matriz com evidências e limitações explícitas.
2. Homologar externamente pagamento, retorno e webhook no Asaas sandbox.
3. Revisar a configuração de produção sem misturar catálogo do marketplace.
4. Obter autorização específica antes de publicar/trocar o Asaas para produção.

Não marcar o pagamento externo como aprovado por uma ativação do gateway manual,
por um texto de sucesso no DOM ou pela mera existência de um webhook no código.

## 8. Rodada de 04/11/2026

Revisão do que estava marcado como feito, contra o código, nas visões do
empreiteiro e do admin. Escopo só em obra própria; marketplace sem mudança de
comportamento.

### Corrigido

- **Enum do banco:** os valores `basic`, `basic_plus` e `premium` agora são criados
  no bootstrap, antes do seed dos planos.
- **Admin:** assinantes, painel e CSV mostram Basic Plus, Premium e Somente leitura.
- **Aditivos:** membro limitado a categorias não lê nem altera aditivos.
- **Área da obra:** aceita `1.200,50`; texto inválido mostra erro e não salva.
- **Nome e área na API:** nome com menos de 3 caracteres e área estourada dão 400.
- **Membro restrito:** via "Editar informações", mas a gravação era recusada. O modal
  agora esconde e não envia o que ele não pode alterar.
- **Link rebaixado para Basic:** a tela dizia "mostra pagamentos" sem mostrar, e
  alterar qualquer seção dava 403. A API agora devolve o que o plano permite.
- **Membro convidado:** caía no assistente "Sobre sua empresa" no primeiro login.
  Agora nasce sem esse passo, e o bootstrap corrige os convidados existentes.
- **Modais de contrato e de informações:** o campo só libera com o valor do banco, e
  uma recarga em segundo plano não apaga o que foi digitado.

### Teto de R$ 500

Não existe teto de R$ 500 no código. Valores de 500,01 a R$ 1,2 trilhão gravam e
voltam iguais no contrato. Lançamentos e aditivos vão até 999.999.999. A causa do
relato não foi reproduzida; a hipótese é o campo numérico antigo do orçamento, que
já foi substituído.

### Testes

- `tests/unit/xgestao-editar-obra.test.ts` e `tests/unit/xgestao-planos-oferta.test.ts`.
- `tests/e2e/integration/xgestao-auditoria-campos.integration.spec.ts`: valores altos,
  recusas, persistência por aba, somente leitura, membro limitado, link rebaixado e admin.
- `tests/e2e/xgestao-homologacao.browser.spec.ts`: área digitada e membro restrito.
- `tests/e2e/xgestao-obras.browser.spec.ts`: preparação atualizada para iniciar o
  teste gratuito, e duas chamadas passaram a sair do navegador. Eram falhas do
  teste, não do produto.

### Decisões do dono aplicadas

- **Diário:** o autor edita o texto do próprio registro, só na obra própria. Fotos não
  mudam por essa edição. O texto anterior fica na auditoria (`obras.diario.update`).
- **Planos:** o texto segue a imagem de monetização, sem SINAPI e sem tarefas. O
  bootstrap troca no banco só o texto gerado pela oferta anterior; o que o admin
  editou no painel fica como está.
- **SINAPI:** saiu da landing do xgestão, do SEO, dos planos e da Política vigente.
- **Tarefas:** saiu dos planos, do diálogo de exclusão, do filtro da timeline da obra
  própria, do link público (inclusive em link antigo com a seção ligada) e das
  minutas. As rotas e os dados continuam; a obra de marketplace não muda.
- **Minutas v2:** teste de 90 dias no Premium e somente leitura ao vencer.

**Pendente com o jurídico:** os Termos vigentes (v1) ainda citam SINAPI e marketplace.
Mudam ao publicar a v2 por `/admin/legal`, que tem campos a preencher, exige revisão
e dispara o re-consentimento.

Resultado: typecheck sem erros, 69 unitários aprovados, 110 cenários de integração
aprovados e 2 pulados (xgestão e `obras-subrecursos`), 23 cenários de navegador
aprovados. As demais specs do marketplace não foram executadas nesta rodada.

**Limites da evidência:** executado em desenvolvimento com gateway manual. Asaas
real e webhook publicado seguem pendentes (AJ-02, AJ-15).

