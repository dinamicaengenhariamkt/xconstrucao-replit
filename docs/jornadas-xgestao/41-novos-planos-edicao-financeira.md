# XG41 — Novos planos e edição financeira

## 1. Objetivo e estado

Revisão de 02/11/2026, baseada nas duas imagens do cliente e nas confirmações do usuário. Escopo **exclusivo do xgestão**, preservando a identidade visual aprovada e sem alterar preços, permissões, dados ou cobrança do marketplace.

**Em execução, não concluída.** Distinguir a matriz comercial aprovada da oferta efetivamente aplicada no banco e nas APIs. A especificação executável nova não substitui automaticamente o catálogo legado. A homologação externa do Asaas continua pendente, conforme XG40.

## 2. Oferta confirmada

| Regra | Basic | Basic Plus | Premium |
|---|---|---|---|
| Mensalidade | R$ 99 | R$ 179 | R$ 299 |
| Obras ativas por empresa | 1 | 3 | 10 |
| Pessoas por empresa, incluindo titular | 2 | 5 | 15 |
| Links públicos por obra | 1 | 3 | Ilimitados |
| Valores no link público | Não | Sim | Sim |
| Orçamento integrado ao SINAPI | Não | Previsto, integração pendente | Previsto, integração pendente |

- O teste voluntário oferece **90 dias de Premium completo**, sem prometer recursos futuros ainda não implementados.
- Ao terminar sem assinatura paga: **somente leitura, preservando todos os dados**, com possibilidade de contratar para voltar a editar. Não retornar ao antigo Free comercial nem cobrar automaticamente.
- Uma assinatura paga antecipadamente não pode ser rebaixada pelo vencimento do trial antigo.
- A equipe é contada por **empresa assinante**, incluindo o titular; uma pessoa em várias obras não ocupa várias vagas.
- Valores públicos permitidos: **contrato, recebimentos e saldo**. Não expor custos, margem, PIX, contratos de prestadores ou dados pessoais. A capacidade do plano não substitui as permissões e seções escolhidas no link.
- Recursos de base: dashboard, filtros e busca; etapas, tarefas e cronograma; fotos, diário e ocorrências; checklists e timeline; documentos; financeiro de gasto × orçamento. Basic Plus herda Basic; Premium herda Basic Plus.
- O Premium é limitado a dez obras. Apenas seus links por obra são ilimitados.
- IA, exportações avançadas e suporte prioritário aparecem na imagem como recursos futuros, “quando lançados”; não fazer propaganda de entrega inexistente. Premium não inclui customizações pessoais.
- O texto “Free” da imagem não define um quarto plano gratuito: o usuário confirmou Basic pago após o teste.

## 3. Ajustes solicitados no Financeiro

1. Inserir **Editar informações** no card Valores do contrato, sem exigir retorno ao botão geral no topo.
2. Investigar o relato de que o preenchimento não passa de **R$ 500,00**.
3. Auditar inserção, edição e salvamento no financeiro e nas outras abas do xgestão.
4. Conferir que valores alterados aparecem no detalhe, em Minhas Obras e no dashboard.

## 4. Causas e correções desta rodada

- O conversor local de lançamentos removia todos os pontos: um decimal canônico como `500.01` podia virar `50001`. O parser novo aceita decimal canônico e moeda brasileira, rejeita entradas inválidas e casas extras sem arredondamento silencioso. O caminho do marketplace conserva o parser anterior.
- O orçamento do editor usava input numérico e `Number()` diretamente, sem aceitar moeda brasileira formatada. O editor xgestão passa a aceitar entrada decimal textual e normalizar o payload.
- O validador de orçamento da obra própria não tratava integralmente tipos numéricos, precisão e overflow. O orçamento agora verifica o formato canônico compatível com `NUMERIC(15,2)` antes da escrita.
- As mutações financeiras invalidavam o detalhe, mas não a lista que alimenta Minhas Obras e o dashboard. A invalidação adicional é condicionada à obra própria xgestão, sem alterar o comportamento do marketplace.
- A ação contextual reutiliza a API de edição e envia **somente valorTotal**. Não transforma saldo ou total com aditivos em campos editáveis, não altera outras informações e não cria uma API paralela.
- Dashboard e orçamento do card de Minhas Obras usavam formatação sem centavos. O xgestão passa a mostrar o valor completo, preservando o formatador padrão do card compartilhado no marketplace.
- A API de lançamentos positivos permitia frações de centavo, que seriam arredondadas ao persistir. Criação e edição de lançamentos de obra própria agora rejeitam mais de duas casas decimais antes da escrita; limites e comportamento do marketplace permanecem inalterados.

O relato específico de teto em R$ 500 ainda precisa ser distinguido dos defeitos acima. Encontrar e corrigir a conversão não prova que todos os problemas relatados tinham a mesma causa.

## 5. Inventário inicial de validações

| Área | Regra observada / tratamento | Evidência necessária |
|---|---|---|
| Orçamento/contrato do cliente | Não negativo, até 13 dígitos inteiros e 2 decimais; máscara BR convertida antes da API | Criação/edição, recarga e saldo com valores grandes |
| Entradas e saídas | API exige valor positivo, máximo R$ 999.999.999; descrição entre 2 e 500 caracteres | Criar, editar, excluir e conferir receita/custo/saldo |
| Contrato do prestador | Não negativo, máximo R$ 999.999.999,99; contrato opcional | Conferir vínculos, centavos e soma por prestador |
| Aditivos | Não confundir com edição do contrato original; alteram total e saldo conforme regra existente | Regressão da integração financeira |
| Recebimentos × custos | Saída não diminui saldo a receber do cliente; somente entrada paga conta como recebido | Regressão com entradas, saídas e pendências |
| Cache/navegação | Detalhe e lista são caches distintos; dashboard usa a lista | Teste de invalidação e roteiro de navegação autenticado |
| Permissões | Leitura/mão de obra não liberam edição do contrato nem dados de outra empresa | API e navegador com os papéis pertinentes |
| Outras abas e dados simulados | Auditoria ampla ainda pendente | Inventariar formulários e provar persistência, não apenas procurar palavras “mock” |

