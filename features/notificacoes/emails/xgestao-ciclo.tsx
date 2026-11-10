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
  Link,
} from '@react-email/components';
import * as React from 'react';

/**
 * XG52 — e-mails automáticos do xgestão (teste, cobrança, cancelamento e
 * marketing). Um template só, com o texto vindo de
 * `features/xgestao/marketing/lib/textos-emails.ts`. Segue o visual de
 * `aviso-expiracao.tsx`.
 */
export interface XgestaoCicloEmailProps {
  titulo: string;
  paragrafos: string[];
  botaoTexto: string;
  botaoLink: string;
  rodape: string;
  /** Só nos e-mails de marketing: link público para sair da lista. */
  descadastroUrl?: string | null;
}

export default function XgestaoCicloEmail({
  titulo = 'xgestão',
  paragrafos = [],
  botaoTexto = 'Abrir o xgestão',
  botaoLink = '#',
  rodape = '',
  descadastroUrl = null,
}: XgestaoCicloEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{titulo}</Heading>
          {paragrafos.map((p, i) => (
            <Text key={i} style={text}>{p}</Text>
          ))}
          <Section style={buttonContainer}>
            <Button style={button} href={botaoLink}>{botaoTexto}</Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>{rodape}</Text>
          {descadastroUrl ? (
            <Text style={footer}>
              <Link href={descadastroUrl} style={footerLink}>Não quero mais receber estes e-mails</Link>
            </Text>
          ) : null}
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
const footerLink = { color: '#8898aa', textDecoration: 'underline' };
