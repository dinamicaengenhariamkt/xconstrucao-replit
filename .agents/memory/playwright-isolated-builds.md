---
name: Isolamento de builds e origem dos testes Playwright
description: Evitar snapshots de cache ativo, encerramento de servidor compartilhado e falsos negativos de upload em loopback.
---

Não aquecer o servidor de testes copiando o cache de um Next que está em execução.

**Why:** uma cópia deixou tipos gerados com conteúdo inconsistente e o E2E não iniciou; limpar somente o cache de testes parado e recompilar isoladamente permitiu executar os casos.

**How to apply:** manter build de teste separado; jamais limpar dados ou o cache do app principal para reparar o runner. Conferir TypeScript depois de o servidor estabilizar, não durante a troca de arquivos gerados.

Uma única execução Playwright deve controlar o servidor usado pelos seus casos.

**Why:** uma rodada paralela reutilizou o servidor de outra; quando a proprietária terminou, a navegação da primeira falhou por conexão recusada.

**How to apply:** reunir os casos em uma execução ou dar a cada processo um servidor/build realmente independente; reuseExistingServer sozinho não garante a vida do servidor.

Upload real ao R2 deve ser conferido pela origem pública efetivamente usada pelo usuário.

**Why:** a tentativa em loopback falhou antes do commit; a mesma jornada completa passou no preview público, em desktop e celular.

**How to apply:** tratar CORS/origem como hipótese ao investigar falhas locais, sem concluir que produção está quebrada nem alterar permissões do bucket por causa de um teste. Preparar dados só no banco de desenvolvimento e manter login normal na UI pública.