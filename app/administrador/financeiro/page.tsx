/**
 * Página Financeira do Administrador
 * TODO: Implementar dashboard financeiro completo com relatórios e análises
 */

'use client';

import { useAuth } from '@features/auth/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { DollarSign, TrendingUp, Users, CreditCard, Receipt, BarChart3 } from 'lucide-react';

export default function AdministradorFinanceiroPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Painel Financeiro - Administrador
          </h1>
          <p className="text-muted-foreground text-lg">
            Bem-vindo, {user?.name}
          </p>
        </div>

        {/* Financial Stats Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Receita Total
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 0,00</div>
              <p className="text-xs text-muted-foreground">
                No período selecionado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Crescimento
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+0%</div>
              <p className="text-xs text-muted-foreground">
                Em relação ao mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Usuários Ativos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Total de usuários pagantes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Transações
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Receita Recorrente
              </CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 0,00</div>
              <p className="text-xs text-muted-foreground">
                MRR (Monthly Recurring Revenue)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Churn Rate
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground">
                Taxa de cancelamento
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Notice */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Dashboard Financeiro em Desenvolvimento</CardTitle>
            <CardDescription>
              Painel administrativo de controle financeiro da plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Funcionalidades planejadas:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Visão consolidada de receitas e despesas
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Gráficos de crescimento e tendências
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Análise de churn e retenção
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Relatórios de faturamento por cliente
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Métricas de performance financeira (MRR, ARR, LTV, CAC)
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Exportação de relatórios em PDF e Excel
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Integração com gateways de pagamento
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
