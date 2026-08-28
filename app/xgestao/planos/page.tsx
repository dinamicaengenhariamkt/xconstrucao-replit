import { redirect } from 'next/navigation';

export default function XGestaoPlanosPage() {
  redirect('/xgestao/configuracoes?tab=plano');
}