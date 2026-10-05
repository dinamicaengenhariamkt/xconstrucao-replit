# Jornadas — xgestão

Jornadas do **xgestão**, o produto de gestão de obras onde o **empreiteiro é o cliente pagante**.

Separado de [`docs/jornadas/`](../jornadas/) de propósito: aquelas descrevem o **marketplace** (contratante ↔ empreiteiro), que segue construído e será apenas ocultado. Misturar as duas numerações confundiria as duas jornadas de produto.

- Numeração **XG01…** (as do marketplace vão de J01 a J61).
- Mesmo formato de [`docs/jornadas/_template.md`](../jornadas/_template.md) — 13 seções, links relativos `../../`.
- Mesmos status canônicos: `planejada` · `pendente` · `mock` · `parcial` · `revisão` · `pronto` · `bloqueada` · `congelada`.

## Índice

| # | Jornada | Bloco | Status | Prioridade | Risco |
|---|---|---|---|---|---|
| [XG01](01-fundacoes-e-shell.md) | Fundações e shell do xgestão | 1 | pronto | alta | baixo |
| [XG02](02-obra-do-empreiteiro.md) | Obra criada e editada pelo empreiteiro | 2 | pronto | alta | baixo |
| [XG03](03-planos-limites-trial.md) | Planos, limites e teste de 3 meses | 3 | parcial (§8 trial destravado → XG35) | alta | médio |
| [XG04](04-link-publico-obra.md) | Link público de acompanhamento | 4 | pronto | alta | médio |
| [XG05](05-ocultar-marketplace.md) | Ocultar o marketplace | 5 | pronto | alta | baixo |
| [XG06](06-admin-xgestao.md) | Visão administrativa do xgestão | 6 | pronto (escopo mínimo) | média | baixo |
| [XG07](07-integracao-sinapi.md) | Integração SINAPI (preços de referência) | — | ❄️ **congelada** | — | — |
| [XG08](08-visao-obra-read-only.md) | Visão da obra em modo leitura | 4 | pronto | alta | **médio-alto** |
| [XG09](09-administracao-obra-ponta-a-ponta.md) | Administração da obra ponta a ponta | 9 | pronto | alta | baixo |
| [XG10](10-ajustes-teste-obra-real.md) | Ajustes do teste em obra real | 10 | pronto | alta | médio |
| [XG11](11-offline-pwa.md) | Uso offline e instalação no celular | — | planejada | baixa | — |
| [XG12](12-console-obra-tela-unica.md) | Console da obra em tela única | 9 | pronto | alta | médio |
| [XG13](13-mobile-e-polimento.md) | O console no celular + acabamento visual | 3 | pronto | alta | baixo |
| [XG14](14-auditoria-console.md) | Auditoria do console antes do teste com o cliente | 2 | pronto | alta | baixo |
| [XG15](15-coerencia-saude-e-progresso.md) | Coerência da Saúde, do progresso e da linguagem | 3 | pronto | alta | baixo |
| [XG16](16-revalidacao-pre-teste.md) | Revalidação antes do teste em obra real | 3 | parcial (§5 — minuta legal aguarda jurídico) | alta | baixo |
| [XG17](17-acabamento-console.md) | Acabamento do console: hero, atualizações e saída da Saúde | 4 | pronto | alta | baixo |
| [XG18](18-consolidacao-edicao-e-mapa.md) | Edição só no console, cards padronizados e o mapa | 4 | pronto | alta | médio |
| [XG19](19-upload-e-acabamento.md) | Upload de documento, z-index do mapa e acabamento | 3 | pronto | alta | baixo |
| [XG20](20-beneficiario-saida-e-datas.md) | Beneficiário da saída e data/hora nos registros | 3 | pronto | alta | baixo |
| [XG21](21-checklist-recorrente-e-mapa.md) | Checklist com recorrência (diária/semanal) e correções do mapa | 5 | pronto (falta verificação visual) | alta | médio |
| [XG22](22-valores-contrato-e-contrato-prestador.md) | Saldo a receber corrigido, PIX/contrato do prestador e prévia de gasto | 3 | pronto (falta verificação visual) | alta | médio |
| [XG23](23-etapas-progresso-manual.md) | A etapa vira dona do próprio avanço (percentual manual) | 3 | pronto (falta verificação visual) | alta | médio |
| [XG24](24-tour-guiado-completo.md) | O tour guiado passa pela obra inteira | 2 | pronto (falta verificação visual) | média | baixo |
| [XG25](25-cronograma-atraso-visivel.md) | A barra do cronograma mostra o atraso | 2 | pronto (falta verificação visual) | média | baixo |
| [XG26](26-remocao-mapa-localizacao.md) | O mapa sai da Localização, o endereço fica | 1 | pronto (falta verificação visual) | média | baixo |
| [XG27](27-dashboard-prazo-e-financeiro.md) | O dashboard mostra prazo e financeiro, não percentual | 2 | pronto (falta verificação visual) | alta | médio |
| [XG28](28-dashboard-tabela-e-entrada.md) | Tabela de visão geral e o dashboard como porta de entrada | 3 | pronto (falta verificação visual) | alta | médio |
| [XG29](29-remocao-total-do-percentual.md) | O percentual de execução sai das telas do xgestão, por inteiro | 2 | pronto (falta verificação visual) | alta | médio |
| [XG30](30-link-cliente-publicos-e-cronograma.md) | Um link por público (pagamentos só no do cliente), cronograma no link, checklist e atualizações fora | 4 | pronto (falta verificação visual) | alta | médio |
| [XG31](31-multiusuario-empresa.md) | Vários usuários na mesma empresa: gestor e colaborador com permissões por obra (Fase A); permissões por área (Fase B, implementada) | 4 | implementada (acesso por obra e equipe testados; ver pendências complementares) | alta | médio |
| [XG32](32-obras-por-assinante-admin.md) | Obras por assinante no admin xgestão + auditoria do dashboard | 6 | pronto (falta verificação visual autenticada) | média | médio |
| [XG33](33-ajustes-pendentes-mvp.md) | Ajustes pendentes do MVP (backlog vivo, itens AJ-NN) | 7 | parcial (AJ-02 bloqueado; roteiro desktop/celular aprovado) | alta | médio |
| [XG34](34-zero-percentual-dados-reais.md) | Zero percentual e só dado real em todas as visões (admin, assinante, link) | 7 | parcial (unidade/API aprovadas; inspeção visual completa pendente) | alta | médio |
| [XG35](35-teste-gratis-e-fim-do-teste.md) | Teste grátis de 3 meses, rebaixamento automático e barra do Free | 7 | parcial (Pro/90 dias confirmado; integração aprovada) | alta | médio |
| [XG36](36-admin-xgestao-fechamento.md) | Fechamento do admin: atrasadas/paradas, prazo e valor pago, assinantes, CSV | 7 | parcial (conferência de API; visual autenticada pendente) | alta | médio |
| [XG37](37-equipe-empresa-fechamento.md) | Fechamento da equipe da empresa: isolamento entre empresas e cobertura | 7 | parcial (dono/gestor/colaborador e revogação aprovados em API) | alta | médio |
| [XG38](38-termos-privacidade-no-ar.md) | Termos e privacidade do xgestão no ar (v2 atualizada) | 7 | bloqueada (dados legais e política de cancelamento; v2 não publicada) | alta | baixo |
| [XG39](39-virada-de-chave-lancamento.md) | Virada de chave do lançamento: limites de obras/usuários e pagamento real | 8 | planejada (só no OK de lançamento) | alta | médio |

