import { useMemo } from 'react';

const COMMON_PASSWORDS = new Set([
  'password', 'password1', '123456', '12345678', 'qwerty', 'abc123',
  'letmein', 'monkey', 'master', 'dragon', '111111', 'baseball',
  'iloveyou', 'trustno1', 'sunshine', 'princess', 'welcome', 'shadow',
  'superman', 'michael', 'football', 'ninja', 'mustang', 'passw0rd',
  'password123', 'contraseña', 'colombia', 'colombia1', 'bogota',
  'medellin', 'siercp', 'siercp123', '12345', '1234567890', 'admin',
  'admin123', 'user1234', 'qwerty123', 'abc12345',
]);

export interface PasswordRequirement {
  label: string;
  met: boolean;
}

export interface PasswordStrengthResult {
  score: number; // 0 = vacío, 1–4 = débil…fuerte
  label: string;
  color: string;
  barColor: string; // mismo que color, para claridad semántica
  requirements: PasswordRequirement[];
  valid: boolean;
}

/**
 * Evalúa la fortaleza de una contraseña en tiempo real.
 * Opcionalmente recibe email y nombre para detectar si la contraseña los contiene.
 */
export function usePasswordStrength(
  password: string,
  context?: { email?: string; name?: string },
): PasswordStrengthResult {
  return useMemo(() => {
    const pwd = password.toLowerCase();
    const emailPrefix = (context?.email ?? '').split('@')[0].toLowerCase().trim();
    const namePart = (context?.name ?? '').toLowerCase().replace(/\s+/g, '').trim();

    const containsContext =
      (emailPrefix.length >= 3 && pwd.includes(emailPrefix)) ||
      (namePart.length >= 3 && pwd.includes(namePart));

    const requirements: PasswordRequirement[] = [
      { label: 'Mínimo 8 caracteres',          met: password.length >= 8 },
      { label: 'Al menos una mayúscula',         met: /[A-Z]/.test(password) },
      { label: 'Al menos una minúscula',         met: /[a-z]/.test(password) },
      { label: 'Al menos un número',             met: /[0-9]/.test(password) },
      { label: 'Al menos un símbolo (!@#$…)',    met: /[^A-Za-z0-9]/.test(password) },
      { label: 'No contiene tu correo o nombre', met: password.length === 0 || !containsContext },
      { label: 'No es una contraseña común',     met: password.length === 0 || !COMMON_PASSWORDS.has(pwd) },
    ];

    const metCount = requirements.filter(r => r.met).length;
    const allMet = requirements.every(r => r.met);

    let score = 0;
    if (password.length > 0) {
      if (metCount <= 2) score = 1;
      else if (metCount <= 4) score = 2;
      else if (metCount <= 6) score = 3;
      else score = 4;
    }

    const LABELS = ['', 'Muy débil', 'Regular', 'Buena', 'Fuerte'];
    const COLORS = ['#E2E8F0', '#DC2626', '#F97316', '#3B82F6', '#16A34A'];

    return {
      score,
      label: LABELS[score],
      color: COLORS[score],
      barColor: COLORS[score],
      requirements,
      valid: allMet,
    };
  }, [password, context?.email, context?.name]);
}
