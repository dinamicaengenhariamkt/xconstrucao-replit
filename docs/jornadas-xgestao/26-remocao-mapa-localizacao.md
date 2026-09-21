# Jornada — XG26: o mapa sai, o endereço fica

> Status: ✅ implementado (verificação visual pendente) | Prioridade: média | Wave: xgestão-26
> Última atualização: 2026-09-20

## 1. Contexto

Segundo relato sobre o mesmo mapa. A [XG21](21-checklist-recorrente-e-mapa.md) já havia
investigado uma queixa parecida e concluído que o código estava certo — o CEP cadastrado é que
não existia nos Correios. Mesmo depois da cascata de tentativas que aquela jornada construiu, o
cliente voltou dizendo que o ponto continua errado.

Desta vez ele mesmo ofereceu a saída, e é ela que esta jornada executa.

## 2. O achado

> *"O Ramon, aqui na parte do mapa, ele não puxa o endereço direito, ele tá puxando a Praça da
> SESP, que é São Paulo que eu coloquei, mas o endereço não tá puxando certinho não."*
>
> *"Se for ter dificuldade, só tira a parte do mapa só e pronto. Deixa só a parte do endereço
> ali, abrir no Google Maps e editar. Deixa só essa parte aí."*

O print mostra o sintoma com precisão: o card de endereço à direita diz **Rua Achilles Masetti,
105 — São Paulo/SP, CEP 04006020**, e o marcador do mapa à esquerda está na **Praça da Sé**, o
marco zero da cidade. Ou seja, a cascata caiu até a última tentativa — cidade/UF — e plotou o
centroide de São Paulo. O badge "Local aproximado — confira o endereço" apareceu, como
projetado, mas avisar que o ponto está errado não é o mesmo que acertá-lo.

**O limite é estrutural, não um bug a mais.** O geocoding roda no browser contra o Nominatim,
escolhido na [XG18](18-consolidacao-edicao-e-mapa.md) por ser gratuito, sem chave e já provado
no mapa de raio do perfil. O que a XG21 descobriu e registrou como gap segue valendo: a base do
OSM não cobre logradouro brasileiro com consistência, e o `User-Agent` identificável que a
política do Nominatim exige é justamente um header que o browser proíbe definir. Acertar de
verdade exigiria endpoint de servidor e provedor pago — trabalho que o pedido não pede e que o
cliente explicitamente dispensou.

## 3. Decisões

- **Remover, não desligar atrás de flag.** Um mapa escondido por flag é código que ninguém
  mantém e que volta a quebrar quando alguém o religa. O git guarda a implementação inteira se
  um dia houver orçamento para geocoding pago.

- **Os dois botões nunca dependeram de geocoding, e é por isso que sobrevivem intactos.**
  `handleOpenMaps` monta uma query de texto (`rua+número, bairro, cidade, estado, CEP`) e delega
  ao Google, que geocodifica muito melhor que o Nominatim. O que saiu foi a tentativa de plotar
  o ponto **dentro** da nossa tela — a de abrir no mapa de quem sabe fazer isso continua.

- **Metade da largura, alinhado à esquerda.** Pedido literal do cliente ("no máximo 50%"), e
  coincide com o que a coluna já ocupava quando havia mapa ao lado: `max-w-md` numa coluna só.
  Esticar para 100% deixaria os botões como barras atravessando a tela e o endereço solto num
  campo de branco.

- **As dependências do Leaflet ficam.** `leaflet`, `react-leaflet` e `@types/leaflet` seguem no
  `package.json`, as regras `.leaflet-*` seguem em [globals.css:418-441](../../app/globals.css)
  e os ícones em `public/leaflet/`. O [`MapaRaio`](../../features/perfil/components/MapaRaio.tsx)
  do perfil continua usando os três — e ali o mapa funciona, porque plota um **raio de atuação**
  a partir do CEP, onde aproximação de bairro é o resultado certo, não um erro. A diferença entre
  os dois casos é o que justifica remover um e manter o outro.

- **O guard `preenchido()` continua.** Nasceu na XG21 para impedir que placeholders de exibição
  (`—`) virassem query do geocoder. Sem mapa ele fica **mais** necessário, não menos: a busca do
  Google Maps passa a ser a única, e um traço nela ainda estraga o resultado.

## 4. Execução

