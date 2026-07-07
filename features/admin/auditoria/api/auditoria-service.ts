// Admin Auditoria — leitura real sobre audit_logs (substitui o mock).
// Mapeia o vocabulário real de `action` (<modulo>.<acao>) para o contrato de UI.
import { desc, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { auditLogs, users } from "@shared/db/schema";
import type {
  AuditoriaEvento,
  AuditoriaEventTipo,
  AuditoriaKpi,
  AuditoriaModulo,
} from "../types";

const EVENTOS_LIMIT = 100;

function iso(value: Date | string | null | undefined): string {
  if (value == null) return "";
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

interface ActionMeta {
  tipo: AuditoriaEventTipo;
  modulo: AuditoriaModulo;
  titulo: string;
}

// Tradução explícita das actions conhecidas. Default seguro p/ desconhecidas.
const ACTION_MAP: Record<string, ActionMeta> = {
  // Acesso
  "user.create": { tipo: "cliente_criado", modulo: "sistema", titulo: "Usuário criado" },
  "user.update": { tipo: "cliente_editado", modulo: "sistema", titulo: "Usuário atualizado" },
  "user.deactivate": { tipo: "cliente_bloqueado", modulo: "sistema", titulo: "Usuário desativado" },
  "user.reset-password": { tipo: "configuracao_alterada", modulo: "sistema", titulo: "Senha resetada" },
  "user.change-password-forced": { tipo: "configuracao_alterada", modulo: "sistema", titulo: "Troca de senha forçada" },
  "user.define-initial-password": { tipo: "configuracao_alterada", modulo: "sistema", titulo: "Senha inicial definida" },
  "conta.desativar": { tipo: "cliente_bloqueado", modulo: "sistema", titulo: "Conta desativada" },
  "conta.exportar-dados": { tipo: "configuracao_alterada", modulo: "sistema", titulo: "Exportação de dados (LGPD)" },
  "conta.trocar-email.solicitar": { tipo: "configuracao_alterada", modulo: "sistema", titulo: "Troca de e-mail solicitada" },
  "conta.trocar-email.confirmar": { tipo: "configuracao_alterada", modulo: "sistema", titulo: "Troca de e-mail confirmada" },
  "impersonate.start": { tipo: "login", modulo: "sistema", titulo: "Impersonação iniciada" },
  "impersonate.exit": { tipo: "logout", modulo: "sistema", titulo: "Impersonação encerrada" },
  // Clientes (admin)
  "admin.cliente.criado": { tipo: "cliente_criado", modulo: "clientes", titulo: "Cliente cadastrado" },
  "admin.cliente.editado": { tipo: "cliente_editado", modulo: "clientes", titulo: "Cliente editado" },
  "admin.cliente.bloqueado": { tipo: "cliente_bloqueado", modulo: "clientes", titulo: "Cliente bloqueado" },
  "admin.cliente.desbloqueado": { tipo: "cliente_editado", modulo: "clientes", titulo: "Cliente desbloqueado" },
  "admin.cliente.reset-senha": { tipo: "configuracao_alterada", modulo: "clientes", titulo: "Senha do cliente resetada" },
  // Empreiteiras (admin)
  "admin.empreiteira.criada": { tipo: "empreiteira_criada", modulo: "empreiteiras", titulo: "Empreiteira cadastrada" },
  "admin.empreiteira.editada": { tipo: "empreiteira_criada", modulo: "empreiteiras", titulo: "Empreiteira editada" },
  "admin.empreiteira.bloqueada": { tipo: "empreiteira_bloqueada", modulo: "empreiteiras", titulo: "Empreiteira bloqueada" },
  "admin.empreiteira.desbloqueada": { tipo: "empreiteira_criada", modulo: "empreiteiras", titulo: "Empreiteira desbloqueada" },
  "admin.empreiteira.reset-acesso": { tipo: "configuracao_alterada", modulo: "empreiteiras", titulo: "Acesso da empreiteira resetado" },
  // Obras
  "obras.create": { tipo: "obra_criada", modulo: "obras", titulo: "Obra criada" },
  "obras.update": { tipo: "obra_atualizada", modulo: "obras", titulo: "Obra atualizada" },
  "obras.delete": { tipo: "obra_atualizada", modulo: "obras", titulo: "Obra removida" },
  "obras.moderar.aprovar": { tipo: "obra_atualizada", modulo: "obras", titulo: "Obra aprovada na moderação" },
  "obras.moderar.rejeitar": { tipo: "obra_atualizada", modulo: "obras", titulo: "Obra rejeitada na moderação" },
  // Financeiro
  "pagamentos.quitar": { tipo: "pagamento_registrado", modulo: "financeiro", titulo: "Pagamento quitado" },
  "financeiro.criar.from-medicao": { tipo: "pagamento_registrado", modulo: "financeiro", titulo: "Lançamento de medição" },
  "financeiro.saida_manual": { tipo: "pagamento_registrado", modulo: "financeiro", titulo: "Saída manual registrada" },
  "financeiro.mark-overdue": { tipo: "sistema", modulo: "financeiro", titulo: "Lançamentos marcados em atraso" },
  // Disputas
  "disputas.abrir": { tipo: "sistema", modulo: "obras", titulo: "Disputa aberta" },
  "disputas.assumir": { tipo: "sistema", modulo: "obras", titulo: "Disputa assumida" },
  "disputas.resolver": { tipo: "sistema", modulo: "obras", titulo: "Disputa resolvida" },
  // Planos / assinatura
  "planos.atualizar": { tipo: "plano_alterado", modulo: "planos", titulo: "Plano atualizado" },
  "assinatura.checkout": { tipo: "plano_alterado", modulo: "planos", titulo: "Assinatura contratada" },
  "assinatura.cancelar": { tipo: "plano_alterado", modulo: "planos", titulo: "Assinatura cancelada" },
  // Comunicação
  "admin.chat.read": { tipo: "sistema", modulo: "sistema", titulo: "Leitura de conversa (admin)" },
};

// Prefixo → módulo, p/ actions não mapeadas explicitamente.
const PREFIX_MODULO: Record<string, AuditoriaModulo> = {
  obras: "obras",
  "obras-salvas": "obras",
  medicoes: "obras",
  candidaturas: "obras",
  disputas: "obras",
  financeiro: "financeiro",
  pagamentos: "financeiro",
  planos: "planos",
  assinatura: "planos",
  anuncios: "configuracoes",
  uploads: "sistema",
  user: "sistema",
  conta: "sistema",
  impersonate: "sistema",
  admin: "sistema",
};

function mapAction(action: string): ActionMeta {
  const known = ACTION_MAP[action];
  if (known) return known;
  const prefix = action.split(".")[0] ?? "";
  return {
    tipo: "sistema",
    modulo: PREFIX_MODULO[prefix] ?? "sistema",
    titulo: action,
  };
}

function descricaoFromPayload(action: string, payload: Record<string, unknown>): string {
  const partes = Object.entries(payload)
    .filter(([, v]) => v != null && typeof v !== "object")
    .slice(0, 4)
    .map(([k, v]) => `${k}: ${String(v)}`);
  return partes.length ? partes.join(" · ") : `Ação registrada: ${action}`;
}

export async function obterAuditoriaKpi(): Promise<AuditoriaKpi> {
  const [row] = await db
    .select({
      acoesHoje: sql<number>`COUNT(*)::int`,
      loginsHoje: sql<number>`COUNT(*) FILTER (WHERE ${auditLogs.action} IN ('impersonate.start'))::int`,
      alertas: sql<number>`COUNT(*) FILTER (WHERE ${auditLogs.action} IN (
        'admin.cliente.bloqueado','admin.empreiteira.bloqueada','user.deactivate',
        'conta.desativar','disputas.abrir','obras.moderar.rejeitar'
      ))::int`,
      erros: sql<number>`COUNT(*) FILTER (WHERE ${auditLogs.action} ILIKE '%fail%' OR ${auditLogs.action} ILIKE '%erro%')::int`,
    })
    .from(auditLogs)
    .where(sql`${auditLogs.createdAt} >= date_trunc('day', now())`);

  return {
    acoesHoje: row?.acoesHoje ?? 0,
    loginsHoje: row?.loginsHoje ?? 0,
    alertas: row?.alertas ?? 0,
    erros: row?.erros ?? 0,
  };
}

export async function listarAuditoriaEventos(): Promise<AuditoriaEvento[]> {
  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      payload: auditLogs.payload,
      criadoEm: auditLogs.createdAt,
      actorNome: users.name,
      actorEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, sql`${users.id} = ${auditLogs.actorId}`)
    .orderBy(desc(auditLogs.createdAt))
    .limit(EVENTOS_LIMIT);

  return rows.map((r) => {
    const meta = mapAction(r.action);
    const payload = (r.payload ?? {}) as Record<string, unknown>;
    return {
      id: r.id,
      tipo: meta.tipo,
      modulo: meta.modulo,
      titulo: meta.titulo,
      descricao: descricaoFromPayload(r.action, payload),
      usuario: r.actorNome?.trim() || r.actorEmail || "Sistema",
      dataHora: iso(r.criadoEm),
    };
  });
}
