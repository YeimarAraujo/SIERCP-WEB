import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

async function requireSuperAdmin() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    if (!sessionCookie) return null;
    try {
        const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
        const snap = await adminDb.collection('users').doc(decoded.uid).get();
        if (snap.data()?.role !== 'SUPER_ADMIN') return null;
        return decoded;
    } catch {
        return null;
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ uid: string }> },
) {
    const caller = await requireSuperAdmin();
    if (!caller) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { uid } = await params;
    if (!uid) return NextResponse.json({ error: 'UID requerido' }, { status: 400 });

    try {
        const { action, reason } = await request.json() as { action: 'approve' | 'reject'; reason?: string };

        const userRef = adminDb.collection('users').doc(uid);
        const snap = await userRef.get();
        if (!snap.exists) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

        if (action === 'approve') {
            await userRef.update({
                status: 'ACTIVE',
                certVerification: 'approved',
                role: 'INSTRUCTOR',
                updatedAt: new Date(),
            });
        } else if (action === 'reject') {
            await userRef.update({
                status: 'REJECTED',
                certVerification: 'rejected',
                ...(reason ? { rejectionReason: reason } : {}),
                updatedAt: new Date(),
            });
        } else {
            return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[instructors PATCH]', err);
        return NextResponse.json({ error: 'Error al procesar' }, { status: 500 });
    }
}
