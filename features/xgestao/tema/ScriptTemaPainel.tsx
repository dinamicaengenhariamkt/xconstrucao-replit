import { scriptTemaAntesDaPintura, type PreferenciaTema } from './painel-tema';

/** Server component: aplica o tema antes da primeira pintura (sem piscar claro). */
export function ScriptTemaPainel({ fixo }: { fixo?: PreferenciaTema }) {
  return <script dangerouslySetInnerHTML={{ __html: scriptTemaAntesDaPintura(fixo) }} />;
}
