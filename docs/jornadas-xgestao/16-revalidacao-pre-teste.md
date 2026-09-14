# Jornada — XG16: Revalidação antes do teste em obra real

> Status: 🔄 em execução | Prioridade: alta | Wave: xgestão-16
> Última atualização: 2026-09-14

> **Ponto de retomada:** o checklist da §5 é a fonte de verdade. Cada item marcado `[x]`
> está feito e verificado; `[ ]` é o que falta. Se a sessão cair, continuar do primeiro
> `[ ]` de cima para baixo.

## 1. Contexto

Revisão ampla pedida antes de liberar o teste com o cliente. A pergunta que abriu:

> *"Os itens de detalhe do empreiteiro já estão todos fechados? Veja se não tem nada mocado
> nem nada do tipo. Se não tiver, você só me devolve que está tudo ok."*

A resposta honesta foi **quase**. O software está sólido; o que não estava eram três
controles que prometiam o que não entregavam — e os textos legais, que descreviam outro
produto.

Duas premissas dadas pelo cliente, que **não** são gaps: Asaas em sandbox e limite de obras
do Freemium liberado para o teste.

## 2. O que a auditoria confirmou — e o que ela não achou

Cinco frentes: mocks/dados fixos, autorização e CRUDs, link público/planos/configurações,
login e redirects, textos legais.

**Zero achado crítico no núcleo do produto.** O que vale registrar são os vereditos
positivos, porque eles é que autorizam o teste:

| Área | Veredito |
|---|---|
| Mocks / dados fixos | Limpo — zero `MOCK_`, zero TODO/FIXME no escopo do xgestão |
| Autorização (IDOR) | Sólido — guard fail-closed, `allowDiscovery` **opt-in** |
| Flag `ownWork` | Sólido — **sempre derivada do banco**, nunca aceita do cliente |
| Recursos filhos | Sólido — `obraId` na cláusula WHERE de toda rota aninhada |
| Upload | Sólido — HEAD confere tamanho/mime **reais** contra o declarado |
| Link público | Sólido — `randomBytes(32)`, rotação invalida o anterior na mesma transação |
| Limite de obras | Reversível por um número, com instrução de reversão no código |
| Webhook Asaas | Fail-closed em produção — correto |

Dois "achados" reportados pelos agentes que **verifiquei e descartei**:
- `createdAt: ''` nas etapas do link público — o tipo `ObraPublicaEtapa` **nem declara** o
  campo. É omissão deliberada; o TypeScript já barra o uso.
- Zeros fixos em `dbToObraContratanteDetalhe` — persona **contratante**, fora do xgestão.

> Um relatório de auditoria que só lista problemas não diz se dá para subir. O valor da
> tabela acima é autorizar o teste, não elogiar o código.

## 3. Os achados reais

### A1 — o botão "Administrador" anunciava a área admin ao público

