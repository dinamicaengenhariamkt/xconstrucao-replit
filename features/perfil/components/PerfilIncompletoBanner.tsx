'use client';

import { useRouter } from 'next/navigation';
import { RiUserSettingsLine } from 'react-icons/ri';
import { useAuth } from '@features/auth/hooks/use-auth';
import { usePerfilContratante, usePerfilEmpreiteiro } from '@features/perfil/hooks/use-perfil';

/**
 * J52 — Banner global (não-bloqueante) que induz o usuário a completar o perfil
 * rico quando ele pulou/não completou o wizard de onboarding. Fonte de verdade =
 * `perfil_completo` (derivado por persona no servidor), não "pulou o wizard".
 *
 * Só contratante/empreiteiro têm perfil rico; anunciante NÃO tem esse conceito →
 * o banner não monta pra ele. Segue o padrão do EmailVerificationBanner (faixa
 * amber full-width, progressive enhancement, some sozinho quando completa).
 */
export function PerfilIncompletoBanner() {
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.role;
  const isContratante = role === 'contratante';
  const isEmpreiteiro = role === 'empreiteiro';

  // Cada hook só dispara para a persona correspondente (enabled) — evita 403.
  const contratante = usePerfilContratante({ enabled: isContratante });
  const empreiteiro = usePerfilEmpreiteiro({ enabled: isEmpreiteiro });

  const perfil = isContratante ? contratante : isEmpreiteiro ? empreiteiro : null;

  // Persona sem perfil rico (anunciante/admin) ou ainda carregando → nada.
  if (!perfil) return null;
  if (perfil.isLoading || !perfil.data) return null;
  if (perfil.data.perfilCompleto) return null;

  const destino = isContratante ? '/contratante/configuracoes' : '/empreiteiro/configuracoes';

  return (
    <div
      className="w-full bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-100"
      data-testid="banner-perfil-incompleto-global"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex items-start gap-3 flex-1">
          <RiUserSettingsLine className="text-xl mt-0.5 shrink-0" />
          <div className="text-sm leading-relaxed">
            <p className="font-semibold">Complete seu perfil</p>
            <p className="text-amber-800 dark:text-amber-200/80">
              Faltam alguns dados (endereço, foto e informações da empresa). Completar libera a
              curadoria e é exigido na hora do pagamento.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push(destino)}
          className="shrink-0 inline-flex items-center justify-center rounded-full bg-amber-900 dark:bg-amber-100 text-amber-50 dark:text-amber-900 text-xs font-bold uppercase tracking-wider px-4 py-2 hover:brightness-110 transition-all"
          data-testid="button-completar-perfil"
        >
          Completar perfil
        </button>
      </div>
    </div>
  );
}
