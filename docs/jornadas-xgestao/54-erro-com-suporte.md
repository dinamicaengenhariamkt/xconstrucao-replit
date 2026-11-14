# 54. Erro com saída: suporte rápido quando algo falha (PRD)

Status: proposta para decisão (13/11/2026). Nada implementado.
Origem: áudio do Eder (13/11) com o print do Banco Inter ("Aconteceu um erro por aqui. Já estamos trabalhando nisso. Tente novamente em breve. [APLNE03]").

## O problema

No beta vamos ter de 50 a 100 empreiteiros usando o xgestão no dia a dia, quase todos no celular. Vai dar erro: é inerente ao produto novo. O risco não é o erro, é o silêncio. O cliente que trava no meio do trabalho, não tem a quem recorrer e não recebe resposta vai para a reclamação pública ou desiste.

O Eder resumiu: "deu probleminha, o cara chamou no WhatsApp, resolveu, beleza; enquanto isso a gente ganha tempo para resolver o problema maior". A ideia é não se queimar no início.

## O que já existe no código (13/11)

| Peça | Situação |
|---|---|
| Tabela `app_errors` (nível, mensagem, rota, usuário, impressão digital) | existe, alimentada por `server/lib/logger.ts` |
| Tela Saúde do admin (`/admin/saude`) | existe |
| Erro do navegador vai para `/api/log/client-error` | existe, com limite por IP |
| Sentry (`@sentry/nextjs`, configs e limpeza de CPF/e-mail/token em `lib/sentry-scrub.ts`) | instalado, **sem chave** (desligado) |
| `error.tsx` do admin, empreiteiro e contratante | existe |
| `error.tsx` do xgestão (`app/xgestao`) | **não existe**: cai na tela global genérica |
| Rotas `app/api/xgestao/**` gravando erro 500 no `app_errors` | **0 de 11**: o erro só vira um toast "Não foi possível salvar" e some |
| Aviso para nós quando algo quebra | **nenhum**: alguém precisa abrir a tela Saúde |
| Endpoint de saúde para monitor externo | **não existe** |

Resumo: o registro existe pela metade e ninguém é avisado. Hoje quem descobre o erro primeiro é o cliente.

## Proposta em 4 camadas

### 1. Saber antes do cliente (detecção)

- Ligar o gancho `onRequestError` do Next 16 em `instrumentation.ts`: todo erro de servidor (qualquer rota, sem mexer em cada uma) grava no `app_errors` com rota e usuário.
- Aviso imediato no Telegram (e e-mail pela Brevo da XConstrução como reserva) quando: um erro novo aparece pela primeira vez, ou o mesmo erro passa de 5 ocorrências em 10 minutos. Agrupado por impressão digital, para não virar spam.
- `GET /api/saude` (testa o banco e o storage em menos de 2 s) e um monitor externo gratuito (UptimeRobot ou Better Stack) batendo a cada 1 a 5 minutos. Se a plataforma cair inteira, o aviso não pode depender dela mesma.
- Sentry: opcional. O plano grátis cobre o beta, a limpeza de dados pessoais já está pronta e é só pôr a chave. Ganho: rastro completo do erro no navegador do cliente. Custo: dado sai do Brasil (mitigado pela limpeza). Recomendação: ligar depois da camada 2, se a tabela própria não bastar.

### 2. Erro com saída (o que o cliente vê)

Um componente único, `ErroComSuporte`, no lugar das telas e avisos de erro do xgestão:

- Texto humano: "Algo não saiu como esperado. Seus dados estão seguros e já fomos avisados."
- Um **código curto** do ocorrido, como o `[APLNE03]` do Inter: `XG-7F3K2` (derivado do id gravado no `app_errors`). É ele que liga a conversa do cliente ao registro do erro.
- Botão **Tentar de novo**.
- Botão **Falar com o suporte**: abre o WhatsApp com a mensagem já escrita: "Olá! Tive um problema no xgestão. Código: XG-7F3K2. Tela: Obra > Pagamentos. 13/11 09:32." Se não houver WhatsApp configurado, cai para e-mail.
- Onde entra: novo `app/xgestao/error.tsx`; toasts de "Não foi possível salvar" passam a mostrar o código e o link "Falar com o suporte"; item "Ajuda e suporte" no menu lateral e no menu da conta; aviso do link público.
- Nada de detalhe técnico na tela (o stack só aparece em desenvolvimento, como já é hoje).

### 3. Previsibilidade (quando o problema é geral)

- Chave **"Instabilidade em andamento"** no admin: liga uma faixa no topo do painel ("Estamos com lentidão em parte do sistema. Já estamos resolvendo. Previsão: 30 min.") e o mesmo texto aparece no `ErroComSuporte`. O cliente sabe que não é com ele e não precisa perguntar.
- Depois de resolvido: e-mail curto para quem foi afetado (sabemos quem pelo `usuario` no `app_errors`), dizendo o que houve e que está normal.

### 4. Atendimento (o lado humano)

- **Hoje não há WhatsApp.** Para o beta, o WhatsApp Business no celular (grátis) já resolve: saudação automática, mensagem de ausência fora do horário e respostas rápidas prontas. Sem código.
- Resposta automática sugerida: "Recebemos sua mensagem. Se você enviou um código XG, já sabemos onde aconteceu. Respondemos em até 15 minutos em horário comercial."
- Quem atende cola o código na busca da tela Saúde e vê usuário, tela, horário e erro. Com o "ver como o cliente" (impersonação, já existe no admin) dá para pegar a informação que o cliente precisava e mandar na hora, como o Eder descreveu, enquanto a correção é feita.
- Mais tarde (fase 2 do produto): WhatsApp pela API com robô que já responde o status da instabilidade. Só se o volume justificar.

## Fases sugeridas

| Fase | Entrega | Tamanho |
|---|---|---|
| F1 Detecção | `onRequestError` + aviso Telegram/e-mail + `/api/saude` + monitor externo | 1 dia |
| F2 Erro com saída | `ErroComSuporte`, `app/xgestao/error.tsx`, código nos toasts, busca por código na Saúde, item de suporte no menu | 1,5 a 2 dias |
| F3 Previsibilidade | chave de instabilidade + faixa + e-mail pós-incidente | 1 dia |
| F4 (opcional) | Sentry com a chave; WhatsApp por API | sob demanda |

Testes: unitário do código curto e da mensagem do WhatsApp; integração do `onRequestError` gravando e disparando aviso (sem enviar de verdade); navegador simulando erro 500 numa rota do xgestão e conferindo código + botões no celular.

## Como medir

- Tempo até sabermos de um erro (meta: menos de 5 min, antes do cliente).
- Tempo até a primeira resposta humana (meta: 15 min em horário comercial).
- % de contatos de suporte que chegam com código (meta: acima de 70%).
- Erros novos por semana, e quantos clientes cada um afetou.

## Decisões pendentes (Ramon / Eder)

1. Número do WhatsApp de suporte e quem atende.
2. Horário de atendimento prometido.
3. Telegram de quem recebe os avisos.
4. Ligar o Sentry agora ou só se a tabela própria não bastar.
