/**
 * Notifications Service
 * 
 * Handles transactional emails and system notifications.
 * In a real production environment, this would integrate with Resend, SendGrid, or AWS SES.
 */

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export const NotificationService = {
  /**
   * Send a general transactional email.
   */
  async sendEmail(params: EmailParams): Promise<boolean> {
    try {
      // TODO: Replace with actual email provider SDK (e.g. Resend.emails.send)
      console.log(`[NotificationService] Sending email to ${params.to} - Subject: ${params.subject}`);
      
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    } catch (error) {
      console.error('[NotificationService] Failed to send email:', error);
      return false;
    }
  },

  /**
   * Send enrollment confirmation to a student.
   */
  async sendEnrollmentConfirmation(
    email: string,
    studentName: string,
    courseTitle: string,
    tempPassword?: string
  ): Promise<boolean> {
    const loginUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://siercp.com/login';
    
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #1800AD;">¡Bienvenido a SIERCP, ${studentName}!</h2>
        <p>Tu inscripción al curso <strong>${courseTitle}</strong> ha sido confirmada exitosamente.</p>
    `;

    if (tempPassword) {
      html += `
        <div style="background-color: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin-top: 0;">Hemos creado una cuenta para ti. Aquí están tus credenciales de acceso:</p>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Usuario/Email:</strong> ${email}</li>
            <li><strong>Contraseña Temporal:</strong> <code>${tempPassword}</code></li>
          </ul>
          <p style="font-size: 12px; color: #666; margin-bottom: 0;">Te recomendamos cambiar tu contraseña al ingresar.</p>
        </div>
      `;
    }

    html += `
        <p>Puedes acceder a tu panel de estudiante aquí:</p>
        <a href="${loginUrl}" style="display: inline-block; background-color: #1800AD; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0;">
          Acceder a mis cursos
        </a>
        <p style="margin-top: 30px; font-size: 12px; color: #888;">
          Si tienes alguna pregunta, por favor contáctanos respondiendo a este correo.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Confirmación de inscripción: ${courseTitle}`,
      html,
    });
  }
};
