"use client";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmpreiteiraSchema } from "@shared/schema";
import type { Empreiteira, InsertEmpreiteira } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2 } from "lucide-react";

export default function EmpreiteirasPage() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { data: empreiteiras, isLoading } = useQuery<Empreiteira[]>({
    queryKey: ["/api/empreiteiras"],
  });

  const form = useForm<InsertEmpreiteira>({
    resolver: zodResolver(insertEmpreiteiraSchema),
    defaultValues: {
      nome: "",
      responsavel: "",
      email: "",
      telefone: "",
      cnpj: "",
      especialidade: "",
      status: "ativo",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertEmpreiteira) => apiRequest("POST", "/api/empreiteiras", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/empreiteiras"] });
      toast({ title: "Sucesso", description: "Empreiteira criada com sucesso." });
      setOpen(false);
      form.reset();
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/empreiteiras/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/empreiteiras"] });
      toast({ title: "Sucesso", description: "Empreiteira removida com sucesso." });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <h1 className="text-2xl font-bold" data-testid="text-empreiteiras-title">Empreiteiras</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-empreiteira">
              <Plus className="w-4 h-4 mr-2" />
              Nova Empreiteira
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Empreiteira</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <FormField control={form.control} name="nome" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl><Input {...field} data-testid="input-empreiteira-nome" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="responsavel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <FormControl><Input {...field} data-testid="input-empreiteira-responsavel" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" {...field} data-testid="input-empreiteira-email" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="telefone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} data-testid="input-empreiteira-telefone" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="cnpj" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} data-testid="input-empreiteira-cnpj" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="especialidade" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especialidade</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} data-testid="input-empreiteira-especialidade" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value ?? "ativo"}>
                      <FormControl><SelectTrigger data-testid="select-empreiteira-status"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-empreiteira">
                  {createMutation.isPending ? "Salvando..." : "Criar Empreiteira"}
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
                <th className="text-left p-3 font-medium">Responsável</th>
                <th className="text-left p-3 font-medium">Email</th>
                <th className="text-left p-3 font-medium">Especialidade</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {empreiteiras && empreiteiras.length > 0 ? empreiteiras.map((e, i) => (
                <tr key={e.id} className="border-b" data-testid={`row-empreiteira-${i}`}>
                  <td className="p-3" data-testid={`text-empreiteira-nome-${i}`}>{e.nome}</td>
                  <td className="p-3">{e.responsavel}</td>
                  <td className="p-3">{e.email}</td>
                  <td className="p-3">{e.especialidade || "—"}</td>
                  <td className="p-3 capitalize">{e.status}</td>
                  <td className="p-3">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(e.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-empreiteira-${i}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhuma empreiteira encontrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
