'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { RESPONSE_BUSINESS_DAYS, type PrivacyRequestType } from '@/lib/privacy';
import { PrivacyClient } from '@/shared/lib/privacy-client';
import { ConsentGate } from '@/components/privacy/consent-gate';

const REQUESTS: Record<PrivacyRequestType, string> = {
    access: 'Consultar qué datos tienen sobre mí',
    rectification: 'Corregir o actualizar mis datos',
    revocation: 'Revocar mi autorización',
    deletion: 'Eliminar mi cuenta y mis datos',
    complaint: 'Presentar un reclamo',
};

/** Derechos del titular (Ley 1581 de 2012, art. 8). */
export default function MyPrivacyPage() {
    const { user, initialized } = useAuth();
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [type, setType] = useState<PrivacyRequestType>('access');
    const [message, setMessage] = useState('');

    const run = async (action: () => Promise<string | void>) => {
        setBusy(true);
        setNotice(null);
        try {
            const result = await action();
            if (result) setNotice(result);
        } catch (e) {
            setNotice(e instanceof Error ? e.message : 'Algo salió mal.');
        }
        setBusy(false);
    };

    if (!initialized) return null;
    if (!user) {
        return (
            <main style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
                <p>Inicia sesión para gestionar tus datos. <Link href="/login">Iniciar sesión</Link></p>
            </main>
        );
    }

    const card = { border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 16 } as const;
    const button = { padding: '10px 16px', borderRadius: 10, border: 'none', background: 'var(--clr-primary, #1d4ed8)', color: '#fff', fontWeight: 700 } as const;

    return (
        <main style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
            <ConsentGate />
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 16 }}>Mi privacidad</h1>
            {notice && <p role="status" style={{ ...card, background: 'var(--muted)' }}>{notice}</p>}

            <section style={card}>
                <h2 style={{ fontSize: 17, fontWeight: 700 }}>Autorización</h2>
                <p style={{ fontSize: 14 }}>
                    {user.privacy?.policyVersion ? `Aceptaste la política del ${user.privacy.policyVersion}.` : 'No hay autorización registrada.'}{' '}
                    <Link href="/privacidad" style={{ textDecoration: 'underline' }}>Leer la política</Link>
                </p>
                <label style={{ display: 'flex', gap: 10, fontSize: 14, marginTop: 8 }}>
                    <input
                        type="checkbox"
                        disabled={busy}
                        checked={user.privacy?.marketing === true}
                        onChange={(e) => run(async () => { await PrivacyClient.setMarketing(e.target.checked); })}
                    />
                    Recibir novedades y ofertas de cursos (opcional).
                </label>
            </section>

            <section style={card}>
                <h2 style={{ fontSize: 17, fontWeight: 700 }}>Mis datos</h2>
                <p style={{ fontSize: 14 }}>Descarga tu perfil, sesiones, autorizaciones y certificados en un archivo.</p>
                <button type="button" style={button} disabled={busy} onClick={() => run(async () => { await PrivacyClient.download(); })}>
                    Descargar mis datos
                </button>
            </section>

            <section style={card}>
                <h2 style={{ fontSize: 17, fontWeight: 700 }}>Solicitudes</h2>
                <p style={{ fontSize: 14 }}>
                    Consultas: respuesta en {RESPONSE_BUSINESS_DAYS.access} días hábiles. Reclamos, correcciones y eliminación:
                    {' '}{RESPONSE_BUSINESS_DAYS.complaint} días hábiles. Te responderemos a {user.email}.
                </p>
                <select value={type} onChange={(e) => setType(e.target.value as PrivacyRequestType)} style={{ width: '100%', padding: 10, borderRadius: 10, marginTop: 8 }}>
                    {Object.entries(REQUESTS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <textarea
                    value={message}
                    maxLength={2000}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Cuéntanos qué necesitas"
                    rows={4}
                    style={{ width: '100%', padding: 10, borderRadius: 10, marginTop: 8 }}
                />
                <button
                    type="button"
                    style={{ ...button, marginTop: 8 }}
                    disabled={busy || message.trim().length < 10}
                    onClick={() => run(async () => {
                        const due = await PrivacyClient.request(type, message.trim());
                        setMessage('');
                        return `Solicitud enviada. Te responderemos a más tardar el ${due.toLocaleDateString('es-CO')}.`;
                    })}
                >
                    Enviar solicitud
                </button>
            </section>
        </main>
    );
}
