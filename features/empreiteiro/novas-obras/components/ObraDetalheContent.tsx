'use client';

import { useState } from 'react';
import { cn } from '@shared/lib/utils';
import type { ObraDetalhe } from '../types';

interface ObraDetalheContentProps {
  obra: ObraDetalhe;
}

interface AccordionSectionProps {
  title: string;
  icon: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function AccordionSection({ title, icon, defaultOpen = false, children }: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between gap-2 p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" data-testid={`accordion-${title.toLowerCase().replace(/\s/g, '-')}`}>
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">{icon}</span>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <span className={cn("material-symbols-outlined text-gray-400 transition-transform duration-200", isOpen && "rotate-180")}>expand_more</span>
      </button>
      {isOpen && <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-800 pt-4">{children}</div>}
    </div>
  );
}

export function ObraDetalheContent({ obra }: ObraDetalheContentProps) {
  return (
    <div className="flex flex-col gap-4">
      <AccordionSection title="Sobre o Projeto" icon="info" defaultOpen={true}>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6">{obra.descricao}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg flex-shrink-0">
              <span className="material-symbols-outlined">home_repair_service</span>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Tipo de Obra</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{obra.tipoObra}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-lg flex-shrink-0">
              <span className="material-symbols-outlined">square_foot</span>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Área Construída</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{obra.areaTotal}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-lg flex-shrink-0">
              <span className="material-symbols-outlined">workspace_premium</span>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Acabamento</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{obra.complexidade === 'alta' ? 'Alto Padrão' : obra.complexidade === 'media' ? 'Médio Padrão' : 'Padrão'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-green-50 dark:bg-green-900/30 text-green-600 rounded-lg flex-shrink-0">
              <span className="material-symbols-outlined">location_on</span>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Localização</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{obra.localizacao.bairro}</p>
              <p className="text-xs text-gray-500">{obra.localizacao.cidade}, {obra.localizacao.estado}</p>
            </div>
          </div>
        </div>
      </AccordionSection>

      <AccordionSection title="Etapas do Projeto" icon="checklist">
        <div className="flex flex-col gap-3">
          {obra.etapas.map((etapa, index) => (
            <div key={etapa.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl" data-testid={`etapa-${etapa.id}`}>
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">{index + 1}</div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{etapa.nome}</p>
                <p className="text-xs text-gray-500 mt-0.5">{etapa.descricao}</p>
              </div>
              <span className="text-xs font-medium text-gray-400 bg-white dark:bg-gray-700 px-3 py-1 rounded-full">{etapa.prazo}</span>
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection title="Requisitos" icon="verified">
        <ul className="flex flex-col gap-3">
          {obra.requisitos.map((req, index) => (
            <li key={index} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400" data-testid={`requisito-${index}`}>
              <span className="material-symbols-outlined text-success text-lg flex-shrink-0 mt-0.5">check_circle</span>
              {req}
            </li>
          ))}
        </ul>
      </AccordionSection>

      <AccordionSection title="Documentação" icon="folder">
        <div className="flex flex-col gap-3">
          {obra.documentos.map((doc) => (
            <a key={doc.id} href={doc.url} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" data-testid={`doc-${doc.id}`}>
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">description</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{doc.nome}</p>
                <p className="text-xs text-gray-400">{doc.tipo} • {doc.tamanho}</p>
              </div>
              <span className="material-symbols-outlined text-gray-400">download</span>
            </a>
          ))}
        </div>
      </AccordionSection>
    </div>
  );
}
