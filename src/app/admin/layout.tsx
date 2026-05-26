import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { AdminShell } from '@/components/layout/admin-shell';

// Nunca cachear — las páginas de admin siempre requieren verificación fresca.
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
        redirect('/login?callbackUrl=/admin/dashboard');
    }

    // Verificar cookie de sesión con revocación. checkRevoked:true garantiza que
    // sesiones revocadas (logout en otro dispositivo) sean rechazadas de inmediato.
    let decoded: Awaited<ReturnType<typeof adminAuth.verifySessionCookie>>;
    try {
        decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    } catch {
        redirect('/login?callbackUrl=/admin/dashboard');
    }

    // SuperAdmin tiene acceso total — bypassa la verificación de membership.
    if (decoded['isSuperAdmin'] === true) {
        return <AdminShell>{children}</AdminShell>;
    }

    // Para ADMIN: verificar en Firestore que el rol es ADMIN o SUPER_ADMIN.
    // No confiar solo en el custom claim de Auth, que puede estar desactualizado
    // hasta el próximo refresh de token (1 hora).
    const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
    const role = userSnap.data()?.role as string | undefined;

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        redirect('/home');
    }

    // Verificar que la cuenta está activa (no suspendida/eliminada).
    if (userSnap.data()?.isActive === false) {
        redirect('/login?error=account_disabled');
    }

    return <AdminShell>{children}</AdminShell>;
}
