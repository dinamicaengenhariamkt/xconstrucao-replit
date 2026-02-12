import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Financeiro } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, Wallet, Plus, Search, Calendar } from "lucide-react";

const financeiroFormSchema = z.object({
  tipo: z.string().min(1, "Tipo obrigatório"),
  descricao: z.string().min(2, "Descrição obrigatória"),
  valor: z.string().min(1, "Valor obrigatório"),
  data: z.string().min(1, "Data obrigatória"),
  categoria: z.string().optional(),
});

type FinanceiroForm = z.infer<typeof financeiroFormSchema>;

function formatCurrency(val: string | number | null) {
  const num = typeof val === "string" ? parseFloat(val) : (val || 0);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
}

export default function FinanceiroPage() {
  const [tab, setTab] = useState("todos");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: lancamentos = [], isLoading } = useQuery<Financeiro[]>({
    queryKey: ["/api/financeiro"],
  });

  const form = useForm<FinanceiroForm>({
    resolver: zodResolver(financeiroFormSchema),
    defaultValues: { tipo: "entrada", descricao: "", valor: "", data: "", categoria: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: FinanceiroForm) => apiRequest("POST", "/api/financeiro", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financeiro"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Lançamento cadastrado!" });
      setDialogOpen(false);
      form.reset({ tipo: "entrada", descricao: "", valor: "", data: "", categoria: "" });
    },
    onError: (e: any) => toast({ title: "Erro ao cadastrar", description: e.message, variant: "destructive" }),
  });

  const filtered = lancamentos.filter((l) => {
    const matchSearch = l.descricao.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === "todos" || l.tipo === tab;
    return matchSearch && matchTab;
  });

  const totalEntradas = lancamentos.filter((l) => l.tipo === "entrada").reduce((sum, l) => sum + parseFloat(l.valor), 0);
  const totalSaidas = lancamentos.filter((l) => l.tipo === "saida").reduce((sum, l) => sum + parseFloat(l.valor), 0);
  const saldo = totalEntradas - totalSaidas;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight" data-testid="text-financeiro-title">Financeiro</h1>
          <p className="text-muted-foreground text-sm mt-1">Controle de entradas, saídas e saldo da plataforma</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl font-bold" data-testid="button-new-lancamento">
              <Plus className="w-4 h-4" />
              Novo lançamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Lançamento</DialogTitle></DialogHeader>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4 mt-4">
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Tipo</Label>
                <Select value={form.watch("tipo")} onValueChange={(v) => form.setValue("tipo", v)}>
                  <SelectTrigger data-testid="select-tipo"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Descrição</Label>
                <Input placeholder="Descrição do lançamento" data-testid="input-descricao" {...form.register("descricao")} />
                {form.formState.errors.descricao && <p className="text-destructive text-xs mt-1">{form.formState.errors.descricao.message}</p>}
              </div>
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Valor (R$)</Label>
                <Input type="number" step="0.01" placeholder="0.00" data-testid="input-valor" {...form.register("valor")} />
                {form.formState.errors.valor && <p className="text-destructive text-xs mt-1">{form.formState.errors.valor.message}</p>}
              </div>
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Data</Label>
                <Input type="date" data-testid="input-data" {...form.register("data")} />
                {form.formState.errors.data && <p className="text-destructive text-xs mt-1">{form.formState.errors.data.message}</p>}
              </div>
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Categoria</Label>
                <Input placeholder="Ex: Material, Mão de obra..." {...form.register("categoria")} />
              </div>
              <Button type="submit" className="w-full rounded-xl font-bold" disabled={createMutation.isPending} data-testid="button-submit-lancamento">
                {createMutation.isPending ? "Cadastrando..." : "Cadastrar Lançamento"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Entradas</p>
                <p className="text-lg font-extrabold text-green-600" data-testid="stat-entradas">{formatCurrency(totalEntradas)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-red-500/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Saídas</p>
                <p className="text-lg font-extrabold text-red-500" data-testid="stat-saidas">{formatCurrency(totalSaidas)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Saldo</p>
                <p className={`text-lg font-extrabold ${saldo >= 0 ? "text-green-600" : "text-red-500"}`} data-testid="stat-saldo">{formatCurrency(saldo)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="todos" data-testid="tab-todos">Todos</TabsTrigger>
            <TabsTrigger value="entrada" data-testid="tab-entradas">Entradas</TabsTrigger>
            <TabsTrigger value="saida" data-testid="tab-saidas">Saídas</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input className="pl-9 rounded-xl" placeholder="Buscar lançamento..." value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-search-financeiro" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Wallet className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-medium">Nenhum lançamento encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs font-bold uppercase tracking-wider">Tipo</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider">Descrição</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider">Categoria</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider">Data</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow key={l.id} data-testid={`row-financeiro-${l.id}`}>
                    <TableCell>
                      <Badge variant={l.tipo === "entrada" ? "default" : "destructive"} className="text-xs font-semibold gap-1">
                        {l.tipo === "entrada" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {l.tipo === "entrada" ? "Entrada" : "Saída"}
                      </Badge>
                    </TableCell>
                    <TableCell><span className="text-sm font-medium">{l.descricao}</span></TableCell>
                    <TableCell><span className="text-sm text-muted-foreground">{l.categoria || "-"}</span></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" /> {l.data}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm font-bold ${l.tipo === "entrada" ? "text-green-600" : "text-red-500"}`}>
                        {l.tipo === "entrada" ? "+" : "-"} {formatCurrency(l.valor)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
