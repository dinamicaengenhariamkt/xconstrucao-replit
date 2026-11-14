# 55. Tema claro/escuro e acabamento leve do painel (PRD)

Status: implementado em 13/11/2026 (ver seção 9). Sem commit; o Ramon commita pelo Replit.
Origem: áudio do Guilherme e print de um cliente com o "modo escuro" do navegador do celular ligado (`ajustes/pwa-xcon.jpeg`).
Regra do dono: ajuste leve, sem mudar de "água para vinho", sem quebrar nada que já funciona. Mesma fonte (Manrope), mesmas cores, mesmos textos.

## 0. Já feito: menu do celular fecha ao tocar no item

Relato do Guilherme: no celular, ao tocar num item do menu lateral a gaveta não fechava, e parecia que o toque não tinha funcionado.

- Correção em `XGestaoSidebar.tsx` e `AdminSidebar.tsx`: todo link do menu fecha a gaveta no celular, inclusive o da tela em que a pessoa já está. No computador nada muda.
- Teste novo `tests/e2e/menu-celular.browser.spec.ts` (empreiteiro e admin, 390 px): 2/2. `logout-xgestao` 3/3, `tsc` limpo, unitários 405/405.
- Vale também para o app instalado (PWA), que usa as mesmas telas.

## 1. O problema do modo escuro forçado

O painel só tem tema claro. Quando o celular do cliente está com o escuro forçado do navegador (Chrome Android, Samsung Internet, Xiaomi), o navegador inverte as cores por conta própria. Reproduzimos no Chromium com `--enable-features=WebContentsForceDark` (fotos em `/tmp/visual/interno/forcado`):

| O que acontece | Onde |
|---|---|
| Logo XConstrução (PNG preto) some no fundo escuro | menu lateral do empreiteiro e do admin |
| Cartões, campos e página ficam quase da mesma cor, com bordas duras | todas as telas |
| Textos cinza ficam com pouco contraste | tabelas do admin |
| Capa vazia da obra vira um bloco preto | Minhas Obras e tela da obra |

Teste feito no mesmo navegador: declarar `color-scheme: only light` desliga essa inversão automática (pixel branco em vez de 18,18,18). `color-scheme: light`, sem o "only", não desliga.

## 2. Recomendação

**Sim, vale ter tema claro e escuro no painel**, em duas etapas:

1. **Já (1 linha, sem risco visual):** declarar `only light` nas áreas do painel (`app/xgestao`, `app/admin/xgestao`, link público). O cliente com escuro forçado passa a ver o painel claro e correto, logo visível, como é hoje para os demais. Isso para o estrago até o tema escuro de verdade existir.
2. **Depois, com calma:** tema escuro próprio, desenhado com a paleta que já usamos no site, com três opções: **Claro, Escuro e Automático (segue o celular)**. Quando o escuro estiver validado, o `only light` sai e entra `light dark`: quem usa o celular no escuro passa a ver o nosso escuro, desenhado, e não a inversão do navegador.

Por que vale: a maioria usa no celular, muitas vezes à noite ou no canteiro; o escuro forçado já está nas mãos dos clientes e hoje deixa a marca invisível. Um escuro bem feito é percebido como cuidado.

## 3. O que já existe e o que falta (inventário do Codex, 13/11)

- Tokens `.dark` em `app/globals.css`, store de tema (`shared/store/theme-store.ts`) e `ThemeProvider`, mas **nenhum botão usa**. Esse provider põe `.dark` no `<html>`, o que escureceria também o marketplace e o site. Não usar como está.
- Padrão a seguir: o tema do site público (`features/landing/lib/site-tema.ts` + `SiteTemaRaiz`), que liga o escuro só dentro de um invólucro e declara `color-scheme`.
- Muitas telas já têm `dark:` parcial. Pontos sem nenhuma versão escura: logo do menu, gráficos com cor fixa (`#333333` some no escuro), textos `gray-500` do link público, capa vazia da obra.
- Componentes que abrem "por cima" (Dialog, Sheet, Popover, DropdownMenu, Select, AlertDialog, Toast, tour guiado) são desenhados no `body`, fora do invólucro. Precisam de um destino de portal dentro do escopo do tema, senão os modais ficam claros num painel escuro.
- Estratégia de menor risco: **acrescentar `dark:` sem tocar na classe clara**. Trocar `bg-white` por `bg-card`, por exemplo, mudaria o claro (o `--card` não é branco puro).
- Telas de obra (console, cronograma, etapas, diário, fotos, ocorrências) não estavam no recorte do inventário: são o maior lote e serão medidas antes de começar.

