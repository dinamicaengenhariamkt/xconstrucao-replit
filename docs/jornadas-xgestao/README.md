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
| [XG03](03-planos-limites-trial.md) | Planos, limites e teste de 3 meses | 3 | parcial (§8 trial bloqueado) | alta | médio |
| [XG04](04-link-publico-obra.md) | Link público de acompanhamento | 4 | pronto | alta | médio |
| [XG05](05-ocultar-marketplace.md) | Ocultar o marketplace | 5 | pronto | alta | baixo |
| [XG06](06-admin-xgestao.md) | Visão administrativa do xgestão | 6 | pronto (escopo mínimo) | média | baixo |
| [XG07](07-integracao-sinapi.md) | Integração SINAPI (preços de referência) | — | ❄️ **congelada** | — | — |
| [XG08](08-visao-obra-read-only.md) | Visão da obra em modo leitura | 4 | pronto | alta | **médio-alto** |
| [XG09](09-administracao-obra-ponta-a-ponta.md) | Administração da obra ponta a ponta | 9 | pronto | alta | baixo |

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

1. **Preços finais e composição funcional dos 3 planos** — bloqueia apenas [XG03 §8](03-planos-limites-trial.md) (a mecânica do teste) e o seed de preços. O cliente ficou de enviar o documento (18:44). **Atenção:** a reunião 002 (*"ele vai ter o acesso ao plano dele"*, 14:41) **contradiz** o PDF de monetização (*"3 meses 100% grátis irrestrito"*). São implementações diferentes — a segunda exige um job de downgrade inteiro. Resolver antes de codificar §8.
2. **Fim do teste com obras acima do limite** — o que acontece quando o período acaba e o usuário tem mais obras que o plano permite. Depende da resposta 1. A recomendação da jornada continua valendo: **nunca retirar acesso de leitura**, bloquear apenas a criação de novas.
### Respondidas em 2026-08-19

| Pergunta original | Resposta |
|---|---|
| ~~Limite do Pro: 10 ou 15 obras?~~ | **10 obras** (01:13) |
| ~~SINAPI: existe serviço de consulta automática?~~ | Sim, via terceiro (respondida em 2026-08-10) — mas a integração foi **congelada** (03:03) |
| ~~Custo do plano PRO do Orçamentador (R$ 79,90/mês) entra no orçamento?~~ | Prejudicada — SINAPI congelado |
| ~~Quota de consultas SINAPI por plano~~ | Prejudicada — SINAPI congelado |
| ~~Jornada do anunciante neste MVP?~~ | **Congelada** (16:04) |
| ~~O que a visão admin precisa mostrar?~~ | Não respondida, mas **despriorizada** — XG06 é a última da ordem e não bloqueia o MVP |
| ~~Domínio xconstrução~~ | **Resolvido em 2026-08-28** — `dinamicareforma.com.br` está apontado e serve a publicação ativa. |

> Ao receber respostas às 2 pendências restantes, atualizar **os dois** — este índice e o script [`gerar-pdf-xgestao.py`](../../scripts/gerar-pdf-xgestao.py), que é a fonte do PDF entregue ao cliente.

## Nota de formato

[XG07](07-integracao-sinapi.md) tem **15 seções**, não 13: insere `9. Configuração` e `10. Restrições contratuais`, deslocando as demais. É exceção conhecida e deliberadamente não corrigida — renumerar uma jornada congelada é risco sem retorno. As outras sete seguem o template.
