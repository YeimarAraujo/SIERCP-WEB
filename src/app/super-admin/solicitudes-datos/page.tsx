'use client';

import { useEffect, useState } from 'react';
import { collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, type Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/shared/lib/firebase';
import { useAuthStore } from '@/stores/auth-store';
import toast from 'react-hot-toast';

interface PrivacyRequest {
    id: string;
    userId: string;
    email: string;
    type: string;
    message: string;
    status: 'open' | 'resolved';
    createdAt?: Timestamp;
    dueAt?: Timestamp;
    response?: string;
}

const TYPES: Record<string, string> = {
    access: 'Consulta',
    rectification: 'Corrección',
    revocation: 'Revocación',
    deletion: 'Eliminación',
    complaint: 'Reclamo',
};

const day = (t?: Timestamp) => (t ? t.toDate().toLocaleDateString('es-CO') : '—');

/**
 * Bandeja de consultas y reclamos de datos (Ley 1581, arts. 14 y 15). Las
 * solicitudes vencidas se resaltan: responder a tiempo es obligación legal.
 */
export default function PrivacyRequestsPage() {
    const user = useAuthStore((s) => s.user);
    const [items, setItems] = useState<PrivacyRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(query(collection(db, 'privacy_requests'), orderBy('dueAt', 'asc')));
            setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PrivacyRequest, 'id'>) })));
        } catch {
            toast.error('No se pudieron cargar las solicitudes.');
        }
        setLoading(false);
    };

    useEffect(() => { void load(); }, []);

    const resolve = async (item: PrivacyRequest) => {
        const response = window.prompt('Resumen de la respuesta enviada al titular por correo:');
        if (!response?.trim()) return;
        await updateDoc(doc(db, 'privacy_requests', item.id), {
            status: 'resolved',
            response: response.trim(),
            resolvedAt: serverTimestamp(),
            resolvedBy: user?.uid ?? null,
        });
        toast.success('Solicitud marcada como respondida.');
        await load();
    };

    const erase = async (item: PrivacyRequest) => {
        const typed = window.prompt(`Esto borra el acceso de ${item.email} y anonimiza sus datos. No se puede deshacer. Escribe ELIMINAR para confirmar:`);
        if (typed !== 'ELIMINAR') return;
        const token = await getAuth().currentUser?.getIdToken();
        const res = await fetch('/api/super-admin/privacy/erase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ requestId: item.id, confirm: typed }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            toast.error(data.error ?? 'No se pudo eliminar.');
            return;
        }
        toast.success('Cuenta eliminada. Avisa al titular por correo.');
        await load();
    };

    const now = Date.now();
    const open = items.filter((i) => i.status === 'open');
    const done = items.filter((i) => i.status !== 'open');

    return (
        <main style={{ padding: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>Solicitudes de datos personales</h1>
            <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 16 }}>
                Consultas: 10 días hábiles. Reclamos, correcciones, revocaciones y eliminaciones: 15 días hábiles.
                Responde por correo al titular y registra aquí el resumen.
            </p>
            {loading ? <p>Cargando…</p> : (
                <>
                    <h2 style={{ fontSize: 17, fontWeight: 700 }}>Pendientes ({open.length})</h2>
                    {open.length === 0 && <p style={{ fontSize: 14 }}>No hay solicitudes pendientes.</p>}
                    {open.map((item) => {
                        const overdue = (item.dueAt?.toMillis() ?? Infinity) < now;
                        return (
                            <article key={item.id} style={{ border: `1px solid ${overdue ? '#EF4444' : 'var(--border)'}`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
                                <strong>{TYPES[item.type] ?? item.type}</strong> · {item.email} · recibida {day(item.createdAt)} ·{' '}
                                <span style={{ color: overdue ? '#EF4444' : undefined, fontWeight: 700 }}>
                                    {overdue ? 'VENCIDA' : 'vence'} {day(item.dueAt)}
                                </span>
                                <p style={{ whiteSpace: 'pre-wrap', margin: '8px 0' }}>{item.message}</p>
                                <button type="button" onClick={() => resolve(item)} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--clr-primary, #1d4ed8)', color: '#fff', fontWeight: 700 }}>
                                    Marcar como respondida
                                </button>
                                {item.type === 'deletion' && (
                                    <button type="button" onClick={() => erase(item)} style={{ marginLeft: 8, padding: '8px 14px', borderRadius: 8, border: 'none', background: '#EF4444', color: '#fff', fontWeight: 700 }}>
                                        Eliminar cuenta y datos
                                    </button>
                                )}
                            </article>
                        );
                    })}
                    <h2 style={{ fontSize: 17, fontWeight: 700, marginTop: 24 }}>Respondidas ({done.length})</h2>
                    {done.map((item) => (
                        <p key={item.id} style={{ fontSize: 14 }}>
                            {TYPES[item.type] ?? item.type} · {item.email} · {day(item.createdAt)} — {item.response}
                        </p>
                    ))}
                </>
            )}
        </main>
    );
}
