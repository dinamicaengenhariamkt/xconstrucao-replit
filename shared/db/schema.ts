import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, bigint, numeric, timestamp, pgEnum, boolean, jsonb, uniqueIndex, index, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["superadmin", "admin", "contratante", "empreiteiro", "anunciante"]);
export const statusEnum = pgEnum("status", ["ativo", "inativo", "aprovacao"]);
export const obraStatusEnum = pgEnum("obra_status", ["em_andamento", "concluida", "pausada", "planejamento"]);
// J58 — estado do contrato entre as partes (coluna dedicada em `obras`, NÃO no
// enum de status). null = obra sem fluxo de contrato (legado / não contratada).
// Fluxo: pendente_contratante → pendente_empreiteiro → assinado (ao assinar, a
// obra é promovida a status='em_andamento').
export const obraContratoStatusEnum = pgEnum("obra_contrato_status", [
  "pendente_contratante",
  "pendente_empreiteiro",
  "assinado",
]);
export const obraVisibilidadeEnum = pgEnum("obra_visibilidade", ["rascunho", "publicada", "pausada", "arquivada"]);
export const obraStatusModeracaoEnum = pgEnum("obra_status_moderacao", ["pendente", "aprovada", "rejeitada"]);
export const obraModalidadeEnum = pgEnum("obra_modalidade", ["administracao", "empreitada_global", "empreitada_etapa"]);
export const obraMateriaisPorEnum = pgEnum("obra_materiais_por", ["contratante", "empreiteiro", "misto"]);
export const obraAnexoTipoEnum = pgEnum("obra_anexo_tipo", [
  "projeto_arquitetonico",
  "projeto_estrutural",
  "art_rrt",
  "alvara",
  "foto_local",
  "contrato",
  "outros",
]);
export const planoEnum = pgEnum("plano", ["free", "pro", "enterprise"]);

export const atividadeTipoEnum = pgEnum("atividade_tipo", [
  "obra_publicada",
  "candidatura_criada",
  "candidatura_aceita",
  "candidatura_rejeitada",
  "candidatura_cancelada",
  "medicao_criada",
  "medicao_aprovada",
  "medicao_contestada",
  "diario_postado",
  "ocorrencia_aberta",
  "ocorrencia_resolvida",
  "lancamento_criado",
  "lancamento_quitado",
  "disputa_aberta",
  "disputa_resolvida",
]);
export type AtividadeTipo =
  | "obra_publicada"
  | "candidatura_criada"
  | "candidatura_aceita"
  | "candidatura_rejeitada"
  | "candidatura_cancelada"
  | "medicao_criada"
  | "medicao_aprovada"
  | "medicao_contestada"
  | "diario_postado"
  | "ocorrencia_aberta"
  | "ocorrencia_resolvida"
  | "lancamento_criado"
  | "lancamento_quitado"
  | "disputa_aberta"
  | "disputa_resolvida";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").unique(),
  password: text("password"),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("contratante"),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  idioma: varchar("idioma", { length: 16 }).notNull().default("pt-BR"),
  timezone: varchar("timezone", { length: 64 }).notNull().default("America/Sao_Paulo"),
  plano: planoEnum("plano").notNull().default("free"),
  planoStartedAt: timestamp("plano_started_at").defaultNow(),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  createdBy: varchar("created_by"),
  ativo: boolean("ativo").notNull().default(true),
  canManageUsers: boolean("can_manage_users").notNull().default(false),
  // XG06/XG07 — escopo do administrador. "global" = admin de plataforma (todas as
  // seções, comportamento histórico); "xgestao" = admin restrito ao recorte do
  // xgestão. TEXT e não enum Postgres de propósito: `ALTER TYPE ... ADD VALUE`
  // roda fora de transação (mesma ressalva de XG01 §6) e esta coluna tende a
  // ganhar valores. Default "global" torna a coluna retrocompatível por
  // construção — nenhum admin existente muda de comportamento. Irrelevante para
  // não-admins. Superadmin é SEMPRE global, independentemente do que está gravado
  // aqui (ver getAdminEscopo em features/auth/api/admin-scope.ts).
  adminEscopo: text("admin_escopo").notNull().default("global"),
  avatarFileId: varchar("avatar_file_id"),
  // J29 — rastreio de último login para churn por inatividade.
  lastLoginAt: timestamp("last_login_at"),
  // J42/J44 — marketplace split: documento fiscal (papel pagador e recebedor)
  // e id do customer Asaas (criado proativamente no cadastro; elimina lookup
  // lazy por email). Nullable — não quebra registros existentes.
  cpfCnpj: text("cpf_cnpj"),
  asaasCustomerId: text("asaas_customer_id"),
  // J51 — gate do wizard de onboarding (primeiro acesso). Marcado `true` ao
  // concluir OU pular o wizard. Distinto de clientes/empreiteiras.perfilCompleto
  // (que é derivado e exige perfil rico); esta flag é só "já viu o onboarding".
  onboardingConcluido: boolean("onboarding_concluido").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actorId: varchar("actor_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  targetUserId: varchar("target_user_id").references(() => users.id, { onDelete: "set null" }),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const passwordSetupTokens = pgTable("password_setup_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
});

export const clientes = pgTable("clientes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }).unique(),
  nome: text("nome").notNull(),
  tipo: text("tipo").notNull().default("Pessoa Jurídica"),
  email: text("email").notNull(),
  telefone: text("telefone"),
  cnpjCpf: text("cnpj_cpf"),
  cep: text("cep"),
  endereco: text("endereco"),
  cidade: text("cidade"),
  estado: text("estado"),
  avatarUrl: text("avatar_url"),
  perfilCompleto: boolean("perfil_completo").notNull().default(false),
  obrasCount: integer("obras_count").default(0),
  volumeFinanceiro: numeric("volume_financeiro", { precision: 15, scale: 2 }).default("0"),
  status: statusEnum("status").notNull().default("ativo"),
  /** Nota interna do admin sobre o cliente (nunca exposta ao próprio cliente). */
  observacoes: text("observacoes"),
});

export const empreiteiras = pgTable("empreiteiras", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }).unique(),
  nome: text("nome").notNull(),
  responsavel: text("responsavel").notNull(),
  email: text("email").notNull(),
  telefone: text("telefone"),
  cnpj: text("cnpj"),
  especialidade: text("especialidade"),
  especialidades: text("especialidades").array().notNull().default(sql`ARRAY[]::text[]`),
  raioKm: integer("raio_km"),
  cep: text("cep"),
  endereco: text("endereco"),
  cidade: text("cidade"),
  estado: text("estado"),
  avatarUrl: text("avatar_url"),
  portfolioUrls: text("portfolio_urls").array().notNull().default(sql`ARRAY[]::text[]`),
  portfolioDocs: text("portfolio_docs").array().notNull().default(sql`ARRAY[]::text[]`),
  zonaAtuacaoUfs: text("zona_atuacao_ufs").array().notNull().default(sql`ARRAY[]::text[]`),
  zonaAtuacaoCidades: text("zona_atuacao_cidades").array().notNull().default(sql`ARRAY[]::text[]`),
  descricao: text("descricao"),
  anoFundacao: integer("ano_fundacao"),
  tamanhoEquipe: text("tamanho_equipe"),
  siteUrl: text("site_url"),
  instagramUrl: text("instagram_url"),
  linkedinUrl: text("linkedin_url"),
  registroProfissional: text("registro_profissional"),
  perfilCompleto: boolean("perfil_completo").notNull().default(false),
  obrasCount: integer("obras_count").default(0),
  avaliacao: numeric("avaliacao", { precision: 3, scale: 1 }).default("0"),
  status: statusEnum("status").notNull().default("ativo"),
  /**
   * Nota interna do admin (nunca exposta à empreiteira nem ao público).
   * Distinta de `descricao`, que é a bio pública do perfil.
   */
  observacoesInternas: text("observacoes_internas"),
});

// ---------------------------------------------------------------------------
// J23 — Papéis aditivos (multi-role). `users.role` segue sendo o papel PRIMÁRIO
// (canônico para os guards existentes e embutido no JWT). Esta tabela registra
// papéis ADICIONAIS por usuário (ex.: um contratante que também é anunciante),
// permitindo upgrade de papel sem duplicar usuário nem deslogar. Backfill dos
// papéis primários atuais é feito no bootstrap. Schema criado idempotente em
// server/bootstrap-anuncios-self-service.ts.
// ---------------------------------------------------------------------------
export const userRoleOrigemEnum = pgEnum("user_role_origem", ["signup", "upgrade", "backfill"]);
// J23 — enum DEDICADO para papéis aditivos: NÃO inclui admin/superadmin. Transforma
// "papel aditivo nunca é privilegiado" em constraint de banco, não convenção de app.
// O backfill só insere papéis primários de usuários comuns (admins não recebem linha).
export const userAdditiveRoleEnum = pgEnum("user_additive_role", [
  "contratante",
  "empreiteiro",
  "anunciante",
  "xgestao",
]);

