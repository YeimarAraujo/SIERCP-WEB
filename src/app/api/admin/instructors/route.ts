import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

// ── Auth helper ───────────────────────────────────────────────────────────────

async function verifyAdmin(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        throw new Error('No autorizado');
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const userSnap = await adminDb.collection('users').doc(decoded.uid).get();

    if (!userSnap.exists) throw new Error('Usuario no encontrado');

    const user = userSnap.data()!;
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new Error('Acceso denegado: se requiere rol ADMIN');
    }

    return { uid: decoded.uid, user, institutionId: user.institutionId as string };
}

// ── POST ──────────────────────────────────────────────────────────────────────
//
// action: 'link'   → vincula un usuario existente como INSTRUCTOR
// action: 'create' → crea un usuario nuevo (auth + user doc) y lo vincula
//
export async function POST(req: NextRequest) {
    try {
        const { uid: adminUid, user: adminUser, institutionId } = await verifyAdmin(req);

        if (!institutionId) {
            return NextResponse.json(
                { error: 'El admin no tiene institutionId configurado' },
                { status: 400 },
            );
        }

        const body = await req.json();
        const { action } = body;

        // ── Link existing user ─────────────────────────────────────────────
        if (action === 'link') {
            const { userId } = body;
            if (!userId) {
                return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
            }

            const membershipId = `${userId}_${institutionId}`;
            const membershipRef = adminDb.collection('memberships').doc(membershipId);
            const snap = await membershipRef.get();

            if (snap.exists) {
                // Re-activate existing membership
                await membershipRef.update({
                    role: 'INSTRUCTOR',
                    status: 'approved',
                    isActive: true,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            } else {
                // Create new membership
                await membershipRef.set({
                    userId,
                    institutionId,
                    role: 'INSTRUCTOR',
                    status: 'approved',
                    isActive: true,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }

            return NextResponse.json({ success: true, membershipId });
        }

        // ── Create new instructor ──────────────────────────────────────────
        if (action === 'create') {
            const { email, password, firstName, lastName, documentType, phone, specialty, identification } = body;

            if (!email || !password || !firstName || !lastName) {
                return NextResponse.json(
                    { error: 'email, password, firstName y lastName son requeridos' },
                    { status: 400 },
                );
            }

            // 1. Create auth user
            let authUser;
            try {
                authUser = await adminAuth.createUser({
                    email,
                    password,
                    displayName: `${firstName} ${lastName}`,
                });
            } catch (e: any) {
                if (e.code === 'auth/email-already-exists') {
                    return NextResponse.json(
                        { error: 'Este correo ya está registrado. Búscalo por número de cédula.' },
                        { status: 409 },
                    );
                }
                throw e;
            }

            const newUid = authUser.uid;

            // 2. Create user document
            await adminDb.collection('users').doc(newUid).set({
                uid: newUid,
                email,
                firstName,
                lastName,
                role: 'INSTRUCTOR',
                identification: identification?.trim() || '',
                documentType: documentType || null,
                phone: phone || '',
                specialty: specialty || 'Instructor',
                isActive: true,
                institutionId,
                status: 'approved',
                certVerification: 'NONE',
                coursesCreated: 0,
                stats: {
                    totalSessions: 0,
                    sessionsToday: 0,
                    averageScore: 0,
                    bestScore: 0,
                    streakDays: 0,
                    totalHours: 0,
                    averageDepthMm: 0,
                    averageRatePerMin: 0,
                },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // 3. Create membership
            const membershipId = `${newUid}_${institutionId}`;
            await adminDb.collection('memberships').doc(membershipId).set({
                userId: newUid,
                institutionId,
                role: 'INSTRUCTOR',
                status: 'approved',
                isActive: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            return NextResponse.json({ success: true, uid: newUid, membershipId });
        }

        return NextResponse.json({ error: `Acción desconocida: ${action}` }, { status: 400 });

    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error interno';
        const status = msg === 'No autorizado' || msg.includes('Acceso denegado') ? 403 : 500;
        return NextResponse.json({ error: msg }, { status });
    }
}
