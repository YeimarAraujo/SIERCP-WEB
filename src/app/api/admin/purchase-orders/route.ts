import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { sanitize } from '@/lib/utils';
import admin from 'firebase-admin';

async function verifyAdmin(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) throw new Error('No autorizado');

    const token = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const userSnap = await adminDb.collection('users').doc(decoded.uid).get();

    if (!userSnap.exists) throw new Error('Usuario no encontrado');
    const user = userSnap.data()!;
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) throw new Error('Acceso denegado');

    return { uid: decoded.uid, user, institutionId: user.institutionId };
}

function generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PO-${timestamp}-${random}`;
}

export async function GET(req: NextRequest) {
    try {
        const { institutionId } = await verifyAdmin(req);
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const userId = searchParams.get('userId');

        let q: FirebaseFirestore.Query = adminDb
            .collection('purchase_orders')
            .where('institutionId', '==', institutionId)
            .orderBy('createdAt', 'desc');

        if (status) {
            q = adminDb
                .collection('purchase_orders')
                .where('institutionId', '==', institutionId)
                .where('status', '==', status)
                .orderBy('createdAt', 'desc');
        }

        const snaps = await q.get();

        const orders = snaps.docs.map((doc) => {
            const d = doc.data();
            return {
                id: doc.id,
                ...d,
                createdAt: d.createdAt?.toDate?.()?.toISOString() ?? null,
                updatedAt: d.updatedAt?.toDate?.()?.toISOString() ?? null,
                completedAt: d.completedAt?.toDate?.()?.toISOString() ?? null,
            };
        });

        return NextResponse.json({ orders });
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error interno';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { institutionId } = await verifyAdmin(req);
        const body = await req.json();

        const userId = sanitize(body.userId);
        const userEmail = sanitize(body.userEmail) || '';
        const userName = sanitize(body.userName) || '';
        const items = body.items || [];

        if (!userId || !items.length) {
            return NextResponse.json({ error: 'userId e items son requeridos' }, { status: 400 });
        }

        const subtotalCents = items.reduce((sum: number, item: any) => {
            return sum + (Number(item.priceCents) || 0) * (Number(item.quantity) || 1);
        }, 0);

        const taxCents = Math.round(subtotalCents * 0.19);
        const discountCents = Number(body.discountCents) || 0;
        const totalCents = subtotalCents + taxCents - discountCents;

        const orderData = {
            orderNumber: generateOrderNumber(),
            userId,
            userEmail,
            userName,
            institutionId,
            institutionName: body.institutionName || '',
            items: items.map((item: any, idx: number) => ({
                id: `item-${idx + 1}`,
                type: item.type || 'OTHER',
                itemId: sanitize(item.itemId) || '',
                itemName: sanitize(item.itemName) || '',
                itemDescription: sanitize(item.itemDescription) || '',
                priceCents: Number(item.priceCents) || 0,
                quantity: Number(item.quantity) || 1,
                metadata: item.metadata || {},
            })),
            subtotalCents,
            taxCents,
            discountCents,
            totalCents,
            currency: 'COP',
            status: 'PENDING',
            paymentMethod: body.paymentMethod || null,
            paymentReference: sanitize(body.paymentReference) || null,
            notes: sanitize(body.notes) || '',
            metadata: body.metadata || {},
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            completedAt: null,
        };

        const ref = adminDb.collection('purchase_orders').doc();
        await ref.set(orderData);

        return NextResponse.json({
            success: true,
            orderId: ref.id,
            orderNumber: orderData.orderNumber,
            message: 'Orden de compra creada exitosamente',
        });
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error interno';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { institutionId } = await verifyAdmin(req);
        const body = await req.json();

        const orderId = sanitize(body.id);
        if (!orderId) {
            return NextResponse.json({ error: 'ID de orden requerido' }, { status: 400 });
        }

        const orderSnap = await adminDb.collection('purchase_orders').doc(orderId).get();
        if (!orderSnap.exists) {
            return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
        }
        if (orderSnap.data()?.institutionId !== institutionId) {
            return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });
        }

        const updateData: Record<string, any> = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (body.status) {
            updateData.status = body.status;
            if (body.status === 'COMPLETED') {
                updateData.completedAt = admin.firestore.FieldValue.serverTimestamp();
            }
        }
        if (body.paymentMethod) updateData.paymentMethod = body.paymentMethod;
        if (body.paymentReference) updateData.paymentReference = body.paymentReference;
        if (body.notes !== undefined) updateData.notes = body.notes;

        await adminDb.collection('purchase_orders').doc(orderId).update(updateData);

        return NextResponse.json({ success: true, message: 'Orden actualizada exitosamente' });
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error interno';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}