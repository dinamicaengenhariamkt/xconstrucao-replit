import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, HardHat, Building2, Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type DashboardStats = {
  totalClientes: number;
  totalEmpreiteiras: number;
  totalObras: number;
  obrasAndamento: number;
  totalEntradas: string;
  totalSaidas: string;
  saldoGeral: string;
};

function StatCard({ icon: Icon, label, value, trend, trendUp, color }: {
  icon: typeof Users;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  color: string;
}) {
  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <Badge variant="secondary" className="text-xs font-semibold gap-1">
              {trendUp ? <ArrowUpRight className="w-3 h-3 text-green-600" /> : <ArrowDownRight className="w-3 h-3 text-red-500" />}
              {trend}
            </Badge>
          )}
        </div>
        <p className="text-2xl font-extrabold mt-3" data-testid={`stat-value-${label}`}>{value}</p>
        <p className="text-xs text-muted-foreground font-medium mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

const monthlyData = [
  { mes: "Jul", entradas: 180000, saidas: 120000 },
  { mes: "Ago", entradas: 220000, saidas: 150000 },
  { mes: "Set", entradas: 195000, saidas: 130000 },
  { mes: "Out", entradas: 250000, saidas: 170000 },
  { mes: "Nov", entradas: 280000, saidas: 190000 },
  { mes: "Dez", entradas: 310000, saidas: 210000 },
];

const statusData = [
  { name: "Em andamento", value: 8, color: "hsl(158, 64%, 32%)" },
  { name: "Planejamento", value: 3, color: "hsl(207, 90%, 54%)" },
  { name: "Concluída", value: 5, color: "hsl(45, 93%, 47%)" },
  { name: "Pausada", value: 2, color: "hsl(4, 90%, 58%)" },
];

function formatCurrency(val: string | number) {
  const num = typeof val === "string" ? parseFloat(val) : val;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
}

export default function DashboardHome() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight" data-testid="text-dashboard-title">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral da plataforma XConstrução</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total de Clientes" value={stats?.totalClientes || 0} trend="+12%" trendUp color="bg-blue-500/10 text-blue-600" />
        <StatCard icon={HardHat} label="Empreiteiras" value={stats?.totalEmpreiteiras || 0} trend="+5%" trendUp color="bg-amber-500/10 text-amber-600" />
        <StatCard icon={Building2} label="Obras Ativas" value={stats?.obrasAndamento || 0} color="bg-primary/10 text-primary" />
        <StatCard icon={Wallet} label="Saldo Geral" value={formatCurrency(stats?.saldoGeral || "0")} trend="+8%" trendUp color="bg-emerald-500/10 text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard icon={TrendingUp} label="Total Entradas" value={formatCurrency(stats?.totalEntradas || "0")} trendUp color="bg-green-500/10 text-green-600" />
        <StatCard icon={TrendingDown} label="Total Saídas" value={formatCurrency(stats?.totalSaidas || "0")} color="bg-red-500/10 text-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold mb-4" data-testid="text-chart-title">Movimentação Financeira (últimos 6 meses)</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
                  />
                  <Bar dataKey="entradas" fill="hsl(158, 64%, 32%)" radius={[4, 4, 0, 0]} name="Entradas" />
                  <Bar dataKey="saidas" fill="hsl(4, 90%, 58%)" radius={[4, 4, 0, 0]} name="Saídas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold mb-4" data-testid="text-pie-title">Status das Obras</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {statusData.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }}></div>
                    <span className="text-muted-foreground">{s.name}</span>
                  </div>
                  <span className="font-bold">{s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