[acesso-plataforma/page.tsx:14](../../app/acesso-plataforma/page.tsx#L14) passava
`showAdminButton={true}` — **literal fixo**, escrito antes de o toggle do XG05 existir. Todo
o resto da página já respeitava `config.marketplaceVisivel`; só a navbar ficou fora.

**Agravante:** o CTA de acesso era renderizado sob `showAccessButton && !showAdminButton`.
O botão "Administrador" **suprimia o "Acessar xgestão"** — não era só ruído, ocupava o lugar
do botão certo.

**Risco de acesso: nenhum.** `/admin/*` é protegido pelo `proxy.ts` e pelas rotas de API — o
próprio `app/admin/layout.tsx` comenta que a camada de UI é UX, não segurança. O que vazava
era a **informação de que a área existe**.

Por que passou despercebido: o spec do XG05 cobria a home, **não** `/acesso-plataforma`.

### A2 — três switches de notificação que não notificavam nada

A aba Notificações tinha quatro switches. **Três eram fachada:** `sis_documentos`,
`sis_ocorrencias` e `sis_diario` apareciam *só* no arquivo que os escrevia. Não estão em
`EmailPreferenceKey` ([preferences.ts:28](../../features/notificacoes/preferences.ts#L28)),
que é o ponto único de checagem — e **não existe disparo** de aviso de ocorrência nem de
diário no produto.

O usuário desligava, o toast dizia "Preferências salvas", e nada mudava. Ou supunha receber
avisos que nunca são enviados.

O quarto, `email_prazo`, tem leitor de verdade — mas em
[aviso-expiracao-job.ts:217](../../features/planos/aviso-expiracao-job.ts#L217), que avisa
sobre a **assinatura**, não sobre prazo de obra. O rótulo descrevia o que ele não faz.

### A3 — o toast dizia "plano ativo" a caminho da tela de pagamento

[XGestaoPlanosSection.tsx:136](../../features/xgestao/components/XGestaoPlanosSection.tsx#L136)
não checava `data.kind`. Com o Asaas o retorno é `kind: 'redirect'`: o usuário era levado ao
checkout **lendo que o plano já estava ativo**. O guard correto já existia na tela equivalente
do marketplace e faltava aqui.

### A4 — a versão do aceite era fixa no código

[register/route.ts:23](../../app/api/auth/register/route.ts#L23) gravava `"1.0"` sem ler
`legal_documents`. Como `pendenciasReconsent` compara aceita × vigente, **no dia em que a v2
fosse publicada** todo cadastro novo gravaria "1.0" e cairia em pendência imediata — o
usuário aceita no cadastro e leva o modal na primeira tela.

Bug latente: invisível até a publicação, e aí atingindo 100% dos novos cadastros.

### A5 — os textos legais descrevem outro produto

O achado mais sério, e o que não estava no radar até o cliente perguntar.

Os Termos definem a plataforma como *"intermediadora, conectando contratantes e
empreiteiros"* (termos-v1.md:54 e :86) — o que é **falso** para quem assina o xgestão. E não
têm **uma única palavra** sobre assinatura, cobrança, renovação ou cancelamento: grep por
`assinatura|cobrança|recorren|cancelamento|reembolso` retorna vazio, num produto vendido por
assinatura.

A Política é bem mais sólida (bases legais, direitos, retenção, ANPD), mas não cobre os dois
fatos centrais do xgestão: o **link público** (conteúdo sem login) e os **dados de terceiros**
que o empreiteiro insere — cliente, equipe, fotos com pessoas —, que definem papel de
controlador × operador na LGPD.

E dois pontos concretos: **placeholders literais no ar** (`[Nome do DPO]`,
`[Endereço completo]`, `CEP: [CEP]`, telefone `(11) 0000-0000`) contra uma declaração de
*"total conformidade com a LGPD"* três parágrafos acima — o **controlador não está
identificado**, o que o art. 41 exige.

## 4. Decisões

- **O botão admin sai de vez do público**, não volta religando a flag — decisão do cliente.
  As telas permanecem: `/login?perfil=administrador` segue funcionando por URL direta.
- **Remover os switches órfãos em vez de construir os disparos.** Um controle que não
  controla é pior que a ausência dele. Os disparos viram jornada própria.
- **Minuta legal escrita, não publicada.** Texto jurídico não se publica sem revisão humana.

## 5. Checklist de execução

### Parte 1 — Ocultar o admin do público
- [x] `showAdminButton={true}` removido de `acesso-plataforma` — o CTA "Acessar xgestão"
      volta ao lugar que era suprimido
- [x] Prop `showAdminButton` aposentada no `GlassNav` e em `GlassNavProps` (sem call site,
      viraria código morto religável por engano)
- [x] Assertions no spec do XG05, **nos dois estados** da flag — a do marketplace religado é
      a que prova que a remoção é definitiva, não atrelada ao toggle
- [x] Verificado que os CTAs de contratante/empreiteiro **já estavam** sob
      `marketplaceVisivel` — o admin era o único fora do sistema

### Parte 2 — Controles que não controlavam
- [x] Três switches órfãos removidos; `NOTIFICATION_DEFAULTS` reduzido às chaves com leitor
- [x] `email_prazo` rotulado pelo que de fato faz ("Avisos sobre sua assinatura")
- [x] Toast de checkout só anuncia ativação quando `data.kind === 'activated'`
- [x] Vocabulário do link público: "Avanços aprovados" → "Avanços registrados" (XG15)

### Parte 3 — Aceite e textos legais
- [x] Versão do aceite lida de `legal_documents`, com fallback para "1.0" se a tabela ainda
      não foi semeada — recusar o cadastro seria pior que registrar a versão presumida
- [x] Minuta `termos-v2.md` — natureza do serviço, assinatura (§5), link público (§6),
      dados de terceiros (§7), conteúdo do Assinante (§9)
- [x] Minuta `privacidade-v2.md` — controlador × operador, bases legais por finalidade, link
      público no lugar do "perfil público", placeholders sinalizados
- [x] Confirmado que o bootstrap lê **só** os `-v1.md`: as minutas são inertes
- [ ] **Jurídico revisa, preenche os campos `[ENTRE COLCHETES]` e publica por `/admin/legal`**

### Fechamento
- [x] `npm run check` limpo
- [x] Testes de saúde — 12/12
- [ ] `npm run test:integration` (precisa do ambiente dev de pé)
- [ ] Verificação manual: flag off e flag on em `/acesso-plataforma`

## 6. Fora de escopo (dívida)

- **`ASAAS_WEBHOOK_TOKEN` ausente no publicado:** o webhook é recusado (fail-closed correto)
  e **a assinatura não ativa**. Irrelevante enquanto o teste roda em sandbox; é uma variável
  de ambiente, sem código. Já rastreado em [XG03 §8-A](03-planos-limites-trial.md).
- **`/cadastro` sem query vira contratante** ([cadastro/page.tsx:62](../../app/cadastro/page.tsx#L62)).
  URL não linkada publicamente. Mexer altera o cadastro do marketplace — risco sem retorno
  antes do teste.
- **Disparos de notificação de ocorrência e diário:** não existem. Os switches voltam quando
  existirem.
- **`sis_documentos` nas telas de contratante e empreiteiro:** mesma fachada, mas é dívida
  pré-existente da plataforma, fora do produto ativo.
- **Robustez (BAIXO):** checklist faz DELETE+INSERT fora de transação; `equipe`, `checklists`
  e `aditivos` omitem o `obraId` redundante no UPDATE final (não exploráveis — o pai já foi
  validado). Signed URLs de 12h sobrevivem à revogação do link (trade-off do XG04 §8).

## 7. Gaps descobertos

- **2026-09-14 — o teste cobria a página errada:** o spec do XG05 assertava a ausência dos
  CTAs de marketplace na **home**, e `/acesso-plataforma` — onde estava o único elemento fora
  do toggle — só era visitada para checar cache. **Um teste de ocultação precisa visitar toda
  superfície pública, não a mais óbvia.**
- **2026-09-14 — controle falso é pior que controle ausente:** três switches gravavam no
  banco, confirmavam com toast e não faziam nada. O usuário podia desligar "Ocorrências" e
  seguir recebendo — ou esperar avisos que o produto nunca envia. **Se a UI oferece um
  controle, alguém precisa lê-lo; senão, a tela está mentindo com confirmação.**
- **2026-09-14 — bug que só aparece no dia da publicação:** a versão do aceite fixa em "1.0"
  era inofensiva enquanto só existia a v1. Publicar a v2 transformaria isso em pendência de
  re-consentimento para 100% dos cadastros novos. **Constante que espelha estado do banco é
  bug adiado, não simplificação.**
- **2026-09-14 — o produto virou outro e o contrato não:** os Termos seguiam descrevendo um
  marketplace intermediador, e ninguém percebeu porque texto legal não quebra build nem
  aparece em teste. **O que não tem teste nem tipo só é revisado quando alguém pergunta.**

## 8. Links cruzados

- Depende de: [XG05](05-ocultar-marketplace.md) (toggle do marketplace),
  [XG15](15-coerencia-saude-e-progresso.md) (vocabulário), [XG03](03-planos-limites-trial.md)
  (planos e webhook)
- Relacionada: [J28](../jornadas/28-documentos-legais-versionados.md) (documentos legais
  versionados — o mecanismo que torna a publicação da v2 uma edição de dado)
- Origem: revisão geral pedida em 2026-09-14, antes do teste em obra real
