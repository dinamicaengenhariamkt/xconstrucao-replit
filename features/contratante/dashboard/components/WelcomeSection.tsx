import Link from 'next/link';
import { RiAddLine, RiMoneyDollarCircleLine } from 'react-icons/ri';
import { Button } from '@shared/components/ui/button';

export function WelcomeSection() {
  const now = new Date();
  const formatted = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const capitalized = formatted.charAt(0).toUpperCase() + formatted.slice(1);

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
          Painel de Visão Geral
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Hoje é {capitalized}. Bem-vindo de volta!
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" data-testid="cta-pagamentos">
          <Link href="/contratante/pagamentos">
            <RiMoneyDollarCircleLine className="w-4 h-4 mr-2" />
            Pagamentos
          </Link>
        </Button>
        <Button asChild data-testid="cta-nova-obra">
          <Link href="/contratante/nova-obra">
            <RiAddLine className="w-4 h-4 mr-2" />
            Nova obra
          </Link>
        </Button>
      </div>
    </div>
  );
}
