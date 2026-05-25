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

interface PagamentoRecebidoEmailProps {
  empreiteiroNome: string;
  obraNome: string;
  valorFormatado: string;
  metodoPagamento: string;
  dataPagamento: string;
  link: string;
}

export default function PagamentoRecebidoEmail({
  empreiteiroNome = 'Empreiteiro',
  obraNome = 'sua obra',
  valorFormatado = 'R$ 0,00',
  metodoPagamento = '-',
  dataPagamento = '-',
  link = '#',
}: PagamentoRecebidoEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Pagamento recebido</Heading>

          <Text style={text}>Olá {empreiteiroNome},</Text>

          <Text style={text}>
            O contratante quitou um pagamento referente à obra{' '}
            <strong>{obraNome}</strong>.
          </Text>

          <Section style={infoBox}>
            <Text style={infoLine}><strong>Valor:</strong> {valorFormatado}</Text>
            <Text style={infoLine}><strong>Método:</strong> {metodoPagamento}</Text>
            <Text style={infoLine}><strong>Data:</strong> {dataPagamento}</Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={link}>
              Ver detalhes do pagamento
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Você recebeu este email porque é o empreiteiro responsável pela obra
            associada a este pagamento na XConstrução.
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
