# Jornada — XG38: termos de uso e privacidade do xgestão no ar

> Status: bloqueada (dados da empresa e cancelamento; minutas revisadas, não publicadas) | Prioridade: alta | Wave: xgestão-38
> Última atualização: 2026-10-04

## 1. Contexto & Objetivo

A [XG16](16-revalidacao-pre-teste.md) escreveu as minutas `termos-v2.md` e `privacidade-v2.md`,
já focadas no xgestão (assinatura, link público, dados de terceiros, controlador × operador). Elas
estão **inertes**: o bootstrap só lê as v1, que descrevem um marketplace intermediador. Hoje o
produto roda com texto que não corresponde ao que ele é.

Decisão do Ramon (2026-10-04): **publicar já** o que temos, atualizado com o que mudou depois da
XG16. A revisão do advogado vem depois, como nova versão.

## 2. Personas

- **Assinante e membro**: aceitam os termos novos (re-consentimento).
- **Admin**: publica por `/admin/legal`.

## 3. Fluxo ponta-a-ponta

1. Atualizar as minutas com o que entrou depois da XG16 (§9).
2. Preencher os campos entre colchetes com os dados da empresa (Ramon fornece).
3. Remover o bloco "MINUTA PARA REVISÃO" do topo.
4. Publicar por `/admin/legal`, que dispara o re-consentimento.

## 4. Telas envolvidas

- [app/admin/legal/page.tsx](../../app/admin/legal/page.tsx) — publicação de versão
- [app/termos](../../app/termos), [app/politica-privacidade](../../app/politica-privacidade) — leitura pública

## 5. Componentes-chave

- [server/legal-seed/termos-v2.md](../../server/legal-seed/termos-v2.md)
- [server/legal-seed/privacidade-v2.md](../../server/legal-seed/privacidade-v2.md)

## 6. Schema (Drizzle)

Nenhuma. Usa `legal_documents` e o fluxo de re-consentimento da J28.

## 7. Endpoints

Os de `/admin/legal` já existentes.

## 8. Mocks a remover

Nenhum.

## 9. Checklist de implementação

- [x] Incluir o **teste grátis** e o rebaixamento automático para o Free ([XG35](35-teste-gratis-e-fim-do-teste.md))
- [x] Incluir **membros da empresa** ([XG31](31-multiusuario-empresa.md)): o dono responde pelos acessos que concede; dado do membro tratado como dado do assinante
- [x] Atualizar o link público para **vários links por público** e a seção de pagamentos ([XG30](30-link-cliente-publicos-e-cronograma.md))
- [ ] Preencher: razão social, CNPJ, endereço completo, CEP, cidade/UF, comarca, telefone,
      e-mail de contato, nome e e-mail do encarregado (DPO), data de publicação, prazos `[30]` e `[90]` dias
- [ ] Remover o bloco de comentário "MINUTA PARA REVISÃO"
- [ ] Confirmar política de cancelamento e alinhar §5.4 com o serviço: minuta prevê acesso até o fim do ciclo pago, mas a implementação cancela imediatamente
- [ ] Publicar por `/admin/legal` no ambiente de teste e conferir o re-consentimento no login
- [ ] Publicar no ambiente publicado

## 10. Critérios de aceite

1. `/termos` e `/politica-privacidade` mostram a v2, sem nenhum `[CAMPO]` sobrando e sem citar marketplace intermediador.
2. Usuário existente vê o pedido de novo aceite no login; o aceite fica em `user_consents` com a versão nova.

## 11. Riscos / Pontos de atenção

- **Bloqueio: dados da empresa.** Razão social, CNPJ, endereço, comarca e encarregado de dados
  precisam vir do Ramon/cliente. Na memória do projeto consta o CNPJ da Dinâmica Reforma
  (25.327.918/0001-70), mas a empresa que opera o xgestão precisa ser confirmada.
- Publicar dispara re-consentimento para todos: avisar os testadores.
- Texto sem revisão jurídica: registrar que a v3 virá após o advogado.

## 12. Links cruzados

- Depende de: [XG16](16-revalidacao-pre-teste.md)
- Relacionadas: [XG30](30-link-cliente-publicos-e-cronograma.md), [XG31](31-multiusuario-empresa.md), [XG35](35-teste-gratis-e-fim-do-teste.md)

## 13. Gaps descobertos durante execução

- 2026-10-04: jornada criada; substitui a pendência "jurídico publica" da XG16 §5.
- 2026-10-04: minutas atualizadas. Termos: §5.1-A teste grátis (opcional, uma vez por conta, volta automática ao Free sem apagar dados) e §5.1-B membros da equipe (o responsável responde pelos acessos que concede); §6 fala em links por público. Privacidade: links por público com seções por link (pagamentos desligado por padrão, conferido em `secoes.ts`) e nova subseção sobre o que o responsável vê dos membros. Falta: dados da empresa nos colchetes, remover o bloco de minuta e publicar.
- 2026-10-04: homologação especificou Pro/90 dias, Free distinto de Basic e preservação da assinatura paga; apontou divergência de cancelamento na própria minuta. V2 permanece inerte. Nenhuma publicação ou novo aceite foi forçado; conferir [relatório](40-relatorio-homologacao-mvp.md) antes de publicar.