Não elevar todos os máximos sem considerar o tipo persistido e a regra do campo. O limite de 500 caracteres da descrição não é teto de R$ 500.

## 6. Plano de implementação comercial ainda pendente

1. Resolver a compatibilidade entre o Basic pago e o identificador legado `free`, que participa de decisões de gratuidade. Não renomear tiers globais.
2. Conciliar catálogo persistido, bootstrap, perfil/plano e apresentação. Um default de código não atualiza linhas já existentes.
3. Aplicar cotas em obras, convites/equipe e links no servidor, incluindo concorrência e restauração, além das mensagens na interface.
4. Aplicar capacidades por plano nas rotas e projeções públicas; não enviar dados proibidos e escondê-los apenas por CSS.
5. Implementar somente leitura após o trial em todas as mutações operacionais, mantendo permissões individuais, contratação e dados.
6. Atualizar preços/nomes e telas de uso, trial, assinatura, admin e checkout somente depois de uma transição coerente e testada.

## 7. Decisões e impedimentos remanescentes

- **Assinantes existentes:** confirmar manutenção de preços/benefícios atuais ou migração com consentimento. Não atualizar contratos Asaas nem cobrar preços novos silenciosamente.
- **SINAPI:** XG07 está congelada no histórico do produto. As imagens novas a oferecem; é necessário confirmar a retomada, fornecedor/API, licença, custos, asterisco e ações incluídas antes de anunciar integração pronta.
- **Equipe:** confirmar reserva de vaga por convite pendente e se prestadores sem login consomem vagas.
- **Preço anual, cancelamento e inadimplência:** não foram redefinidos pelo material; a divergência contratual de cancelamento da XG40 não foi resolvida.
- **Asaas:** ciclo sandbox externo, autenticação/destino do webhook na publicação e tratamento dos headers sensíveis no retry continuam pendentes antes da virada comercial.

Esses pontos não bloqueiam corrigir a edição financeira. Bloqueiam afirmar que a nova oferta está aplicada e pronta para lançamento.

## 8. Rastreabilidade e aceite

- [x] Imagens analisadas e regras aprovadas documentadas.
- [x] Nova oferta representada em módulo próprio, sem alterar catálogo legado ou contratos.
- [x] Botão contextual e modal de valor do contrato implementados.
- [x] Parser de moeda e validação de orçamento implementados.
- [x] Invalidação da carteira xgestão após lançamento implementada.
- [x] TypeScript e testes unitários aprovados nesta rodada.
- [x] Integração de valores grandes, edição e saldos aprovada nesta rodada.
- [x] Navegador autenticado desktop/mobile: botão, salvamento, recarga e navegação do orçamento.
- [x] Navegador autenticado: saída financeira atualiza o dashboard com cache previamente atualizado.
- [ ] Auditoria completa das outras abas, permissões e dados simulados.
- [ ] Catálogo persistido, cobrança, cotas e capacidades novos aplicados de ponta a ponta.
- [ ] Somente leitura pós-trial aplicado e comprovado em telas e APIs.
- [ ] Retomada SINAPI e transição de assinantes decididas.
- [ ] Homologação Asaas externa finalizada.

Não marcar toda a jornada como concluída pela existência do botão, do módulo de oferta ou dos testes unitários.

### Evidências de 02/11/2026

- Primeira etapa aprovada: TypeScript; 27 testes unitários/renderização; 14 testes de integração de financeiro e regressão do catálogo legado; dois fluxos autenticados desktop/celular de edição e recarga do contrato.
- A regressão adicional das demais jornadas xgestão, dos outros testes unitários xgestão e do TypeScript terminou com código zero. Asaas sandbox externo não integra essa afirmação.
- O teste ampliado de navegação com cache previamente carregado passou em desktop e celular, incluindo orçamento completo no dashboard e na lista.
- A rodada final passou: TypeScript, 23 testes unitários de moeda/invalidação, 11 testes de integração financeira e dois testes autenticados no navegador (desktop 1440 px e celular 390 px).
- A API rejeitou zero, negativo, excesso de precisão e valores acima do teto do lançamento; o orçamento de R$ 1.000.000,99 foi preservado.
- No navegador, o teste carregou o dashboard antes de editar o contrato, voltou e confirmou o orçamento completo; carregou novamente o cache, lançou uma saída de R$ 47,89 pela interface e confirmou o custo atualizado no dashboard. Também verificou Minhas Obras e o detalhe após recarga.
- O sucesso dos testes do catálogo legado não valida os bloqueios da nova oferta: catálogo novo e somente leitura pós-trial continuam pendentes.

## 9. Referências

- [XG03 — Planos e trial](03-planos-limites-trial.md)
- [XG07 — SINAPI](07-integracao-sinapi.md)
- [XG22 — Valores e contratos](22-valores-contrato-e-contrato-prestador.md)
- [XG31 — Equipe](31-multiusuario-empresa.md)
- [XG35 — Trial anterior](35-teste-gratis-e-fim-do-teste.md)
- [XG39 — Virada comercial separada](39-virada-de-chave-lancamento.md)
- [XG40 — Homologação anterior](40-relatorio-homologacao-mvp.md)
