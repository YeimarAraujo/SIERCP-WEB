import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase-admin';
import { ToastProvider } from '@/components/layout/toast-provider';
import { SuperAdminLayoutClient } from './layout-client';

// Never cache — SA pages always require a fresh auth check.
export const dynamic = 'force-dynamic';

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
        redirect('/login?callbackUrl=/super-admin/dashboard');
    }

    let decoded: Awaited<ReturnType<typeof adminAuth.verifySessionCookie>>;
    try {
        decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    } catch {
        redirect('/login?callbackUrl=/super-admin/dashboard');
    }

    if (decoded['isSuperAdmin'] !== true) {
        redirect('/home');
    }

    return (
        <>
            <SuperAdminLayoutClient>{children}</SuperAdminLayoutClient>
            <ToastProvider />
        </>
    );
}