### Homologação atual

[Relatório parcial de homologação](40-relatorio-homologacao-mvp.md): resultados por execução, evidências, falhas corrigidas e bloqueios. **Não há autorização de lançamento comercial nem assinatura Asaas homologada.**

## Contexto

Fontes: [`docs/novo-fluxo/`](../novo-fluxo/) — transcrições das reuniões (`reuniao-xconstrucao-xgestao-001.vtt` e `-002.vtt`), o PDF de monetização e o [resumo executivo](../novo-fluxo/xgestao-plano-40-45-dias.pdf) gerado por [`scripts/gerar-pdf-xgestao.py`](../../scripts/gerar-pdf-xgestao.py).

**Prazo:** 40 a 45 dias corridos (~20 dias úteis de desenvolvimento + testes conjuntos e homologação).

**Objetivo do MVP, redefinido em 2026-08-19:** a plataforma funcionando para o **Dedé testar nas obras reais dele**. Não é o produto completo — é o produto rodando na dinâmica de uso real. *"O que a gente precisa mais agora é, talvez, do produto funcionando para ele poder testar com as obras reais que ele já tem"* (02:27).

Esse recorte é o critério para decidir o que entra e o que sai: tudo que não serve ao teste em obra real sai do caminho crítico. *"Cada coisa que tu tiver que gastar tempo vai naturalmente tirar tempo de outras coisas"* (01:52).