export const userRoles = pgTable(
  "user_roles",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: userAdditiveRoleEnum("role").notNull(),
    origem: userRoleOrigemEnum("origem").notNull().default("signup"),
    criadoEm: timestamp("criado_em").defaultNow().notNull(),
  },
  (t) => ({
    // Um papel por usuário, sem duplicar (idempotência do backfill + upgrade).
    uniqUserRole: uniqueIndex("uniq_user_roles_user_role").on(t.userId, t.role),
    idxUser: index("idx_user_roles_user").on(t.userId),
  }),
);

export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = typeof userRoles.$inferInsert;

export const obras = pgTable("obras", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  endereco: text("endereco").notNull(),
  clienteId: varchar("cliente_id").references(() => clientes.id),
  empreiteiraId: varchar("empreiteira_id").references(() => empreiteiras.id),
  status: obraStatusEnum("status").notNull().default("planejamento"),
  // J58 — estado do contrato entre as partes. null = obra sem fluxo de contrato.
  contratoStatus: obraContratoStatusEnum("contrato_status"),
  visibilidade: obraVisibilidadeEnum("visibilidade").notNull().default("rascunho"),
  statusModeracao: obraStatusModeracaoEnum("status_moderacao").notNull().default("pendente"),
  motivoModeracao: text("motivo_moderacao"),
  moderadoEm: timestamp("moderado_em"),
  moderadoPor: varchar("moderado_por").references(() => users.id, { onDelete: "set null" }),
  tipo: text("tipo"),
  descricao: text("descricao"),
  cep: text("cep"),
  // Endereço detalhado: número (obrigatório ao publicar — validado no schema
  // Zod) e complemento (opcional). Separados de `endereco` (logradouro) para
  // permitir montar a query do Google Maps com precisão. J40 #18.
  numero: text("numero"),
  complemento: text("complemento"),
  cidade: text("cidade"),
  uf: varchar("uf", { length: 2 }),
  lat: numeric("lat", { precision: 10, scale: 7 }),
  lng: numeric("lng", { precision: 10, scale: 7 }),
  modalidade: obraModalidadeEnum("modalidade"),
  materiaisPor: obraMateriaisPorEnum("materiais_por"),
  areaM2: numeric("area_m2", { precision: 10, scale: 2 }),
  padraoAcabamento: text("padrao_acabamento"),
  acessibilidadeObs: text("acessibilidade_obs"),
  valorTotal: numeric("valor_total", { precision: 15, scale: 2 }).default("0"),
  valorPago: numeric("valor_pago", { precision: 15, scale: 2 }).default("0"),
  progresso: integer("progresso").default(0),
  dataInicio: text("data_inicio"),
  dataPrevisao: text("data_previsao"),
  // J25 — Obras em Destaque na Home (curadoria admin).
  destaque: boolean("destaque").notNull().default(false),
  destaqueOrdem: integer("destaque_ordem"),
  fotoCapaFileId: varchar("foto_capa_file_id").references(() => userFiles.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Links de acompanhamento anônimo das obras próprias do xgestão.
 *
 * O token é armazenado em claro intencionalmente: o dono precisa recuperar o
 * mesmo link depois de compartilhá-lo. A capacidade do token é limitada pela
 * projeção pública, que não inclui finanças, documentos ou dados pessoais.
 */
export const obraShareLinks = pgTable(
  "obra_share_links",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    obraId: varchar("obra_id").notNull().references(() => obras.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    criadoPor: varchar("criado_por").notNull().references(() => users.id, { onDelete: "restrict" }),
    ativo: boolean("ativo").notNull().default(true),
    expiraEm: timestamp("expira_em"),
    visualizacoes: integer("visualizacoes").notNull().default(0),
    ultimoAcessoEm: timestamp("ultimo_acesso_em"),
    criadoEm: timestamp("criado_em").notNull().defaultNow(),
  },
  (t) => ({
    uniqToken: uniqueIndex("obra_share_links_token_uniq").on(t.token),
    idxObraAtivo: index("obra_share_links_obra_ativo_idx").on(t.obraId, t.ativo),
    // Cada obra tem no máximo uma capability ativa; links revogados continuam
    // preservados para auditoria e histórico.
    uniqActiveObra: uniqueIndex("obra_share_links_one_active_obra_uniq")
      .on(t.obraId)
      .where(sql`${t.ativo} = true`),
  }),
);

export const obraAnexos = pgTable("obra_anexos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  obraId: varchar("obra_id").notNull().references(() => obras.id, { onDelete: "cascade" }),
  fileId: varchar("file_id").notNull().references(() => userFiles.id, { onDelete: "cascade" }),
  tipo: obraAnexoTipoEnum("tipo").notNull(),
  observacao: text("observacao"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ObraAnexo = typeof obraAnexos.$inferSelect;

// J58 — assinatura eletrônica do contrato por parte (molde `user_consents`:
// registro com IP/UA). Cada parte assina uma vez por obra (unique obra+papel).
export const contratoPapelEnum = pgEnum("contrato_papel", ["contratante", "empreiteiro"]);

export const contratoAssinaturas = pgTable(
  "contrato_assinaturas",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    obraId: varchar("obra_id").notNull().references(() => obras.id, { onDelete: "cascade" }),
    candidaturaId: varchar("candidatura_id").references(() => candidaturas.id, { onDelete: "set null" }),
    papel: contratoPapelEnum("papel").notNull(),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    versaoTemplate: integer("versao_template").notNull(),
    assinadoEm: timestamp("assinado_em").defaultNow().notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
  },
  (t) => ({
    uniqObraPapel: uniqueIndex("contrato_assinaturas_obra_papel_uniq").on(t.obraId, t.papel),
  }),
);

export type ContratoAssinatura = typeof contratoAssinaturas.$inferSelect;

export const financeiroStatusEnum = pgEnum("financeiro_status", ["pendente", "pago", "atrasado", "cancelado"]);
// Escopo separa o dinheiro DA OBRA (pagamentos contratante↔empreiteiro, J06/J08)
// do dinheiro DA PLATAFORMA (assinaturas J11, anúncios J12, estornos de disputa J10).
// Default "obra" garante backfill seguro dos lançamentos existentes.
export const financeiroEscopoEnum = pgEnum("financeiro_escopo", ["obra", "plataforma"]);

export const financeiro = pgTable(
  "financeiro",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tipo: text("tipo").notNull(),
    descricao: text("descricao").notNull(),
    valor: numeric("valor", { precision: 15, scale: 2 }).notNull(),
    data: text("data").notNull(),
    escopo: financeiroEscopoEnum("escopo").notNull().default("obra"),
    obraId: varchar("obra_id").references(() => obras.id),
    categoria: text("categoria"),
    status: financeiroStatusEnum("status").notNull().default("pendente"),
    dataVencimento: text("data_vencimento"),
    dataPagamento: text("data_pagamento"),
    metodoPagamento: text("metodo_pagamento"),
    comprovanteUrl: text("comprovante_url"),
    comprovanteFileId: varchar("comprovante_file_id").references(() => userFiles.id, { onDelete: "set null" }),
    medicaoId: varchar("medicao_id"),
    // Referência polimórfica idempotente para a origem do lançamento de plataforma
    // (ex: origemTipo="assinatura", origemId=<assinatura.id>). Garante que reenvio
    // de webhook / re-resolução de disputa não duplique entradas (índice único parcial).
    origemTipo: text("origem_tipo"),
    origemId: varchar("origem_id"),
    pagadorUserId: varchar("pagador_user_id").references(() => users.id, { onDelete: "set null" }),
    recebedorUserId: varchar("recebedor_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    // Caixa consolidado por escopo/período agrega muito por estas colunas.
    idxEscopoStatusData: index("idx_financeiro_escopo_status_data").on(t.escopo, t.status, t.data),
    // Idempotência de lançamentos de plataforma por origem. Índice parcial
    // (WHERE origem_id IS NOT NULL no bootstrap) para não afetar lançamentos de obra.
    uqOrigem: uniqueIndex("uq_financeiro_origem").on(t.origemTipo, t.origemId).where(sql`${t.origemId} IS NOT NULL`),
  }),
);

export const candidaturaStatusEnum = pgEnum("candidatura_status", ["pendente", "aceita", "rejeitada"]);

export const candidaturas = pgTable("candidaturas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  obraId: varchar("obra_id").references(() => obras.id),
  empreiteiroId: varchar("empreiteiro_id").references(() => users.id),
  valorProposta: numeric("valor_proposta", { precision: 15, scale: 2 }).notNull(),
  prazoEstimado: integer("prazo_estimado"),
  dataInicio: text("data_inicio"),
  dataTermino: text("data_termino"),
  descricao: text("descricao"),
  observacoesPrazo: text("observacoes_prazo"),
  status: candidaturaStatusEnum("status").notNull().default("pendente"),
  createdAt: timestamp("created_at").defaultNow(),
  atividades: text("atividades"),
  observacoesFinanceiras: text("observacoes_financeiras"),
  motivoRejeicao: text("motivo_rejeicao"),
  mensagemContratante: text("mensagem_contratante"),
  notificacaoDisparada: boolean("notificacao_disparada").notNull().default(false),
  canceladaPeloEmpreiteiro: boolean("cancelada_pelo_empreiteiro").notNull().default(false),
  decididaEm: timestamp("decidida_em"),
});

export const candidaturaAnexos = pgTable("candidatura_anexos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  candidaturaId: varchar("candidatura_id").notNull().references(() => candidaturas.id, { onDelete: "cascade" }),
  fileId: varchar("file_id").notNull().references(() => userFiles.id, { onDelete: "cascade" }),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CandidaturaAnexo = typeof candidaturaAnexos.$inferSelect;

export const obrasSalvas = pgTable(
  "obras_salvas",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    obraId: varchar("obra_id").notNull().references(() => obras.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    uniqUserObra: uniqueIndex("uq_obras_salvas_user_obra").on(t.userId, t.obraId),
  }),
);

export const insertObraSalvaSchema = createInsertSchema(obrasSalvas).omit({ id: true, createdAt: true });
export type InsertObraSalva = z.infer<typeof insertObraSalvaSchema>;
export type ObraSalva = typeof obrasSalvas.$inferSelect;

export const medicaoStatusEnum = pgEnum("medicao_status", ["pendente", "aprovada", "contestada"]);

export const medicoes = pgTable("medicoes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  obraId: varchar("obra_id").notNull().references(() => obras.id, { onDelete: "cascade" }),
  empreiteiroId: varchar("empreiteiro_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  numero: integer("numero").notNull(),
  etapa: text("etapa").notNull(),
  descricao: text("descricao"),
  percentual: numeric("percentual", { precision: 5, scale: 2 }).notNull(),
  valor: numeric("valor", { precision: 15, scale: 2 }).notNull().default("0"),
  fotos: text("fotos").array().notNull().default(sql`ARRAY[]::text[]`),
  status: medicaoStatusEnum("status").notNull().default("pendente"),
  motivoContestacao: text("motivo_contestacao"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  decidedAt: timestamp("decided_at"),
  decidedBy: varchar("decided_by").references(() => users.id, { onDelete: "set null" }),
});

export const insertMedicaoSchema = createInsertSchema(medicoes).omit({
  id: true,
  numero: true,
  status: true,
  motivoContestacao: true,
  createdAt: true,
  decidedAt: true,
  decidedBy: true,
});
export type InsertMedicao = z.infer<typeof insertMedicaoSchema>;
export type Medicao = typeof medicoes.$inferSelect;

// J20 — Satisfação (NPS/CSAT). `tipo` = qual métrica; `persona` = qual ponta do
// marketplace responde; `status` = ciclo de vida do convite (enviado → respondido).
export const surveyTipoEnum = pgEnum("survey_tipo", ["nps", "csat"]);
export const surveyPersonaEnum = pgEnum("survey_persona", ["contratante", "empreiteiro"]);
export const surveyStatusEnum = pgEnum("survey_status", ["pendente", "respondido", "expirado"]);

export const notificacaoTipoEnum = pgEnum("notificacao_tipo", ["lembrete", "alerta", "info", "sucesso"]);

export const notificacoes = pgTable("notificacoes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tipo: notificacaoTipoEnum("tipo").notNull().default("info"),
  titulo: text("titulo").notNull(),
  descricao: text("descricao").notNull(),
  href: text("href"),
  threadId: varchar("thread_id").references(() => chatThreads.id, { onDelete: "set null" }),
  lida: boolean("lida").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  // Dedupe de notificação não-lida por (user_id, href). Espelha o índice criado
  // em server/bootstrap-notificacoes.ts (J13 hardening). Re-disparo legítimo
  // segue possível: ao ler (lida=true), a linha sai do índice parcial.
  uniqUserHrefUnread: uniqueIndex("uniq_notificacoes_user_href_unread")
    .on(t.userId, t.href)
    .where(sql`${t.lida} = false AND ${t.href} IS NOT NULL`),
}));

