'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface PerfilContratante {
  id: string;
  userId: string | null;
  nome: string;
  tipo: string;
  email: string;
  telefone: string | null;
  cnpjCpf: string | null;
  cep: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  avatarUrl: string | null;
  perfilCompleto: boolean;
  status: 'ativo' | 'inativo' | 'aprovacao';
  bio: string | null;
  idioma: string;
  timezone: string;
}

export interface PerfilEmpreiteiro {
  id: string;
  userId: string | null;
  nome: string;
  responsavel: string;
  email: string;
  telefone: string | null;
  cnpj: string | null;
  cep: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  avatarUrl: string | null;
  especialidades: string[];
  raioKm: number | null;
  portfolioUrls: string[];
  portfolioDocs: string[];
  descricao: string | null;
  anoFundacao: number | null;
  tamanhoEquipe: string | null;
  siteUrl: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  registroProfissional: string | null;
  perfilCompleto: boolean;
  status: 'ativo' | 'inativo' | 'aprovacao';
  bio: string | null;
  idioma: string;
  timezone: string;
}

export interface PerfilAdmin {
  id: string;
  name: string;
  email: string;
  role: 'admin';
  phone: string | null;
  avatarUrl: string | null;
  bio: string | null;
  idioma: string;
  timezone: string;
}

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

async function patchJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

const KEY_C = ['perfil', 'contratante'] as const;
const KEY_E = ['perfil', 'empreiteiro'] as const;

export function usePerfilContratante() {
  return useQuery<PerfilContratante>({
    queryKey: KEY_C,
    queryFn: () => getJSON<PerfilContratante>('/api/perfil/contratante'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdatePerfilContratante() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PerfilContratante>) =>
      patchJSON<PerfilContratante>('/api/perfil/contratante', data),
    onSuccess: (data) => qc.setQueryData(KEY_C, data),
  });
}

export function usePerfilEmpreiteiro() {
  return useQuery<PerfilEmpreiteiro>({
    queryKey: KEY_E,
    queryFn: () => getJSON<PerfilEmpreiteiro>('/api/perfil/empreiteiro'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdatePerfilEmpreiteiro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PerfilEmpreiteiro>) =>
      patchJSON<PerfilEmpreiteiro>('/api/perfil/empreiteiro', data),
    onSuccess: (data) => qc.setQueryData(KEY_E, data),
  });
}

const KEY_A = ['perfil', 'admin'] as const;

export function usePerfilAdmin() {
  return useQuery<PerfilAdmin>({
    queryKey: KEY_A,
    queryFn: () => getJSON<PerfilAdmin>('/api/perfil/admin'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdatePerfilAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Omit<PerfilAdmin, 'id' | 'email' | 'role'>>) =>
      patchJSON<PerfilAdmin>('/api/perfil/admin', data),
    onSuccess: (data) => qc.setQueryData(KEY_A, data),
  });
}

/**
 * Lê um arquivo de imagem como data URL (base64).
 * Limita o tamanho máximo aceito para não estourar payload do banco.
 */
export const MAX_AVATAR_BYTES = 1_500_000; // ~1.5 MB
export const MAX_PORTFOLIO_IMAGE_BYTES = 2_000_000; // ~2 MB
export const MAX_PORTFOLIO_DOC_BYTES = 5_000_000; // ~5 MB

export function fileToDataUrl(file: File, maxBytes: number = MAX_AVATAR_BYTES): Promise<string> {
  if (file.size > maxBytes) {
    const mb = (maxBytes / 1_000_000).toFixed(1);
    return Promise.reject(new Error(`Arquivo muito grande. Máximo ${mb}MB.`));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}
