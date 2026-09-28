---
name: Provisionamento de membros xgestão
description: Limite entre a conta convidada de uma equipe e o cadastro automático de empreiteira.
---

Um membro convidado do xgestão não pode receber uma empresa própria por nenhum fluxo de verificação de e-mail, recuperação de perfil ou login, mesmo antes de aceitar o convite ou depois de revogado.

**Why:** A conta tem papel primário empreiteiro, e o provisionamento automático de perfil por papel pode criar uma segunda empresa. Isso faz a resolução de empresa tratá-la como dono e contorna o significado da revogação. Proteger só a página de perfil ou o endpoint de convite não basta.

**How to apply:** Ao introduzir qualquer novo caminho que crie um perfil de empreiteiro, confira o vínculo de equipe em todos os estados antes do provisionamento. Continue exigindo que concessões por obra pertençam à empresa e sejam obras próprias do xgestão, nunca obras de clientes do marketplace.