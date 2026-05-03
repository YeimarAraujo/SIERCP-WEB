'use client';

import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { FileText } from 'lucide-react';

export default function StudentReportsPage() {
    const columns = [
        { key: 'date', label: 'Fecha' },
        { key: 'sessionName', label: 'Sesión' },
        { key: 'courseName', label: 'Curso' },
        { key: 'score', label: 'Score' },
        {
            key: 'aha', label: 'AHA',
            render: (val: unknown) => (
                <span style={{
                    background: Number(val) >= 80 ? 'var(--aha-good-bg)' : Number(val) >= 60 ? 'var(--aha-warn-bg)' : 'var(--aha-danger-bg)',
                    color: Number(val) >= 80 ? 'var(--aha-good)' : Number(val) >= 60 ? 'var(--aha-warn)' : 'var(--aha-danger)',
                    padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: '600',
                }}>
                    {String(val)}%
                </span>
            ),
        },
        {
            key: 'actions', label: 'Acciones',
            render: () => (
                <button style={{
                    background: 'var(--brand-light)', color: 'var(--brand)',
                    border: 'none', borderRadius: 'var(--radius-md)',
                    padding: '6px 12px', fontSize: '13px', fontWeight: '600',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                    <FileText size={14} />
                    Descargar PDF
                </button>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Mis reportes"
                subtitle="Tus reportes de sesiones de entrenamiento"
            />

            <div className="card-padded" style={{ marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '180px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Curso
                    </label>
                    <select className="input-field">
                        <option value="">Todos los cursos</option>
                    </select>
                </div>
                <div style={{ flex: '1', minWidth: '180px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Período
                    </label>
                    <select className="input-field">
                        <option>Última semana</option>
                        <option>Último mes</option>
                        <option>Último año</option>
                    </select>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={[]}
                emptyMessage="No tienes reportes aún. Completa sesiones de entrenamiento para generar reportes."
            />
        </div>
    );
}
