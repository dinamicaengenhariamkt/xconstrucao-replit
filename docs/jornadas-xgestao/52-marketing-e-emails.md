# XG52: marketing e e-mails automáticos

Consentimento de e-mail de marketing (LGPD), e-mails automáticos do ciclo de vida da conta pelo Brevo, rotina diária agendada e validação do telefone no cadastro. Feito em 10/11/2026.

## 1. Consentimento de marketing (LGPD)

Base legal: consentimento (art. 7º, I, e art. 8º da LGPD). Livre, opcional, revogável a qualquer momento.

| Onde | Como funciona |
|---|---|
| Cadastro do xgestão (`/cadastro?perfil=xgestao`) | Caixa **desmarcada**: "Quero receber dicas e novidades do xgestão por e-mail. Posso sair quando quiser." Não é condição para cadastrar. Só aparece no cadastro do xgestão. |
| Configurações do xgestão, aba Notificações | Card "Dicas e novidades" com um liga/desliga que salva na hora. Só para o responsável da conta (membro da equipe não vê). |
| Link no fim de cada e-mail de marketing | Abre `/descadastro?t=...`, página pública, sem login. A saída acontece no botão "Sim, não quero mais receber". |
| Cabeçalho `List-Unsubscribe` | O Gmail e outros mostram "Cancelar inscrição"; o clique faz `POST /api/xgestao/descadastro` (RFC 8058, um clique). |

O que fica gravado em `users`:

- `marketing_consentimento_em`: quando aceitou (nulo = nunca aceitou);
- `marketing_revogado_em`: quando saiu;
- `marketing_origem`: de onde veio a última mudança (`cadastro`, `configuracoes`, `descadastro`).

Está ativo quando há aceite e não há saída depois dele. Cada aceite e cada saída também vão para `audit_logs` (`xgestao.marketing.consentiu` e `xgestao.marketing.revogou`) com IP e navegador: é a prova do consentimento.

O token do link de descadastro é o id da conta cifrado (AES-256-GCM, chave derivada por HMAC do `SESSION_SECRET` que já existe). Não mostra o id, não pode ser alterado e não expira. Abrir o link não tira ninguém da lista (a pré-visualização do provedor de e-mail não descadastra); só o clique no botão.

## 2. Os e-mails

Remetente: "xgestão" `noreply@dinamicareforma.com.br`. Visual igual ao aviso de expiração existente (`features/notificacoes/emails/xgestao-ciclo.tsx`); textos em `features/xgestao/marketing/lib/textos-emails.ts`.

| E-mail | Quando sai | O que diz | Tipo e base legal |
|---|---|---|---|
| Teste termina em 7 dias | Faltam até 7 dias para o fim do teste | Até quando vai o teste; depois do fim ainda há 24h e a conta vira somente leitura, sem apagar nada. Botão "Ver planos". | Transacional, execução de contrato |
| Teste termina em 3 dias | Faltam até 3 dias | Igual, com 3 dias | Transacional |
| Teste termina em 1 dia | Falta até 1 dia | Igual, com 1 dia | Transacional |
| Teste terminou | Prazo acabou, dentro das 24h de tolerância | Até quando a conta segue liberada; depois, somente leitura. Botão "Escolher um plano". | Transacional |
| Pagamento pendente | Assinatura inadimplente, dentro da carência de 7 dias | Não conseguimos confirmar o pagamento; regularize até a data do fim da carência. Botão "Ver minha assinatura". | Transacional |
| Cancelamento confirmado | Cancelamento agendado pelo assinante | Acesso completo até a data; depois somente leitura, dados guardados. | Transacional |
| Sua primeira obra | Entrou no xgestão há 3 a 30 dias, ainda sem obra e com acesso | Convite para cadastrar a primeira obra. Botão "Cadastrar uma obra". | Marketing, só com consentimento |
| Suas obras continuam aqui (7 dias) | 7 a 13 dias depois de perder o acesso (teste vencido sem assinar ou assinatura encerrada) | A conta está em somente leitura desde a data; tudo continua guardado; para voltar a editar, escolha um plano. | Marketing, só com consentimento |
| Suas obras continuam aqui (30 dias) | 30 a 44 dias depois de perder o acesso | Mesmo texto | Marketing, só com consentimento |

Regras:

