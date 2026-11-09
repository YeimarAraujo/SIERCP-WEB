'use client';

import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, getDoc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { useAuthStore } from '@/features/auth/store/auth-store';

interface Invitation {
    id: string;
    institutionName: string;
}

/**
 * Invitaciones de instituciones a quien ya tenía cuenta. Hasta que acepte, la
 * institución no ve sus datos (Ley 1581).
 */
export function InvitationsBanner() {
    const uid = useAuthStore((s) => s.user?.uid);
    const [items, setItems] = useState<Invitation[]>([]);

    useEffect(() => {
        if (!uid) return;
        const q = query(collection(db, 'memberships'), where('userId', '==', uid), where('status', '==', 'invited'));
        return onSnapshot(q, async (snap) => {
            const list = await Promise.all(snap.docs.map(async (d) => {
                const institution = await getDoc(doc(db, 'institutions', String(d.data().institutionId ?? ''))).catch(() => null);
                return { id: d.id, institutionName: (institution?.data()?.name as string | undefined) ?? 'Una institución' };
            }));
            setItems(list);
        }, () => setItems([]));
    }, [uid]);

    if (items.length === 0) return null;

    const answer = async (id: string, accept: boolean) => {
        const ref = doc(db, 'memberships', id);
        if (accept) {
            await updateDoc(ref, { status: 'approved', isActive: true, acceptedAt: serverTimestamp() });
            window.location.reload();
        } else {
            await deleteDoc(ref);
        }
    };

    return (
        <div style={{ display: 'grid', gap: 8, margin: '12px 16px' }}>
            {items.map((item) => (
                <div key={item.id} role="status" style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: 'var(--popover)' }}>
                    <strong>{item.institutionName} te invitó a unirte.</strong>{' '}
                    Si aceptas, la institución y sus instructores verán tu progreso y tus sesiones.
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                        <button type="button" onClick={() => answer(item.id, false)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--foreground)' }}>
                            Rechazar
                        </button>
                        <button type="button" onClick={() => answer(item.id, true)} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--clr-primary, #1d4ed8)', color: '#fff', fontWeight: 700 }}>
                            Aceptar
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
