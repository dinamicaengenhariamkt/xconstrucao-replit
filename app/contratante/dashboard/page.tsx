/**
 * Dashboard do Contratante
 * TODO: Implementar dashboard completo com estatísticas e gestão de obras
 */

'use client';

import { useAuth } from '@features/auth/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Building2, ClipboardList, Users, FileText } from 'lucide-react';

export default function ContratanteDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Bem-vindo, {user?.name}
          </h1>
          <p className="text-muted-foreground text-lg">
            Dashboard do Contratante - Em construção
          </p>
        </div>

        {/* Placeholder Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Minhas Obras
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Obras cadastradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Propostas
              </CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Aguardando análise
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Empreiteiras
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Cadastradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Contratos
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Ativos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Notice */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Dashboard em Desenvolvimento</CardTitle>
            <CardDescription>
              Esta área está sendo construída e estará disponível em breve.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Funcionalidades planejadas:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Gestão completa de obras
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Análise de propostas de empreiteiras
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Acompanhamento financeiro
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Sistema de comunicação integrado
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Relatórios e dashboards analíticos
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
