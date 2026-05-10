import { db } from "./db";
import {
  users,
  clientes,
  empreiteiras,
  obras,
  financeiro,
  candidaturas,
  marketplaceLeads,
  accounts,
  sessions,
  verificationTokens,
} from "@shared/db/schema";
import { hashPassword } from "./auth";
import { sql, eq } from "drizzle-orm";

/**
 * Seed determinístico para desenvolvimento.
 *
 * - Não roda em produção a menos que o banco esteja absolutamente vazio.
 * - Em dev, se detectar que o seed antigo (sem userId nas profile rows)
 *   ainda está presente, faz um reset completo para garantir que joão e
 *   maria fiquem corretamente vinculados aos seus clientes/empreiteiras.
 */
export async function seedDatabase() {
  const [existingUser] = await db.select().from(users).limit(1);

  // Detecta seed antigo: existe joão/maria mas suas profile rows não têm userId
  let needsReset = false;
  if (existingUser && process.env.NODE_ENV !== "production") {
    const [joao] = await db.select().from(users).where(eq(users.email, "joao@construtora.com"));
    if (joao) {
      const [joaoCliente] = await db.select().from(clientes).where(eq(clientes.userId, joao.id));
      if (!joaoCliente) needsReset = true;
    }
  }

  if (existingUser && !needsReset) return;

  if (needsReset) {
    console.log("Detected legacy seed without user_id links — resetting domain tables...");
    // Ordem importa por causa das FKs
    await db.delete(financeiro);
    await db.delete(candidaturas);
    await db.delete(obras);
    await db.delete(clientes);
    await db.delete(empreiteiras);
    await db.delete(marketplaceLeads);
    await db.delete(accounts);
    await db.delete(sessions);
    await db.delete(verificationTokens);
    await db.delete(users);
  }

  console.log("Seeding database...");

  // CREDENCIAIS DE DESENVOLVIMENTO (atendem à política "balanced":
  // mínimo 8 chars + 3 categorias entre maiúscula/minúscula/número/símbolo):
  //   admin@xconstrucao.com / Admin@2026!Constru
  //   joao@construtora.com  / Joao@2026!Obras
  //   maria@empreiteira.com / Maria@2026!Reforma
  const adminPassword = await hashPassword("Admin@2026!Constru");
  const joaoPassword = await hashPassword("Joao@2026!Obras");
  const mariaPassword = await hashPassword("Maria@2026!Reforma");
  const now = new Date();

  // 1. Usuários — todos já com email verificado para facilitar dev
  const insertedUsers = await db
    .insert(users)
    .values([
      {
        username: "admin",
        password: adminPassword,
        name: "Rafael Santos",
        email: "admin@xconstrucao.com",
        role: "admin",
        emailVerified: now,
      },
      {
        username: "joao",
        password: joaoPassword,
        name: "João Oliveira",
        email: "joao@construtora.com",
        role: "contratante",
        phone: "(11) 98765-4321",
        emailVerified: now,
      },
      {
        username: "maria",
        password: mariaPassword,
        name: "Maria Fernandes",
        email: "maria@empreiteira.com",
        role: "empreiteiro",
        phone: "(21) 97654-3210",
        emailVerified: now,
      },
    ])
    .returning();

  const joao = insertedUsers.find((u) => u.email === "joao@construtora.com")!;
  const maria = insertedUsers.find((u) => u.email === "maria@empreiteira.com")!;

  // 2. Clientes — primeiro o do João (vinculado), depois os "órfãos" criados pelo admin
  await db.insert(clientes).values([
    {
      userId: joao.id,
      nome: "João Oliveira",
      tipo: "Pessoa Física",
      email: "joao@construtora.com",
      telefone: "(11) 98765-4321",
      cnpjCpf: "987.654.321-00",
      obrasCount: 2,
      volumeFinanceiro: "650000.00",
      status: "ativo",
    },
    { nome: "Construtora Horizonte", tipo: "Pessoa Jurídica", email: "horizonte@email.com", telefone: "(11) 3456-7890", cnpjCpf: "12.345.678/0001-90", obrasCount: 5, volumeFinanceiro: "2500000.00", status: "ativo" },
    { nome: "Engenharia Moderna Ltda", tipo: "Pessoa Jurídica", email: "moderna@email.com", telefone: "(11) 2345-6789", cnpjCpf: "23.456.789/0001-01", obrasCount: 3, volumeFinanceiro: "1800000.00", status: "ativo" },
    { nome: "Carlos Alberto Mendes", tipo: "Pessoa Física", email: "carlos@email.com", telefone: "(21) 99876-5432", cnpjCpf: "123.456.789-00", obrasCount: 2, volumeFinanceiro: "650000.00", status: "ativo" },
    { nome: "Grupo Edificar S.A.", tipo: "Pessoa Jurídica", email: "edificar@email.com", telefone: "(31) 3456-7891", cnpjCpf: "34.567.890/0001-12", obrasCount: 8, volumeFinanceiro: "4200000.00", status: "ativo" },
    { nome: "Incorporadora Vista Real", tipo: "Pessoa Jurídica", email: "vistareal@email.com", telefone: "(41) 3567-8901", cnpjCpf: "45.678.901/0001-23", obrasCount: 1, volumeFinanceiro: "900000.00", status: "aprovacao" },
  ]);

  // 3. Empreiteiras — primeiro a da Maria (vinculada), depois as "órfãs"
  await db.insert(empreiteiras).values([
    {
      userId: maria.id,
      nome: "Maria Fernandes Empreiteira",
      responsavel: "Maria Fernandes",
      email: "maria@empreiteira.com",
      telefone: "(21) 97654-3210",
      cnpj: "11.222.333/0001-44",
      especialidade: "Acabamento e Pintura",
      obrasCount: 3,
      avaliacao: "4.6",
      status: "ativo",
    },
    { nome: "MasterBuild Construções", responsavel: "Pedro Almeida", email: "master@build.com", telefone: "(11) 4567-8901", cnpj: "56.789.012/0001-34", especialidade: "Estrutural", obrasCount: 12, avaliacao: "4.8", status: "ativo" },
    { nome: "TecnoObra Engenharia", responsavel: "Ana Costa", email: "tecno@obra.com", telefone: "(21) 5678-9012", cnpj: "67.890.123/0001-45", especialidade: "Elétrica e Hidráulica", obrasCount: 8, avaliacao: "4.5", status: "ativo" },
    { nome: "Alicerce Empreiteira", responsavel: "Roberto Dias", email: "alicerce@emp.com", telefone: "(31) 6789-0123", cnpj: "78.901.234/0001-56", especialidade: "Fundações", obrasCount: 6, avaliacao: "4.7", status: "ativo" },
    { nome: "Nova Era Construções", responsavel: "Luciana Borges", email: "novaera@const.com", telefone: "(41) 7890-1234", cnpj: "89.012.345/0001-67", especialidade: "Acabamento", obrasCount: 4, avaliacao: "4.2", status: "aprovacao" },
  ]);

  // 4. Obras / financeiro continuam como antes (não dependem da jornada 01)
  await db.insert(obras).values([
    { nome: "Residencial Park Tower", endereco: "Av. Paulista, 1500 - São Paulo, SP", status: "em_andamento", valorTotal: "3500000.00", valorPago: "1750000.00", progresso: 50, dataInicio: "2025-03-15", dataPrevisao: "2026-06-30" },
    { nome: "Edifício Corporate Center", endereco: "Rua XV de Novembro, 300 - Curitiba, PR", status: "em_andamento", valorTotal: "5200000.00", valorPago: "2080000.00", progresso: 40, dataInicio: "2025-06-01", dataPrevisao: "2027-01-15" },
    { nome: "Condomínio Jardim Real", endereco: "Av. Atlântica, 800 - Rio de Janeiro, RJ", status: "planejamento", valorTotal: "2800000.00", valorPago: "0.00", progresso: 0, dataInicio: "2026-04-01", dataPrevisao: "2027-10-30" },
    { nome: "Galpão Industrial Norte", endereco: "Rod. BR-101, Km 45 - Belo Horizonte, MG", status: "em_andamento", valorTotal: "1500000.00", valorPago: "1050000.00", progresso: 70, dataInicio: "2025-01-10", dataPrevisao: "2026-03-20" },
    { nome: "Shopping Center Estrela", endereco: "Av. Brasil, 2000 - Porto Alegre, RS", status: "concluida", valorTotal: "8500000.00", valorPago: "8500000.00", progresso: 100, dataInicio: "2024-01-15", dataPrevisao: "2025-12-30" },
    { nome: "Hospital Regional Esperança", endereco: "Rua da Saúde, 150 - Salvador, BA", status: "pausada", valorTotal: "6200000.00", valorPago: "1860000.00", progresso: 30, dataInicio: "2025-05-01", dataPrevisao: "2027-06-30" },
  ]);

  await db.insert(financeiro).values([
    { tipo: "entrada", descricao: "Pagamento Residencial Park Tower - Parcela 3", valor: "350000.00", data: "2026-02-01", categoria: "Medição" },
    { tipo: "entrada", descricao: "Pagamento Edifício Corporate Center - Parcela 2", valor: "520000.00", data: "2026-01-15", categoria: "Medição" },
    { tipo: "entrada", descricao: "Sinal Condomínio Jardim Real", valor: "280000.00", data: "2026-02-10", categoria: "Sinal" },
    { tipo: "saida", descricao: "Material - Cimento e Aço - Park Tower", valor: "125000.00", data: "2026-02-03", categoria: "Material" },
    { tipo: "saida", descricao: "Mão de obra - MasterBuild - Fev/26", valor: "89000.00", data: "2026-02-05", categoria: "Mão de obra" },
    { tipo: "saida", descricao: "Equipamentos - Guindaste aluguel", valor: "45000.00", data: "2026-01-20", categoria: "Equipamento" },
    { tipo: "entrada", descricao: "Pagamento Galpão Industrial - Parcela 5", valor: "150000.00", data: "2026-01-28", categoria: "Medição" },
    { tipo: "saida", descricao: "Material elétrico - Corporate Center", valor: "67000.00", data: "2026-02-08", categoria: "Material" },
    { tipo: "entrada", descricao: "Shopping Estrela - Parcela final", valor: "850000.00", data: "2026-01-10", categoria: "Finalização" },
    { tipo: "saida", descricao: "Seguro da obra - Hospital Regional", valor: "32000.00", data: "2026-02-01", categoria: "Seguro" },
  ]);

  console.log("Database seeded successfully!");
}
