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

interface WelcomeEmailProps {
  userName: string;
  userRole: 'contratante' | 'empreiteiro';
  dashboardUrl?: string;
}

export default function WelcomeEmail({
  userName = 'Usuário',
  userRole = 'contratante',
  dashboardUrl,
}: WelcomeEmailProps) {
  // dashboardUrl is resolved server-side by the caller (from NEXTAUTH_URL),
  // so it works correctly at runtime in production — unlike NEXT_PUBLIC_BASE_URL
  // which is baked in at build time and may be empty if not set during `next build`.
  const resolvedDashboardUrl = dashboardUrl ?? (process.env.NEXTAUTH_URL ?? '') + '/dashboard';
  const roleText = userRole === 'empreiteiro' ? 'Empreiteiro' : 'Contratante';

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Bem-vindo à XConstrução!</Heading>

          <Text style={text}>
            Olá {userName},
          </Text>

          <Text style={text}>
            Sua conta foi criada com sucesso! Estamos muito felizes em tê-lo(a)
            conosco na <strong>XConstrução</strong>.
          </Text>

          <Text style={text}>
            Você se cadastrou como: <strong>{roleText}</strong>
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={resolvedDashboardUrl}>
              Acessar Minha Conta
            </Button>
          </Section>

          <Text style={text}>
            Com a XConstrução você pode gerenciar suas obras de forma inteligente,
            controlar finanças, acompanhar o progresso e muito mais.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Se você não criou esta conta, por favor ignore este email ou
            entre em contato com nosso suporte.
          </Text>

          <Text style={footer}>
            © {new Date().getFullYear()} XConstrução. Todos os direitos reservados.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Estilos inline (necessário para compatibilidade com clientes de email)
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  marginTop: '40px',
  marginBottom: '40px',
  borderRadius: '8px',
  maxWidth: '600px',
};

const h1 = {
  color: '#1e293b',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 24px',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const hr = {
  borderColor: '#e2e8f0',
  margin: '32px 0',
};

const footer = {
  color: '#94a3b8',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 12px',
};
