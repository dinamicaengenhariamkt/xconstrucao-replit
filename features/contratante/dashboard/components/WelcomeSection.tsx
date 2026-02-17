'use client';

export function WelcomeSection() {
  const now = new Date();
  const formatted = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const capitalized = formatted.charAt(0).toUpperCase() + formatted.slice(1);

  return (
    <div className="flex justify-between items-end">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
          Painel de Visão Geral
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Hoje é {capitalized}. Bem-vindo de volta!
        </p>
      </div>
    </div>
  );
}
