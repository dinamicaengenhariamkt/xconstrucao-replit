'use client';

import { RiQuestionLine, RiSearchLine } from 'react-icons/ri';

interface FAQHeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  'data-testid'?: string;
}

export function FAQHero({ searchQuery, onSearchChange, 'data-testid': testId }: FAQHeroProps) {
  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-10 text-white">
      <div className="max-w-2xl mx-auto text-center">
        <RiQuestionLine className="w-10 h-10 mb-4 block mx-auto text-white/60" />
        <h1 className="text-4xl font-extrabold tracking-tighter mb-3">Perguntas Frequentes</h1>
        <p className="text-white/60 mb-8">Encontre respostas para as dúvidas mais comuns sobre a plataforma.</p>
        <div className="relative">
          <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar perguntas..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            data-testid={testId}
            aria-label="Buscar perguntas frequentes"
            className="w-full pl-12 pr-4 py-4 text-sm bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder-white/40"
          />
        </div>
      </div>
    </div>
  );
}
