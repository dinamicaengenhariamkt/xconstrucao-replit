"use client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, HardHat, Building2, Wallet } from "lucide-react";

function formatBRL(value: number | string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<{
    totalClientes: number;
    totalEmpreiteiras: number;
    totalObras: number;
    volumeFinanceiro: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
  });

  const stats = [
    {
      label: "Total Clientes",
      value: data?.totalClientes ?? 0,
      icon: Users,
      testId: "stat-total-clientes",
      format: (v: number) => String(v),
    },
    {
      label: "Total Empreiteiras",
      value: data?.totalEmpreiteiras ?? 0,
      icon: HardHat,
      testId: "stat-total-empreiteiras",
      format: (v: number) => String(v),
    },
    {
      label: "Total Obras",
      value: data?.totalObras ?? 0,
      icon: Building2,
      testId: "stat-total-obras",
      format: (v: number) => String(v),
    },
    {
      label: "Volume Financeiro",
      value: data?.volumeFinanceiro ?? 0,
      icon: Wallet,
      testId: "stat-volume-financeiro",
      format: (v: number) => formatBRL(v),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" data-testid="text-dashboard-title">Painel de Controle</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.testId} data-testid={stat.testId}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" data-testid={`skeleton-${stat.testId}`} />
              ) : (
                <p className="text-2xl font-bold" data-testid={`value-${stat.testId}`}>
                  {stat.format(stat.value)}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
