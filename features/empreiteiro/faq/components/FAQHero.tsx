'use client';

interface FAQHeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function FAQHero({ searchQuery, onSearchChange }: FAQHeroProps) {
  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-10 text-white">
      <div className="max-w-2xl mx-auto text-center">
        <span className="material-symbols-outlined text-4xl mb-4 block text-white/60">help</span>
        <h1 className="text-4xl font-extrabold tracking-tighter mb-3">Perguntas Frequentes</h1>
        <p className="text-white/60 mb-8">Encontre respostas para as dúvidas mais comuns sobre a plataforma.</p>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40">search</span>
          <input
            type="text"
            placeholder="Buscar perguntas..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-4 text-sm bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder-white/40"
            data-testid="input-search-faq"
            aria-label="Buscar perguntas frequentes"
          />
        </div>
      </div>
    </div>
  );
}
