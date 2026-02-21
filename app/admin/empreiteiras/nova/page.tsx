'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Badge } from '@shared/components/ui/badge';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@shared/components/ui/form';
import { RiArrowLeftLine, RiSaveLine, RiCloseLine } from 'react-icons/ri';
import { useState } from 'react';

const ESPECIALIDADES_OPTIONS = [
  'Fundações',
  'Estrutura',
  'Acabamento',
  'Elétrica',
  'Hidráulica',
  'Alvenaria',
  'Pintura',
  'Impermeabilização',
];

const novaEmpreiteiraSchema = z.object({
  razaoSocial: z.string().min(3, 'Razão social deve ter pelo menos 3 caracteres'),
  nomeFantasia: z.string().min(2, 'Nome fantasia deve ter pelo menos 2 caracteres'),
  cnpj: z.string().min(14, 'CNPJ inválido'),
  email: z.string().email('Email inválido'),
  telefone: z.string().min(10, 'Telefone inválido'),
  responsavel: z.string().min(3, 'Nome do responsável deve ter pelo menos 3 caracteres'),
  endereco: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  cidade: z.string().min(2, 'Cidade inválida'),
  estado: z.string().length(2, 'Use a sigla do estado (ex: SP)'),
  especialidades: z.array(z.string()).min(1, 'Selecione pelo menos uma especialidade'),
});

type NovaEmpreiteiraFormData = z.infer<typeof novaEmpreiteiraSchema>;

export default function AdminNovaEmpreiteiraPage() {
  const router = useRouter();
  const [selectedEspecialidades, setSelectedEspecialidades] = useState<string[]>([]);

  const form = useForm<NovaEmpreiteiraFormData>({
    resolver: zodResolver(novaEmpreiteiraSchema),
    defaultValues: {
      razaoSocial: '',
      nomeFantasia: '',
      cnpj: '',
      email: '',
      telefone: '',
      responsavel: '',
      endereco: '',
      cidade: '',
      estado: '',
      especialidades: [],
    },
  });

  const toggleEspecialidade = (esp: string) => {
    const current = form.getValues('especialidades');
    const updated = current.includes(esp)
      ? current.filter((e) => e !== esp)
      : [...current, esp];
    form.setValue('especialidades', updated, { shouldValidate: true });
    setSelectedEspecialidades(updated);
  };

  const onSubmit = async (data: NovaEmpreiteiraFormData) => {
    try {
      const res = await fetch('/api/admin/empreiteiras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Erro ao cadastrar empreiteira');
      router.push('/admin/empreiteiras');
    } catch {
      console.error('Erro ao cadastrar empreiteira');
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-8" data-testid="admin-nova-empreiteira-page">
      <Link href="/admin/empreiteiras" data-testid="link-back-empreiteiras-nova">
        <Button variant="ghost" size="sm" data-testid="button-back-empreiteiras-nova">
          <RiArrowLeftLine className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Nova Empreiteira</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Preencha os dados para cadastrar uma nova empreiteira
        </p>
      </div>

      <Card className="rounded-2xl max-w-2xl">
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" data-testid="form-nova-empreiteira">
              <FormField
                control={form.control}
                name="razaoSocial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão Social</FormLabel>
                    <FormControl>
                      <Input placeholder="Razão social da empresa" {...field} data-testid="input-razao-social" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nomeFantasia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Fantasia</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome fantasia" {...field} data-testid="input-nome-fantasia" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input placeholder="00.000.000/0001-00" {...field} data-testid="input-cnpj" />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@empresa.com.br" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 3456-7890" {...field} data-testid="input-telefone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="responsavel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do responsável" {...field} data-testid="input-responsavel" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="endereco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, número, complemento" {...field} data-testid="input-endereco" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Cidade" {...field} data-testid="input-cidade" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input placeholder="SP" maxLength={2} {...field} data-testid="input-estado" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="especialidades"
                render={() => (
                  <FormItem>
                    <FormLabel>Especialidades</FormLabel>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {ESPECIALIDADES_OPTIONS.map((esp) => {
                        const isSelected = selectedEspecialidades.includes(esp);
                        return (
                          <Badge
                            key={esp}
                            variant={isSelected ? 'default' : 'outline'}
                            className={`cursor-pointer rounded-full text-xs px-3 py-1 transition-colors ${
                              isSelected ? '' : ''
                            }`}
                            onClick={() => toggleEspecialidade(esp)}
                            data-testid={`badge-toggle-especialidade-${esp}`}
                          >
                            {esp}
                            {isSelected && <RiCloseLine className="w-3 h-3 ml-1" />}
                          </Badge>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={form.formState.isSubmitting} data-testid="button-submit-empreiteira">
                  <RiSaveLine className="w-4 h-4 mr-2" />
                  {form.formState.isSubmitting ? 'Salvando...' : 'Cadastrar Empreiteira'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
