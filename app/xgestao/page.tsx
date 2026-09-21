import { redirect } from 'next/navigation';
import { XGESTAO_HOME } from '@features/xgestao/routes';

export default function XGestaoPage() {
  // XG28 — `/xgestao` nu passa a abrir o dashboard, não a lista.
  redirect(XGESTAO_HOME);
}