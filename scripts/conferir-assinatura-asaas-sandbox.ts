import { readFile, writeFile } from 'node:fs/promises';
import { sql } from 'drizzle-orm';
import { db } from '../shared/db/db';
import { inspecionarDatabaseUrl } from '../tests/e2e/guards';

async function main() {
  const guard = inspecionarDatabaseUrl(process.env.DATABASE_URL);
  if (!guard.ok) throw new Error(guard.reason);
  if (process.env.ASAAS_ENVIRONMENT !== 'sandbox') throw new Error('Somente sandbox');
  const arquivo = '.local/homologacao/xgestao-asaas-sandbox.json';
  const contexto = JSON.parse(await readFile(arquivo, 'utf8'));
  const ref = `xconstrucao|${contexto.userId}|${contexto.planoId}|mensal`;
  const assinatura = await db.execute(sql`
    SELECT a.id, a.status, a.persona, a.gateway_provider,
           a.gateway_subscription_id, a.renova_em, p.tier, p.nome
    FROM assinaturas a JOIN planos p ON p.id = a.plano_id
    WHERE a.user_id = ${contexto.userId}
    ORDER BY a.created_at
  `);
  const eventos = await db.execute(sql`
    SELECT gateway_event_id, status, retry_count, processed_at
    FROM webhook_delivery_log
    WHERE raw_body::jsonb->'payment'->>'externalReference' = ${ref}
    ORDER BY created_at
  `);
  const headers = {
    access_token: process.env.ASAAS_API_KEY!,
    'User-Agent': 'XConstrucao/1.0',
  };
  const res = await fetch(
    `https://api-sandbox.asaas.com/v3/payments?externalReference=${encodeURIComponent(ref)}`,
    { headers },
  );
  if (!res.ok) throw new Error(`Asaas: HTTP ${res.status}`);
  const pagamentos = await res.json() as { data: Array<{
    id: string; status: string; subscription?: string; value: number;
  }> };
  const evidence = {
    consultadoEm: new Date().toISOString(),
    assinaturas: assinatura.rows,
    entregas: eventos.rows,
    pagamentos: pagamentos.data.map(p => ({
      id: p.id, status: p.status, subscription: p.subscription, value: p.value,
    })),
  };
  contexto.evidencias = [...(contexto.evidencias ?? []), evidence];
  await writeFile(arquivo, JSON.stringify(contexto, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
}

main().then(() => process.exit(0)).catch(error => {
  console.error(error.message);
  process.exit(1);
});