## Decisões da reunião 002 (2026-08-19)

| Tema | Decisão | Timestamp | Efeito |
|---|---|---|---|
| SINAPI | **Congelado** até a ida a mercado | 03:03, 19:00 | [XG07](07-integracao-sinapi.md) congelada |
| Jornada do anunciante | **Congelada** — *"foca nessa parte do empreiteiro de fato"* | 16:04 | Zona de anúncio sai de [XG04](04-link-publico-obra.md) |
| Limite do plano Pro | **10 obras** | 01:13, 15:11 | Fecha a pendência #3 em [XG03](03-planos-limites-trial.md) |
| Planos | Freemium 1 obra · Basic 3 · Pro 10 | 15:01-15:13 | [XG03 §6](03-planos-limites-trial.md) |
| Freemium | *"tudo do básico, com um pouco menos de função"* | 15:20-15:28 | Premissa provisória — aguarda documento |
| Trial | Acesso ao **plano dele**, não irrestrito. Prazo indiferente | 14:21-14:41 | **Contradiz o PDF** — ver pendência 1 |
| Marketplace e contratante | **Ocultar confirmado** | 03:41 | [XG05](05-ocultar-marketplace.md) sem mudança |
| Link público | **Leitura pura**, *"sem o cara poder modificar nada"* | 20:45 | Sem chat, sem upload, sem comentário |
| Telas do link | **Reaproveitar as do contratante do marketplace** | 19:47-20:15 | Origem de [XG08](08-visao-obra-read-only.md) |

> 💡 **Sobre a interação do contratante.** A reunião teve uma divergência real: o Eder defendeu que o contratante precisa de interação mínima na plataforma (subir documento, usar o XChat), e o Hugo argumentou que isso pertence ao marketplace, não ao xgestão — *"o contratante não é o cliente do xgestão; quem é o cliente do xgestão é o empreiteiro"* (12:20). O assunto ficou para outra conversa (*"depois a gente vê isso aí"*, 13:16) e **o formato fechado foi leitura pura** (20:45).
>
> Registro do custo, para quando o tema voltar: hoje `chat_threads.contratante_user_id` é **NOT NULL FK → `users.id`** e `obra_id` é **UNIQUE**, com exatamente dois participantes em colunas fixas. Contratante sem conta não passa — é mudança de schema, não de código. O caminho mais barato seria um usuário convidado real (linha em `users` sem senha, acesso por magic link), que destrava chat, upload e visualização de uma vez reaproveitando os guards existentes — ao custo de auditar o que mais um `users.id` válido destrava no resto do sistema.

