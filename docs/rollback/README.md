# Rollback de mudanças visuais

## Site público, 12/11/2026 (facelift leve + tema claro/escuro + animação ao rolar)

Pedido do Ramon: melhorar o visual da home, do xgestão inteligente, dos Termos, da Privacidade, do menu e do rodapé, sem mudar textos, fonte nem cores. Se o cliente não gostar, volta assim.

O arquivo `visual-site-antes-2026-11-11.tar.gz` guarda a versão anterior destes arquivos (já com o PWA do dia 11/11):

- app/page.tsx
- app/xgestao-inteligente/page.tsx
- app/politica-privacidade/page.tsx
- app/termos/page.tsx
- features/landing/components/GlassNav.tsx
- features/landing/components/SiteFooter.tsx
- features/landing/components/InstalarAppSecao.tsx
- features/legal/components/LegalDocumentView.tsx (não foi alterado; está aqui por segurança)

### Voltar tudo

No Shell do Replit, na raiz do projeto:

```bash
tar xzf docs/rollback/visual-site-antes-2026-11-11.tar.gz
```

Isso sobrescreve só os arquivos da lista. Os arquivos novos do facelift podem ficar (sem uso, não aparecem):
`features/landing/components/Reveal.tsx`, `SiteTemaRaiz.tsx`, `SiteTemaBotao.tsx` e `features/landing/lib/site-tema.ts`.

### Voltar só uma página

```bash
tar xzf docs/rollback/visual-site-antes-2026-11-11.tar.gz app/termos/page.tsx
```

### Manter uma correção mesmo voltando o visual

O link "Desenvolvido por Ramon Gomes" no rodapé foi corrigido para https://ramongomessilva.com.br/. A versão antiga aponta para ramongomes.com.br. Se voltar o `SiteFooter.tsx`, corrigir esse link de novo.

## Site público, rodada 2, 12/11/2026 (responsividade, breadcrumb, telas de conta)

Pedido do Ramon depois de ver no aparelho: tirar as etiquetas com bolinha acima dos títulos e a bolinha do menu, corrigir os cards espremidos, breadcrumb com imagem de fundo em login/termos/privacidade, tema claro/escuro em todas as telas externas, tirar "Versão 1" do documento legal.

`visual-site-antes-2026-11-12.tar.gz` guarda o estado logo antes da rodada 2 (já com a rodada 1). Inclui também login, cadastro, recuperar senha, nova senha, verificar e-mail, descadastro e a página /instalar.

- Voltar só a rodada 2: `tar xzf docs/rollback/visual-site-antes-2026-11-12.tar.gz`
- Voltar tudo ao visual original (antes das duas rodadas): rode primeiro o da rodada 2 e depois `tar xzf docs/rollback/visual-site-antes-2026-11-11.tar.gz`. As telas de conta só existem no pacote da rodada 2.

Arquivos novos da rodada 2 (podem ficar sem uso): `features/landing/components/SiteHeroPagina.tsx`, `features/legal/components/IndiceDocumento.tsx`.

## Painel do xgestão, 13/11/2026 (tema claro/escuro + acabamento leve, PRD 55)

Pedido do Ramon: aplicar o PRD 55 completo (tema escuro do painel do empreiteiro, do admin xgestão e do link público; ajustes leves do claro).

`painel-tema-antes-2026-11-13.tar.gz` guarda os 97 arquivos alterados como estavam antes (já com a correção do menu do celular, que continua valendo ao voltar).

### Voltar tudo

```bash
tar xzf docs/rollback/painel-tema-antes-2026-11-13.tar.gz
tar xzf docs/rollback/painel-tema-antes-2026-11-13-selos.tar.gz
rm app/admin/xgestao/layout.tsx
```

O `rm` é necessário: esse layout é novo e liga o tema no admin. Os demais arquivos novos podem ficar sem uso: `features/xgestao/tema/` (4 arquivos), `tests/unit/painel-tema.test.ts`, `tests/e2e/helpers-tema-painel.ts`, `tests/e2e/tema-painel.browser.spec.ts` e `tests/e2e/tema-painel-escuro-forcado.browser.spec.ts` (para tirar os testes, apague os dois specs e as duas linhas deles no `playwright.config.ts`).

### Desligar só o botão de tema (manter tudo claro)

Apagar a linha `<SeletorTemaMenu />` em `features/xgestao/components/XGestaoTopbar.tsx` e o bloco `isAdminXgestaoPath(pathname) && <SeletorTemaMenu />` em `features/admin/components/AdminTopbar.tsx`, e trocar `PREFERENCIA_PADRAO` para `'claro'` em `features/xgestao/tema/painel-tema.ts`. O escuro forçado do navegador continua desligado (fica claro e com a logo visível).
