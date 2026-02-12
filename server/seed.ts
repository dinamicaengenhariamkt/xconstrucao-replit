import { db } from "./db";
import { users, clientes, empreiteiras, obras, financeiro } from "@shared/schema";
import { hashPassword } from "./auth";
import { sql } from "drizzle-orm";

export async function seedDatabase() {
  const [existingUser] = await db.select().from(users).limit(1);
  if (existingUser) return;

  console.log("Seeding database...");

  const adminPassword = await hashPassword("admin123");
  const userPassword = await hashPassword("user123");

  await db.insert(users).values([
    { username: "admin", password: adminPassword, name: "Rafael Santos", email: "admin@xconstrucao.com", role: "admin" },
    { username: "joao", password: userPassword, name: "João Oliveira", email: "joao@construtora.com", role: "contratante", phone: "(11) 98765-4321" },
    { username: "maria", password: userPassword, name: "Maria Fernandes", email: "maria@empreiteira.com", role: "empreiteiro", phone: "(21) 97654-3210" },
  ]);

  await db.insert(clientes).values([
    { nome: "Construtora Horizonte", tipo: "Pessoa Jurídica", email: "horizonte@email.com", telefone: "(11) 3456-7890", cnpjCpf: "12.345.678/0001-90", obrasCount: 5, volumeFinanceiro: "2500000.00", status: "ativo" },
    { nome: "Engenharia Moderna Ltda", tipo: "Pessoa Jurídica", email: "moderna@email.com", telefone: "(11) 2345-6789", cnpjCpf: "23.456.789/0001-01", obrasCount: 3, volumeFinanceiro: "1800000.00", status: "ativo" },
    { nome: "Carlos Alberto Mendes", tipo: "Pessoa Física", email: "carlos@email.com", telefone: "(21) 99876-5432", cnpjCpf: "123.456.789-00", obrasCount: 2, volumeFinanceiro: "650000.00", status: "ativo" },
    { nome: "Grupo Edificar S.A.", tipo: "Pessoa Jurídica", email: "edificar@email.com", telefone: "(31) 3456-7891", cnpjCpf: "34.567.890/0001-12", obrasCount: 8, volumeFinanceiro: "4200000.00", status: "ativo" },
    { nome: "Incorporadora Vista Real", tipo: "Pessoa Jurídica", email: "vistareal@email.com", telefone: "(41) 3567-8901", cnpjCpf: "45.678.901/0001-23", obrasCount: 1, volumeFinanceiro: "900000.00", status: "aprovacao" },
  ]);

  await db.insert(empreiteiras).values([
    { nome: "MasterBuild Construções", responsavel: "Pedro Almeida", email: "master@build.com", telefone: "(11) 4567-8901", cnpj: "56.789.012/0001-34", especialidade: "Estrutural", obrasCount: 12, avaliacao: "4.8", status: "ativo" },
    { nome: "TecnoObra Engenharia", responsavel: "Ana Costa", email: "tecno@obra.com", telefone: "(21) 5678-9012", cnpj: "67.890.123/0001-45", especialidade: "Elétrica e Hidráulica", obrasCount: 8, avaliacao: "4.5", status: "ativo" },
    { nome: "Alicerce Empreiteira", responsavel: "Roberto Dias", email: "alicerce@emp.com", telefone: "(31) 6789-0123", cnpj: "78.901.234/0001-56", especialidade: "Fundações", obrasCount: 6, avaliacao: "4.7", status: "ativo" },
    { nome: "Nova Era Construções", responsavel: "Luciana Borges", email: "novaera@const.com", telefone: "(41) 7890-1234", cnpj: "89.012.345/0001-67", especialidade: "Acabamento", obrasCount: 4, avaliacao: "4.2", status: "aprovacao" },
  ]);

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