## 4. Paleta escura (mesmas cores do site)

| Papel | Claro (hoje) | Escuro |
|---|---|---|
| Fundo da página | `gray-50` / `#FAFAFA` | `#1C1F22` |
| Cartão | branco | `#2A2D30` |
| Campo de formulário | branco, borda cinza | `#222528`, borda `white/10` |
| Borda | `black/5` a `gray-200` | `white/10` |
| Texto principal | `#101819` | `#F4F5F5` |
| Texto secundário | `gray-500` | `slate-400` |
| Menu lateral | `#FAFAFA` | `#1C1F22` com divisória `white/10` |
| Item ativo do menu | fundo claro + barra | `#2A2D30`, texto semibold |
| Botão primário | `#333333`, texto branco | branco, texto `#1C1F22` (igual ao site) |
| Selos de status | cor clara | mesma cor em fundo `900/30` e texto `300` (padrão já usado no admin) |
| Logo | PNG preto | mesmo PNG com `dark:invert` (ou versão branca) |

Nenhuma cor nova.

## 5. Acabamento leve (claro e escuro)

Seleção depois de conferir a crítica do Gemini nas fotos (itens sem base nas fotos foram descartados).

Painel do empreiteiro (prioridade celular):

| # | Tela | Ajuste | Impacto |
|---|---|---|---|
| 1 | Menu lateral | Item ativo sem a barra preta saliente à direita: fundo suave + semibold (como no site) | alto |
| 2 | Menu lateral | Tirar a bolinha de "Área xgestão" (mesmo padrão removido do site) | baixo |
| 3 | Menu lateral | Folga inferior com área segura do celular para o "Sair" não ficar colado na borda | médio |
| 4 | Todas | Selo "Planejamento" com a mesma cor na lista e na tela da obra (hoje verde em uma, azul na outra) | alto |
| 5 | Painel | 4 indicadores em grade 2x2 no celular (hoje em coluna, muita rolagem) | alto |
| 6 | Painel | Ícones dos indicadores no mesmo "quadradinho" (hoje um tem caixa, outro não) | médio |
| 7 | Minhas Obras | Busca e "Filtros" na mesma linha no celular | médio |
| 8 | Minhas Obras | Rodapé do cartão (Orçamento, Prazo) em duas colunas legíveis | médio |
| 9 | Configurações | Abas com indicação de que rolam para o lado (hoje "Notificaç" corta seco) | médio |
| 10 | Formulários | Botão principal de largura total no celular (ex.: "Salvar perfil") | médio |
| 11 | Faixa do teste | "Assinar agora" com área de toque de 44 px | médio |
| 12 | Todas | Transições discretas (150 a 200 ms) em hover, foco e item ativo; respeita "reduzir movimento". Sem animação de rolagem no painel (velocidade em primeiro lugar) | baixo |

Admin (computador):

| # | Tela | Ajuste | Impacto |
|---|---|---|---|
| A1 | Menu | Mesmo item ativo do painel (sem barra saliente) | baixo |
| A2 | Assinantes | Filtros secundários recolhidos num "Mais filtros" (só visual; mesmos filtros e mesma URL) | alto |
| A3 | Obras | Busca, filtros e "Exportar CSV" numa linha só | médio |
| A4 | Financeiro | Hierarquia: números de plano menores que os KPIs de faturamento | baixo |

Link público (cliente final): segue o celular dele (Automático), sem botão; logo e selos corrigidos. Quem abre com o celular claro não vê nenhuma mudança.

Fora do escopo: marketplace, site público (já tem tema próprio), textos, fonte, fluxos e regras.

## 6. Lotes

| Lote | Conteúdo | Risco |
|---|---|---|
| L0 | `only light` nas áreas do painel | mínimo |
| L1 | Acabamento claro do empreiteiro (itens 1 a 12) | baixo |
| L2 | Acabamento do admin (A1 a A4) | baixo |
| L3 | Infra do tema: invólucro com escopo, preferência (Claro/Escuro/Automático), destino de portais, toast e tour | alto |
| L4 | Cascas: menu, topo, faixas, logo | médio |
| L5 | Telas do empreiteiro (painel, obras, equipe, configurações, planos) | médio |
| L6 | Telas de obra (console, cronograma, etapas, diário, fotos, ocorrências) | alto |
| L7 | Admin xgestão e gráficos | médio |
| L8 | Link público + troca de `only light` para `light dark` + botão de tema no menu da conta | médio |

L0 a L2 podem sair antes e independem do escuro. O botão de tema só aparece no L8, quando tudo estiver escuro; até lá ninguém vê tela meio escura.

