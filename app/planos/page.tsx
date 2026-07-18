'use client';

import Link from 'next/link';
import { RiCloseCircleLine, RiArrowRightLine, RiArrowLeftLine } from 'react-icons/ri';

export default function PlanosPage() {
  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-[#1C1F22] flex items-center justify-center px-4"
      data-testid="planos-cancelamento-page"
    >
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 text-center space-y-6">

          <div className="flex justify-center">
            <RiCloseCircleLine
              className="w-16 h-16 text-gray-400"
              data-testid="icon-cancelamento"
            />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Checkout cancelado
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              O processo de pagamento foi cancelado. Nenhuma cobrança foi realizada.
              <br /><br />
              Você pode escolher um plano a qualquer momento para desbloquear todos
              os recursos da plataforma.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/contratante/planos"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm"
              data-testid="link-ver-planos-contratante"
            >
              Ver planos para contratante
              <RiArrowRightLine className="w-4 h-4" />
            </Link>
            <Link
              href="/empreiteiro/planos"
              className="inline-flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
              data-testid="link-ver-planos-empreiteiro"
            >
              <RiArrowLeftLine className="w-4 h-4" />
              Ver planos para empreiteiro
            </Link>
          </div>

        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          XConstrução · Planos e Assinaturas
        </p>
      </div>
    </div>
  );
}
