# Jornada — Transparência LGPD do Processamento de Pagamento

> Status: pronto | Prioridade: alta | Wave: 11
> Última atualização: 2026-07-22
>
> A auditoria LGPD confirmou que a MECÂNICA de consentimento é robusta (2 documentos
> versionados, IP/UA, rollback em falha, revogação/re-aceite), mas havia uma lacuna de
> TRANSPARÊNCIA: o usuário não era informado de que o CPF/CNPJ é enviado a um provedor
> externo de pagamentos, e a política não era acessível permanentemente.

## 1. Contexto & Objetivo
No cadastro, a plataforma cria proativamente um cadastro do usuário num processador de
pagamentos externo (com CPF/CNPJ). Isso não era comunicado, e os textos legais só mencionavam
"processadores de pagamento" de forma genérica. Objetivo: dar transparência e acesso à política,
**sem** reescrever o texto jurídico definitivo (fica pro jurídico refinar na v2).

## 2. Mudanças
1. **Link permanente no footer** — [SiteFooter.tsx](../../features/landing/components/SiteFooter.tsx):
   Termos de Uso + Política de Privacidade (rotas [/termos](../../app/termos/page.tsx) e
   [/politica-privacidade](../../app/politica-privacidade/page.tsx) já existiam, mas não eram
   alcançáveis pelo footer).
2. **Nota no cadastro** — [app/cadastro/page.tsx](../../app/cadastro/page.tsx): a frase do CPF/CNPJ
   passou a informar que os dados de pagamento são processados por um provedor externo, com link
   "Saiba mais" → política.
3. **Nota no wizard** — [OnboardingWizard.tsx](../../features/onboarding/OnboardingWizard.tsx):
   linha de ciência nos passos de empresa (cobrança) e de recebimento (empreiteiro), com link.
4. **Esclarecimento na política** — [privacidade-v1.md](../../server/legal-seed/privacidade-v1.md):
   frase na subseção "Prestadores de Serviço" explicitando que um processador de pagamentos
   terceirizado pode receber CPF/CNPJ/nome/e-mail para criar cadastro/subconta necessários às
   transações. **Sem bump de versão** — é esclarecimento do texto genérico já vigente.
   O bootstrap [bootstrap-legal-documents.ts](../../server/bootstrap-legal-documents.ts) sincroniza
   o conteúdo da v1 com o arquivo (o `.md` é a fonte de verdade do seed; versões publicadas >1 são
   imutáveis e não são tocadas).

## 3. Decisões (dono)
- Não nomear a marca do provedor na UI (o jurídico decide se nomeia).
- Não fazer a v2 formal dos termos agora — só o esclarecimento mínimo. O jurídico refina depois.

## 4. Checklist
- [x] Link termos/privacidade no footer
- [x] Nota de transparência no cadastro (com link)
- [x] Nota de transparência no wizard (empresa + recebimento)
- [x] Esclarecimento na política de privacidade (sem bump de versão; sync no bootstrap)

## 5. Critérios de aceite
1. Footer mostra links para Termos e Política em qualquer página que o use.
2. Cadastro e wizard informam o processamento por provedor externo, com "Saiba mais".
3. A política menciona o compartilhamento de CPF/CNPJ com processador de pagamentos.
4. Nenhum bump de versão dos documentos legais (re-consent não é disparado).

## 6. Nota jurídica
Este é um reforço de transparência de engenharia, **não** um parecer jurídico. O texto definitivo
(incluindo se/como nomear o provedor e a base legal detalhada) deve ser validado pelo jurídico.

## 7. Links cruzados
- Origem: auditoria ASAAS. Reusa J32 (documentos legais), J44 (provisionamento de customer).
