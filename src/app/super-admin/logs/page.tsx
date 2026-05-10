'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { SessionService } from '@/services/firestore.service';
import { formatDate } from '@/lib/utils';

export default function SuperAdminLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        SessionService.getAllRecent(100)
            .then(sessions => sessions.map(s => ({
                date: formatDate(s.startedAt),
                user: s.studentName || '—',
                institution: s.courseTitle || '—',
                action: (s.metrics?.qualityScore || 0) >= 85 ? 'Certificación' : 'Práctica',
                detail: `${s.scenarioTitle || 'Escenario'} — ${s.metrics?.qualityScore || 0}% calidad`,
            })))
            .then(setLogs)
            .finally(() => setLoading(false));
    }, []);

    const columns = [
        { key: 'date', label: 'Fecha' },
        { key: 'user', label: 'Usuario' },
        { key: 'institution', label: 'Institución' },
        { key: 'action', label: 'Acción' },
        { key: 'detail', label: 'Detalle' },
    ];

    return (
        <div>
            <PageHeader
                title="Logs de actividad"
                subtitle={`Registro de las últimas actividades del sistema (${logs.length} eventos)`}
            />

            <div className="card-padded" style={{ marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '180px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Institución
                    </label>
                    <select className="input-field">
                        <option value="">Todas las instituciones</option>
                    </select>
                </div>
                <div style={{ flex: '1', minWidth: '180px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Tipo de acción
                    </label>
                    <select className="input-field">
                        <option value="">Todas las acciones</option>
                        <option>Creación</option>
                        <option>Modificación</option>
                        <option>Eliminación</option>
                        <option>Login</option>
                    </select>
                </div>
                <div style={{ flex: '1', minWidth: '180px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Fecha
                    </label>
                    <select className="input-field">
                        <option>Hoy</option>
                        <option>Última semana</option>
                        <option>Último mes</option>
                    </select>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={logs}
                loading={loading}
                emptyMessage="No hay actividad registrada"
            />
        </div>
    );
}
