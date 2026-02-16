'use client';

import { Button } from '@shared/components/ui/button';
import { Download } from 'lucide-react';

export function ExportBanner() {
  const handleExport = () => {
    // TODO: Implementar exportação de PDF
    console.log('Exportando PDF...');
  };

  return (
    <div className="bg-primary rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
      {/* Background texture/pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="white"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center md:text-left">
        <h4 className="text-white text-xl font-extrabold">
          Precisa de um relatório consolidado?
        </h4>
        <p className="text-white/70 mt-1 max-w-lg">
          Gere automaticamente documentos em PDF com todos os indicadores de desempenho e
          status financeiro das suas obras.
        </p>
      </div>

      <Button
        onClick={handleExport}
        className="relative z-10 px-8 py-3 bg-white text-primary font-extrabold rounded-xl hover:bg-gray-50 transition-colors shadow-xl"
      >
        <Download className="w-4 h-4 mr-2" />
        Gerar PDF Completo
      </Button>
    </div>
  );
}
