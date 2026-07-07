'use client';

import { useState } from 'react';
import { RiChat3Line, RiNotification3Line, RiShieldCheckLine } from 'react-icons/ri';
import { PageHeader } from '@features/shared/components/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@shared/components/ui/tabs';
import { ChatsTab } from '@features/admin/comunicacao/components/ChatsTab';
import { NotificacoesTab } from '@features/admin/comunicacao/components/NotificacoesTab';
import { AuditoriaTab } from '@features/admin/comunicacao/components/AuditoriaTab';

/**
 * J21 — Observabilidade de Comunicação (Admin).
 * Painel READ-ONLY: conversas das obras, notificações disparadas e trilha de
 * auditoria das leituras. O admin observa, não participa das threads.
 */
export default function ComunicacaoPage() {
  const [tab, setTab] = useState('conversas');

  return (
    <div className="p-4 md:p-8 lg:p-12 space-y-8">
      <PageHeader
        title="Comunicação"
        subtitle="Observabilidade read-only de conversas, notificações e auditoria."
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="conversas" data-testid="tab-conversas" className="gap-1.5">
            <RiChat3Line className="w-4 h-4" />
            Conversas
          </TabsTrigger>
          <TabsTrigger value="notificacoes" data-testid="tab-notificacoes" className="gap-1.5">
            <RiNotification3Line className="w-4 h-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="auditoria" data-testid="tab-auditoria" className="gap-1.5">
            <RiShieldCheckLine className="w-4 h-4" />
            Auditoria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversas">
          <ChatsTab />
        </TabsContent>
        <TabsContent value="notificacoes">
          <NotificacoesTab />
        </TabsContent>
        <TabsContent value="auditoria">
          <AuditoriaTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
