'use client';

import { PageHeader } from '@/components/ui/page-header';
import { useState } from 'react';
import { Settings } from 'lucide-react';

export default function AdminSettingsPage() {
    const [institution, setInstitution] = useState({
        name: '',
        nit: '',
        city: '',
        phone: '',
        email: '',
    });
    const [aha, setAha] = useState({ minScore: '80', certScore: '85' });
    const [notifications, setNotifications] = useState({
        notifyInstructorSession: true,
        notifyAdminCourse: true,
    });

    return (
        <div>
            <PageHeader
                title="Configuración"
                subtitle="Administra los parámetros de tu institución"
            />

            {/* Seccion 1 - Informacion */}
            <div className="card-padded" style={{ marginBottom: '24px' }}>
                <h3 style={{
                    fontSize: '16px', fontWeight: '600',
                    color: 'var(--text-primary)', margin: '0 0 16px',
                }}>
                    Información de la institución
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                Nombre
                            </label>
                            <input className="input-field" placeholder="Nombre de la institución"
                                value={institution.name}
                                onChange={(e) => setInstitution({ ...institution, name: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                NIT
                            </label>
                            <input className="input-field" placeholder="Número de identificación tributaria"
                                value={institution.nit}
                                onChange={(e) => setInstitution({ ...institution, nit: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                Ciudad
                            </label>
                            <input className="input-field" placeholder="Ciudad"
                                value={institution.city}
                                onChange={(e) => setInstitution({ ...institution, city: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                Teléfono
                            </label>
                            <input className="input-field" placeholder="Teléfono de contacto"
                                value={institution.phone}
                                onChange={(e) => setInstitution({ ...institution, phone: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Email
                        </label>
                        <input className="input-field" placeholder="Email institucional"
                            value={institution.email}
                            onChange={(e) => setInstitution({ ...institution, email: e.target.value })} />
                    </div>
                    <div className="divider" />
                    <button className="btn-primary" style={{ alignSelf: 'flex-end' }}>
                        Guardar cambios
                    </button>
                </div>
            </div>

            {/* Seccion 2 - Parametros AHA */}
            <div className="card-padded" style={{ marginBottom: '24px' }}>
                <h3 style={{
                    fontSize: '16px', fontWeight: '600',
                    color: 'var(--text-primary)', margin: '0 0 16px',
                }}>
                    Parámetros AHA
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Score mínimo para aprobar
                        </label>
                        <input className="input-field" type="number" min="0" max="100"
                            value={aha.minScore}
                            onChange={(e) => setAha({ ...aha, minScore: e.target.value })} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Score mínimo para certificado
                        </label>
                        <input className="input-field" type="number" min="0" max="100"
                            value={aha.certScore}
                            onChange={(e) => setAha({ ...aha, certScore: e.target.value })} />
                    </div>
                </div>
                <div className="divider" />
                <button className="btn-primary" style={{ alignSelf: 'flex-end' }}>
                    Guardar
                </button>
            </div>

            {/* Seccion 3 - Notificaciones */}
            <div className="card-padded">
                <h3 style={{
                    fontSize: '16px', fontWeight: '600',
                    color: 'var(--text-primary)', margin: '0 0 16px',
                }}>
                    Notificaciones
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <label style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer',
                    }}>
                        <input type="checkbox" checked={notifications.notifyInstructorSession}
                            onChange={(e) => setNotifications({ ...notifications, notifyInstructorSession: e.target.checked })}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--brand)' }} />
                        Notificar al instructor cuando alumno completa sesión
                    </label>
                    <label style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer',
                    }}>
                        <input type="checkbox" checked={notifications.notifyAdminCourse}
                            onChange={(e) => setNotifications({ ...notifications, notifyAdminCourse: e.target.checked })}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--brand)' }} />
                        Notificar al admin cuando se crea un curso
                    </label>
                    <div className="divider" />
                    <button className="btn-primary" style={{ alignSelf: 'flex-end' }}>
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
}
