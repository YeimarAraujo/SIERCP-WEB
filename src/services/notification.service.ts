/**
 * NotificationService — transactional email delivery via Resend.
 *
 * All methods are fire-and-forget safe: errors are caught and logged
 * but never thrown, so a failed email never breaks a payment flow.
 *
 * Requires: RESEND_API_KEY and RESEND_FROM_EMAIL in environment variables.
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM_EMAIL ?? 'SIERCP <no-reply@siercp.com>';
const BRAND = 'SIERCP — Plataforma de Entrenamiento RCP';

// ── Email templates ────────────────────────────────────────────────────────

function enrollmentHtml(opts: {
  nombre: string;
  courseTitle: string;
  tempPassword?: string;
  loginUrl: string;
}): string {
  const { nombre, courseTitle, tempPassword, loginUrl } = opts;
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
  const { nombre, courseTitle, amountCOP, reference, loginUrl } = opts;
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
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://siercp.com'}/login`;
    try {
      await resend.emails.send({
        from: FROM,
        to: toEmail,
        subject: `✓ Inscripción confirmada: ${courseTitle}`,
        html: enrollmentHtml({ nombre, courseTitle, tempPassword, loginUrl }),
      });
    } catch (err) {
      console.error('[NotificationService] sendEnrollmentConfirmation failed:', err);
    }
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
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://siercp.com'}/login`;
    try {
      await resend.emails.send({
        from: FROM,
        to: opts.toEmail,
        subject: `✓ Pago confirmado: ${opts.courseTitle}`,
        html: paymentReceiptHtml({
          nombre: opts.nombre,
          courseTitle: opts.courseTitle,
          amountCOP: opts.amountCents / 100,
          reference: opts.reference,
          loginUrl,
        }),
      });
    } catch (err) {
      console.error('[NotificationService] sendPaymentReceipt failed:', err);
    }
  },

  /**
   * Sends institution welcome email after successful first-time plan purchase.
   * Includes a link to complete account setup (register as ADMIN).
   */
  async sendInstitutionWelcome(opts: {
    toEmail: string;
    nombre: string;
    institutionName: string;
    planType: string;
    registerUrl: string;
    adminPhone: string;
  }): Promise<void> {
    const { toEmail, nombre, institutionName, planType, registerUrl } = opts;
    const planLabel = ({
      pyme: 'PYME', business: 'Business', corporate: 'Corporativo',
      enterprise: 'Enterprise', sstSinLicencia: 'SST sin Licencia', sstConLicencia: 'SST con Licencia',
    } as Record<string, string>)[planType] ?? planType;

    try {
      await resend.emails.send({
        from: FROM,
        to: toEmail,
        subject: `🎉 ¡Tu institución en SIERCP está lista! — Completa tu registro`,
        html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1e40af,#6d28d9);padding:32px 24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">🎉 ¡Pago confirmado!</h1>
      <p style="color:#c4b5fd;margin:8px 0 0;">${BRAND}</p>
    </div>
    <div style="padding:32px 24px;">
      <p style="font-size:16px;color:#1e293b;">Hola <strong>${nombre}</strong>,</p>
      <p style="color:#475569;line-height:1.7;">
        Tu institución <strong>${institutionName}</strong> ha sido activada exitosamente con el
        <strong>Plan ${planLabel}</strong>. Ahora necesitas crear tu cuenta de administrador para acceder.
      </p>
      <div style="background:#f0f9ff;border:1px solid #0ea5e9;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 8px;font-weight:600;color:#0369a1;">Próximos pasos</p>
        <ol style="margin:0;padding-left:20px;color:#0c4a6e;font-size:14px;line-height:2;">
          <li>Haz clic en el botón de abajo para crear tu cuenta</li>
          <li>Completa tu perfil de administrador</li>
          <li>Invita instructores y estudiantes a tu institución</li>
        </ol>
      </div>
      <div style="text-align:center;margin:28px 0;">
        <a href="${registerUrl}" style="background:#1e40af;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;display:inline-block;font-size:15px;">
          Crear mi cuenta de administrador →
        </a>
      </div>
      <p style="color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;padding-top:16px;margin-top:24px;">
        Si el botón no funciona, copia este enlace en tu navegador:<br>
        <code style="font-size:11px;word-break:break-all;color:#1e40af;">${registerUrl}</code><br><br>
        <strong>Equipo SIERCP</strong>
      </p>
    </div>
  </div>
</body>
</html>`,
      });
    } catch (err) {
      console.error('[NotificationService] sendInstitutionWelcome failed:', err);
    }
  },

  /**
   * Sends welcome email for admin-created accounts.
   */
  async sendWelcomeEmail(opts: {
    toEmail: string;
    nombre: string;
    tempPassword: string;
  }): Promise<void> {
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://siercp.com'}/login`;
    try {
      await resend.emails.send({
        from: FROM,
        to: opts.toEmail,
        subject: `Bienvenido a SIERCP — Tus credenciales de acceso`,
        html: `<!DOCTYPE html>
<html lang="es">
<body style="font-family:system-ui,sans-serif;background:#f8fafc;padding:20px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <h2 style="color:#1e40af;">${BRAND}</h2>
    <p>Hola <strong>${opts.nombre}</strong>, se ha creado tu cuenta en la plataforma.</p>
    <div style="background:#f0f9ff;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 8px;"><strong>Email:</strong> ${opts.toEmail}</p>
      <p style="margin:0;"><strong>Contraseña temporal:</strong>
        <code style="background:#e0f2fe;padding:2px 8px;border-radius:4px;">${opts.tempPassword}</code>
      </p>
    </div>
    <a href="${loginUrl}" style="background:#1e40af;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;display:inline-block;font-weight:600;">
      Iniciar sesión →
    </a>
    <p style="color:#64748b;font-size:13px;margin-top:24px;">Cambia tu contraseña al entrar por primera vez.</p>
  </div>
</body>
</html>`,
      });
    } catch (err) {
      console.error('[NotificationService] sendWelcomeEmail failed:', err);
    }
  },
};