## Decisões de arquitetura que valem para todas as jornadas

1. **Role aditiva, não role nova.** O xgestão usa a tabela `user_roles` ([`shared/db/schema.ts:196`](../../shared/db/schema.ts), J23). `users.role` continua `empreiteiro`. Trocar a role primária quebraria ~250 rotas com `guard.user.role !== "x"` e tiraria do usuário o acesso ao marketplace — o oposto de "ocultar, não apagar".
2. **Prefixo `/xgestao/*` com páginas finas.** Os ~40 arquivos de [`features/empreiteiro/minhas-obras/`](../../features/empreiteiro/minhas-obras/) são **reaproveitados por extração**, nunca copiados. O cliente foi enfático: o usuário precisa saber em qual produto está.
3. **Ocultar por configuração.** Toggles em [`settings-reader.ts`](../../features/admin/platform-settings/server/settings-reader.ts) (J26). Nada de apagar rota ou comentar componente. A reversibilidade é entregável.
4. **O banco já permite obra sem contratante.** Em [`shared/db/schema.ts:219-220`](../../shared/db/schema.ts), `clienteId` e `empreiteiraId` são nullable, e [`features/obras/api/access.ts`](../../features/obras/api/access.ts) concede acesso por `empreiteiraId` sem exigir candidatura. **Não há migration do modelo central.**
5. **Extrair e parametrizar, nunca duplicar.** Reafirmado pelo cliente em 2026-08-19 para as telas do link público. Vale para todo o projeto: quando o mesmo componente serve dois produtos, ele ganha uma prop — não uma cópia. A exceção é o *layout* genuinamente diferente (sidebar do xgestão, shell público), onde abstrair custa mais que escrever. Ver [XG08 §8](08-visao-obra-read-only.md).

## Ordem de execução original

Com SINAPI e anunciante fora, o caminho crítico ficou mais curto e mais linear:

```
XG01  fundações e shell
 └─ XG02  obra do empreiteiro
     ├─ XG03  planos e limites      (parcial — §8 trial aguarda preços)
     ├─ XG05  ocultar marketplace   (independente, barato)
     └─ XG08  extração read-only
         └─ XG04  link público
              ├─ XG06  admin          (escopo mínimo entregue)
              └─ XG09  administração ponta a ponta

❄️ congeladas: XG07 (SINAPI) · jornada do anunciante (J12/J16/J23/J31)
```

**XG08 vem antes de XG04** — o link sem conteúdo não entrega nada, e a extração é o trabalho com maior risco de regressão. Melhor descobrir cedo se os cards J06 resistem à parametrização.

**XG05 é o item mais barato do projeto** e não depende de nada além de XG01. Se sobrar uma janela em qualquer ponto, é o que preencher.

**XG03 pode começar sem os preços.** Persona, catálogo, contagem por `empreiteiraId` e o 402 não dependem da definição comercial — só a mecânica do teste (§8) depende.

## Fora de escopo

- **Migração Replit → infra própria** — decisão em aberto do lado do cliente; não entra em nenhuma jornada.
- **Orçamento estruturado** (tabela de itens de orçamento por obra) — projeto próprio.
- **Interação do contratante no xgestão** (chat, upload, comentários) — decidido como leitura pura em 2026-08-19. Ver o callout acima.
- **SINAPI** e **jornada do anunciante** — congelados, não cancelados. As jornadas seguem no diretório com o conteúdo preservado.

## Definições pendentes

Sobraram **2**. Nenhuma bloqueia o desenvolvimento já entregue.

1. **Preços finais e composição funcional dos 3 planos para o lançamento** — a definição comercial continua separada da homologação. A antiga dúvida sobre o trial foi respondida pelo usuário: **Pro comercial por 90 dias; sem assinatura paga ativa, volta ao Free sem apagar dados**. Isso não autoriza novos preços nem ativação comercial.
2. **Aplicação dos limites reais no lançamento** — manter obras e dados existentes no fim do teste; os limites temporários permanecem intactos. A ativação dos limites de obras/equipe exige o OK separado de XG39; não foi realizada nesta rodada.