- **A situação não é recalculada.** Vem de `listarAssinantesDetalhados` (a mesma leitura do admin CRM), que usa `situacaoAssinante` e `assinaturaXgestaoVigente`. "Saiu" é a data de saída do CRM (`saida.em`) ou, para teste vencido, o fim do teste + 24h.
- **Uma vez só.** Tabela `xgestao_emails_enviados` com chave única (conta, tipo, referência). A referência é o dia que ancora o aviso (fim do teste, fim da carência, pedido de cancelamento, dia da saída) ou `unico` no "primeira obra". Um teste novo ou uma nova inadimplência geram um aviso novo; o mesmo não repete. A linha é reservada antes do envio e apagada se o envio falhar (tenta de novo na próxima rodada).
- **Switch "Avisos sobre sua assinatura" desligado** (`email_prazo`): não saem os avisos de teste e de pagamento. A confirmação de cancelamento sai sempre.
- **Ficam de fora:** conta interna, admin e superadmin, conta desativada, membros da equipe (só o responsável recebe).
- **Anti-abuso (XG50):** nenhum e-mail oferece teste grátis ou mês bônus de novo, nem desconto.
- **Teto diário:** o plano free do Brevo permite 300 e-mails por dia para a conta inteira (verificação de e-mail e recuperação de senha também contam). A rotina usa no máximo `XGESTAO_EMAILS_TETO_DIARIO` (padrão 200, máximo 290), descontando o que ela mesma já mandou no dia. Transacional vai antes de marketing; o que passar do teto fica para o dia seguinte.
- Sem `SESSION_SECRET` (nem `NEXTAUTH_SECRET`/`AUTH_SECRET`) não há link de descadastro, então nenhum e-mail de marketing sai (conta em `semTokenDescadastro`).

## 3. Lista do Brevo

A cada rodada, quem tem consentimento ativo entra (ou é atualizado) na lista **"xgestão assinantes"**, dentro da pasta "xgestão". Lista, pasta e atributos são criados na primeira vez, pela API.

| Atributo | Conteúdo |
|---|---|
| `SITUACAO` | código da situação (`em_teste`, `pago`, `somente_leitura`...) |
| `PLANO` | nome do plano (com "(teste)" durante o teste) |
| `FIM_TESTE` | data de fim do teste, quando em teste |

Quem retirou o consentimento nos últimos 45 dias é removido da lista. Falha do Brevo não derruba a rotina: aparece em `brevo.ok = false` com o motivo no JSON de resposta e no log. O nome da lista pode ser trocado com `BREVO_LISTA_XGESTAO`.

## 4. Rotina diária: `POST /api/cron/xgestao-diario`

O deploy é autoscale (sem processo contínuo), então um agendador externo chama a rota uma vez por dia. Ela:

1. roda os jobs que antes só rodavam no boot: lançamentos atrasados (`mark-overdue`), aviso de expiração de inadimplente, testes vencidos, trocas de plano vencidas e ajustes de troca;
2. manda os e-mails da seção 2;
3. sincroniza a lista do Brevo.

Proteção: `Authorization: Bearer <CRON_SECRET>`, comparado em tempo constante. Sem `CRON_SECRET` nos Secrets a rota responde **503** e não roda; segredo ausente ou errado, **401**. Pode ser chamada mais de uma vez no dia sem repetir e-mail.

Resposta (só contagens, sem dado pessoal):

```json
{
  "ok": true,
  "jobs": { "mark-overdue": { "ok": true, "total": 0 }, "aviso-expiracao": { "ok": true, "total": 0 } },
  "emails": { "contasAvaliadas": 42, "planejados": 5, "jaEnviados": 2, "enviados": 3, "adiadosPeloTeto": 0,
              "falhas": 0, "semTokenDescadastro": 0, "teto": 200, "enviadosHojeAntes": 0,
              "porTipo": { "teste_acaba_7d": 2, "sem_obra_3d": 1 } },
  "brevo": { "ok": true, "modo": "real", "listaId": 12, "enviados": 8, "removidos": 1 }
}
```

Cada rodada fica em `job_runs` como `cron.xgestao-diario`.

### Secrets a cadastrar no deploy

| Secret | Valor |
|---|---|
| `CRON_SECRET` | segredo longo e aleatório. Gerar com `openssl rand -hex 32`. O mesmo valor vai no agendador. |
| `BREVO_API_KEY` | já existe |
| `NEXTAUTH_URL` | já existe; é a base dos links dos e-mails |
| `XGESTAO_EMAILS_TETO_DIARIO` | opcional (padrão 200) |

