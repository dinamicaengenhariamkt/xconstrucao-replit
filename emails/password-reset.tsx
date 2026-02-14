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

interface PasswordResetEmailProps {
  resetUrl: string;
  userName?: string;
}

export default function PasswordResetEmail({
  resetUrl,
  userName = 'Usuário',
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Recuperação de Senha</Heading>

          <Text style={text}>
            Olá {userName},
          </Text>

          <Text style={text}>
            Você solicitou a recuperação de senha da sua conta <strong>XConstrução</strong>.
          </Text>

          <Text style={text}>
            Clique no botão abaixo para redefinir sua senha:
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={resetUrl}>
              Redefinir Senha
            </Button>
          </Section>

          <Text style={text}>
            Ou copie e cole este link no seu navegador:
          </Text>

          <Text style={link}>
            {resetUrl}
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            <strong>Importante:</strong> Este link expira em 15 minutos por questões de segurança.
          </Text>

          <Text style={footer}>
            Se você não solicitou esta recuperação de senha, ignore este email.
            Sua senha permanecerá inalterada.
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

const link = {
  color: '#3b82f6',
  fontSize: '14px',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
  marginBottom: '24px',
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
