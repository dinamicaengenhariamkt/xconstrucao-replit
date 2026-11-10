import { NextRequest } from 'next/server';
import { adminJson, requireAdminXgestao } from '@features/xgestao/admin/server/guard';
import { listarContatosAssinante, registrarContatoAssinante } from '@features/xgestao/admin/server/contatos';
import { validarRegistroContato } from '@features/xgestao/admin/lib/contato-assinante';
import { listarAssinantesXgestao } from '@features/xgestao/admin/server/escopo';

const ID_VALIDO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/admin/xgestao/assinantes/:id/contatos — CRM-07: histórico dos
 * contatos do admin com o responsável (mais recente primeiro).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminXgestao(request);
  if (guard.error) return guard.error;
  const { id } = await params;
  if (!ID_VALIDO.test(id)) return adminJson({ message: 'Assinante não encontrado.' }, 404);
  const [assinante] = await listarAssinantesXgestao({ userIds: [id], internas: 'incluir' });
  if (!assinante) return adminJson({ message: 'Assinante não encontrado.' }, 404);
  return adminJson({ contatos: await listarContatosAssinante(id) });
}

/**
 * POST /api/admin/xgestao/assinantes/:id/contatos — registra um contato
 * (`canal`: whatsapp|email|telefone|outro; `nota` opcional, até 1000
 * caracteres). Só administrador; fica em `audit_logs`.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminXgestao(request);
  if (guard.error) return guard.error;
  const { id } = await params;
  if (!ID_VALIDO.test(id)) return adminJson({ message: 'Assinante não encontrado.' }, 404);
  const valido = validarRegistroContato(await request.json().catch(() => null));
  if (!valido.ok) return adminJson({ message: valido.erro }, 400);
  const contato = await registrarContatoAssinante({
    userId: id,
    adminId: guard.user.id,
    canal: valido.canal,
    nota: valido.nota,
    request,
  });
  if (!contato) return adminJson({ message: 'Assinante não encontrado.' }, 404);
  return adminJson({ contato }, 201);
}
