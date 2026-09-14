# Jornada — XG18: Edição só no console, cards padronizados e o mapa que faltava

> Status: 🔄 em execução | Prioridade: alta | Wave: xgestão-18
> Última atualização: 2026-09-14

> **Ponto de retomada:** o checklist da §5 é a fonte de verdade. Cada item marcado `[x]`
> está feito e verificado; `[ ]` é o que falta. Se a sessão cair, continuar do primeiro
> `[ ]` de cima para baixo.

## 1. Contexto

Revisão da tela em uso. Cinco pontos levantados pelo cliente — e a investigação mostrou que
três deles tinham causa **mais simples** do que o sintoma sugeria, um era um placeholder
nunca implementado, e um já estava certo.

> *"Eu lembro que a gente tinha acordado que, nessa tela inicial aqui mesmo, o ID da obra
> tudo seria feito na edição da obra em si. Tudo nessa tela."*

## 2. Os achados

### A1 — a tela "Cadastro completo" era um caminho duplicado

Auditoria campo a campo: **os 14 campos editáveis da tela existiam, idênticos, nos modais do
console**. Não por semelhança — os dois caminhos chamavam as **mesmas funções** de
[use-editar-obra.ts](../../features/xgestao/hooks/use-editar-obra.ts) (`patchObra`,
`validarInformacoes`, `validarLocalizacao`), com os mesmos `maxLength`, `required` e
mensagens. A única diferença: a tela salvava os 14 num PATCH, os modais salvam em dois.

**Uma lacuna real, e bloqueante:** `ExcluirObraDialog` tinha **exatamente um consumidor** em
todo o repositório — aquela tela. Apagá-la sem migrar deixaria o produto **sem nenhuma forma
de excluir uma obra pela interface**.

**E um motivo da XG12 que não se sustentava.** A [XG12 §6](12-console-obra-tela-unica.md)
manteve a tela por dois papéis: exclusão e "onboarding guiado de obra nova". O segundo
**nunca existiu no código**: o `NovaObraModal` não faz redirect para `/editar` — o `router`
dele só manda ao perfil quando o cadastro da empresa está incompleto. A tela nunca abria
sozinha; só pelo link cinza "Cadastro completo".

### A2 — o botão do hero repetia, com menos, o que o card entrega melhor

Depois que o link público ganhou bloco próprio no card de detalhes — com URL visível e botão
**Copiar** —, o "Compartilhar link" sobre a capa virou redundante.

### A3 — os cards do Financeiro: um prop que não chegava

**Não era CSS errado.** O `StatsCard` **já implementa** o padrão luminous via
[LuminousHoverCard](../../shared/components/ui/LuminousHoverCard.tsx), e o `ProfitCard` **já
propaga** a flag para cada um. A cadeia quebrava em dois pontos: `FinanceiroTabProps` não
declarava `luminous`, e o console — que calcula `kpiLuminous` e passa para os 5 KPIs do topo
— não passava nada para a aba.

Resultado: default `false`, ramo "plain", sem borda em gradiente e com a sombra de hover
pesada. Era exatamente o "hover antigo" que o cliente viu.

### A4 — o mapa nunca foi implementado

O relato foi *"a gente vai precisar liberar ali a parte do Google"*. **Não é chave de API.**
[LocalizacaoCard.tsx](../../features/shared/components/LocalizacaoCard.tsx) tinha um
placeholder literal, com o comentário `{/* Map placeholder */}` no próprio código: uma div
cinza com ícone e o texto "Mapa da localização". Renderizava idêntico com ou sem endereço.

Não havia chave de mapa em lugar nenhum do projeto — e nunca houve, porque não havia mapa
embutido. O botão "Abrir no Google Maps" funciona por ser só um `window.open` para a URL de
busca, que não exige credencial.

**E o projeto já tinha tudo:** `leaflet`, `react-leaflet` e `@types/leaflet` no
`package.json`, com um precedente funcionando em
[MapaRaioInner.tsx](../../features/perfil/components/MapaRaioInner.tsx) — Leaflet +
OpenStreetMap, geocoding por Nominatim, ambos **gratuitos e sem chave**.

### A5 — o Gantt estava certo

Validado pelo cliente na tela e conferido no código:
[CronogramaGanttCard](../../features/empreiteiro/minhas-obras/components/CronogramaGanttCard.tsx),
entregue na XG10, **SVG inline sem biblioteca externa**. Marcador de "hoje", legenda de
status, aviso de etapas sem data, rolagem horizontal, `role="img"` + `aria-label`. Nada a
fazer.

## 3. Decisões

- **Apagar a tela, não ocultar.** Exceção consciente à regra do README §3, que protege o
  **marketplace** — oculto e reversível. Esta é do xgestão e foi substituída por paridade
  total: manter seria manter duas portas para o mesmo dado. O git preserva o histórico.
- **Migrar a exclusão primeiro.** Só depois apagar. A ordem importa: inverter deixaria o
  produto sem exclusão por um commit.
- **Leaflet em vez de Google.** Já instalado, já provado no projeto, sem chave e sem custo.
  Google Maps embutido exigiria criar credencial, billing no GCP e restrição por referrer —
  custo e dependência sem ganho evidente.
- **Não persistir `lat`/`lng` agora.** A cascata de geocoding resolve sem isso; persistir
  exigiria tocar adapters, interface e o PATCH. Fica como dívida (§6), não meia-implementação.

