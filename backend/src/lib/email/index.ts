import nodemailer from 'nodemailer';
import { env } from '../../config/env';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: env.SMTP_USER
    ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
    : undefined,
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (!env.SMTP_HOST) {
    console.log(`[EMAIL MOCK] Para: ${to} | Assunto: ${subject}`);
    return;
  }
  await transporter.sendMail({ from: env.EMAIL_FROM, to, subject, html });
}

export const emailTemplates = {
  newProposal: (artistName: string, clientName: string, eventDate: string, totalAmount: number) => ({
    subject: 'Nova Proposta de Booking – Pulso Musical',
    html: `
      <div style="font-family:Inter,sans-serif;background:#0e0e0e;color:#fff;padding:32px;border-radius:16px;max-width:600px">
        <h1 style="color:#e6ff00;font-family:Manrope,sans-serif">Nova Proposta Recebida</h1>
        <p>Olá <strong>${artistName}</strong>,</p>
        <p><strong>${clientName}</strong> enviou uma proposta de booking para <strong>${eventDate}</strong>.</p>
        <p>Valor total estimado: <strong>R$ ${totalAmount.toFixed(2)}</strong></p>
        <a href="${env.FRONTEND_URL}/booking-details.html"
           style="display:inline-block;background:#e6ff00;color:#5a6500;padding:12px 24px;border-radius:8px;font-weight:bold;text-decoration:none;margin-top:16px">
          Ver Proposta
        </a>
      </div>
    `,
  }),

  proposalAccepted: (clientName: string, artistName: string, eventDate: string) => ({
    subject: 'Proposta Aceita! – Pulso Musical',
    html: `
      <div style="font-family:Inter,sans-serif;background:#0e0e0e;color:#fff;padding:32px;border-radius:16px;max-width:600px">
        <h1 style="color:#e6ff00;font-family:Manrope,sans-serif">Proposta Aceita!</h1>
        <p>Olá <strong>${clientName}</strong>,</p>
        <p><strong>${artistName}</strong> aceitou sua proposta para <strong>${eventDate}</strong>.</p>
        <a href="${env.FRONTEND_URL}/booking-details.html"
           style="display:inline-block;background:#e6ff00;color:#5a6500;padding:12px 24px;border-radius:8px;font-weight:bold;text-decoration:none;margin-top:16px">
          Ver Detalhes
        </a>
      </div>
    `,
  }),

  proposalRejected: (clientName: string, artistName: string) => ({
    subject: 'Proposta Recusada – Pulso Musical',
    html: `
      <div style="font-family:Inter,sans-serif;background:#0e0e0e;color:#fff;padding:32px;border-radius:16px;max-width:600px">
        <h1 style="color:#ff7351;font-family:Manrope,sans-serif">Proposta Recusada</h1>
        <p>Olá <strong>${clientName}</strong>,</p>
        <p><strong>${artistName}</strong> não pôde aceitar sua proposta no momento.</p>
        <a href="${env.FRONTEND_URL}/index.html"
           style="display:inline-block;background:#e6ff00;color:#5a6500;padding:12px 24px;border-radius:8px;font-weight:bold;text-decoration:none;margin-top:16px">
          Explorar Outros Artistas
        </a>
      </div>
    `,
  }),

  counterProposal: (clientName: string, artistName: string, newAmount: number) => ({
    subject: 'Contra-proposta Recebida – Pulso Musical',
    html: `
      <div style="font-family:Inter,sans-serif;background:#0e0e0e;color:#fff;padding:32px;border-radius:16px;max-width:600px">
        <h1 style="color:#e6ff00;font-family:Manrope,sans-serif">Contra-proposta Recebida</h1>
        <p>Olá <strong>${clientName}</strong>,</p>
        <p><strong>${artistName}</strong> enviou uma contra-proposta no valor de <strong>R$ ${newAmount.toFixed(2)}</strong>.</p>
        <a href="${env.FRONTEND_URL}/booking-details.html"
           style="display:inline-block;background:#e6ff00;color:#5a6500;padding:12px 24px;border-radius:8px;font-weight:bold;text-decoration:none;margin-top:16px">
          Revisar Contra-proposta
        </a>
      </div>
    `,
  }),
};