export type Notificacao = typeof notificacoes.$inferSelect;

export const chatThreads = pgTable("chat_threads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  obraId: varchar("obra_id").notNull().unique("chat_threads_obra_unique").references(() => obras.id, { onDelete: "cascade" }),
  contratanteUserId: varchar("contratante_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  empreiteiroUserId: varchar("empreiteiro_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  criadaEm: timestamp("criada_em").defaultNow().notNull(),
  ultimaMensagemEm: timestamp("ultima_mensagem_em").defaultNow().notNull(),
});

export type ChatThread = typeof chatThreads.$inferSelect;

export const chatMensagens = pgTable("chat_mensagens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").notNull().references(() => chatThreads.id, { onDelete: "cascade" }),
  autorUserId: varchar("autor_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  texto: text("texto").notNull(),
  anexoObraId: varchar("anexo_obra_id").references(() => obras.id, { onDelete: "set null" }),
  lidaEm: timestamp("lida_em"),
  criadaEm: timestamp("criada_em").defaultNow().notNull(),
  arquivoUrl: text("arquivo_url"),
  arquivoNome: text("arquivo_nome"),
  arquivoMime: text("arquivo_mime"),
});

export type ChatMensagem = typeof chatMensagens.$inferSelect;

// J20 — Satisfação (NPS/CSAT).
// `surveys` = convites de pesquisa gerados por gatilho (obra concluída → NPS;
// pagamento quitado → CSAT). `survey_respostas` = a resposta (única por survey).
// A idempotência do gatilho é garantida pela unique (tipo, persona, origem*):
// reenviar o mesmo evento não duplica o convite.
export const surveys = pgTable("surveys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tipo: surveyTipoEnum("tipo").notNull(),
  persona: surveyPersonaEnum("persona").notNull(),
  // dono do convite (a quem foi enviado). O POST /responder valida contra isto.
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // obra que originou o gatilho. set null p/ não bloquear a exclusão da obra.
  obraId: varchar("obra_id").references(() => obras.id, { onDelete: "set null" }),
  // origem idempotente: ("obra_concluida", <obraId>) | ("pagamento_quitado", <lancamentoId>).
  origemTipo: text("origem_tipo").notNull(),
  origemId: varchar("origem_id").notNull(),
  status: surveyStatusEnum("status").notNull().default("pendente"),
  enviadoEm: timestamp("enviado_em").defaultNow().notNull(),
}, (t) => ({
  // Um convite por (tipo, persona, origem) — idempotência do gatilho.
  uniqOrigem: uniqueIndex("uq_surveys_tipo_persona_origem").on(t.tipo, t.persona, t.origemTipo, t.origemId),
  // Listagem de pendências por usuário (card "responder pesquisa").
  idxUserStatus: index("idx_surveys_user_status").on(t.userId, t.status),
}));

export type Survey = typeof surveys.$inferSelect;

export const surveyRespostas = pgTable("survey_respostas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  surveyId: varchar("survey_id").notNull().references(() => surveys.id, { onDelete: "cascade" }),
  // NPS 0-10 | CSAT 0-5. Faixa validada por tipo no endpoint (Zod).
  nota: integer("nota").notNull(),
  comentario: text("comentario"), // LGPD: texto livre opcional.
  // Consentimento implícito ao responder (molde user_consents: IP/UA).
  ip: text("ip"),
  userAgent: text("user_agent"),
  respondidoEm: timestamp("respondido_em").defaultNow().notNull(),
}, (t) => ({
  // Uma resposta por convite (critério de aceite §5).
  uniqSurvey: uniqueIndex("uq_survey_respostas_survey").on(t.surveyId),
  // Agregação por janela temporal (NPS/CSAT dos últimos 90 dias).
  idxRespondidoEm: index("idx_survey_respostas_respondido_em").on(t.respondidoEm),
}));

