module.exports=[723862,e=>e.a(async(a,s)=>{try{let a=await e.y("pg-587764f78a6c7a9c");e.n(a),s()}catch(e){s(e)}},!0),449064,e=>e.a(async(a,s)=>{try{var E=e.i(723862),r=e.i(196100),t=e.i(183138),T=a([E,r]);if([E,r]=T.then?(await T)():T,!process.env.DATABASE_URL)throw Error("DATABASE_URL must be set");let A=new E.Pool({connectionString:process.env.DATABASE_URL}),i=(0,r.drizzle)(A,{schema:t});e.s(["db",0,i]),s()}catch(e){s(e)}},!1),648863,e=>e.a(async(a,s)=>{try{var E=e.i(533102),r=e.i(449064),t=a([r]);[r]=t.then?(await t)():t;let i="admin@xconstrucao.com";async function T(){let e=await r.db.execute(E.sql`
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'superadmin'
    LIMIT 1
  `),a=e.rows??e;if(!(Array.isArray(a)&&a.length>0))try{await r.db.execute(E.sql`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin' BEFORE 'admin'`),console.info("[bootstrap-superadmin] enum value 'superadmin' added")}catch(e){console.error("[bootstrap-superadmin] não foi possível adicionar enum 'superadmin':",e);return}await A("users","must_change_password",E.sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE`),await A("users","created_by",E.sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by VARCHAR REFERENCES users(id) ON DELETE SET NULL`),await A("users","ativo",E.sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE`),await A("users","can_manage_users",E.sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS can_manage_users BOOLEAN NOT NULL DEFAULT FALSE`),await r.db.execute(E.sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      actor_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      target_user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      ip TEXT,
      user_agent TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `),await r.db.execute(E.sql`
    CREATE TABLE IF NOT EXISTS password_setup_tokens (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      created_by VARCHAR REFERENCES users(id) ON DELETE SET NULL
    )
  `);let s=await r.db.execute(E.sql`
    UPDATE users
       SET role = 'superadmin'::user_role
     WHERE email = ${i}
       AND role <> 'superadmin'
     RETURNING id
  `),t=s.rows??s;Array.isArray(t)&&t.length>0&&console.info(`[bootstrap-superadmin] ${i} promovido para superadmin`)}async function A(e,a,s){try{await r.db.execute(s)}catch(e){console.error("[bootstrap-superadmin] ensureColumn falhou:",e)}}e.s(["bootstrapSuperAdmin",()=>T]),s()}catch(e){s(e)}},!1)];

//# sourceMappingURL=%5Broot-of-the-server%5D__648ef89f._.js.map