import { expect, test } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { obras, obraShareLinks } from '@shared/db/schema';
import { novoAssinanteHomologacao } from '../helpers-xgestao-homologacao';

/**
 * E2E-03 — link pausado pela troca de plano (XG48) continua na lista do dono.
 *
 * Antes ele sumia do GET e o dono não tinha como revogá-lo: o link voltaria a
 * abrir sozinho quando a empresa subisse de plano. Agora vem marcado
 * (`pausadoPorPlano`), não conta no limite, não aceita edição de seções e
 * pode ser revogado.
 */
test.describe('E2E-03 — link pausado pelo plano na lista do dono', () => {
  test('GET devolve o pausado marcado, PATCH recusa e DELETE revoga', async ({ request }) => {
    await novoAssinanteHomologacao(request, 'link-pausado');
    const criada = await request.post('/api/xgestao/obras', {
      data: { nome: 'E2E link pausado', endereco: 'Rua do Link Pausado, 10' },
    });
    expect(criada.status(), await criada.text()).toBe(201);
    const { id: obraId } = (await criada.json()) as { id: string };
    try {
      const emitido = await request.post(`/api/xgestao/obras/${obraId}/share`, { data: { nome: 'Cliente' } });
      expect(emitido.status(), await emitido.text()).toBe(201);
      const { share } = (await emitido.json()) as { share: { id: string; path: string } };

      // Ativo: listado sem a marca.
      const antes = await (await request.get(`/api/xgestao/obras/${obraId}/share`)).json() as {
        shares: Array<{ id: string; pausadoPorPlano?: boolean }>;
      };
      expect(antes.shares).toEqual([expect.objectContaining({ id: share.id, pausadoPorPlano: false })]);

      // A descida de plano pausa o link (mesma marca que `troca-marcas` grava).
      await db.update(obraShareLinks).set({ pausadoPorPlano: true }).where(eq(obraShareLinks.id, share.id));

      const lista = await request.get(`/api/xgestao/obras/${obraId}/share`);
      expect(lista.status(), await lista.text()).toBe(200);
      const corpo = (await lista.json()) as { shares: Array<{ id: string; pausadoPorPlano?: boolean }> };
      expect(corpo.shares).toEqual([expect.objectContaining({ id: share.id, pausadoPorPlano: true })]);

      // O cliente vê o aviso neutro.
      expect(await (await request.get(share.path)).text()).toContain('Esta obra não está disponível no momento');

      // Seções não se editam num link pausado.
      const editar = await request.patch(`/api/xgestao/obras/${obraId}/share/${share.id}`, { data: { nome: 'Outro' } });
      expect(editar.status()).toBe(404);

      // Pausado não ocupa vaga: emitir outro continua possível no limite do plano.
      const outro = await request.post(`/api/xgestao/obras/${obraId}/share`, { data: { nome: 'Arquiteto' } });
      expect(outro.status(), await outro.text()).toBe(201);
      const { share: shareOutro } = (await outro.json()) as { share: { id: string } };

      // Revogar o pausado funciona e ele sai da lista.
      const revogar = await request.delete(`/api/xgestao/obras/${obraId}/share/${share.id}`);
      expect(revogar.status(), await revogar.text()).toBe(200);
      const [linha] = await db.select({ ativo: obraShareLinks.ativo }).from(obraShareLinks)
        .where(eq(obraShareLinks.id, share.id));
      expect(linha.ativo).toBe(false);
      const depois = (await (await request.get(`/api/xgestao/obras/${obraId}/share`)).json()) as {
        shares: Array<{ id: string }>;
      };
      expect(depois.shares.map((s) => s.id)).toEqual([shareOutro.id]);
    } finally {
      await db.delete(obraShareLinks).where(eq(obraShareLinks.obraId, obraId));
      await db.delete(obras).where(eq(obras.id, obraId));
    }
  });
});
