'use client';

import { ObraConsoleView } from '@features/empreiteiro/minhas-obras/components/ObraConsoleView';

export default function XGestaoObraDetalhePage() {
  return <ObraConsoleView basePath="/xgestao/obras" showMarketplaceContact={false} />;
}