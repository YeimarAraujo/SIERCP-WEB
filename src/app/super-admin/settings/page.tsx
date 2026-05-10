'use client';

import { PageHeader } from '@/components/ui/page-header';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function SuperAdminSettingsPage() {
    const [aha, setAha] = useState({ minScore: '80', certScore: '85' });
    const [maintenance, setMaintenance] = useState(false);

    return (
        <div>
            <PageHeader
                title="Configuración global"
                subtitle="Parámetros globales del sistema SIERCP"
            />

            {/* AHA Parameters */}
            <div className="card-padded" style={{ marginBottom: '24px' }}>
                <h3 style={{
                    fontSize: '16px', fontWeight: '600',
                    color: 'var(--text-primary)', margin: '0 0 16px',
                }}>
                    Parámetros AHA globales
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Score mínimo para aprobar (default)
                        </label>
                        <input className="input-field" type="number" min="0" max="100"
                            value={aha.minScore}
                            onChange={(e) => setAha({ ...aha, minScore: e.target.value })} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Criterio certificado (default)
                        </label>
                        <input className="input-field" type="number" min="0" max="100"
                            value={aha.certScore}
                            onChange={(e) => setAha({ ...aha, certScore: e.target.value })} />
                    </div>
                </div>
                <div className="divider" />
                <button className="btn-primary" style={{ alignSelf: 'flex-end' }} onClick={() => toast.success('Parámetros AHA guardados')}>
                    Guardar
                </button>
            </div>

            {/* Global Notifications */}
            <div className="card-padded" style={{ marginBottom: '24px' }}>
                <h3 style={{
                    fontSize: '16px', fontWeight: '600',
                    color: 'var(--text-primary)', margin: '0 0 16px',
                }}>
                    Notificaciones globales
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <label style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer',
                    }}>
                        <input type="checkbox" defaultChecked
                            style={{ width: '18px', height: '18px', accentColor: 'var(--brand)' }} />
                        Notificar a super admin cuando se crea una nueva institución
                    </label>
                    <label style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer',
                    }}>
                        <input type="checkbox" defaultChecked
                            style={{ width: '18px', height: '18px', accentColor: 'var(--brand)' }} />
                        Notificar cuando un admin está pendiente de aprobación
                    </label>
                </div>
                <div className="divider" />
                <button className="btn-primary" style={{ alignSelf: 'flex-end' }} onClick={() => toast.success('Notificaciones guardadas')}>
                    Guardar
                </button>
            </div>

            {/* Maintenance */}
            <div className="card-padded">
                <h3 style={{
                    fontSize: '16px', fontWeight: '600',
                    color: 'var(--text-primary)', margin: '0 0 16px',
                }}>
                    Mantenimiento del sistema
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <label style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer',
                    }}>
                        <input type="checkbox" checked={maintenance}
                            onChange={(e) => setMaintenance(e.target.checked)}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--brand)' }} />
                        Modo mantenimiento (solo super admin puede acceder)
                    </label>
                </div>
                <div className="divider" />
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button className="btn-ghost" onClick={() => toast.success('Caché limpiada correctamente')}>
                        Limpiar caché
                    </button>
                    <button className="btn-secondary" onClick={() => toast.success('Reindexación iniciada')}>
                        Reindexar datos
                    </button>
                    <button className="btn-danger" onClick={() => {
                        if (window.confirm('¿Estás seguro de que deseas restablecer el sistema? Esta acción no se puede deshacer.')) {
                            toast.success('Sistema restablecido');
                        }
                    }}>
                        Restablecer sistema
                    </button>
                </div>
            </div>
        </div>
    );
}
