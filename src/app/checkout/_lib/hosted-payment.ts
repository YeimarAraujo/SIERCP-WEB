import { createUserWithEmailAndPassword, signInWithEmailAndPassword, type User } from 'firebase/auth';
import { auth } from '@/shared/lib/firebase';

/** Devuelve la cuenta del comprador. Un reintento reutiliza la ya creada. */
export async function resolveCheckoutBuyer(opts: {
  mode: string;
  email: string;
  password: string;
}): Promise<User> {
  if (opts.mode === 'existing') {
    if (!auth.currentUser) throw new Error('Tu sesión expiró. Vuelve a verificar tu cuenta.');
    return auth.currentUser;
  }

  const email = opts.email.trim().toLowerCase();
  if (!email || opts.password.length < 6) throw new Error('Correo o contraseña inválidos.');

  try {
    return (await createUserWithEmailAndPassword(auth, email, opts.password)).user;
  } catch (err) {
    if ((err as { code?: string })?.code !== 'auth/email-already-in-use') throw err;
    try {
      return (await signInWithEmailAndPassword(auth, email, opts.password)).user;
    } catch {
      throw new Error('Este correo ya tiene cuenta. Elige "Ya tengo cuenta" para continuar.');
    }
  }
}

/** Crea la compra en el servidor y lleva al cliente a la página segura de Wompi. */
export async function redirectToWompi(path: string, buyer: User, body: unknown): Promise<void> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await buyer.getIdToken()}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.redirectUrl) {
    throw new Error(data.error || 'No se pudo iniciar el pago. Intenta de nuevo.');
  }
  window.location.href = data.redirectUrl;
}

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
}
