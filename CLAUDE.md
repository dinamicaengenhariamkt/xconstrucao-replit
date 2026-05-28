# Claude Code — Configuração de Skills

Este arquivo orienta o Claude sobre **quando** carregar cada uma das 96 skills disponíveis em `.claude/skills/`. Coloque este `CLAUDE.md` na raiz do projeto (ou em `~/.claude/CLAUDE.md` para escopo global) e o Claude o carrega automaticamente em toda sessão.

## Filosofia

São muitas skills. Carregar todas em toda conversa estoura contexto. A solução é classificar por **frequência de uso** e ler apenas a skill relevante quando o contexto exigir.

### Como usar
1. Identifique pela tabela abaixo qual skill se aplica ao pedido do usuário
2. Leia o `SKILL.md` da skill correspondente: `Read .claude/skills/<nome>/SKILL.md`
3. Siga as instruções da skill para executar a tarefa

## Frequência de uso

**Sempre considerar** (em qualquer tarefa de código, mesmo sem o usuário pedir):
- `12-factor-apps` — auditar código novo ou revisão contra os 12 fatores; usar como checklist mental antes de finalizar

**Frequente** (consultar quando o gatilho casar):
- `backend-dev-guidelines` — **gatilho:** editar/criar código Node/TypeScript no backend
- `frontend-dev-guidelines` — **gatilho:** editar/criar código React/Next
- `docker-expert` — **gatilho:** mexer em Dockerfile, compose, ou config de container
- `postgres-best-practices` — **gatilho:** escrever query, criar schema, ou planejar migration
- `superpowers-lite` — **gatilho:** tarefa não-trivial (>10 linhas, lógica nova, multi-step). NÃO usar pra fix de typo, ajuste de cor, ou one-shot < 10 linhas
- `systematic-debugging` — **gatilho:** bug não-óbvio (causa não identificada na 1a leitura) ou comportamento inconsistente
- `sdd` — **gatilho:** feature nova ou refactor estrutural. NÃO usar pra ajuste pontual ou mudança de config
- `context7` — **gatilho:** mexer com lib externa específica que pode ter mudado API (ex: nova versão Drizzle, configurar lib pouco usada). NÃO usar pra libs comuns onde o conhecimento base já basta
- `humanizer` — **gatilho:** escrever texto user-facing (commits, READMEs, mensagens, copys)
- `security-audit` — **gatilho:** code review tocando auth, secrets, input externo, ou query construída com input do usuário

**On-demand** (consultar só quando o pedido casar especificamente — ver tabelas abaixo): todas as demais

### Dedup de skills

Uma vez lida uma skill na conversa, manter o conteúdo no contexto de trabalho — **não reler na mesma conversa**. Exceção: se o contexto foi compactado e o conteúdo da skill foi perdido (verificar mentalmente se ainda lembra das instruções), pode reler.

Vale para todos os tiers (Sempre, Frequente, On-demand).

## Índice de Skills

Todas em `.claude/skills/<nome>/SKILL.md`.

### Custom (7)
| Skill | Quando usar |
|---|---|
| 12-factor-apps | Auditar app contra 12-Factor (config, deps, build/release/run, logs, etc), gera tabela Strong/Partial/Weak + roadmap de gaps |
| context7 | Busca de documentação atualizada de libs (`npx ctx7 library <nome> "<query>"`) |
| humanizer | Remover padrões de escrita IA, humanizar texto user-facing |
| sdd | Spec-Driven Development: requirements EARS → design Mermaid → tasks atômicas |
| superpowers-lite | Workflow dev estruturado com HARD-gates, TDD, planejamento antes de implementação |
| systematic-debugging | Debugging metódico, root cause analysis (não chutar fixes) |
| zustand-state | State management React/Next com Zustand (stores, selectors, persist, devtools, slices, TypeScript) |

### Anthropic Official (17)
| Skill | Quando usar |
|---|---|
| algorithmic-art | Arte generativa com p5.js |
| brand-guidelines | Identidade visual Anthropic |
| canvas-design | Arte visual em PNG/PDF |
| claude-api | Apps com Claude API/SDK/Agent SDK, prompt caching, migração entre modelos |
| doc-coauthoring | Escrita colaborativa de docs técnicos |
| docx | Criar/editar documentos Word |
| frontend-design | Interfaces web production-grade |
| internal-comms | Comunicações internas |
| mcp-builder | Construir servidores MCP |
| pdf | Ler, criar, editar PDFs |
| pptx | Apresentações PowerPoint |
| skill-creator | Criar e otimizar skills |
| slack-gif-creator | GIFs animados para Slack |
| theme-factory | Temas visuais para artifacts |
| web-artifacts-builder | SPAs e componentes React complexos |
| webapp-testing | Testar web apps com Playwright |
| xlsx | Planilhas Excel, CSV |

