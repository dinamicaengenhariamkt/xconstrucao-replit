---
name: Verificação de e-mail nos testes E2E
description: Host dos links de verificação capturados durante testes com servidor Next.js isolado.
---

Em testes de API que usam um servidor E2E dedicado, o link de verificação capturado no e-mail pode carregar o host de desenvolvimento, embora o usuário do teste tenha sido criado no servidor E2E. Extraia o caminho e a query do link e faça o request com o cliente relativo ao servidor de teste.

**Why:** Um redirect 302 do link não prova que o usuário do banco do teste foi verificado; o host público pode encaminhar o token a outra instância. O teste falhou ao conferir o campo verificado mesmo recebendo redirect.

**How to apply:** Em fluxos que capturam links de e-mail e operam com um baseURL de teste isolado, preserve o token e direcione a visita ao mesmo baseURL usado no cadastro. Confira também o estado após o redirect.