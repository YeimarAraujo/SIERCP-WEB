'use client';

import type { FormEvent } from 'react';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type Status = 'idle' | 'sending' | 'sent' | 'error';

function RecuperarContent() {
    const searchParams = useSearchParams();
    const [email, setEmail] = useState(searchParams.get('email') ?? '');
    const [status, setStatus] = useState<Status>('idle');
    const [message, setMessage] = useState('');

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setStatus('sending');
        setMessage('');
        try {
            const { auth } = await import('@/lib/firebase');
            if (!auth) throw new Error('not-configured');
            const { sendPasswordResetEmail } = await import('firebase/auth');
            auth.languageCode = 'es';
            await sendPasswordResetEmail(auth, email.trim().toLowerCase(), {
                url: `${window.location.origin}/login`,
            });
            setStatus('sent');
        } catch (err) {
            const code = (err as { code?: string })?.code ?? '';
            // Un correo no registrado se trata como éxito para no revelar qué cuentas existen.
            if (code === 'auth/user-not-found') {
                setStatus('sent');
                return;
            }
            setStatus('error');
            if (code === 'auth/invalid-email') {
                setMessage('Ese correo no es válido. Revísalo e inténtalo de nuevo.');
            } else if (code === 'auth/too-many-requests') {
                setMessage('Hiciste demasiados intentos. Espera unos minutos.');
            } else if (code === 'auth/network-request-failed') {
                setMessage('No hay conexión. Revisa tu internet e inténtalo de nuevo.');
            } else {
                setMessage('No pudimos enviar el correo. Inténtalo de nuevo en unos minutos.');
            }
        }
    }

    if (status === 'sent') {
        return (
            <div className="w-full text-center">
                <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 12, color: 'var(--clr-text-head)' }}>Revisa tu correo</h1>
                <p style={{ color: 'var(--clr-muted)', fontSize: '1rem', lineHeight: 1.6 }}>
                    Si <strong>{email}</strong> tiene una cuenta, te enviamos un enlace para crear una contraseña nueva.
                    Puede tardar unos minutos. Revisa también la carpeta de spam.
                </p>
                <div className="pt-4">
                    <Link href="/login" className="btn-brand w-100" style={{ padding: 16, borderRadius: 16, justifyContent: 'center', textDecoration: 'none' }}>
                        Volver a iniciar sesión
                    </Link>
                </div>
                <button
                    type="button"
                    onClick={() => setStatus('idle')}
                    style={{ marginTop: 16, color: 'var(--clr-primary)', fontWeight: 700, background: 'none', border: 'none', padding: 0 }}
                >
                    Usar otro correo
                </button>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="text-center mb-8">
                <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 12, color: 'var(--clr-text-head)' }}>Recupera tu contraseña</h1>
                <p style={{ color: 'var(--clr-muted)', fontSize: '1rem' }}>Escribe el correo de tu cuenta y te enviaremos un enlace.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {status === 'error' && (
                    <div role="alert" className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        {message}
                    </div>
                )}

                <div>
                    <label htmlFor="email" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--clr-text)', marginBottom: 8, display: 'block' }}>
                        Correo electrónico
                    </label>
                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@correo.com"
                        required
                        style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--clr-border)', background: 'var(--clr-bg)', color: 'var(--clr-text)', fontSize: '0.95rem' }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="btn-brand w-100"
                    style={{ padding: 16, borderRadius: 16, fontSize: '1.05rem', justifyContent: 'center' }}
                >
                    {status === 'sending' ? 'Enviando…' : 'Enviar enlace'}
                </button>

                <p className="text-center" style={{ fontSize: '0.95rem', color: 'var(--clr-muted)' }}>
                    ¿La recordaste?{' '}
                    <Link href="/login" style={{ color: 'var(--clr-primary)', fontWeight: 800 }}>Inicia sesión</Link>
                </p>
            </form>
        </div>
    );
}

export default function RecuperarPage() {
    return (
        <Suspense fallback={<div className="w-full text-center py-8">Cargando...</div>}>
            <RecuperarContent />
        </Suspense>
    );
}
