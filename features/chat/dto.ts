import type { Conversation, Message, ObraRefAttachment } from "@features/shared/xchat/types";
import type { ConversaRow, MensagemRow } from "./service";

const PARTICIPANT_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-red-500",
  "bg-cyan-500",
  "bg-fuchsia-500",
  "bg-teal-500",
] as const;

const DIAS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

function hashStringToIndex(input: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash % modulo;
}

function colorForUserId(userId: string): string {
  return PARTICIPANT_COLORS[hashStringToIndex(userId, PARTICIPANT_COLORS.length)] ?? "bg-blue-500";
}

function initialsFrom(name: string | null | undefined, fallback: string): string {
  const source = (name ?? "").trim();
  if (!source) return fallback.slice(0, 2).toUpperCase();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  const first = parts[0]!;
  const last = parts[parts.length - 1]!;
  return (first[0]! + last[0]!).toUpperCase();
}

function formatRelativeShort(date: Date, now = new Date()): string {
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return "Ontem";
  if (diffDays > 1 && diffDays < 7) return DIAS_PT[date.getDay()] ?? "";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function toConversationDTO(row: ConversaRow): Conversation {
  const fallbackName = row.counterpartName?.trim() || "Participante";
  const lastMessageDate = row.ultimaMensagemCriadaEm ?? row.ultimaMensagemEm;
  return {
    id: row.threadId,
    participantName: fallbackName,
    participantInitials: initialsFrom(row.counterpartName, fallbackName),
    participantColor: colorForUserId(row.counterpartUserId),
    ...(row.counterpartAvatarUrl ? { avatarUrl: row.counterpartAvatarUrl } : {}),
    obraNome: row.obraNome,
    obraId: row.obraId,
    lastMessage: row.ultimaMensagemTexto ?? "",
    lastMessageTime: formatRelativeShort(lastMessageDate),
    unreadCount: row.naoLidas,
    isActive: false,
  };
}

export function toMessageDTO(row: MensagemRow, viewerUserId: string): Message {
  const attachment: ObraRefAttachment | undefined =
    row.anexoObraId && row.anexoObraNome
      ? {
          type: "obra_ref",
          obraId: row.anexoObraId,
          obraNome: row.anexoObraNome,
          obraStatus: row.anexoObraStatus ?? "",
          progresso: row.anexoObraProgresso ?? 0,
          endereco: row.anexoObraEndereco ?? "",
        }
      : undefined;

  return {
    id: row.id,
    senderId: row.autorUserId,
    senderName: row.autorName?.trim() || "Participante",
    ...(row.autorAvatarUrl ? { senderAvatarUrl: row.autorAvatarUrl } : {}),
    content: row.texto,
    timestamp: row.criadaEm.toISOString(),
    isOwn: row.autorUserId === viewerUserId,
    type: "text",
    status: row.lidaEm ? "read" : "delivered",
    ...(attachment ? { attachment } : {}),
  };
}