export type SurveyResposta = typeof surveyRespostas.$inferSelect;

// J22 — Autenticação Forte (2FA / TOTP).
// Tabela dedicada (não engorda `users`): uma linha por conta com 2FA configurado.
// `secret` guarda o segredo TOTP base32; `recoveryCodes` guarda HASHES (uso único).
// `enabled` só vira true após o usuário confirmar o primeiro código (confirmadoEm).
export const userTotp = pgTable("user_totp", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique("user_totp_user_unique").references(() => users.id, { onDelete: "cascade" }),
  secret: text("secret").notNull(),
  enabled: boolean("enabled").notNull().default(false),
  recoveryCodes: jsonb("recovery_codes").$type<string[]>().notNull().default([]),
  confirmadoEm: timestamp("confirmado_em"),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizado_em").defaultNow().notNull(),
});

export type UserTotp = typeof userTotp.$inferSelect;

export const marketplaceLeadStatusEnum = pgEnum("marketplace_lead_status", ["pendente", "notificado", "descartado"]);

export const marketplaceLeads = pgTable("marketplace_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  telefone: text("telefone").notNull(),
  isWhatsapp: boolean("is_whatsapp").notNull().default(false),
  status: marketplaceLeadStatusEnum("status").notNull().default("pendente"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// NextAuth.js tables
export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionToken: text("session_token").notNull().unique(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
  userAgent: text("user_agent"),
  ip: text("ip"),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const consentDocumentEnum = pgEnum("consent_document", ["termos", "privacidade", "termo_anunciante", "contrato_obra"]);

export const userConsents = pgTable(
  "user_consents",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    documento: consentDocumentEnum("documento").notNull(),
    versao: text("versao").notNull(),
    aceitoEm: timestamp("aceito_em").defaultNow().notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    revogadoEm: timestamp("revogado_em"),
  },
  (t) => ({
    uniqUserDocVersao: uniqueIndex("user_consents_user_doc_versao_uniq").on(t.userId, t.documento, t.versao),
  }),
);

export const userPreferencias = pgTable("user_preferencias", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  notificacoes: jsonb("notificacoes").$type<Record<string, boolean>>().notNull().default({}),
  privacidade: jsonb("privacidade").$type<Record<string, boolean>>().notNull().default({}),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// J28 — Documentos Legais Versionados. Cada publicação de Termos/Privacidade vira
// uma versão (conteúdo Markdown + vigência). As páginas públicas leem a versão
// vigente; o `user_consents.versao` passa a referenciar a versão aceita, permitindo
// re-consentimento quando a vigente > aceita. Schema idempotente em
// server/bootstrap-legal-documents.ts. O CONTEÚDO é dado (jurídico edita pelo admin).
// ---------------------------------------------------------------------------
export const legalDocuments = pgTable(
  "legal_documents",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tipo: consentDocumentEnum("tipo").notNull(),
    versao: integer("versao").notNull(),
    titulo: text("titulo").notNull(),
    // Conteúdo em Markdown (renderizado sanitizado no client).
    conteudo: text("conteudo").notNull(),
    vigenteEm: timestamp("vigente_em").defaultNow().notNull(),
    ativo: boolean("ativo").notNull().default(true),
    criadoPor: varchar("criado_por").references(() => users.id, { onDelete: "set null" }),
    criadoEm: timestamp("criado_em").defaultNow().notNull(),
  },
  (t) => ({
    uniqTipoVersao: uniqueIndex("legal_documents_tipo_versao_uniq").on(t.tipo, t.versao),
    idxTipoAtivo: index("idx_legal_documents_tipo_ativo").on(t.tipo, t.ativo),
  }),
);

export type LegalDocument = typeof legalDocuments.$inferSelect;
export type InsertLegalDocument = typeof legalDocuments.$inferInsert;

export const platformSettings = pgTable("platform_settings", {
  chave: text("chave").primaryKey(),
  valor: jsonb("valor").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: varchar("updated_by").references(() => users.id, { onDelete: "set null" }),
});

// J29 — Observabilidade histórica: uma fotografia por métrica por dia.
// Índice único (metrica, periodo) garante a idempotência do job de snapshot.
export const kpiSnapshots = pgTable("kpi_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metrica: text("metrica").notNull(),
  valor: numeric("valor").notNull(),
  periodo: date("periodo").notNull(),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
}, (t) => ({
  uniqMetricaPeriodo: uniqueIndex("uniq_kpi_snapshots_metrica_periodo").on(t.metrica, t.periodo),
}));

export type KpiSnapshot = typeof kpiSnapshots.$inferSelect;

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires").notNull(),
});

export const userFileVisibilityEnum = pgEnum("user_file_visibility", ["public", "private"]);

