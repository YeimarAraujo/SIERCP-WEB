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
        const role = snap.data()?.role as string | undefined;
        if (role !== 'SUPER_ADMIN') return null;
        return decoded;
    } catch {
        return null;
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const caller = await requireSuperAdmin();
    if (!caller) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    try {
        const body = await request.json() as Record<string, unknown>;
        // Strip fields the client must not overwrite
        const { createdAt: _c, createdBy: _cb, id: _id, ...safe } = body;

        await adminDb.collection('institutions').doc(id).update({
            ...safe,
            updatedAt: new Date(),
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[institutions PATCH]', err);
        return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const caller = await requireSuperAdmin();
    if (!caller) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    try {
        await adminDb.collection('institutions').doc(id).delete();
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[institutions DELETE]', err);
        return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
    }
}
