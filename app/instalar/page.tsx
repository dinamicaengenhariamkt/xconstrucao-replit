import type { Metadata } from 'next';
import { InstalarAppPagina } from '@features/pwa/components/InstalarAppPagina';

export const metadata: Metadata = {
  title: 'Instalar o app',
  description: 'Instale o xgestão no celular em poucos segundos, direto do navegador.',
};

export default function InstalarPage() {
  return <InstalarAppPagina />;
}