### Pendência jurídica (bloqueia o go-live comercial, não o teste)

**Termos de Uso e Política de Privacidade descrevem o marketplace, não o xgestão.** Os Termos
publicados declaram a plataforma "intermediadora, conectando contratantes e empreiteiros" e
**não mencionam assinatura, cobrança ou cancelamento** — num produto vendido por assinatura.
A Política não cobre o **link público** nem os **dados de terceiros** que o empreiteiro
insere (cliente, equipe, fotos), que definem controlador × operador na LGPD. E há
**placeholders literais no ar** (`[Nome do DPO]`, `[Endereço completo]`, `[CEP]`) contra uma
declaração de "total conformidade" — o controlador não está identificado (art. 41, LGPD).

Minutas escritas e **não publicadas** em `server/legal-seed/termos-v2.md` e
`privacidade-v2.md`. O conteúdo é **dado**, não código: publicar é uma edição em
`/admin/legal`, que dispara o re-consentimento sozinho (J28). Falta o jurídico revisar e
preencher os campos entre colchetes. Detalhes em [XG16 §3](16-revalidacao-pre-teste.md).

### Pendência de configuração (não bloqueia desenvolvimento)

**Homologação de 2026-10-04, atualização:** o usuário confirmou `ASAAS_WEBHOOK_TOKEN`;
webhook sandbox cadastrado e ativo na origem pública do desenvolvimento. Destino rejeita
chamada sem token (400) e aceita sondagem autenticada sem processar pagamento (200).
Checkout Basic mensal de R$ 89 criado para conta descartável, mas pagamento e ativação
continuam não comprovados; conclusão interativa do checkout pendente.
A situação do ambiente publicado e a antiga aprovação de cartão não foram novamente
verificadas nesta execução; não usar esse histórico como comprovação de pagamento.
Checklist em [XG03 §8-A](03-planos-limites-trial.md).
### Respondidas em 2026-08-19

| Pergunta original | Resposta |
|---|---|
| ~~Limite do Pro: 10 ou 15 obras?~~ | **10 obras** (01:13) |
| ~~SINAPI: existe serviço de consulta automática?~~ | Sim, via terceiro (respondida em 2026-08-10) — mas a integração foi **congelada** (03:03) |
| ~~Custo do plano PRO do Orçamentador (R$ 79,90/mês) entra no orçamento?~~ | Prejudicada — SINAPI congelado |
| ~~Quota de consultas SINAPI por plano~~ | Prejudicada — SINAPI congelado |
| ~~Jornada do anunciante neste MVP?~~ | **Congelada** (16:04) |
| ~~O que a visão admin precisa mostrar?~~ | **Respondida em 2026-09-02**, na revisão do produto: obras com filtro, detalhe de cada obra, lucro do assinante, receita da plataforma e saúde — "enxuto, mas navegável". Ver [XG06 §8](06-admin-xgestao.md). O escopo mínimo anterior era um chute para destravar o MVP, e não se sustentou no uso |
| ~~Domínio xconstrução~~ | **Resolvido em 2026-08-28** — `dinamicareforma.com.br` está apontado e serve a publicação ativa. |

> Ao receber respostas às 2 pendências restantes, atualizar **os dois** — este índice e o script [`gerar-pdf-xgestao.py`](../../scripts/gerar-pdf-xgestao.py), que é a fonte do PDF entregue ao cliente.

## Nota de formato

[XG07](07-integracao-sinapi.md) tem **15 seções**, não 13: insere `9. Configuração` e `10. Restrições contratuais`, deslocando as demais. É exceção conhecida e deliberadamente não corrigida — renumerar uma jornada congelada é risco sem retorno. As outras sete seguem o template.