### Antigravity (33)
| Skill | Quando usar |
|---|---|
| backend-dev-guidelines | Padrões Node.js/TypeScript backend |
| brevo-automation | Automação de email marketing Brevo |
| c4-component | Diagramas C4 nível componente |
| c4-context | Diagramas C4 nível contexto |
| deep-research | Pesquisa autônoma multi-step com Gemini |
| docker-expert | Docker, multi-stage builds, Compose |
| drizzle-orm-expert | Drizzle ORM, schema, migrations |
| expo-deployment | Deploy de apps Expo/React Native |
| frontend-dev-guidelines | Padrões React/TypeScript frontend |
| geo-fundamentals | Otimização para buscadores IA (GEO) |
| gmail-automation | Automação de Gmail via MCP |
| google-analytics-automation | Relatórios GA4 automatizados |
| i18n-localization | Internacionalização, traduções, RTL |
| imagen | Geração de imagens com Google Gemini |
| instagram | Instagram Graph API, posts, analytics |
| linkedin-cli | Automação LinkedIn via CLI |
| llm-app-patterns | Arquitetura de apps LLM em produção |
| n8n-code-javascript | JavaScript em n8n Code nodes |
| n8n-expression-syntax | Expressões n8n, sintaxe `{{}}` |
| n8n-workflow-patterns | Arquiteturas de workflow n8n |
| performance-optimizer | Otimização de performance, gargalos |
| playwright-skill | Automação de browser com Playwright |
| postgres-best-practices | Otimização Postgres, queries, índices |
| prisma-expert | Prisma ORM, schema, relations |
| prompt-engineering-patterns | Técnicas avançadas de prompt |
| rag-implementation | RAG, embeddings, vector DB, chunking |
| security-audit | Auditoria de segurança, pentesting |
| supabase-automation | Automação Supabase, edge functions |
| telegram-bot-builder | Bots Telegram em produção |
| terraform-specialist | Terraform/OpenTofu, IaC |
| ui-ux-pro-max | UI/UX design, 50 estilos, paletas |
| whatsapp-cloud-api | WhatsApp Business API, templates |
| youtube-summarizer | Extração e resumo de vídeos YouTube |

### Marketing (32)
| Skill | Quando usar |
|---|---|
| ab-test-setup | Testes A/B, experimentos, hipóteses |
| ad-creative | Criativos de anúncio, headlines, RSA |
| ai-seo | SEO para buscadores IA (ChatGPT, Perplexity) |
| analytics-tracking | GA4, GTM, eventos, UTM, tracking plan |
| churn-prevention | Redução de churn, cancel flow, dunning |
| cold-email | Emails de prospecção B2B, outreach |
| competitor-alternatives | Páginas de comparação, versus, battle cards |
| content-strategy | Estratégia de conteúdo, topic clusters |
| copy-editing | Revisão e melhoria de copy existente |
| copywriting | Copy para landing pages, homepage, proposta de valor |
| email-sequence | Automação de email, sequências, nurture |
| form-cro | Otimização de formulários, redução de fricção |
| free-tool-strategy | Ferramentas gratuitas para gerar leads |
| launch-strategy | Lançamento de produto, Product Hunt, GTM |
| marketing-ideas | Brainstorm de táticas de crescimento SaaS |
| marketing-psychology | Psicologia comportamental aplicada a marketing |
| onboarding-cro | Ativação de usuários, time-to-value, aha moment |
| page-cro | Otimização de conversão de páginas |
| paid-ads | Google Ads, Meta Ads, ROAS, CPA |
| paywall-upgrade-cro | Telas de upgrade, conversão freemium |
| popup-cro | Popups de captura, exit intent |
| pricing-strategy | Precificação, tiers, packaging |
| product-marketing-context | Contexto de posicionamento, ICP |
| programmatic-seo | SEO programático em escala |
| referral-program | Programas de indicação e afiliados |
| revops | Lead lifecycle, scoring, pipeline |
| sales-enablement | Decks de vendas, one-pagers, objeções |
| schema-markup | Schema.org, JSON-LD, rich snippets |
| seo-audit | Auditoria técnica de SEO |
| signup-flow-cro | Otimização de fluxo de cadastro |
| site-architecture | Arquitetura de site, sitemap, URLs |
| social-content | Conteúdo para redes sociais |

### Vercel (5)
| Skill | Quando usar |
|---|---|
| composition-patterns | Patterns de composição React |
| deploy-to-vercel | Deploy no Vercel |
| react-best-practices | React/Next.js otimização |
| react-native-skills | Desenvolvimento React Native |
| web-design-guidelines | Auditoria UI, acessibilidade |

### Wshobson (2)
| Skill | Quando usar |
|---|---|
| design-system-patterns | Design tokens, theming, component libraries |
| tailwind-design-system | Design system com Tailwind CSS v4 |
