import { and, eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { obraEquipe } from "@shared/db/schema";

/** Nome livre de beneficiário: cabe no campo e não vira parágrafo no badge. */
const NOME_MAX = 80;

export interface FornecedorResolvido {
  fornecedorId: string | null;
  fornecedorNome: string | null;
}

/**
 * XG20 — resolve "para quem foi o dinheiro" de uma saída.
 *
 * Duas formas de informar o beneficiário, e elas se excluem:
 *
 * - `fornecedorId` — alguém da **equipe desta obra**. É o caminho que faz o
 *   filtro ser exato: o vínculo é por id, não por como o nome foi digitado.
 * - `fornecedorNome` — texto livre, para o pagamento avulso a quem não está na
 *   equipe. Não obriga o usuário a cadastrar alguém no meio do lançamento.
 *
 * Quando vem por id, o nome do membro é copiado para `fornecedorNome`. O FK é
 * `ON DELETE SET NULL`: sem o snapshot, remover alguém da equipe transformaria
 * saídas antigas em "pagamento para ninguém".
 *
 * A checagem de que o membro pertence **a esta obra** é o ponto de segurança —
 * sem ela, um id de outra obra entraria aqui e criaria vínculo entre obras de
 * donos diferentes, do mesmo jeito que `validarComprovante` impede para arquivo.
 *
 * Retorna `{ erro }` com a mensagem do 400, ou os dois campos prontos para o insert.
 */
export async function resolverFornecedor(params: {
  tipo: string;
  obraId: string;
  fornecedorId: string | null | undefined;
  fornecedorNome: string | null | undefined;
}): Promise<{ erro: string } | FornecedorResolvido> {
  const { tipo, obraId } = params;
  const fornecedorId = params.fornecedorId || null;
  const fornecedorNome = params.fornecedorNome?.trim() || null;

  // Entrada é dinheiro que chega do cliente da obra; "para quem" não existe lá.
  // Mesma regra de `validarCategoria`, que já recusa categoria em entrada.
  if (tipo === "entrada" && (fornecedorId || fornecedorNome)) {
    return { erro: "Entrada não tem beneficiário." };
  }

  if (fornecedorId && fornecedorNome) {
    return { erro: "Escolha um membro da equipe ou digite um nome, não os dois." };
  }

  if (fornecedorId) {
    const [membro] = await db
      .select({ nome: obraEquipe.nome })
      .from(obraEquipe)
      .where(and(eq(obraEquipe.id, fornecedorId), eq(obraEquipe.obraId, obraId)));

    // Mensagem única para "não existe" e "é de outra obra": a diferença só
    // interessaria a quem está sondando ids alheios.
    if (!membro) return { erro: "Essa pessoa não está na equipe desta obra." };

    return { fornecedorId, fornecedorNome: membro.nome };
  }

  if (fornecedorNome && fornecedorNome.length > NOME_MAX) {
    return { erro: `O nome deve ter no máximo ${NOME_MAX} caracteres.` };
  }

  return { fornecedorId: null, fornecedorNome };
}