### Opção A: Scheduled Deployment do Replit

1. No Replit, Publishing, criar um deployment do tipo **Scheduled**.
2. Schedule: todo dia às **9h**, fuso **America/Sao_Paulo**. Se o campo de fuso não aparecer, usar o cron `0 12 * * *` (12h UTC = 9h de Brasília).
3. Run command:

   ```bash
   curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" "$APP_URL/api/cron/xgestao-diario"
   ```

4. Secrets do Scheduled Deployment: `CRON_SECRET` (o mesmo do app) e `APP_URL` (domínio público, ex.: `https://www.dinamicareforma.com.br`, sem barra no fim).
5. Build command: deixar vazio ou `true`. O comando só faz uma chamada HTTP, leva segundos.
6. Depois da 1ª execução, conferir no log do Scheduled Deployment o JSON com `"ok": true`. Se aparecer 503, faltou o `CRON_SECRET` nos Secrets do app publicado; 401, os dois valores são diferentes.

### Opção B: cron externo

Qualquer agendador que faça um POST com cabeçalho serve (cron-job.org, GitHub Actions, cron de um servidor próprio):

```bash
# todo dia às 9h de Brasília
0 9 * * * curl -fsS -X POST -H "Authorization: Bearer SEU_CRON_SECRET" https://SEU_DOMINIO/api/cron/xgestao-diario
```

No cron-job.org: método POST, cabeçalho `Authorization: Bearer ...`, fuso America/Sao_Paulo, 9h diário. O segredo fica guardado no serviço externo; prefira a opção A.

## 5. Admin CRM

- Lista de assinantes: chip **"Aceita e-mail de marketing"** (combina com os outros recortes) e, em cada linha, "Aceita e-mail de marketing" ou "Sem e-mail de marketing".
- CSV: colunas `Aceita e-mail de marketing`, `Consentimento em`, `Revogado em`, `Origem do consentimento`. Com o chip ligado, o CSV sai só com quem aceitou (`marketing=aceitou` na URL); é esse o arquivo para campanha. O admin vê tudo, sem máscara.

## 6. Telefone

O Asaas não exige telefone (só nome e CPF/CNPJ), então ele continua **opcional** no cadastro. Se preenchido, precisa ser brasileiro com DDD: 10 dígitos (fixo) ou 11 (celular, começando com 9), com ou sem máscara e com ou sem +55. A mesma regra (`shared/lib/telefone-br.ts`) vale no navegador e no servidor (`registerSchema`), e o número é gravado só com dígitos. O cadastro pelo Google não passa por esse formulário e não muda.

## 7. Termos e Política

As minutas **não publicadas** `server/legal-seed/termos-v2.md` (nova §3-A) e `privacidade-v2.md` (§2.2, §3 e §4) passaram a dizer: marketing só com consentimento, opcional e fora da condição de cadastro; revogação a qualquer momento pelas configurações ou pelo link; avisos da conta não são marketing; Brevo como operadora, com a transferência internacional pelo art. 33 da LGPD (marcado para revisão do jurídico). A v1 publicada não mudou. Publicar continua sendo pelo `/admin/legal`.

## 8. Arquivos

- `migrations/0016_xgestao_marketing_emails.sql` e `server/bootstrap-colunas-essenciais.ts` (colunas em `users` e tabela `xgestao_emails_enviados`, criadas no boot);
- `features/xgestao/marketing/lib/*` (regras puras: consentimento, token, quem recebe o quê, textos, autorização do cron);
- `features/xgestao/marketing/server/*` (consentimento, Brevo, rotina);
- `app/api/cron/xgestao-diario`, `app/api/xgestao/marketing`, `app/api/xgestao/descadastro`, `app/descadastro`;
- testes: `tests/unit/xgestao-marketing-emails.test.ts`, `tests/e2e/integration/xgestao-marketing-emails.integration.spec.ts`, `tests/e2e/xgestao-marketing.browser.spec.ts`.

## 9. Pendências

- Agendar a rotina (seção 4) e cadastrar o `CRON_SECRET` no deploy.
- Confirmação de cancelamento sai na rodada seguinte ao pedido (até 24h depois), não na hora.
- O aviso antigo de inadimplência (`aviso-expiracao-job`, "XConstrução") continua saindo no 4º dia de atraso, além do aviso novo do xgestão no início do atraso.
- Revisão do jurídico nas minutas v2 antes de publicar.
