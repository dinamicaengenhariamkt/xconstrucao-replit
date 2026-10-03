---
name: Rejeição genérica do Git
description: Diferenciar divergência de histórico e rejeição por arquivos grandes sem colocar trabalho existente em risco.
---

Não interpretar a mensagem genérica PUSH_REJECTED do painel como prova de commits novos no remoto. Verificar também o tamanho dos arquivos em todos os commits ainda não enviados, não apenas no estado final da branch.

**Why:** O painel sugeriu atraso em relação ao remoto mesmo com a branch somente adiantada. Um cache de build acima do limite por arquivo do GitHub estava no histórico não publicado; atualizar o painel ou fazer pull não removia esse bloqueio.

**How to apply:** Confirmar o estado real do remoto antes de alterar histórico. Caso seja necessário limpar apenas commits não enviados, obter autorização, manter uma referência local de segurança e comparar o conteúdo que não é cache em todos os commits. Preservar o ancestral já publicado permite um push normal, sem sobrescrever o remoto. Não enviar a branch de segurança contendo os arquivos rejeitados.