## 7. Como garantir que nada quebra

- Antes de cada lote: snapshot em `docs/rollback/` (como no site).
- **Claro intacto:** fotos do claro antes e depois em 390 e 1280 px, comparadas pixel a pixel. Nos lotes de tema (L3 a L8) a diferença no claro tem que ser zero.
- Escuro: fotos de todas as telas, contraste AA medido (axe), modais, selects, toasts e tour abertos no escuro.
- Escuro forçado: teste de navegador com o escuro do Chrome ligado conferindo que o logo aparece e as cores não invertem.
- Todos os testes que já existem (unitários, integração, navegador do xgestão) passam igual; `data-testid` e textos não mudam.
- Teste novo de preferência: escolhe Escuro, recarrega, continua escuro; Automático segue o celular; marketplace e site não mudam.

## 8. Decisões pendentes

1. L0 (`only light`) já, antes do escuro? Recomendo sim.
2. Padrão do tema quando o escuro existir: Automático (recomendo) ou Claro.
3. A2 (recolher filtros do admin) entra ou fica como está?
4. Logo escuro: `invert` no PNG atual (rápido) ou versão branca oficial do cliente.

## 9. Implementado (13/11/2026)

Decisões tomadas na implementação: padrão **Automático**; logo com `invert` no PNG atual; A2 entra (com abertura automática quando a URL já traz um filtro, para não esconder o que está ativo).

O que mudou em relação ao plano acima:
- O `only light` do L0 ficou como valor de partida no HTML; o script do tema troca para `dark` quando o painel está no nosso escuro. Por isso a troca final para `light dark` (L8) não foi necessária: o escuro forçado nunca atua, nem no Claro nem no Escuro.
- O escuro é a classe `.dark` no `<body>` enquanto uma tela do painel está aberta (`features/xgestao/tema/`). Assim os modais, menus e avisos, que o Radix desenha no `body`, também ficam escuros, sem mexer em nenhum componente compartilhado. Ao sair do painel a classe sai.
- Item 7 (busca e "Filtros" na mesma linha) foi testado e desfeito: no celular o campo de busca ficava cortado ("Buscar por títul").
- Item 8 (rodapé do cartão) não tinha defeito: o corte na foto era o selo flutuante do Replit.
- Selos de status: "Planejamento" passou a `blue-600` também no claro (o branco sobre o `blue-500/90` dava 4,3, abaixo do AA). No escuro todos os selos usam a mesma cor em fundo translúcido, como no admin.
- Vermelho de "Sair" e erros um pouco mais claro só no escuro (contraste AA).

Como foi feito: o Claude fez a base do tema, os menus, o topo, os ajustes 1 a 12, A1 a A4 e os testes; o Codex aplicou o `dark:` em 81 arquivos de tela, em 4 lotes paralelos, com uma regra que só permite acrescentar `dark:`; um verificador (`_tema/gate-claro.py`, fora do repo) provou que o claro dessas telas não mudou; o Codex revisou a base do tema (1 achado, corrigido); o Gemini revisou as 51 fotos do escuro (3 defeitos reais corrigidos, 2 falsos positivos descartados).

Testes:
- `tests/unit/painel-tema.test.ts` (9): regra Claro/Escuro/Automático, script de antes da pintura igual às funções em todas as combinações, sem storage, onde o tema é ligado.
- `tests/e2e/tema-painel.browser.spec.ts`: preferência (vale na hora, sobrevive ao recarregar, Automático segue o celular, sair do painel não leva o escuro), admin (só no xgestão) e varredura de 51 telas no escuro (celular e computador, abas da obra, menus, modal, link público) com contraste AA medido e sem cartão claro esquecido: 0 problemas.
- `tests/e2e/tema-painel-escuro-forcado.browser.spec.ts`: Chromium com o escuro forçado ligado; Claro fica claro de verdade e Automático usa o nosso escuro com a logo visível.

Contraste no claro (pedido do Ramon, 13/11): só no xgestão, um tom mais escuro da mesma cor nos selos "Planejamento" (blue-600), "Pausada" e "Com pendências" (amber-700), "Concluída"/"Finalizada" (green-700) e "Com atraso" (red-600), e nas iniciais brancas dos membros da equipe (`corMembroLegivel`). O marketplace continua com as cores de antes: o card da obra recebe as classes do xgestão por prop (`badgeClasses`) e o avatar por `corLegivel`. Teste `tema-painel.browser.spec.ts` mede todas essas combinações no claro e no escuro (AA 4,5).

Voltar atrás: `docs/rollback/README.md`, seção "Painel do xgestão, 13/11/2026".