## 4. Checklist de execução

### Parte 1 — Edição consolidada no console
- [x] "Excluir obra" migrado para o rodapé do card de detalhes, separado por borda das ações
      positivas — a proteção real segue no diálogo, que exige digitar o nome da obra
- [x] Link "Cadastro completo" removido
- [x] `app/xgestao/obras/[id]/editar/` e `EditarObraPage.tsx` apagados
- [x] Mantidos `CapaObraEditor`, `ExcluirObraDialog`, `use-editar-obra.ts` e `GuidedTour` —
      todos com outros consumidores
- [x] Teste de integração: a rota passa a esperar **404**, com o porquê no comentário
- [x] Teste de browser reescrito para os dois modais (os IDs equivalentes já existiam)

### Parte 2 — Hero e tour
- [x] "Compartilhar link" removido do hero; sobre a capa fica só "Trocar capa"
- [x] Passo do tour reapontado para o bloco de link no card, que ganhou `data-tour`
- [x] Texto do passo ajustado: menciona copiar ali mesmo e gerenciar no modal

### Parte 3 — Cards
- [x] `luminous` declarado em `FinanceiroTabProps`, repassado ao `ProfitCard` e vindo do
      console via `kpiLuminous` — **zero mudança de CSS**
- [x] KPIs de `ValoresDoContrato` alinhados, **preservando a `border-l-4` colorida**: ali a
      cor distingue contratado × aditivo × saldo, é informação e não decoração

### Parte 4 — Mapa
- [x] `MapaEnderecoInner` espelhando o padrão do perfil, com cascata de precisão
      (endereço completo → CEP → cidade/UF)
- [x] Wrapper `MapaEndereco` com `dynamic(ssr: false)` — **obrigatório**: Leaflet toca
      `window` e quebraria o build no SSR
- [x] Placeholder substituído, com o fundo cinza virando estado de carregando/indisponível
- [x] `IconMap`, que só servia ao placeholder, removido do import

### Fechamento
- [x] `npm run check` limpo
- [x] Testes de saúde — 12/12
- [x] Páginas que montam o `LocalizacaoCard` compilam no dev server (valida o `ssr: false`)
- [ ] `npm run test:integration`
- [ ] Verificação visual: mapa com marcador, cards com o mesmo hover, exclusão ponta a ponta

## 5. Fora de escopo (dívida)

- **`lat`/`lng` não persistidos.** As colunas existem em `obras`
  ([schema.ts:253-254](../../shared/db/schema.ts#L253)) e seguem vazias. Hoje o mapa
  geocodifica a cada visita; o Nominatim pede ~1 req/s e User-Agent identificável, então em
  escala isso fica frágil. Gravar no PATCH exigiria estender a interface `Localizacao` e os
  adapters (`features/obras/adapters.ts:321,425`), que hoje descartam os campos.
- **Precisão do Nominatim** em endereço residencial brasileiro é irregular — daí a cascata.
  Um endereço que só resolve na cidade mostra o mapa na cidade, não na rua.
- **Acessibilidade do Gantt** (já em [XG15 §6](15-coerencia-saude-e-progresso.md)): no celular
  a coluna de nomes rola junto e some; o percentual só existe no `<title>`, inacessível no
  toque **e para leitor de tela** — `role="img"` faz o leitor anunciar só o rótulo geral e
  ignorar o conteúdo interno. Melhoria com escopo próprio.
- **Indicador de completude do cadastro.** A barra "Progresso do cadastro N/5" morreu com a
  tela. O console tem o tour e o estado vazio do card, mas não um medidor. Nenhum dado ficou
  ineditável — é lacuna de guia, não de função.

## 6. Gaps descobertos

- **2026-09-14 — "precisa liberar a API do Google" era uma feature inexistente:** o relato
  descrevia um sintoma de configuração, e a causa era um placeholder com o comentário
  `{/* Map placeholder */}` no código. **Um placeholder que imita a coisa real vira relato de
  bug: o usuário não distingue "não carregou" de "nunca existiu".**
- **2026-09-14 — o "hover antigo" era um prop que não chegava:** nenhuma classe estava errada
  — `StatsCard` e `ProfitCard` já implementavam o padrão inteiro, e a flag simplesmente não
  era repassada. **Antes de reescrever estilo, checar se o componente já não sabe fazer o que
  se quer.**
- **2026-09-14 — decisão documentada não é decisão implementada:** a XG12 manteve a tela de
  edição por dois motivos, e um deles ("onboarding guiado de obra nova") nunca saiu do papel —
  não havia redirect algum. A doc registrou a intenção e ninguém conferiu o código depois.
  **Ao reavaliar uma decisão antiga, verificar se a premissa dela chegou a existir.**
- **2026-09-14 — apagar exige inventário, não impressão:** a paridade de 14 campos parecia
  óbvia, e era — mas o inventário achou a exclusão, que tinha um único ponto de entrada em
  todo o produto. **A auditoria não serviu para confirmar o que já se sabia; serviu para
  achar o que ninguém lembrava.**

## 7. Links cruzados

- Reverte: [XG12 §6](12-console-obra-tela-unica.md) ("a tela `/editar` fica")
- Depende de: [XG17](17-acabamento-console.md) (o card de detalhes e o bloco de link),
  [XG10](10-ajustes-teste-obra-real.md) (o Gantt validado aqui)
- Origem: revisão de uso em 2026-09-14
