/**
 * NotificationService — transactional email delivery via Resend.
 *
 * All methods are fire-and-forget safe: errors are caught and logged
 * but never thrown, so a failed email never breaks a payment flow.
 *
 * Requires: RESEND_API_KEY and RESEND_FROM_EMAIL in environment variables.
 * El correo de recuperar contraseña lo envía Firebase Auth, no este servicio.
 */

import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM_EMAIL ?? 'SIERCP <no-reply@siercp.com>';
const BRAND = 'SIERCP — Plataforma de Entrenamiento RCP';

type EmailMessage = { to: string; subject: string; html: string };

/**
 * Único punto de envío. Resend devuelve los fallos en `error` sin lanzarlos,
 * y el cliente no se puede construir sin clave: ambos casos quedan en el log.
 */
async function deliver(context: string, message: EmailMessage): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error(`[NotificationService] ${context}: falta RESEND_API_KEY, correo no enviado`);
    return false;
  }
  if (!message.to) {
    console.error(`[NotificationService] ${context}: destinatario vacío`);
    return false;
  }
  try {
    const { error } = await new Resend(apiKey).emails.send({ from: FROM, ...message });
    if (error) {
      console.error(`[NotificationService] ${context} failed:`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[NotificationService] ${context} failed:`, err);
    return false;
  }
}

function esc(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCOP(amountCents: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amountCents / 100);
}

function loginLink(): string {
  const configured = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/+$/, '');
  const base = /^https?:\/\//.test(configured) && !configured.includes('play.google.com')
    ? configured
    : 'https://siercp.com';
  return `${base}/login`;
}

function planEmailHtml(opts: {
  title: string;
  intro: string;
  nombre: string;
  planName: string;
  amountCents: number;
  reference: string;
  expiresAt?: Date;
  steps?: string[];
  itemLabel?: string;
}): string {
  const steps = opts.steps?.length
    ? `<ol style="margin:16px 0;padding-left:20px;color:#334155;font-size:14px;line-height:1.9;">${opts.steps.map((step) => `<li>${esc(step)}</li>`).join('')}</ol>`
    : '';
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 0;color:#6b7280;">${label}</td><td style="padding:6px 0;text-align:right;font-weight:600;">${esc(value)}</td></tr>`;

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1e40af,#0ea5e9);padding:32px 24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">${esc(opts.title)}</h1>
      <p style="color:#bfdbfe;margin:8px 0 0;">${BRAND}</p>
    </div>
    <div style="padding:32px 24px;">
      <p style="font-size:16px;color:#1e293b;">Hola <strong>${esc(opts.nombre)}</strong>,</p>
      <p style="color:#475569;line-height:1.7;">${esc(opts.intro)}</p>
      <div style="background:#f8fafc;border-radius:8px;padding:16px 20px;margin:16px 0;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          ${row(opts.itemLabel ?? 'Plan', opts.planName)}
          ${row('Valor pagado', formatCOP(opts.amountCents))}
          ${opts.expiresAt ? row('Vigente hasta', opts.expiresAt.toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })) : ''}
          ${row('Referencia', opts.reference)}
        </table>
      </div>
      ${steps}
      <div style="text-align:center;margin:28px 0;">
        <a href="${loginLink()}" style="background:#1e40af;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;display:inline-block;">
          Entrar a SIERCP →
        </a>
      </div>
      <p style="color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;padding-top:16px;">
        Guarda este correo como comprobante de pago.<br>
        <strong>Equipo SIERCP</strong>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ── Email templates ────────────────────────────────────────────────────────

function enrollmentHtml(opts: {
  nombre: string;
  courseTitle: string;
  tempPassword?: string;
  loginUrl: string;
}): string {
  const { loginUrl } = opts;
  const nombre = esc(opts.nombre);
  const courseTitle = esc(opts.courseTitle);
  const tempPassword = opts.tempPassword ? esc(opts.tempPassword) : '';
  const credentialSection = tempPassword
    ? `
      <div style="background:#f0f9ff;border:1px solid #0ea5e9;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 8px;font-weight:600;color:#0369a1;">🔑 Acceso a tu nueva cuenta</p>
        <p style="margin:0 0 4px;">Contraseña temporal: <strong style="font-family:monospace;font-size:16px;">${tempPassword}</strong></p>
        <p style="margin:0;color:#64748b;font-size:13px;">Cambia tu contraseña al iniciar sesión por primera vez.</p>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1e40af,#0ea5e9);padding:32px 24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">¡Inscripción confirmada!</h1>
      <p style="color:#bfdbfe;margin:8px 0 0;">${BRAND}</p>
    </div>
    <div style="padding:32px 24px;">
      <p style="font-size:16px;color:#1e293b;">Hola <strong>${nombre}</strong>,</p>
      <p style="color:#475569;">Tu inscripción al curso <strong>${courseTitle}</strong> ha sido confirmada exitosamente.</p>
      ${credentialSection}
      <div style="text-align:center;margin:28px 0;">
        <a href="${loginUrl}" style="background:#1e40af;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;display:inline-block;">
          Acceder a mi curso →
        </a>
      </div>
      <p style="color:#64748b;font-size:14px;border-top:1px solid #e2e8f0;padding-top:16px;margin-top:24px;">
        Si tienes preguntas, responde este correo o visita nuestro soporte.<br>
        <strong>Equipo SIERCP</strong>
      </p>
    </div>
  </div>
</body>
</html>`;
}

function paymentReceiptHtml(opts: {
  nombre: string;
  courseTitle: string;
  amountCOP: number;
  reference: string;
  loginUrl: string;
}): string {
  const { amountCOP, loginUrl } = opts;
  const nombre = esc(opts.nombre);
  const courseTitle = esc(opts.courseTitle);
  const reference = esc(opts.reference);
  const formattedAmount = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amountCOP);

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#065f46,#10b981);padding:32px 24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">✓ Pago recibido</h1>
      <p style="color:#a7f3d0;margin:8px 0 0;">${BRAND}</p>
    </div>
    <div style="padding:32px 24px;">
      <p style="font-size:16px;color:#1e293b;">Hola <strong>${nombre}</strong>,</p>
      <div style="background:#f0fdf4;border-radius:8px;padding:20px;margin:16px 0;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:6px 0;color:#6b7280;">Curso</td><td style="padding:6px 0;text-align:right;font-weight:600;">${courseTitle}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Monto</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#065f46;">${formattedAmount}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Referencia</td><td style="padding:6px 0;text-align:right;font-family:monospace;font-size:12px;">${reference}</td></tr>
        </table>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="${loginUrl}" style="background:#065f46;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;display:inline-block;">
          Acceder a mi curso →
        </a>
      </div>
      <p style="color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;padding-top:16px;">
        Guarda este correo como comprobante de pago.<br>
        <strong>Equipo SIERCP</strong>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ── Public API ─────────────────────────────────────────────────────────────

export const NotificationService = {
  /**
   * Sends enrollment confirmation.
   * If `tempPassword` is provided, includes account credentials in the email.
   */
  async sendEnrollmentConfirmation(
    toEmail: string,
    nombre: string,
    courseTitle: string,
    tempPassword?: string,
  ): Promise<void> {
    await deliver('sendEnrollmentConfirmation', {
      to: toEmail,
      subject: `✓ Inscripción confirmada: ${courseTitle}`,
      html: enrollmentHtml({ nombre, courseTitle, tempPassword, loginUrl: loginLink() }),
    });
  },

  /**
   * Sends payment receipt after a successful Wompi webhook.
   */
  async sendPaymentReceipt(opts: {
    toEmail: string;
    nombre: string;
    courseTitle: string;
    amountCents: number;
    reference: string;
  }): Promise<void> {
    await deliver('sendPaymentReceipt', {
      to: opts.toEmail,
      subject: `✓ Pago confirmado: ${opts.courseTitle}`,
      html: paymentReceiptHtml({
        nombre: opts.nombre,
        courseTitle: opts.courseTitle,
        amountCOP: opts.amountCents / 100,
        reference: opts.reference,
        loginUrl: loginLink(),
      }),
    });
  },

  /**
   * Bienvenida tras la primera compra: la cuenta ya existe y es administradora.
   */
  async sendInstitutionWelcome(opts: {
    toEmail: string;
    nombre: string;
    institutionName: string;
    planName: string;
    amountCents: number;
    reference: string;
    expiresAt: Date;
  }): Promise<void> {
    await deliver('sendInstitutionWelcome', {
      to: opts.toEmail,
      subject: `Tu institución ${opts.institutionName} ya está activa en SIERCP`,
      html: planEmailHtml({
        title: '¡Pago confirmado!',
        intro: `Tu institución ${opts.institutionName} quedó activa y tu cuenta ya es la de administrador.`,
        nombre: opts.nombre,
        planName: opts.planName,
        amountCents: opts.amountCents,
        reference: opts.reference,
        expiresAt: opts.expiresAt,
        steps: [
          'Entra con el correo y la contraseña que creaste al comprar',
          'Revisa los datos de tu institución',
          'Invita a tus instructores y estudiantes',
        ],
      }),
    });
  },

  /** Comprobante de la renovación de un plan existente. */
  async sendPlanReceipt(opts: {
    toEmail: string;
    nombre: string;
    planName: string;
    amountCents: number;
    reference: string;
    expiresAt: Date;
  }): Promise<void> {
    await deliver('sendPlanReceipt', {
      to: opts.toEmail,
      subject: `✓ Pago confirmado: plan ${opts.planName}`,
      html: planEmailHtml({
        title: '✓ Plan renovado',
        intro: 'Recibimos tu pago y tu plan sigue activo.',
        nombre: opts.nombre,
        planName: opts.planName,
        amountCents: opts.amountCents,
        reference: opts.reference,
        expiresAt: opts.expiresAt,
      }),
    });
  },

  /** Comprobante de maniquíes, licencia SST y packs. */
  async sendProductReceipt(opts: {
    toEmail: string;
    nombre: string;
    productName: string;
    amountCents: number;
    reference: string;
    expiresAt?: Date;
    note: string;
  }): Promise<void> {
    await deliver('sendProductReceipt', {
      to: opts.toEmail,
      subject: `✓ Pago confirmado: ${opts.productName}`,
      html: planEmailHtml({
        title: '✓ Pago confirmado',
        intro: `Recibimos tu pago. ${opts.note}`,
        nombre: opts.nombre,
        planName: opts.productName,
        itemLabel: 'Producto',
        amountCents: opts.amountCents,
        reference: opts.reference,
        expiresAt: opts.expiresAt,
      }),
    });
  },

  /**
   * Sends welcome email for admin-created accounts.
   */
  async sendWelcomeEmail(opts: {
    toEmail: string;
    nombre: string;
    tempPassword: string;
  }): Promise<void> {
    await deliver('sendWelcomeEmail', {
      to: opts.toEmail,
      subject: 'Bienvenido a SIERCP — Tus credenciales de acceso',
      html: `<!DOCTYPE html>
<html lang="es">
<body style="font-family:system-ui,sans-serif;background:#f8fafc;padding:20px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <h2 style="color:#1e40af;">${BRAND}</h2>
    <p>Hola <strong>${esc(opts.nombre)}</strong>, se ha creado tu cuenta en la plataforma.</p>
    <div style="background:#f0f9ff;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 8px;"><strong>Email:</strong> ${esc(opts.toEmail)}</p>
      <p style="margin:0;"><strong>Contraseña temporal:</strong>
        <code style="background:#e0f2fe;padding:2px 8px;border-radius:4px;">${esc(opts.tempPassword)}</code>
      </p>
    </div>
    <a href="${loginLink()}" style="background:#1e40af;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;display:inline-block;font-weight:600;">
      Iniciar sesión →
    </a>
    <p style="color:#64748b;font-size:13px;margin-top:24px;">Cambia tu contraseña al entrar por primera vez.</p>
  </div>
</body>
</html>`,
    });
  },
};
