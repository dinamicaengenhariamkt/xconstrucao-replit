"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@shared/lib/queryClient";
import { useToast } from "@shared/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFinanceiroSchema } from "@shared/db/schema";
import type { Financeiro, InsertFinanceiro } from "@shared/db/schema";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@shared/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@shared/components/ui/form";
import { Skeleton } from "@shared/components/ui/skeleton";
import { Plus, Trash2 } from "lucide-react";

function formatBRL(value: number | string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

export default function FinanceiroPage() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { data: registros, isLoading } = useQuery<Financeiro[]>({
    queryKey: ["/api/financeiro"],
  });

  const form = useForm<InsertFinanceiro>({
    resolver: zodResolver(insertFinanceiroSchema),
    defaultValues: {
      tipo: "entrada",
      descricao: "",
      valor: "0",
      data: "",
      categoria: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertFinanceiro) => apiRequest("POST", "/api/financeiro", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financeiro"] });
      toast({ title: "Sucesso", description: "Registro financeiro criado com sucesso." });
      setOpen(false);
      form.reset();
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/financeiro/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financeiro"] });
      toast({ title: "Sucesso", description: "Registro removido com sucesso." });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <h1 className="text-2xl font-bold" data-testid="text-financeiro-title">Financeiro</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-financeiro">
              <Plus className="w-4 h-4 mr-2" />
              Novo Registro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Registro Financeiro</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <FormField control={form.control} name="tipo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger data-testid="select-financeiro-tipo"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada</SelectItem>
                        <SelectItem value="saida">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="descricao" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl><Input {...field} data-testid="input-financeiro-descricao" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="valor" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} data-testid="input-financeiro-valor" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="data" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl><Input type="date" {...field} data-testid="input-financeiro-data" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="categoria" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} data-testid="input-financeiro-categoria" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-financeiro">
                  {createMutation.isPending ? "Salvando..." : "Criar Registro"}
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
                <th className="text-left p-3 font-medium">Tipo</th>
                <th className="text-left p-3 font-medium">Descrição</th>
                <th className="text-left p-3 font-medium">Valor</th>
                <th className="text-left p-3 font-medium">Data</th>
                <th className="text-left p-3 font-medium">Categoria</th>
                <th className="text-left p-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {registros && registros.length > 0 ? registros.map((r, i) => (
                <tr key={r.id} className="border-b" data-testid={`row-financeiro-${i}`}>
                  <td className={`p-3 font-medium ${r.tipo === "entrada" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {r.tipo === "entrada" ? "Entrada" : "Saída"}
                  </td>
                  <td className="p-3" data-testid={`text-financeiro-descricao-${i}`}>{r.descricao}</td>
                  <td className="p-3">{formatBRL(r.valor)}</td>
                  <td className="p-3">{r.data}</td>
                  <td className="p-3">{r.categoria || "—"}</td>
                  <td className="p-3">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(r.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-financeiro-${i}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhum registro financeiro encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
