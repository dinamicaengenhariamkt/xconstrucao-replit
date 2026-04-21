import { Resend } from 'resend';
import { render } from '@react-email/render';
import PasswordResetEmail from '@features/auth/emails/password-reset';
import WelcomeEmail from '@features/auth/emails/welcome';
import VerificationEmail from '@features/auth/emails/verification';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(to: string, resetUrl: string, userName: string) {
  try {
    const emailHtml = await render(PasswordResetEmail({ resetUrl, userName }));

    const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    const { data, error } = await resend.emails.send({
      from: `XConstrucao <${emailFrom}>`,
      to,
      subject: 'XConstrução - Recuperação de Senha',
      html: emailHtml,
    });

    if (error) {
      console.error('Erro ao enviar email:', error);
      throw new Error('Falha ao enviar email');
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw error;
  }
}

export async function sendWelcomeEmail(
  to: string,
  userName: string,
  userRole: 'contratante' | 'empreiteiro'
) {
  try {
    const emailHtml = await render(WelcomeEmail({ userName, userRole }));

    const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    const { data, error } = await resend.emails.send({
      from: `XConstrucao <${emailFrom}>`,
      to,
      subject: 'Bem-vindo à XConstrução!',
      html: emailHtml,
    });

    if (error) {
      console.error('Erro ao enviar email de boas-vindas:', error);
      throw new Error('Falha ao enviar email de boas-vindas');
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas:', error);
    throw error;
  }
}

export async function sendVerificationEmail(
  to: string,
  verificationUrl: string,
  userName: string
) {
  try {
    const emailHtml = await render(VerificationEmail({ verificationUrl, userName }));

    const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    const { data, error } = await resend.emails.send({
      from: `XConstrucao <${emailFrom}>`,
      to,
      subject: 'XConstrução - Confirme seu Email',
      html: emailHtml,
    });

    if (error) {
      console.error('Erro ao enviar email de verificação:', error);
      throw new Error('Falha ao enviar email de verificação');
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erro ao enviar email de verificação:', error);
    throw error;
  }
}
