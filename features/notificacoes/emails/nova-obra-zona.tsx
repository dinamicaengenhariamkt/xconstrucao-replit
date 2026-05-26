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

export interface NovaObraZonaEmailProps {
  empreiteiroNome: string;
  obraNome: string;
  cidade: string | null;
  uf: string | null;
  valorFormatado: string | null;
  link: string;
}

export default function NovaObraZonaEmail({
  empreiteiroNome = 'Empreiteiro',
  obraNome = 'uma nova obra',
  cidade = null,
  uf = null,
  valorFormatado = null,
  link = '#',
}: NovaObraZonaEmailProps) {
  const local =
    cidade && uf ? `${cidade} - ${uf}` : cidade || uf || 'sua região';

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Nova obra na sua zona de atuação</Heading>

          <Text style={text}>Olá {empreiteiroNome},</Text>

          <Text style={text}>
            Uma nova obra acaba de ser publicada no marketplace e bate com a sua
            zona de atuação. Dê uma olhada antes que outro empreiteiro se
            candidate.
          </Text>

          <Section style={infoBox}>
            <Text style={infoLine}>
              <strong>Obra:</strong> {obraNome}
            </Text>
            <Text style={infoLine}>
              <strong>Local:</strong> {local}
            </Text>
            {valorFormatado ? (
              <Text style={infoLine}>
                <strong>Valor estimado:</strong> {valorFormatado}
              </Text>
            ) : null}
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={link}>
              Ver detalhes da obra
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Você recebeu este email porque a UF ou a cidade desta obra estão na
            sua zona de atuação na XConstrução. Você pode desativar este aviso
            em Configurações &rarr; Notificações &rarr; "Novas obras".
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
const h1 = { color: '#333333', fontSize: '24px', fontWeight: '700', margin: '0 0 16px' };
const text = { color: '#444444', fontSize: '15px', lineHeight: '24px', margin: '0 0 12px' };
const infoBox = {
  backgroundColor: '#f6f9fc',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
};
const infoLine = { color: '#333333', fontSize: '14px', lineHeight: '22px', margin: '4px 0' };
const buttonContainer = { textAlign: 'center' as const, margin: '24px 0' };
const button = {
  backgroundColor: '#333333',
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
