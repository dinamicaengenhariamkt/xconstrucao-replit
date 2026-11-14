'use client';

import { RiComputerLine, RiMoonLine, RiSunLine } from 'react-icons/ri';
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from '@shared/components/ui/dropdown-menu';
import { normalizarPreferencia, OPCOES_TEMA } from './painel-tema';
import { usePreferenciaTema } from './PainelTemaRaiz';

const ICONES = { claro: RiSunLine, escuro: RiMoonLine, automatico: RiComputerLine } as const;

/** Bloco "Tema" do menu da conta do painel (empreiteiro e admin xgestão). */
export function SeletorTemaMenu() {
  const painel = usePreferenciaTema();
  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">Tema</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={painel.preferencia}
        onValueChange={(valor) => painel.escolher(normalizarPreferencia(valor))}
        data-testid="painel-tema-opcoes"
      >
        {OPCOES_TEMA.map(({ valor, rotulo }) => {
          const Icone = ICONES[valor];
          return (
            <DropdownMenuRadioItem key={valor} value={valor} data-testid={`painel-tema-${valor}`}>
              <Icone className="mr-2 size-4" />
              {rotulo}
            </DropdownMenuRadioItem>
          );
        })}
      </DropdownMenuRadioGroup>
    </>
  );
}
