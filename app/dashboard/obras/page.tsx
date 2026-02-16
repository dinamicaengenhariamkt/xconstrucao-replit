"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@shared/lib/queryClient";
import { useToast } from "@shared/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertObraSchema } from "@shared/db/schema";
import type { Obra, InsertObra } from "@shared/db/schema";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@shared/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@shared/components/ui/form";
import { Skeleton } from "@shared/components/ui/skeleton";
import { Progress } from "@shared/components/ui/progress";
import { Plus, Trash2 } from "lucide-react";

function formatBRL(value: number | string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

const statusLabels: Record<string, string> = {
  planejamento: "Planejamento",
  em_andamento: "Em Andamento",
  concluida: "Concluída",
  pausada: "Pausada",
};

export default function ObrasPage() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { data: obras, isLoading } = useQuery<Obra[]>({
    queryKey: ["/api/obras"],
  });

  const form = useForm<InsertObra>({
    resolver: zodResolver(insertObraSchema),
    defaultValues: {
      nome: "",
      endereco: "",
      status: "planejamento",
      valorTotal: "0",
      dataInicio: "",
      dataPrevisao: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertObra) => apiRequest("POST", "/api/obras", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/obras"] });
      toast({ title: "Sucesso", description: "Obra criada com sucesso." });
      setOpen(false);
      form.reset();
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/obras/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/obras"] });
      toast({ title: "Sucesso", description: "Obra removida com sucesso." });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <h1 className="text-2xl font-bold" data-testid="text-obras-title">Obras</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-obra">
              <Plus className="w-4 h-4 mr-2" />
              Nova Obra
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Obra</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <FormField control={form.control} name="nome" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl><Input {...field} data-testid="input-obra-nome" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="endereco" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl><Input {...field} data-testid="input-obra-endereco" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value ?? "planejamento"}>
                      <FormControl><SelectTrigger data-testid="select-obra-status"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="planejamento">Planejamento</SelectItem>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="concluida">Concluída</SelectItem>
                        <SelectItem value="pausada">Pausada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="valorTotal" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Total (R$)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ""} data-testid="input-obra-valor" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="dataInicio" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início</FormLabel>
                    <FormControl><Input type="date" {...field} value={field.value ?? ""} data-testid="input-obra-data-inicio" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="dataPrevisao" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Previsão</FormLabel>
                    <FormControl><Input type="date" {...field} value={field.value ?? ""} data-testid="input-obra-data-previsao" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-obra">
                  {createMutation.isPending ? "Salvando..." : "Criar Obra"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Nome</th>
                <th className="text-left p-3 font-medium">Endereço</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Valor Total</th>
                <th className="text-left p-3 font-medium">Progresso</th>
                <th className="text-left p-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {obras && obras.length > 0 ? obras.map((o, i) => (
                <tr key={o.id} className="border-b" data-testid={`row-obra-${i}`}>
                  <td className="p-3" data-testid={`text-obra-nome-${i}`}>{o.nome}</td>
                  <td className="p-3">{o.endereco}</td>
                  <td className="p-3">{statusLabels[o.status] || o.status}</td>
                  <td className="p-3">{formatBRL(o.valorTotal ?? 0)}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Progress value={o.progresso ?? 0} className="h-2 w-20" />
                      <span className="text-xs text-muted-foreground">{o.progresso ?? 0}%</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(o.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-obra-${i}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhuma obra encontrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