- [x] [`LocalizacaoCard.tsx`](../../features/shared/components/LocalizacaoCard.tsx) — sai o
      import, sai o grid `lg:grid-cols-2` e sai o bloco do mapa; a coluna de endereço + ações
      vira filho único com `max-w-md`
- [x] `MapaEndereco.tsx` e `MapaEnderecoInner.tsx` apagados — eram consumidos só por este card
- [x] Docblock do `preenchido()` atualizado: citava `MapaEnderecoInner`, arquivo que deixou de
      existir

Os dois consumidores não mudaram: [empreiteiro](../../app/empreiteiro/minhas-obras/[id]/page.tsx)
(com `onEditar`, que abre o `EditarLocalizacaoModal`) e
[contratante](../../app/contratante/minhas-obras/[id]/page.tsx) (leitura pura). O modal de
edição segue intacto — inclusive o autofill por CEP via ViaCEP, que é validação de dado e não
geocoding.

## 5. Testes

- [x] `npm run check` limpo — é o que pegaria qualquer import órfão dos arquivos apagados
- [x] Grep confirma nenhuma referência restante a `MapaEndereco` ou `mapa-precisao` em código
- [x] `data-testid="btn-editar-localizacao"` preservado — é a única asserção da suíte que toca
      esta seção ([xgestao-obras.browser.spec.ts:377](../../tests/e2e/xgestao-obras.browser.spec.ts))
- [ ] **Browser spec não executado**: faltam bibliotecas de sistema para o Chromium subir neste
      ambiente, como já constatado na [XG24](24-tour-guiado-completo.md) e na
      [XG25](25-cronograma-atraso-visivel.md). Rodar `npm run test:e2e:xgestao` onde o browser exista
- [ ] Verificação visual: card sem mapa, sem badge e sem créditos do OpenStreetMap; endereço em
      ~metade da largura; os dois botões funcionando; mapa de raio do perfil ainda renderizando

## 6. Dívidas

- **O endereço da obra continua sem validação no cadastro.** É a causa raiz que a XG21 já havia
  identificado (`lookupCep` existe em [masks.ts:67](../../shared/lib/masks.ts) e nunca foi ligado
  ao formulário da obra) e que esta jornada **não** resolve — só remove o sintoma visível. Um CEP
  digitado errado segue entrando no banco; agora ninguém vê o efeito até abrir o Google Maps.
- **Geocoding próprio some do produto.** Qualquer feature futura que precise de coordenada (raio
  de obras num mapa, distância até o prestador) recomeça do zero — e deve começar por um
  endpoint de servidor com provedor que cubra o Brasil, não pelo Nominatim no browser.

## 7. Gaps descobertos

- **2026-09-20 — o segundo relato do mesmo bug mudou a pergunta.** Da primeira vez a resposta
  certa foi investigar o dado, e o código estava certo. Da segunda, com o dado correto e o ponto
  ainda errado, a pergunta deixou de ser "como consertar" e passou a ser "isso é conservável com
  o que temos?". **Relato repetido sobre a mesma feature é sinal de limite estrutural, não de
  correção mal feita.**
- **2026-09-20 — avisar que o resultado está errado não conserta o resultado.** O badge "Local
  aproximado" fez exatamente o que a XG21 projetou, e ainda assim o cliente voltou. **Um aviso
  honesto sobre imprecisão não compra tolerância à imprecisão: se o dado exibido não serve, a
  saída é não exibi-lo.**
- **2026-09-20 — a mesma dependência pode ser certa num lugar e errada noutro.** Leaflet +
  Nominatim saiu do endereço da obra e ficou no raio do perfil, sem contradição: um precisa de
  ponto exato, o outro de área aproximada — e a precisão que o serviço entrega é suficiente para
  o segundo. **Avaliar ferramenta externa contra o requisito de cada uso, não contra o produto
  inteiro.**

## 8. Links cruzados

- Depende de: [XG18](18-consolidacao-edicao-e-mapa.md) — que trouxe o mapa ·
  [XG21](21-checklist-recorrente-e-mapa.md) — que tentou corrigi-lo e registrou o limite do
  Nominatim
- Relacionado: [XG19](19-upload-e-acabamento.md) — o z-index do Leaflet, agora só relevante para
  o mapa de raio do perfil
- Origem: `docs/novo-fluxo/ajustes/solicitacao-novo-ajuste-mapa-xgestao-001.txt` e `-002.txt`
  + print (2026-09-20)
