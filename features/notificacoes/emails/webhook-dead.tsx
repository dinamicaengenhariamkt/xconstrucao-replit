import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Hr,
  Section,
} from '@react-email/components';
import * as React from 'react';

export interface WebhookDeadAlertEmailProps {
  adminName: string;
  count: number;
  events: Array<{ id: string; eventType: string; gatewayEventId: string; retryCount: number }>;
  dashboardUrl: string;
}

export default function WebhookDeadAlertEmail({
  adminName = 'Administrador',
  count = 1,
  events = [],
  dashboardUrl = '#',
}: WebhookDeadAlertEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>⚠️ Webhooks de pagamento não processados</Heading>

          <Text style={text}>Olá {adminName},</Text>

          <Text style={text}>
            {count === 1
              ? 'Um evento de webhook de pagamento esgotou todas as tentativas de reprocessamento e não pôde ser processado.'
              : `${count} eventos de webhook de pagamento esgotaram todas as tentativas de reprocessamento e não puderam ser processados.`}
          </Text>

          <Section style={alertBox}>
            <Text style={alertText}>
              ⚠️ Esses eventos foram marcados como <strong>dead-letter</strong> e não serão retentados automaticamente.
              É necessário revisão manual para garantir que nenhum pagamento foi perdido.
            </Text>
          </Section>

          {events.length > 0 && (
            <Section style={tableSection}>
              <Text style={tableHeader}>Eventos afetados:</Text>
              {events.map((evt) => (
                <Section key={evt.id} style={eventRow}>
                  <Text style={eventText}>
                    <strong>Tipo:</strong> {evt.eventType}
                    {'  ·  '}
                    <strong>ID Gateway:</strong> {evt.gatewayEventId}
                    {'  ·  '}
                    <strong>Tentativas:</strong> {evt.retryCount}
                  </Text>
                </Section>
              ))}
            </Section>
          )}

          <Section style={buttonContainer}>
            <Button style={button} href={dashboardUrl}>
              Ver painel de saúde
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Você recebeu este alerta porque é administrador da XConstrução.
            Acesse o painel de saúde da plataforma para investigar e, se necessário,
            reprocessar os eventos manualmente.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: 'Manrope, -apple-system, BlinkMacSystemFont, sans-serif',
};
const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '32px 24px',
  maxWidth: '560px',
  borderRadius: '12px',
};
const h1 = { color: '#333333', fontSize: '22px', fontWeight: '700', margin: '0 0 16px' };
const text = { color: '#444444', fontSize: '15px', lineHeight: '24px', margin: '0 0 12px' };
const alertBox = {
  backgroundColor: '#fff3e0',
  border: '1px solid #ffcc80',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
};
const alertText = { color: '#e65100', fontSize: '14px', lineHeight: '22px', margin: '0' };
const tableSection = { margin: '16px 0' };
const tableHeader = { color: '#333333', fontSize: '14px', fontWeight: '700' as const, margin: '0 0 8px' };
const eventRow = {
  backgroundColor: '#f8f9fa',
  borderRadius: '6px',
  padding: '10px 12px',
  marginBottom: '6px',
};
const eventText = { color: '#555555', fontSize: '13px', lineHeight: '20px', margin: '0' };
const buttonContainer = { textAlign: 'center' as const, margin: '24px 0' };
const button = {
  backgroundColor: '#c62828',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '700',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};
const hr = { borderColor: '#e6ebf1', margin: '24px 0' };
const footer = { color: '#8898aa', fontSize: '12px', lineHeight: '18px' };
