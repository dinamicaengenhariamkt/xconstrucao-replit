"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RiSendPlaneLine, RiMegaphoneLine } from "react-icons/ri";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@shared/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@shared/components/ui/form";
import { Input } from "@shared/components/ui/input";
import { Button } from "@shared/components/ui/button";
import { Checkbox } from "@shared/components/ui/checkbox";
import { useToast } from "@shared/hooks/use-toast";
import { marketplaceLeadSchema, type MarketplaceLeadInput } from "@shared/db/schema";

interface MarketplaceNotificacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MarketplaceNotificacaoModal({
  open,
  onOpenChange,
}: MarketplaceNotificacaoModalProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<MarketplaceLeadInput>({
    resolver: zodResolver(marketplaceLeadSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      isWhatsapp: false,
    },
  });

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = async (data: MarketplaceLeadInput) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/marketplace-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.message || "Erro ao registrar seu interesse");
      }

      toast({
        title: "Prontinho!",
        description:
          "Recebemos seu contato e avisaremos assim que o Marketplace xconstrução estiver disponível.",
      });
      handleClose();
    } catch (err) {
      toast({
        title: "Não foi possível enviar",
        description:
          err instanceof Error ? err.message : "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : handleClose())}>
      <DialogContent
        className="w-full max-w-lg p-0 flex flex-col gap-0 overflow-hidden"
        data-testid="modal-marketplace-notificacao"
      >
        <DialogHeader className="p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#7C3AED]/10 shrink-0">
              <RiMegaphoneLine className="w-6 h-6 text-[#7C3AED]" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Quero ser avisado
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-0.5">
                Marketplace xconstrução — deixe seus dados e avisaremos assim que lançarmos.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6">
          <Form {...form}>
            <form
              id="form-marketplace-notificacao"
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
            >
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nome <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Seu nome completo"
                        autoComplete="name"
                        {...field}
                        data-testid="input-lead-nome"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      E-mail <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="voce@exemplo.com"
                        autoComplete="email"
                        {...field}
                        data-testid="input-lead-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Telefone <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="(00) 00000-0000"
                        autoComplete="tel"
                        {...field}
                        data-testid="input-lead-telefone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isWhatsapp"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-lead-whatsapp"
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal cursor-pointer">
                      Este telefone também é WhatsApp
                    </FormLabel>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <DialogFooter className="p-6 border-t border-gray-100 dark:border-gray-800 flex flex-row justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={submitting}
            data-testid="button-cancelar-lead"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-marketplace-notificacao"
            disabled={submitting}
            className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
            data-testid="button-enviar-lead"
          >
            <RiSendPlaneLine className="w-4 h-4 mr-2" />
            {submitting ? "Enviando..." : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
