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

export interface AvisoExpiracaoEmailProps {
  userName: string;
  planoNome: string;
  diasRestantes: number;
  expiracaoFormatada: string;
  link: string;
}

export default function AvisoExpiracaoEmail({
  userName = 'Usuário',
  planoNome = 'Plano',
  diasRestantes = 3,
  expiracaoFormatada = '',
  link = '#',
}: AvisoExpiracaoEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Seu acesso expira em breve</Heading>

          <Text style={text}>Olá {userName},</Text>

          <Text style={text}>
            Identificamos uma pendência de pagamento na sua assinatura{' '}
            <strong>{planoNome}</strong>. Se o pagamento não for regularizado,
            seu acesso será encerrado em{' '}
            <strong>
              {diasRestantes === 1
                ? '1 dia'
                : `${diasRestantes} dias`}
            </strong>
            {expiracaoFormatada ? ` (${expiracaoFormatada})` : ''}.
          </Text>

          <Section style={alertBox}>
            <Text style={alertText}>
              ⚠️ Após o vencimento você perderá acesso às funcionalidades do
              plano <strong>{planoNome}</strong> e será migrado para o plano
              gratuito.
            </Text>
          </Section>

          <Text style={text}>
            Para manter seu acesso, regularize o pagamento pelo seu painel de
            assinaturas.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={link}>
              Regularizar pagamento
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Você recebeu este aviso porque possui uma assinatura com pagamento
            em aberto na XConstrução. Em caso de dúvidas, entre em contato com
            nosso suporte.
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
const alertBox = {
  backgroundColor: '#fff8e1',
  border: '1px solid #ffe082',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
};
const alertText = { color: '#795548', fontSize: '14px', lineHeight: '22px', margin: '0' };
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
