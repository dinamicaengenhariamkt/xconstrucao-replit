import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Obra } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Search, MapPin, Calendar } from "lucide-react";

const obraFormSchema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  endereco: z.string().min(3, "Endereço obrigatório"),
  valorTotal: z.string().optional(),
  dataInicio: z.string().optional(),
  dataPrevisao: z.string().optional(),
});

type ObraForm = z.infer<typeof obraFormSchema>;

function formatCurrency(val: string | number | null) {
  const num = typeof val === "string" ? parseFloat(val) : (val || 0);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
}

function obraStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    em_andamento: { label: "Em andamento", variant: "default" },
    planejamento: { label: "Planejamento", variant: "secondary" },
    concluida: { label: "Concluída", variant: "outline" },
    pausada: { label: "Pausada", variant: "destructive" },
  };
  const s = map[status] || map.planejamento;
  return <Badge variant={s.variant} className="text-xs font-semibold">{s.label}</Badge>;
}

export default function ObrasPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: obras = [], isLoading } = useQuery<Obra[]>({
    queryKey: ["/api/obras"],
  });

  const form = useForm<ObraForm>({
    resolver: zodResolver(obraFormSchema),
    defaultValues: { nome: "", endereco: "", valorTotal: "", dataInicio: "", dataPrevisao: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: ObraForm) => apiRequest("POST", "/api/obras", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/obras"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Obra cadastrada com sucesso!" });
      setDialogOpen(false);
      form.reset();
    },
    onError: (e: any) => toast({ title: "Erro ao cadastrar", description: e.message, variant: "destructive" }),
  });

  const filtered = obras.filter((o) => {
    const matchSearch = o.nome.toLowerCase().includes(search.toLowerCase()) || o.endereco.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight" data-testid="text-obras-title">Obras</h1>
          <p className="text-muted-foreground text-sm mt-1">Acompanhe todas as obras da plataforma</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-muted-foreground font-medium">
            <span className="font-bold text-foreground">{obras.length}</span> obras
          </span>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl font-bold" data-testid="button-new-obra">
                <Building2 className="w-4 h-4" />
                Nova obra
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Obra</DialogTitle></DialogHeader>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4 mt-4">
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Nome da Obra</Label>
                  <Input placeholder="Ex: Residencial Park" data-testid="input-obra-nome" {...form.register("nome")} />
                  {form.formState.errors.nome && <p className="text-destructive text-xs mt-1">{form.formState.errors.nome.message}</p>}
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Endereço</Label>
                  <Input placeholder="Rua, número, cidade" data-testid="input-obra-endereco" {...form.register("endereco")} />
                  {form.formState.errors.endereco && <p className="text-destructive text-xs mt-1">{form.formState.errors.endereco.message}</p>}
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1.5 block">Valor Total (R$)</Label>
                  <Input type="number" placeholder="0.00" {...form.register("valorTotal")} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-semibold mb-1.5 block">Data Início</Label>
                    <Input type="date" {...form.register("dataInicio")} />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold mb-1.5 block">Previsão</Label>
                    <Input type="date" {...form.register("dataPrevisao")} />
                  </div>
                </div>
                <Button type="submit" className="w-full rounded-xl font-bold" disabled={createMutation.isPending} data-testid="button-submit-obra">
                  {createMutation.isPending ? "Cadastrando..." : "Cadastrar Obra"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input className="pl-9 rounded-xl" placeholder="Buscar obra..." value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-search-obras" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] rounded-xl"><SelectValue placeholder="Todos os status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="em_andamento">Em andamento</SelectItem>
            <SelectItem value="planejamento">Planejamento</SelectItem>
            <SelectItem value="concluida">Concluída</SelectItem>
            <SelectItem value="pausada">Pausada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-medium">Nenhuma obra encontrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((o) => (
            <Card key={o.id} className="border-border" data-testid={`card-obra-${o.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-sm font-bold truncate">{o.nome}</h3>
                  {obraStatusBadge(o.status)}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{o.endereco}</span>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-bold">{o.progresso || 0}%</span>
                  </div>
                  <Progress value={o.progresso || 0} className="h-1.5" />
                </div>
                <div className="flex items-center justify-between text-xs border-t border-border pt-3">
                  <div>
                    <span className="text-muted-foreground">Valor: </span>
                    <span className="font-bold">{formatCurrency(o.valorTotal)}</span>
                  </div>
                  {o.dataPrevisao && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {o.dataPrevisao}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
