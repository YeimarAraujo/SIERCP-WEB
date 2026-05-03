'use client';

import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';

export default function InstructorCertificatesPage() {
    const columns = [
        { key: 'student', label: 'Estudiante' },
        { key: 'course', label: 'Curso' },
        { key: 'score', label: 'Score' },
        {
            key: 'status', label: 'Estado',
            render: (val: unknown) => {
                const statuses: Record<string, { bg: string; text: string; label: string }> = {
                    'approved': { bg: 'var(--success-bg)', text: 'var(--success-text)', label: 'Aprobado' },
                    'pending': { bg: 'var(--warning-bg)', text: 'var(--warning-text)', label: 'Pendiente' },
                    'rejected': { bg: 'var(--danger-bg)', text: 'var(--danger-text)', label: 'Rechazado' },
                };
                const s = statuses[val as string] || { bg: 'var(--bg-surface-2)', text: 'var(--text-muted)', label: String(val) };
                return (
                    <span style={{ background: s.bg, color: s.text, padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: '600' }}>
                        {s.label}
                    </span>
                );
            },
        },
        { key: 'date', label: 'Fecha' },
        {
            key: 'actions', label: 'Acciones',
            render: (_: unknown, row: Record<string, unknown>) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    {row.status === 'approved' ? (
                        <button style={{
                            background: 'var(--brand-light)', color: 'var(--brand)',
                            border: 'none', borderRadius: 'var(--radius-md)',
                            padding: '6px 12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                        }}>
                            Ver PDF
                        </button>
                    ) : (
                        <button style={{
                            background: 'var(--brand)', color: 'var(--text-on-brand)',
                            border: 'none', borderRadius: 'var(--radius-md)',
                            padding: '6px 12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                        }}>
                            Generar certificado
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Certificados"
                subtitle="Genera y gestiona certificados de tus estudiantes"
            />
            <DataTable
                columns={columns}
                data={[]}
                emptyMessage="No hay certificados generados aún"
            />
        </div>
    );
}
