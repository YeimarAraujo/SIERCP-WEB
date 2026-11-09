'use client';

import { useState } from 'react';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { ADULT_AGE, ageOn, PRIVACY_POLICY_VERSION } from '@/lib/privacy';
import { PrivacyClient } from '@/shared/lib/privacy-client';

/**
 * Autorización de tratamiento de datos (Ley 1581 de 2012). Bloquea el panel a
 * quien no tiene constancia de la política vigente: cuentas nuevas, creadas por
 * una institución o importadas, y todos cuando la política cambia.
 */
export function ConsentGate() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const [birthDate, setBirthDate] = useState('');
    const [authorizes, setAuthorizes] = useState(false);
    const [marketing, setMarketing] = useState(false);
    const [guardian, setGuardian] = useState({ name: '', documentType: 'CC', document: '', relationship: 'Madre', email: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!user || user.privacy?.policyVersion === PRIVACY_POLICY_VERSION) return null;

    const date = birthDate || user.birthDate || '';
    const age = date ? ageOn(date, new Date()) : null;
    const isMinor = age !== null && age < ADULT_AGE;

    const submit = async () => {
        if (age === null) return setError('Indica una fecha de nacimiento válida.');
        if (!authorizes) return setError('Debes autorizar el tratamiento de datos para usar SICAP.');
        setSaving(true);
        setError(null);
        try {
            await PrivacyClient.recordConsent({ birthDate: date, marketing, guardian: isMinor ? guardian : undefined });
            // El documento del usuario se actualiza en el servidor y el aviso se cierra solo.
        } catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo guardar.');
        }
        setSaving(false);
    };

    const field = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' } as const;

    return (
        <div role="dialog" aria-modal="true" aria-labelledby="consent-title" style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,.6)', display: 'grid', placeItems: 'center', padding: 16 }}>
            <div style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', background: 'var(--popover)', color: 'var(--foreground)', borderRadius: 16, padding: 24 }}>
                <h2 id="consent-title" style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Tratamiento de datos personales</h2>
                <p style={{ fontSize: 14, marginBottom: 8 }}>
                    Antes de continuar necesitamos tu autorización, como exige la Ley 1581 de 2012. Usamos tus datos de
                    identificación, contacto y práctica de RCP para tu formación, tus certificados, el seguimiento de tu
                    instructor y las obligaciones legales. Puedes consultar, corregir o eliminar tus datos y revocar esta
                    autorización desde <a href="/mi-privacidad" style={{ textDecoration: 'underline' }}>Mi privacidad</a>.
                </p>
                <a href="/privacidad" target="_blank" rel="noreferrer" style={{ fontSize: 14, fontWeight: 700, textDecoration: 'underline' }}>Leer la política completa</a>

                <label style={{ display: 'block', marginTop: 16, fontSize: 13, fontWeight: 700 }}>
                    Fecha de nacimiento
                    <input type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setBirthDate(e.target.value)} style={{ ...field, marginTop: 4 }} />
                </label>

                {isMinor && (
                    <fieldset style={{ marginTop: 16, display: 'grid', gap: 8 }}>
                        <legend style={{ fontSize: 14, fontWeight: 700 }}>Eres menor de edad: autoriza tu representante legal</legend>
                        <input placeholder="Nombre completo del representante" value={guardian.name} onChange={(e) => setGuardian({ ...guardian, name: e.target.value })} style={field} />
                        <div style={{ display: 'flex', gap: 8 }}>
                            <select value={guardian.documentType} onChange={(e) => setGuardian({ ...guardian, documentType: e.target.value })} style={{ ...field, width: 90 }}>
                                <option>CC</option><option>CE</option><option>PA</option>
                            </select>
                            <input placeholder="Documento" value={guardian.document} onChange={(e) => setGuardian({ ...guardian, document: e.target.value })} style={field} />
                        </div>
                        <select value={guardian.relationship} onChange={(e) => setGuardian({ ...guardian, relationship: e.target.value })} style={field}>
                            <option>Madre</option><option>Padre</option><option>Tutor legal</option>
                        </select>
                        <input type="email" placeholder="Correo del representante" value={guardian.email} onChange={(e) => setGuardian({ ...guardian, email: e.target.value })} style={field} />
                    </fieldset>
                )}

                <label style={{ display: 'flex', gap: 10, marginTop: 16, fontSize: 14 }}>
                    <input type="checkbox" checked={authorizes} onChange={(e) => setAuthorizes(e.target.checked)} />
                    <span>
                        {isMinor
                            ? 'Como representante legal, autorizo el tratamiento de los datos del menor según la política.'
                            : 'Autorizo el tratamiento de mis datos personales según la política.'}
                        <small style={{ display: 'block', opacity: 0.7 }}>Obligatorio para usar SICAP.</small>
                    </span>
                </label>
                <label style={{ display: 'flex', gap: 10, marginTop: 10, fontSize: 14 }}>
                    <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
                    <span>
                        Acepto recibir novedades y ofertas de cursos.
                        <small style={{ display: 'block', opacity: 0.7 }}>Opcional. Puedes cambiarlo cuando quieras.</small>
                    </span>
                </label>

                {error && <p role="alert" style={{ color: '#EF4444', fontSize: 14, marginTop: 12 }}>{error}</p>}

                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                    <button type="button" onClick={submit} disabled={saving} style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: 'none', background: 'var(--clr-primary, #1d4ed8)', color: '#fff', fontWeight: 700 }}>
                        {saving ? 'Guardando…' : 'Aceptar y continuar'}
                    </button>
                    <button type="button" onClick={() => logout()} style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--foreground)' }}>
                        Salir
                    </button>
                </div>
            </div>
        </div>
    );
}
