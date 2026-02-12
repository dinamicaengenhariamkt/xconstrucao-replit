import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Cliente } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Search, MoreHorizontal, Mail, Phone } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const clienteFormSchema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  tipo: z.string().default("Pessoa Jurídica"),
  email: z.string().email("Email inválido"),
  telefone: z.string().optional(),
  cnpjCpf: z.string().optional(),
});

type ClienteForm = z.infer<typeof clienteFormSchema>;

function formatCurrency(val: string | number | null) {
  const num = typeof val === "string" ? parseFloat(val) : (val || 0);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
    ativo: { label: "Ativo", variant: "default" },
    inativo: { label: "Inativo", variant: "destructive" },
    aprovacao: { label: "Em aprovação", variant: "secondary" },
  };
  const s = map[status] || map.ativo;
  return <Badge variant={s.variant} className="text-xs font-semibold" data-testid={`badge-status-${status}`}>{s.label}</Badge>;
}

export default function ClientesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: clientes = [], isLoading } = useQuery<Cliente[]>({
    queryKey: ["/api/clientes"],
  });

  const form = useForm<ClienteForm>({
    resolver: zodResolver(clienteFormSchema),
    defaultValues: { nome: "", tipo: "Pessoa Jurídica", email: "", telefone: "", cnpjCpf: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: ClienteForm) => apiRequest("POST", "/api/clientes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Cliente cadastrado com sucesso!" });
      setDialogOpen(false);
      form.reset();
    },
    onError: (e: any) => toast({ title: "Erro ao cadastrar", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/clientes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clientes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Cliente removido" });
    },
  });

  const filtered = clientes.filter((c) => {
    const matchSearch = c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.cnpjCpf || "").includes(search);
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight" data-testid="text-clientes-title">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">Visão geral de todos os contratantes ativos na plataforma</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-muted-foreground font-medium">
            <span className="font-bold text-foreground">{clientes.length}</span> clientes
          </span>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl font-bold" data-testid="button-new-cliente">
                <UserPlus className="w-4 h-4" />
                Cadastrar novo cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Cliente</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4 mt-4">
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Nome</Label>
                  <Input placeholder="Nome da empresa ou pessoa" data-testid="input-cliente-nome" {...form.register("nome")} />
                  {form.formState.errors.nome && <p className="text-destructive text-xs mt-1">{form.formState.errors.nome.message}</p>}
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Tipo</Label>
                  <Select value={form.watch("tipo")} onValueChange={(v) => form.setValue("tipo", v)}>
                    <SelectTrigger data-testid="select-cliente-tipo"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pessoa Jurídica">Pessoa Jurídica</SelectItem>
                      <SelectItem value="Pessoa Física">Pessoa Física</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Email</Label>
                  <Input type="email" placeholder="email@empresa.com" data-testid="input-cliente-email" {...form.register("email")} />
                  {form.formState.errors.email && <p className="text-destructive text-xs mt-1">{form.formState.errors.email.message}</p>}
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Telefone</Label>
                  <Input placeholder="(11) 99999-9999" data-testid="input-cliente-telefone" {...form.register("telefone")} />
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">CNPJ/CPF</Label>
                  <Input placeholder="00.000.000/0001-00" data-testid="input-cliente-cnpj" {...form.register("cnpjCpf")} />
                </div>
                <Button type="submit" className="w-full rounded-xl font-bold" disabled={createMutation.isPending} data-testid="button-submit-cliente">
                  {createMutation.isPending ? "Cadastrando..." : "Cadastrar Cliente"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            className="pl-9 rounded-xl"
            placeholder="Buscar por nome, e-mail ou CNPJ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-clientes"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] rounded-xl" data-testid="select-filter-status">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="inativo">Inativos</SelectItem>
            <SelectItem value="aprovacao">Em aprovação</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <UserPlus className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-medium">Nenhum cliente encontrado</p>
            <p className="text-muted-foreground text-xs mt-1">Cadastre o primeiro cliente para começar</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs font-bold uppercase tracking-wider">Cliente</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider">Contato</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider">Obras</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider">Volume Financeiro</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id} data-testid={`row-cliente-${c.id}`}>
                    <TableCell>
                      <p className="text-sm font-bold">{c.nome}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.tipo}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" /> {c.email}
                      </div>
                      {c.telefone && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                          <Phone className="w-3 h-3" /> {c.telefone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-bold">{c.obrasCount || 0}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold">{formatCurrency(c.volumeFinanceiro)}</span>
                    </TableCell>
                    <TableCell>{statusBadge(c.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-actions-${c.id}`}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(c.id)}>
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
