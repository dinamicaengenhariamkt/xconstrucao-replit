import { render } from '@react-email/render';
import PasswordResetEmail from '@features/auth/emails/password-reset';
import WelcomeEmail from '@features/auth/emails/welcome';
import VerificationEmail from '@features/auth/emails/verification';
import PasswordSetupEmail from '@features/auth/emails/password-setup';
import PagamentoRecebidoEmail from '@features/notificacoes/emails/pagamento-recebido';
import CandidaturaDecididaEmail, {
  type CandidaturaDecididaEmailProps,
} from '@features/notificacoes/emails/candidatura-decidida';
import NovaObraZonaEmail, {
  type NovaObraZonaEmailProps,
} from '@features/notificacoes/emails/nova-obra-zona';
import { captureTestEmail, isEmailTestMode } from '@shared/lib/test-email-store';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const SENDER_NAME = 'XConstrução';
const DEFAULT_SENDER_EMAIL = 'noreply@dinamicareforma.com.br';

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  tag: string;
};

type BrevoSendResult = { success: true; data: { id: string } };

async function sendViaBrevo({ to, subject, html, tag }: SendArgs): Promise<BrevoSendResult> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error(`[email:${tag}] BREVO_API_KEY ausente — não é possível enviar email.`);
    throw new Error('Falha ao enviar email');
  }

  const senderEmail = process.env.EMAIL_FROM || DEFAULT_SENDER_EMAIL;

  const res = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    let detail: unknown = undefined;
    try {
      detail = await res.json();
    } catch {
      try {
        detail = await res.text();
      } catch {
        // ignore
      }
    }
    console.error(`[email:${tag}] Brevo respondeu ${res.status}:`, detail);
    throw new Error('Falha ao enviar email');
  }

  const payload = (await res.json().catch(() => ({}))) as { messageId?: string };
  return { success: true, data: { id: payload.messageId ?? '' } };
}

export async function sendPasswordResetEmail(to: string, resetUrl: string, userName: string) {
  const html = await render(PasswordResetEmail({ resetUrl, userName }));
  const subject = 'XConstrução - Recuperação de Senha';

  if (isEmailTestMode()) {
    captureTestEmail({ to, subject, html, meta: { kind: 'password-reset', resetUrl, userName } });
    return { success: true, data: { id: 'test-mode' } };
  }

  try {
    return await sendViaBrevo({ to, subject, html, tag: 'password-reset' });
  } catch (error) {
    console.error('Erro ao enviar email de recuperação de senha:', error);
    throw error;
  }
}

export async function sendWelcomeEmail(
  to: string,
  userName: string,
  userRole: 'contratante' | 'empreiteiro'
) {
  const html = await render(WelcomeEmail({ userName, userRole }));
  const subject = 'Bem-vindo à XConstrução!';

  if (isEmailTestMode()) {
    captureTestEmail({ to, subject, html, meta: { kind: 'welcome', userName, userRole } });
    return { success: true, data: { id: 'test-mode' } };
  }

  try {
    return await sendViaBrevo({ to, subject, html, tag: 'welcome' });
  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas:', error);
    throw error;
  }
}

export async function sendPasswordSetupEmail(
  to: string,
  setupUrl: string,
  userName: string,
  invitedByName: string | null,
  roleLabel: string,
) {
  const html = await render(
    PasswordSetupEmail({ setupUrl, userName, invitedByName: invitedByName ?? undefined, roleLabel }),
  );
  const subject = 'XConstrução - Defina sua senha de acesso';

  if (isEmailTestMode()) {
    captureTestEmail({ to, subject, html, meta: { kind: 'password-setup', setupUrl, userName, invitedByName, roleLabel } });
    return { success: true, data: { id: 'test-mode' } };
  }

  try {
    return await sendViaBrevo({ to, subject, html, tag: 'password-setup' });
  } catch (error) {
    console.error('Erro ao enviar email de definição de senha:', error);
    throw error;
  }
}

export async function sendPagamentoRecebidoEmail(
  to: string,
  props: {
    empreiteiroNome: string;
    obraNome: string;
    valorFormatado: string;
    metodoPagamento: string;
    dataPagamento: string;
    link: string;
  },
) {
  const html = await render(PagamentoRecebidoEmail(props));
  const subject = `XConstrução - Pagamento recebido (${props.valorFormatado})`;

  if (isEmailTestMode()) {
    captureTestEmail({ to, subject, html, meta: { kind: 'pagamento-recebido', ...props } });
    return { success: true, data: { id: 'test-mode' } };
  }

  try {
    return await sendViaBrevo({ to, subject, html, tag: 'pagamento-recebido' });
  } catch (error) {
    console.error('Erro ao enviar email de pagamento recebido:', error);
    throw error;
  }
}

export async function sendCandidaturaDecididaEmail(
  to: string,
  props: CandidaturaDecididaEmailProps,
) {
  const html = await render(CandidaturaDecididaEmail(props));
  const subject =
    props.resultado === 'aceita'
      ? `XConstrução - Sua proposta foi aceita (${props.obraNome})`
      : `XConstrução - Sua proposta não foi selecionada (${props.obraNome})`;

  if (isEmailTestMode()) {
    captureTestEmail({ to, subject, html, meta: { kind: 'candidatura-decidida', ...props } });
    return { success: true, data: { id: 'test-mode' } };
  }

  try {
    return await sendViaBrevo({ to, subject, html, tag: 'candidatura-decidida' });
  } catch (error) {
    console.error('Erro ao enviar email de candidatura decidida:', error);
    throw error;
  }
}

export async function sendNovaObraZonaEmail(
  to: string,
  props: NovaObraZonaEmailProps,
) {
  const html = await render(NovaObraZonaEmail(props));
  const subject = `XConstrução - Nova obra na sua zona: ${props.obraNome}`;

  if (isEmailTestMode()) {
    captureTestEmail({ to, subject, html, meta: { kind: 'nova-obra-zona', ...props } });
    return { success: true, data: { id: 'test-mode' } };
  }

  try {
    return await sendViaBrevo({ to, subject, html, tag: 'nova-obra-zona' });
  } catch (error) {
    console.error('Erro ao enviar email de nova obra na zona:', error);
    throw error;
  }
}

export async function sendVerificationEmail(
  to: string,
  verificationUrl: string,
  userName: string
) {
  const html = await render(VerificationEmail({ verificationUrl, userName }));
  const subject = 'XConstrução - Confirme seu Email';

  if (isEmailTestMode()) {
    captureTestEmail({ to, subject, html, meta: { kind: 'verification', verificationUrl, userName } });
    return { success: true, data: { id: 'test-mode' } };
  }

  try {
    return await sendViaBrevo({ to, subject, html, tag: 'verification' });
  } catch (error) {
    console.error('Erro ao enviar email de verificação:', error);
    throw error;
  }
}
