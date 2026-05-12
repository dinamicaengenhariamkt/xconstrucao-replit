module.exports=[723862,e=>e.a(async(t,s)=>{try{let t=await e.y("pg-587764f78a6c7a9c");e.n(t),s()}catch(e){s(e)}},!0),299772,e=>e.a(async(t,s)=>{try{var o=e.i(723862),r=e.i(196100),n=e.i(183138),c=t([o,r]);if([o,r]=c.then?(await c)():c,!process.env.DATABASE_URL)throw Error("DATABASE_URL must be set");let a=new o.Pool({connectionString:process.env.DATABASE_URL}),i=(0,r.drizzle)(a,{schema:n});e.s(["db",0,i]),s()}catch(e){s(e)}},!1),64809,e=>e.a(async(t,s)=>{try{var o=e.i(299772),r=e.i(533102),n=t([o]);async function c(){let e=0;try{let t=await o.db.execute(r.sql`
      INSERT INTO user_consents (user_id, documento, versao, aceito_em)
      SELECT u.id, 'termos'::consent_document, '1.0', COALESCE(u.created_at, NOW())
      FROM users u
      WHERE NOT EXISTS (
        SELECT 1 FROM user_consents c
        WHERE c.user_id = u.id AND c.documento = 'termos'
      )
      ON CONFLICT (user_id, documento, versao) DO NOTHING;
    `),s=await o.db.execute(r.sql`
      INSERT INTO user_consents (user_id, documento, versao, aceito_em)
      SELECT u.id, 'privacidade'::consent_document, '1.0', COALESCE(u.created_at, NOW())
      FROM users u
      WHERE NOT EXISTS (
        SELECT 1 FROM user_consents c
        WHERE c.user_id = u.id AND c.documento = 'privacidade'
      )
      ON CONFLICT (user_id, documento, versao) DO NOTHING;
    `);return e=(t.rowCount??0)+(s.rowCount??0),console.info(`[backfillConsents] ok — inserted ${e} consent row(s)`),{ok:!0,inserted:e}}catch(s){let t=s instanceof Error?s.message:String(s);return console.error("[backfillConsents] FAILED — legacy users will stay 'Pendente':",t),{ok:!1,inserted:e,error:t}}}[o]=n.then?(await n)():n,e.s(["backfillConsents",()=>c]),s()}catch(e){s(e)}},!1)];

//# sourceMappingURL=%5Broot-of-the-server%5D__6ec60204._.js.map