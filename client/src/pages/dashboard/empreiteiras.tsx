import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Empreiteira } from "@shared/schema";
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
import { HardHat, Search, MoreHorizontal, Star, Mail, Phone } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const formSchema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  responsavel: z.string().min(2, "Responsável obrigatório"),
  email: z.string().email("Email inválido"),
  telefone: z.string().optional(),
  cnpj: z.string().optional(),
  especialidade: z.string().optional(),
});

type EmpreiteiraForm = z.infer<typeof formSchema>;

function statusBadge(status: string) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
    ativo: { label: "Ativa", variant: "default" },
    inativo: { label: "Inativa", variant: "destructive" },
    aprovacao: { label: "Em aprovação", variant: "secondary" },
  };
  const s = map[status] || map.ativo;
  return <Badge variant={s.variant} className="text-xs font-semibold">{s.label}</Badge>;
}

export default function EmpreiteirasPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: empreiteiras = [], isLoading } = useQuery<Empreiteira[]>({
    queryKey: ["/api/empreiteiras"],
  });

  const form = useForm<EmpreiteiraForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { nome: "", responsavel: "", email: "", telefone: "", cnpj: "", especialidade: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: EmpreiteiraForm) => apiRequest("POST", "/api/empreiteiras", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/empreiteiras"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Empreiteira cadastrada com sucesso!" });
      setDialogOpen(false);
      form.reset();
    },
    onError: (e: any) => toast({ title: "Erro ao cadastrar", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/empreiteiras/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/empreiteiras"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Empreiteira removida" });
    },
  });

  const filtered = empreiteiras.filter((e) => {
    const matchSearch = e.nome.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight" data-testid="text-empreiteiras-title">Empreiteiras</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerenciamento de todas as empresas executoras</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-muted-foreground font-medium">
            <span className="font-bold text-foreground">{empreiteiras.length}</span> empreiteiras
          </span>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl font-bold" data-testid="button-new-empreiteira">
                <HardHat className="w-4 h-4" />
                Cadastrar empreiteira
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Empreiteira</DialogTitle></DialogHeader>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4 mt-4">
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Nome da Empresa</Label>
                  <Input placeholder="Nome da empreiteira" data-testid="input-empreiteira-nome" {...form.register("nome")} />
                  {form.formState.errors.nome && <p className="text-destructive text-xs mt-1">{form.formState.errors.nome.message}</p>}
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Responsável</Label>
                  <Input placeholder="Nome do responsável" data-testid="input-empreiteira-resp" {...form.register("responsavel")} />
                  {form.formState.errors.responsavel && <p className="text-destructive text-xs mt-1">{form.formState.errors.responsavel.message}</p>}
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Email</Label>
                  <Input type="email" placeholder="email@empresa.com" data-testid="input-empreiteira-email" {...form.register("email")} />
                  {form.formState.errors.email && <p className="text-destructive text-xs mt-1">{form.formState.errors.email.message}</p>}
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Telefone</Label>
                  <Input placeholder="(11) 99999-9999" {...form.register("telefone")} />
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">CNPJ</Label>
                  <Input placeholder="00.000.000/0001-00" {...form.register("cnpj")} />
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Especialidade</Label>
                  <Input placeholder="Ex: Estrutural, Elétrica..." {...form.register("especialidade")} />
                </div>
                <Button type="submit" className="w-full rounded-xl font-bold" disabled={createMutation.isPending} data-testid="button-submit-empreiteira">
                  {createMutation.isPending ? "Cadastrando..." : "Cadastrar Empreiteira"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input className="pl-9 rounded-xl" placeholder="Buscar empreiteira..." value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-search-empreiteiras" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] rounded-xl"><SelectValue placeholder="Todos os status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="ativo">Ativas</SelectItem>
            <SelectItem value="inativo">Inativas</SelectItem>
            <SelectItem value="aprovacao">Em aprovação</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <HardHat className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-medium">Nenhuma empreiteira encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs font-bold uppercase tracking-wider">Empreiteira</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider">Contato</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider">Especialidade</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider">Obras</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider">Avaliação</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id} data-testid={`row-empreiteira-${e.id}`}>
                    <TableCell>
                      <p className="text-sm font-bold">{e.nome}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{e.responsavel}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><Mail className="w-3 h-3" /> {e.email}</div>
                      {e.telefone && <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1"><Phone className="w-3 h-3" /> {e.telefone}</div>}
                    </TableCell>
                    <TableCell><span className="text-sm">{e.especialidade || "-"}</span></TableCell>
                    <TableCell><span className="text-sm font-bold">{e.obrasCount || 0}</span></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-semibold">{e.avaliacao || "0.0"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{statusBadge(e.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(e.id)}>Remover</DropdownMenuItem>
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
