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

export interface CandidaturaDecididaEmailProps {
  empreiteiroNome: string;
  obraNome: string;
  resultado: 'aceita' | 'rejeitada';
  valorFormatado: string;
  motivoRejeicao?: string | null;
  mensagemContratante?: string | null;
  link: string;
}

export default function CandidaturaDecididaEmail({
  empreiteiroNome = 'Empreiteiro',
  obraNome = 'a obra',
  resultado = 'aceita',
  valorFormatado = 'R$ 0,00',
  motivoRejeicao = null,
  mensagemContratante = null,
  link = '#',
}: CandidaturaDecididaEmailProps) {
  const aceita = resultado === 'aceita';
  const titulo = aceita ? 'Sua proposta foi aceita!' : 'Sua proposta não foi selecionada';
  const introducao = aceita
    ? `Boas notícias! O contratante aceitou sua proposta para a obra ${obraNome}.`
    : `O contratante decidiu seguir com outra proposta para a obra ${obraNome}.`;
  const ctaLabel = aceita ? 'Acessar a obra' : 'Ver candidatura';

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{titulo}</Heading>

          <Text style={text}>Olá {empreiteiroNome},</Text>
          <Text style={text}>{introducao}</Text>

          <Section style={infoBox}>
            <Text style={infoLine}>
              <strong>Obra:</strong> {obraNome}
            </Text>
            <Text style={infoLine}>
              <strong>Valor proposto:</strong> {valorFormatado}
            </Text>
            {aceita && mensagemContratante ? (
              <Text style={infoLine}>
                <strong>Mensagem do contratante:</strong> {mensagemContratante}
              </Text>
            ) : null}
            {!aceita && motivoRejeicao ? (
              <Text style={infoLine}>
                <strong>Motivo:</strong> {motivoRejeicao}
              </Text>
            ) : null}
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={link}>
              {ctaLabel}
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Você recebeu este email porque enviou uma proposta para esta obra na XConstrução.
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
