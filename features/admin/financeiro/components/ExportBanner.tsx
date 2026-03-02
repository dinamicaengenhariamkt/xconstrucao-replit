'use client';

import { useState } from 'react';
import { RiDownloadLine, RiLoaderLine } from 'react-icons/ri';
import { Button } from '@shared/components/ui/button';
import { useToast } from '@shared/hooks/use-toast';

export function ExportBanner() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  async function handleGerar() {
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsGenerating(false);
    toast({
      title: 'Relatório em desenvolvimento',
      description: 'Esta funcionalidade estará disponível em breve.',
    });
  }

  return (
    <div className="bg-primary rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="adminGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#adminGrid)" />
        </svg>
      </div>

      <div className="relative z-10 text-center md:text-left">
        <h4 className="text-white text-xl font-extrabold">
          Precisa de um relatório financeiro completo?
        </h4>
        <p className="text-white/70 mt-1 max-w-lg">
          Exporte automaticamente um PDF consolidado com todos os indicadores financeiros,
          fluxo de pagamentos e receitas da plataforma.
        </p>
      </div>

      <Button
        onClick={handleGerar}
        disabled={isGenerating}
        className="relative z-10 px-8 py-3 bg-white text-primary font-extrabold rounded-xl hover:bg-gray-50 transition-colors shadow-xl flex items-center gap-2 disabled:opacity-80"
      >
        {isGenerating ? (
          <>
            <RiLoaderLine className="w-4 h-4 animate-spin" />
            Gerando...
          </>
        ) : (
          <>
            <RiDownloadLine className="w-4 h-4" />
            Gerar Relatório
          </>
        )}
      </Button>
    </div>
  );
}