export const userFiles = pgTable("user_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerUserId: varchar("owner_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  visibility: userFileVisibilityEnum("visibility").notNull(),
  bucketKey: text("bucket_key").notNull().unique(),
  originalName: text("original_name").notNull(),
  mime: text("mime").notNull(),
  sizeBytes: integer("size_bytes").notNull().default(0),
  publicUrl: text("public_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const empreiteiroDocumentos = pgTable("empreiteiro_documentos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  empreiteiroUserId: varchar("empreiteiro_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fileId: varchar("file_id").notNull().references(() => userFiles.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(),
  status: text("status").notNull().default("enviado"),
  observacao: text("observacao"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Documentos anexados pelo admin ao dossiê de um cliente (contrato social,
 * procuração, etc.). Espelha `empreiteiroDocumentos`, mas o vínculo é com
 * `clientes.id` — o admin anexa a partir de `/admin/clientes/[id]`.
 * Soft-delete via `deletedAt` (o arquivo em `userFiles` tem o seu próprio).
 */
export const clienteDocumentos = pgTable("cliente_documentos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clienteId: varchar("cliente_id").notNull().references(() => clientes.id, { onDelete: "cascade" }),
  fileId: varchar("file_id").notNull().references(() => userFiles.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  tipo: text("tipo").notNull().default("outro"),
  uploadedBy: varchar("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const empreiteiroPortfolio = pgTable("empreiteiro_portfolio", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  empreiteiroUserId: varchar("empreiteiro_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fileId: varchar("file_id").notNull().references(() => userFiles.id, { onDelete: "cascade" }),
  titulo: text("titulo"),
  descricao: text("descricao"),
  ordem: integer("ordem").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type UserFile = typeof userFiles.$inferSelect;
export type EmpreiteiroDocumento = typeof empreiteiroDocumentos.$inferSelect;
export type EmpreiteiroPortfolioItem = typeof empreiteiroPortfolio.$inferSelect;

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertClienteSchema = createInsertSchema(clientes).omit({ id: true });
export const insertEmpreiteiraSchema = createInsertSchema(empreiteiras).omit({ id: true });
export const insertObraSchema = createInsertSchema(obras).omit({ id: true });
export const insertFinanceiroSchema = createInsertSchema(financeiro).omit({ id: true });
export const insertCandidaturaSchema = createInsertSchema(candidaturas).omit({ id: true, createdAt: true });
export const insertMarketplaceLeadSchema = createInsertSchema(marketplaceLeads).omit({ id: true, createdAt: true, status: true });
export const insertSurveySchema = createInsertSchema(surveys).omit({ id: true, status: true, enviadoEm: true });
export const insertUserConsentSchema = createInsertSchema(userConsents).omit({ id: true, aceitoEm: true, revogadoEm: true });
export const insertUserPreferenciasSchema = createInsertSchema(userPreferencias).omit({ updatedAt: true });
export const insertPlatformSettingSchema = createInsertSchema(platformSettings).omit({ updatedAt: true });

export const marketplaceLeadSchema = z.object({
  nome: z.string().trim().min(2, "Nome deve ter no mínimo 2 caracteres").max(120, "Nome muito longo"),
  email: z.string().trim().email("Email inválido").max(160, "Email muito longo"),
  telefone: z.string().trim().min(8, "Telefone inválido").max(30, "Telefone muito longo"),
  isWhatsapp: z.boolean().default(false),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  username: z.string().min(3, "Usuário deve ter no mínimo 3 caracteres"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  role: z.enum(["contratante", "empreiteiro", "anunciante"]),
  phone: z.string().optional(),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: "Você deve aceitar os Termos de Uso e a Política de Privacidade" }) }),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCliente = z.infer<typeof insertClienteSchema>;
export type Cliente = typeof clientes.$inferSelect;
export type InsertEmpreiteira = z.infer<typeof insertEmpreiteiraSchema>;
export type Empreiteira = typeof empreiteiras.$inferSelect;
export type InsertObra = z.infer<typeof insertObraSchema>;
export type Obra = typeof obras.$inferSelect;
export type InsertFinanceiro = z.infer<typeof insertFinanceiroSchema>;
export type Financeiro = typeof financeiro.$inferSelect;
export type InsertCandidatura = z.infer<typeof insertCandidaturaSchema>;
export type Candidatura = typeof candidaturas.$inferSelect;
export type InsertMarketplaceLead = z.infer<typeof insertMarketplaceLeadSchema>;
export type MarketplaceLead = typeof marketplaceLeads.$inferSelect;
export type MarketplaceLeadInput = z.infer<typeof marketplaceLeadSchema>;

// =============================================================
// J06 — Medições & Diário de Obra (Task #72)
// =============================================================

export const obraEtapaStatusEnum = pgEnum("obra_etapa_status", ["pendente", "em_andamento", "bloqueado", "concluido"]);
export const obraOcorrenciaGravidadeEnum = pgEnum("obra_ocorrencia_gravidade", ["critico", "medio", "baixo"]);
export const obraOcorrenciaStatusEnum = pgEnum("obra_ocorrencia_status", ["aberta", "resolvida"]);
export const obraFotoFaseEnum = pgEnum("obra_foto_fase", ["antes", "durante", "agora"]);

export const obraEtapas = pgTable("obra_etapas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  obraId: varchar("obra_id").notNull().references(() => obras.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  ordem: integer("ordem").notNull().default(0),
  progresso: integer("progresso").notNull().default(0),
  status: obraEtapaStatusEnum("status").notNull().default("pendente"),
  responsavel: text("responsavel"),
  prazo: timestamp("prazo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const obraDiario = pgTable("obra_diario", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  obraId: varchar("obra_id").notNull().references(() => obras.id, { onDelete: "cascade" }),
  autorId: varchar("autor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  texto: text("texto").notNull(),
  fotoFileIds: text("foto_file_ids").array().notNull().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const obraOcorrencias = pgTable("obra_ocorrencias", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  obraId: varchar("obra_id").notNull().references(() => obras.id, { onDelete: "cascade" }),
  autorId: varchar("autor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  titulo: text("titulo").notNull(),
  descricao: text("descricao").notNull(),
  gravidade: obraOcorrenciaGravidadeEnum("gravidade").notNull().default("medio"),
  status: obraOcorrenciaStatusEnum("status").notNull().default("aberta"),
  fotoFileId: varchar("foto_file_id").references(() => userFiles.id, { onDelete: "set null" }),
  resolvidoPorId: varchar("resolvido_por_id").references(() => users.id, { onDelete: "set null" }),
  resolvidoEm: timestamp("resolvido_em"),
  notificacaoDisparada: boolean("notificacao_disparada").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const obraFotos = pgTable("obra_fotos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  obraId: varchar("obra_id").notNull().references(() => obras.id, { onDelete: "cascade" }),
  autorId: varchar("autor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fileId: varchar("file_id").notNull().references(() => userFiles.id, { onDelete: "cascade" }),
  fase: obraFotoFaseEnum("fase"),
  tag: text("tag"),
  enviadaAoContratante: boolean("enviada_ao_contratante").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ObraEtapa = typeof obraEtapas.$inferSelect;
export type ObraDiarioEntry = typeof obraDiario.$inferSelect;
export type ObraOcorrencia = typeof obraOcorrencias.$inferSelect;
export type ObraFoto = typeof obraFotos.$inferSelect;

// =============================================================
// J11 — Operação da obra: Tarefas, Checklists, Equipe (Task #76)
// =============================================================

export const obraTarefaStatusEnum = pgEnum("obra_tarefa_status", [
  "pendente",
  "em_andamento",
  "bloqueado",
  "concluido",
]);
export const obraTarefaPrioridadeEnum = pgEnum("obra_tarefa_prioridade", ["alta", "media", "baixa"]);
export const obraChecklistTipoEnum = pgEnum("obra_checklist_tipo", ["seguranca", "diario", "etapa"]);
export const obraChecklistStatusEnum = pgEnum("obra_checklist_status", [
  "pendente",
  "em_andamento",
  "completo",
]);
export const obraEquipeTipoEnum = pgEnum("obra_equipe_tipo", [
  "contratante",
  "engenheiro",
  "mestre",
  "equipe",
]);
export const obraEquipePermissaoEnum = pgEnum("obra_equipe_permissao", ["visualizar", "editar", "admin"]);

export const obraTarefas = pgTable("obra_tarefas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  obraId: varchar("obra_id").notNull().references(() => obras.id, { onDelete: "cascade" }),
  etapaId: varchar("etapa_id").references(() => obraEtapas.id, { onDelete: "set null" }),
  etapa: text("etapa").notNull().default(""),
  titulo: text("titulo").notNull(),
  descricao: text("descricao"),
  responsavel: text("responsavel").notNull().default(""),
  prazo: text("prazo").notNull().default(""),
  status: obraTarefaStatusEnum("status").notNull().default("pendente"),
  prioridade: obraTarefaPrioridadeEnum("prioridade").notNull().default("media"),
  progresso: integer("progresso"),
  bloqueioMotivo: text("bloqueio_motivo"),
  bloqueioInfo: text("bloqueio_info"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const obraChecklists = pgTable("obra_checklists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  obraId: varchar("obra_id").notNull().references(() => obras.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  descricao: text("descricao").notNull().default(""),
  tipo: obraChecklistTipoEnum("tipo").notNull().default("seguranca"),
  status: obraChecklistStatusEnum("status").notNull().default("pendente"),
  completadoEm: text("completado_em"),
  assinadoPor: text("assinado_por"),
  assinadoEm: text("assinado_em"),
  registroProfissional: text("registro_profissional"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const obraChecklistItens = pgTable("obra_checklist_itens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  checklistId: varchar("checklist_id")
    .notNull()
    .references(() => obraChecklists.id, { onDelete: "cascade" }),
  titulo: text("titulo").notNull(),
  concluida: boolean("concluida").notNull().default(false),
  ordem: integer("ordem").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const obraEquipe = pgTable("obra_equipe", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  obraId: varchar("obra_id").notNull().references(() => obras.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  nome: text("nome").notNull(),
  papel: text("papel").notNull().default(""),
  tipo: obraEquipeTipoEnum("tipo").notNull().default("equipe"),
  cor: text("cor").notNull().default("bg-primary"),
  telefone: text("telefone"),
  email: text("email"),
  registro: text("registro"),
  membros: text("membros"),
  ativo: boolean("ativo").notNull().default(true),
  permissao: obraEquipePermissaoEnum("permissao"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ObraTarefa = typeof obraTarefas.$inferSelect;
export type ObraChecklist = typeof obraChecklists.$inferSelect;
export type ObraChecklistItem = typeof obraChecklistItens.$inferSelect;
export type ObraEquipeMembro = typeof obraEquipe.$inferSelect;

// ---------------------------------------------------------------------------
// J07 — Atividades & Timeline (feed de domínio, separado de audit_logs).
// Schema real é criado idempotente em server/bootstrap-atividades.ts.
// ---------------------------------------------------------------------------
export const atividades = pgTable("atividades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tipo: atividadeTipoEnum("tipo").notNull(),
  actorUserId: varchar("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  obraId: varchar("obra_id").references(() => obras.id, { onDelete: "set null" }),
  targetUserId: varchar("target_user_id").references(() => users.id, { onDelete: "set null" }),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type Atividade = typeof atividades.$inferSelect;
export type InsertAtividade = typeof atividades.$inferInsert;

// ---------------------------------------------------------------------------
// J10 — Disputas. Fonte de verdade rica; o GET admin mapeia para o contrato de
// UI existente (features/admin/disputas/types). Schema criado idempotente em
// server/bootstrap-disputas.ts.
// ---------------------------------------------------------------------------
export const disputaStatusEnum = pgEnum("disputa_status", [
  "aberta",
  "em_analise",
  "aguardando_partes",
  "resolvida",
  "cancelada",
]);
// Alvo da disputa: uma medição (J06) ou um lançamento financeiro (J08).
export const disputaAlvoEnum = pgEnum("disputa_alvo", ["medicao", "pagamento"]);
// Tipo de resolução define o efeito financeiro aplicado no fechamento.
export const disputaResolucaoEnum = pgEnum("disputa_resolucao", [
  "favor_contratante",
  "favor_empreiteiro",
  "meio_termo",
]);
export const disputaCategoriaEnum = pgEnum("disputa_categoria", [
  "pagamento_atrasado",
  "medicao_rejeitada",
  "qualidade_obra",
  "descumprimento_prazo",
  "escopo_contrato",
  "outros",
]);
export const disputaPrioridadeEnum = pgEnum("disputa_prioridade", ["alta", "media", "baixa"]);

export const disputas = pgTable(
  "disputas",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    obraId: varchar("obra_id").notNull().references(() => obras.id, { onDelete: "cascade" }),
    abertaPorUserId: varchar("aberta_por_user_id").notNull().references(() => users.id, { onDelete: "set null" }),
    contraparteUserId: varchar("contraparte_user_id").references(() => users.id, { onDelete: "set null" }),
    alvoTipo: disputaAlvoEnum("alvo_tipo").notNull(),
    alvoId: varchar("alvo_id").notNull(),
    categoria: disputaCategoriaEnum("categoria").notNull().default("outros"),
    prioridade: disputaPrioridadeEnum("prioridade").notNull().default("media"),
    titulo: text("titulo").notNull(),
    descricao: text("descricao").notNull(),
    valorEnvolvido: numeric("valor_envolvido", { precision: 15, scale: 2 }),
    status: disputaStatusEnum("status").notNull().default("aberta"),
    responsavelAdminId: varchar("responsavel_admin_id").references(() => users.id, { onDelete: "set null" }),
    resolucaoTipo: disputaResolucaoEnum("resolucao_tipo"),
    resolucaoTexto: text("resolucao_texto"),
    // Quanto, da resolução, foi estornado/ajustado no financeiro (auditoria).
    valorAjustado: numeric("valor_ajustado", { precision: 15, scale: 2 }),
    resolvedAt: timestamp("resolved_at"),
    resolvedByUserId: varchar("resolved_by_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    idxObra: index("idx_disputas_obra").on(t.obraId),
    idxStatus: index("idx_disputas_status").on(t.status),
    // Uma disputa ABERTA por alvo (impede duplicatas / bloqueia pagamento).
    // Índice parcial aplicado no bootstrap: WHERE status NOT IN ('resolvida','cancelada').
    uqAlvoAberta: uniqueIndex("uq_disputas_alvo_aberta").on(t.alvoTipo, t.alvoId),
  }),
);

export const disputaMensagens = pgTable(
  "disputa_mensagens",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    disputaId: varchar("disputa_id").notNull().references(() => disputas.id, { onDelete: "cascade" }),
    autorUserId: varchar("autor_user_id").notNull().references(() => users.id, { onDelete: "set null" }),
    texto: text("texto").notNull(),
    anexoFileId: varchar("anexo_file_id").references(() => userFiles.id, { onDelete: "set null" }),
    // true quando a mensagem é uma nota administrativa (visível só p/ admin).
    interna: boolean("interna").notNull().default(false),
    criadaEm: timestamp("criada_em").defaultNow().notNull(),
  },
  (t) => ({
    idxDisputa: index("idx_disputa_mensagens_disputa").on(t.disputaId),
  }),
);

export type Disputa = typeof disputas.$inferSelect;
export type InsertDisputa = typeof disputas.$inferInsert;
export type DisputaMensagem = typeof disputaMensagens.$inferSelect;
export type InsertDisputaMensagem = typeof disputaMensagens.$inferInsert;

// ---------------------------------------------------------------------------
// J11 — Planos & Assinatura. `users.plano` continua sendo o tier ATIVO (free/
// pro/enterprise) e dirige o catálogo de limites (shared/lib/plans-catalog).
// `planos` é o catálogo editável pelo admin; `assinaturas` é o vínculo do user
// com um plano (dita users.plano); `assinatura_eventos` garante idempotência do
// webhook. Gateway de pagamento fica atrás de uma porta (features/planos/gateway).
// Schema criado idempotente em server/bootstrap-planos.ts.
// ---------------------------------------------------------------------------
export const planoPersonaEnum = pgEnum("plano_persona", ["contratante", "empreiteiro", "xgestao", "ambos"]);
export const assinaturaStatusEnum = pgEnum("assinatura_status", ["ativa", "cancelada", "inadimplente", "expirada", "pendente_reativacao"]);

export const planos = pgTable(
  "planos",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    // Tier de referência no catálogo (free/pro/enterprise) — liga ao plans-catalog.
    tier: planoEnum("tier").notNull(),
    persona: planoPersonaEnum("persona").notNull(),
    nome: text("nome").notNull(),
    descricao: text("descricao"),
    valorMensal: numeric("valor_mensal", { precision: 15, scale: 2 }).notNull().default("0"),
    valorAnual: numeric("valor_anual", { precision: 15, scale: 2 }),
    limitesJson: jsonb("limites_json").$type<Record<string, number>>().notNull().default({}),
    features: text("features").array().notNull().default(sql`ARRAY[]::text[]`),
    ativo: boolean("ativo").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    // Um plano por (tier, persona) — catálogo canônico.
    uqTierPersona: uniqueIndex("uq_planos_tier_persona").on(t.tier, t.persona),
  }),
);

export const assinaturas = pgTable(
  "assinaturas",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    planoId: varchar("plano_id").notNull().references(() => planos.id),
    // Persona é um snapshot do produto da assinatura. Permite que xgestão e
    // marketplace tenham assinaturas ativas independentes para a mesma conta.
    persona: planoPersonaEnum("persona").notNull(),
    status: assinaturaStatusEnum("status").notNull().default("ativa"),
    ciclo: text("ciclo").notNull().default("mensal"), // mensal | anual
    iniciadaEm: timestamp("iniciada_em").defaultNow().notNull(),
    renovaEm: timestamp("renova_em"),
    canceladaEm: timestamp("cancelada_em"),
    // Registra quando a assinatura entrou no estado pendente_reativacao.
    // Usado para detectar linhas presas no gateway-check limbo por muito tempo.
    pendenteReativacaoAt: timestamp("pendente_reativacao_at"),
    // Campos agnósticos de gateway — preenchidos pelo adapter real (J14).
    gatewayProvider: text("gateway_provider").notNull().default("manual"),
    gatewayCustomerId: text("gateway_customer_id"),
    gatewaySubscriptionId: text("gateway_subscription_id"),
    // Contador de execuções consecutivas do job de carência em que o gateway
    // devolveu "unknown" (inalcançável). Zerado ao sair de pendente_reativacao
    // (para ativa ou expirada). Quando atinge PENDENTE_REATIVACAO_MAX_RETRIES,
    // a assinatura é expirada com evento "gateway_unreachable_too_long".
    gatewayRetryCount: integer("gateway_retry_count").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    idxUser: index("idx_assinaturas_user").on(t.userId),
    // O índice parcial real por (user, persona) é criado no bootstrap.
  }),
);

export const assinaturaEventos = pgTable(
  "assinatura_eventos",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    assinaturaId: varchar("assinatura_id").references(() => assinaturas.id, { onDelete: "cascade" }),
    tipo: text("tipo").notNull(), // checkout | renovacao | falha_cobranca | cancelamento
    // ID único do evento no gateway — chave de idempotência do webhook.
    gatewayEventId: text("gateway_event_id"),
    payloadJson: jsonb("payload_json").$type<Record<string, unknown>>().notNull().default({}),
    criadoEm: timestamp("criado_em").defaultNow().notNull(),
  },
  (t) => ({
    uqGatewayEvent: uniqueIndex("uq_assinatura_eventos_gateway").on(t.gatewayEventId),
  }),
);

export type Plano = typeof planos.$inferSelect;
export type InsertPlano = typeof planos.$inferInsert;
export type Assinatura = typeof assinaturas.$inferSelect;
export type InsertAssinatura = typeof assinaturas.$inferInsert;
export type AssinaturaEvento = typeof assinaturaEventos.$inferSelect;

// ---------------------------------------------------------------------------
// J42 — Fundação de dados: marketplace split & recebimento. Só modelagem
// (sem comportamento novo). `asaas_subcontas` = subconta Asaas do empreiteiro
// (recebedor) com `wallet_id` que entra no split; `pagamentos_split` = registro
// de repasse por cobrança de obra. Schema criado idempotente em
// server/bootstrap-marketplace-split.ts. Consumido por J45/J47/J48/J49/J50.
// ---------------------------------------------------------------------------
export const asaasSubcontaStatusEnum = pgEnum("asaas_subconta_status", [
  "pendente",
  "aguardando_kyc",
  "aprovada",
  "rejeitada",
]);
export const splitPagamentoStatusEnum = pgEnum("split_pagamento_status", [
  "pendente",
  "confirmado",
  "repassado",
  "falhou",
  "estornado",
]);

export const asaasSubcontas = pgTable(
  "asaas_subcontas",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    // Uma subconta por empreiteiro (unique). Cascade: sumiu o user, some a subconta.
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    // IDs do Asaas: a subconta (/accounts) e o walletId (campo crítico do split).
    asaasAccountId: text("asaas_account_id"),
    walletId: text("wallet_id"),
    // apiKey da subconta, SEMPRE cifrada em repouso (AES-256-GCM). Nunca texto puro.
    asaasApiKeyEnc: text("asaas_api_key_enc"),
    onboardingStatus: asaasSubcontaStatusEnum("onboarding_status").notNull().default("pendente"),
    // Status bruto de KYC do Asaas (auditoria).
    kycStatus: text("kyc_status"),
    // Dados de recebimento: PIX ou TED.
    tipoConta: text("tipo_conta"), // PIX | TED
    pixChave: text("pix_chave"),
    pixTipo: text("pix_tipo"),
    bancoCodigo: text("banco_codigo"),
    agencia: text("agencia"),
    conta: text("conta"),
    contaDigito: text("conta_digito"),
    contaTipo: text("conta_tipo"),
    titularNome: text("titular_nome"),
    titularCpfCnpj: text("titular_cpf_cnpj"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    uqUser: uniqueIndex("uq_asaas_subcontas_user").on(t.userId),
    idxAccount: index("idx_asaas_subcontas_account").on(t.asaasAccountId),
    idxWallet: index("idx_asaas_subcontas_wallet").on(t.walletId),
  }),
);

export const pagamentosSplit = pgTable(
  "pagamentos_split",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    financeiroId: varchar("financeiro_id").references(() => financeiro.id),
    obraId: varchar("obra_id").references(() => obras.id),
    medicaoId: varchar("medicao_id"),
    pagadorUserId: varchar("pagador_user_id").references(() => users.id, { onDelete: "set null" }),
    recebedorUserId: varchar("recebedor_user_id").references(() => users.id, { onDelete: "set null" }),
    // ID do pagamento no Asaas — chave de idempotência do webhook (unique).
    asaasPaymentId: text("asaas_payment_id"),
    asaasCheckoutId: text("asaas_checkout_id"),
    // J56 — URL de pagamento reusada em reentrância (evita 2ª cobrança em double-click).
    invoiceUrl: text("invoice_url"),
    valorTotal: numeric("valor_total", { precision: 15, scale: 2 }),
    valorPlataforma: numeric("valor_plataforma", { precision: 15, scale: 2 }),
    valorEmpreiteiro: numeric("valor_empreiteiro", { precision: 15, scale: 2 }),
    // Snapshot da regra de comissão no momento (a regra viva fica em platform_settings).
    percentualPlataforma: numeric("percentual_plataforma", { precision: 5, scale: 2 }),
    walletIdEmpreiteiro: text("wallet_id_empreiteiro"),
    status: splitPagamentoStatusEnum("status").notNull().default("pendente"),
    billingType: text("billing_type"), // PIX | BOLETO | CREDIT_CARD
    confirmadoEm: timestamp("confirmado_em"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    uqAsaasPayment: uniqueIndex("uq_pagamentos_split_asaas_payment").on(t.asaasPaymentId),
    idxObraStatus: index("idx_pagamentos_split_obra_status").on(t.obraId, t.status),
    idxFinanceiro: index("idx_pagamentos_split_financeiro").on(t.financeiroId),
  }),
);

export type AsaasSubconta = typeof asaasSubcontas.$inferSelect;
export type InsertAsaasSubconta = typeof asaasSubcontas.$inferInsert;
export type PagamentoSplit = typeof pagamentosSplit.$inferSelect;
export type InsertPagamentoSplit = typeof pagamentosSplit.$inferInsert;

// J49 — Saques do empreiteiro (transferência da subconta Asaas para o banco).
// Histórico local espelhando /transfers do Asaas; base para reconciliação (J50).
export const saqueStatusEnum = pgEnum("saque_status", [
  "pendente",
  "concluido",
  "falhou",
]);

export const saques = pgTable(
  "saques",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    valor: numeric("valor", { precision: 15, scale: 2 }).notNull(),
    status: saqueStatusEnum("status").notNull().default("pendente"),
    // id da transferência no Asaas (/transfers) — auditoria/reconciliação.
    asaasTransferId: text("asaas_transfer_id"),
    // método usado: PIX | TED (snapshot dos dados de recebimento da subconta).
    metodo: text("metodo"),
    erro: text("erro"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    idxUser: index("idx_saques_user").on(t.userId),
    idxTransfer: index("idx_saques_transfer").on(t.asaasTransferId),
  }),
);

export type Saque = typeof saques.$inferSelect;
export type InsertSaque = typeof saques.$inferInsert;

// ---------------------------------------------------------------------------
// J12 — Gestão de Anúncios. Campanhas internas exibidas em zonas (sidebar/banner)
// na landing e dashboards, com tracking de impressão/clique e KPIs. Entrada de
// anunciante alimenta J09 (escopo plataforma). Schema criado idempotente em
// server/bootstrap-anuncios.ts.
// ---------------------------------------------------------------------------
export const anuncioStatusEnum = pgEnum("anuncio_status", ["rascunho", "agendada", "ativa", "pausada", "expirada"]);
export const anuncioEventoTipoEnum = pgEnum("anuncio_evento_tipo", ["impressao", "clique"]);
export const anuncianteStatusEnum = pgEnum("anunciante_status", ["ativo", "inativo"]);

export const anunciantes = pgTable("anunciantes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // J23 — vínculo opcional com o usuário-anunciante (self-service). NULL = anunciante
  // legado criado manualmente pelo admin (advertiser externo sem conta). Preenchido
  // = anunciante com login próprio. Unifica o conceito de "anunciante" no banco.
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }).unique(),
  nome: text("nome").notNull(),
  sigla: varchar("sigla", { length: 8 }),
  contato: text("contato"),
  email: text("email"),
  telefone: text("telefone"),
  cnpj: text("cnpj"),
  status: anuncianteStatusEnum("status").notNull().default("ativo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const anuncios = pgTable(
  "anuncios",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    anuncianteId: varchar("anunciante_id").notNull().references(() => anunciantes.id, { onDelete: "cascade" }),
    titulo: text("titulo").notNull(),
    subtitulo: text("subtitulo"),
    criativoUrl: text("criativo_url"),
    ctaUrl: text("cta_url"),
    ctaTexto: text("cta_texto"),
    // J24 — template do criativo (validado em app contra o registry, como `zona`).
    template: text("template").notNull().default("imagem-card"),
    // J24 — campos estruturados específicos do template (texto/fonte/blocos…).
    // Shape validado por template (zod) na API antes de persistir.
    conteudo: jsonb("conteudo"),
    // Zona de exibição (ver AnuncioZonaId em features/shared/anuncios/types).
    zona: text("zona").notNull(),
    inicio: text("inicio"),
    fim: text("fim"),
    orcamento: numeric("orcamento", { precision: 15, scale: 2 }).notNull().default("0"),
    status: anuncioStatusEnum("status").notNull().default("rascunho"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    // Hot path: GET /api/anuncios filtra por zona+status. Período filtrado em SQL.
    idxZonaStatus: index("idx_anuncios_zona_status").on(t.zona, t.status),
    idxAnunciante: index("idx_anuncios_anunciante").on(t.anuncianteId),
  }),
);

export const anuncioEventos = pgTable(
  "anuncio_eventos",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    anuncioId: varchar("anuncio_id").notNull().references(() => anuncios.id, { onDelete: "cascade" }),
    tipo: anuncioEventoTipoEnum("tipo").notNull(),
    // LGPD: só preenchido se o viewer estiver logado; null para visitante público.
    userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
    criadoEm: timestamp("criado_em").defaultNow().notNull(),
  },
  (t) => ({
    idxAnuncioTipo: index("idx_anuncio_eventos_anuncio_tipo").on(t.anuncioId, t.tipo),
  }),
);

// J24 — Master toggle por seção/zona (Opção B): interruptor explícito,
// independente de campanha ativa. `chave`: ex. "secao:mercado-em-foco", "zona:<id>".
export const anuncioConfig = pgTable("anuncio_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chave: text("chave").notNull().unique(),
  visivel: boolean("visivel").notNull().default(true),
  atualizadoEm: timestamp("atualizado_em").defaultNow().notNull(),
});

export type Anunciante = typeof anunciantes.$inferSelect;
export type InsertAnunciante = typeof anunciantes.$inferInsert;
export type Anuncio = typeof anuncios.$inferSelect;
export type InsertAnuncio = typeof anuncios.$inferInsert;
export type AnuncioEvento = typeof anuncioEventos.$inferSelect;
export type AnuncioConfig = typeof anuncioConfig.$inferSelect;

// ---------------------------------------------------------------------------
// J23 — Self-Service de Anúncios. Anunciante (usuário) monta um PEDIDO com N
// SLOTS (cada slot = zona + período + template + criativo, reusando J24). O
// pedido passa por moderação obrigatória (D4) e, ao ser aprovado, cada slot é
// MATERIALIZADO em `anuncios` (pipeline J16). Cobrança é protótipo plugável (D5):
// a cobrança real fica para a J31. Schema idempotente em
// server/bootstrap-anuncios-self-service.ts.
// ---------------------------------------------------------------------------
export const pedidoAnuncioStatusEnum = pgEnum("pedido_anuncio_status", [
  "em_analise",
  "aprovado",
  "recusado",
  "publicado",
  "encerrado",
]);
export const pedidoCobrancaStatusEnum = pgEnum("pedido_cobranca_status", [
  "prototipo",
  "pendente",
  "paga",
  "isenta",
]);

export const pedidosAnuncio = pgTable(
  "pedidos_anuncio",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    // Quem solicitou (anunciante puro OU cliente que também anuncia). FK direta ao
    // usuário — a identidade de anunciante (empresa/CNPJ) mora em `anunciantes`.
    solicitanteUserId: varchar("solicitante_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    status: pedidoAnuncioStatusEnum("status").notNull().default("em_analise"),
    motivoRecusa: text("motivo_recusa"),
    valorTotal: numeric("valor_total", { precision: 15, scale: 2 }).notNull().default("0"),
    cobrancaStatus: pedidoCobrancaStatusEnum("cobranca_status").notNull().default("prototipo"),
    // J31 — cobrança real (one-off). Nullable: só populados no fluxo pago.
    gatewayProvider: text("gateway_provider"),
    gatewayCustomerId: text("gateway_customer_id"),
    gatewayPaymentId: text("gateway_payment_id"),
    cpfCnpj: text("cpf_cnpj"),
    invoiceUrl: text("invoice_url"),
    criadoEm: timestamp("criado_em").defaultNow().notNull(),
    moderadoEm: timestamp("moderado_em"),
    moderadoPor: varchar("moderado_por").references(() => users.id, { onDelete: "set null" }),
  },
  (t) => ({
    idxSolicitante: index("idx_pedidos_anuncio_solicitante").on(t.solicitanteUserId),
    idxStatus: index("idx_pedidos_anuncio_status").on(t.status),
  }),
);

// J31 — eventos de pagamento de pedido de anúncio (idempotência do webhook).
// Espelha `assinatura_eventos`: `gateway_event_id` único garante que reenvio do
// mesmo webhook não materialize/lance receita duas vezes.
export const pedidoPagamentoEventos = pgTable(
  "pedido_pagamento_eventos",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    pedidoId: varchar("pedido_id").references(() => pedidosAnuncio.id, { onDelete: "cascade" }),
    tipo: text("tipo").notNull(), // paga | falhou
    gatewayEventId: text("gateway_event_id"),
    payloadJson: jsonb("payload_json").$type<Record<string, unknown>>().notNull().default({}),
    criadoEm: timestamp("criado_em").defaultNow().notNull(),
  },
  (t) => ({
    uqGatewayEvent: uniqueIndex("uq_pedido_pagamento_eventos_gateway").on(t.gatewayEventId),
    idxPedido: index("idx_pedido_pagamento_eventos_pedido").on(t.pedidoId),
  }),
);

export const pedidoSlots = pgTable(
  "pedido_slots",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    pedidoId: varchar("pedido_id").notNull().references(() => pedidosAnuncio.id, { onDelete: "cascade" }),
    // Zona validada em app contra ZONAS (isZonaValida) — TEXT como em `anuncios`.
    zona: text("zona").notNull(),
    // Template validado contra o registry (templateAceitoNaZona) — reuso J24.
    template: text("template").notNull().default("imagem-card"),
    titulo: text("titulo").notNull(),
    subtitulo: text("subtitulo"),
    criativoUrl: text("criativo_url"),
    ctaUrl: text("cta_url"),
    ctaTexto: text("cta_texto"),
    conteudo: jsonb("conteudo"),
    periodoInicio: text("periodo_inicio"),
    periodoFim: text("periodo_fim"),
    valorSlot: numeric("valor_slot", { precision: 15, scale: 2 }).notNull().default("0"),
    // Preenchido na materialização (aprovação) — liga ao `anuncios` real criado.
    anuncioId: varchar("anuncio_id").references(() => anuncios.id, { onDelete: "set null" }),
  },
  (t) => ({
    idxPedido: index("idx_pedido_slots_pedido").on(t.pedidoId),
  }),
);

export type PedidoAnuncio = typeof pedidosAnuncio.$inferSelect;
export type InsertPedidoAnuncio = typeof pedidosAnuncio.$inferInsert;
export type PedidoSlot = typeof pedidoSlots.$inferSelect;
export type InsertPedidoSlot = typeof pedidoSlots.$inferInsert;
export type PedidoPagamentoEvento = typeof pedidoPagamentoEventos.$inferSelect;
export type InsertPedidoPagamentoEvento = typeof pedidoPagamentoEventos.$inferInsert;

// ---------------------------------------------------------------------------
// Admin FAQ — base de perguntas frequentes gerenciável pelo admin.
// `categoria` é TEXT (não enum) p/ forward-compat: novos grupos não exigem
// migration. `visao` segmenta por persona. Schema criado idempotente em
// server/bootstrap-faq.ts (com seed dos itens canônicos).
// ---------------------------------------------------------------------------
export const faqVisaoEnum = pgEnum("faq_visao", ["contratante", "empreiteiro", "anunciante", "ambos"]);

export const faq = pgTable(
  "faq",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    category: text("category").notNull(),
    visao: faqVisaoEnum("visao").notNull().default("ambos"),
    ordem: integer("ordem").notNull().default(0),
    ativo: boolean("ativo").notNull().default(true),
    criadoEm: timestamp("criado_em").defaultNow().notNull(),
    atualizadoEm: timestamp("atualizado_em").defaultNow().notNull(),
  },
  (t) => ({
    // Listagem ordena por categoria + ordem.
    idxCategoriaOrdem: index("idx_faq_categoria_ordem").on(t.category, t.ordem),
  }),
);

export type Faq = typeof faq.$inferSelect;
export type InsertFaq = typeof faq.$inferInsert;

// ---------------------------------------------------------------------------
// Observabilidade Técnica (J33) — app_errors + job_runs
// Tabelas criadas idempotentemente em server/bootstrap-observabilidade.ts.
// ---------------------------------------------------------------------------
export const appErrors = pgTable(
  "app_errors",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    level: text("level").notNull().default("error"),
    message: text("message").notNull(),
    stack: text("stack"),
    route: text("route"),
    userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
    meta: jsonb("meta"),
    fingerprint: text("fingerprint"),
    source: text("source").notNull().default("server"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    idxCreatedAt: index("idx_app_errors_created_at").on(t.createdAt),
    idxRoute: index("idx_app_errors_route").on(t.route),
    idxLevel: index("idx_app_errors_level").on(t.level),
  })
);

export type AppError = typeof appErrors.$inferSelect;
export type InsertAppError = typeof appErrors.$inferInsert;

export const jobRuns = pgTable(
  "job_runs",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    job: text("job").notNull(),
    status: text("status").notNull(),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    finishedAt: timestamp("finished_at"),
    error: text("error"),
    meta: jsonb("meta"),
  },
  (t) => ({
    idxJobStarted: index("idx_job_runs_job_started").on(t.job, t.startedAt),
    idxStatus: index("idx_job_runs_status").on(t.status),
  })
);

export type JobRun = typeof jobRuns.$inferSelect;
export type InsertJobRun = typeof jobRuns.$inferInsert;
