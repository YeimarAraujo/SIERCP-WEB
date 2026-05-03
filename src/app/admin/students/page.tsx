'use client';

import { useRouter } from 'next/navigation';
import { useInstitutionData } from '@/hooks/use-institution-data';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Upload, UserPlus, RefreshCw } from 'lucide-react';

export default function AdminStudentsPage() {
    const router = useRouter();
    const { students, loading, error, refetch } = useInstitutionData();

    const studentRows = students.map((s) => ({
        id: s.uid,
        displayName: `${s.firstName} ${s.lastName}`.trim(),
        email: s.email,
        status: s.status,
        createdAt: s.createdAt,
        identificacion: s.identificacion,
    }));

    const columns = [
        {
            key: 'displayName',
            label: 'Nombre',
            render: (_: unknown, row: any) => (
                <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {row.displayName || '—'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {row.identificacion ?? ''}
                    </div>
                </div>
            ),
        },
        { key: 'email', label: 'Correo electrónico' },
        {
            key: 'status',
            label: 'Estado',
            render: (val: unknown) => (
                <span style={{
                    background: val === 'ACTIVE' ? 'var(--success-bg)' : 'var(--warning-bg)',
                    color: val === 'ACTIVE' ? 'var(--success-text)' : 'var(--warning-text)',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '12px',
                    fontWeight: '600',
                }}>
                    {val === 'ACTIVE' ? 'Activo' : 'Pendiente'}
                </span>
            ),
        },
        {
            key: 'createdAt',
            label: 'Registro',
            render: (val: unknown) => {
                if (!val) return '—';
                const date = val instanceof Date ? val : new Date(val as string);
                return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
            },
        },
        {
            key: 'actions',
            label: 'Acciones',
            render: (_: unknown, row: any) => (
                <button
                    onClick={() => router.push(`/admin/students/${row.id}`)}
                    style={{
                        background: 'var(--brand-light)',
                        color: 'var(--brand)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        padding: '6px 12px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                    }}
                >
                    Ver detalle
                </button>
            ),
        },
    ];

    if (error) {
        return (
            <div>
                <PageHeader title="Estudiantes" />
                <div style={{
                    background: 'var(--danger-bg)',
                    border: '1px solid var(--danger-text)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px 20px',
                    color: 'var(--danger-text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <span>{error}</span>
                    <button onClick={refetch} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', color: 'var(--danger-text)', cursor: 'pointer', fontWeight: 600 }}>
                        <RefreshCw size={14} /> Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title={`Estudiantes ${!loading ? `(${students.length})` : ''}`}
                subtitle="Gestiona los estudiantes de tu institución"
                actions={
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => router.push('/admin/students/import')}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <Upload size={16} /> Importar CSV
                        </button>
                        <button
                            onClick={() => router.push('/admin/students/new')}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <UserPlus size={16} /> Nuevo estudiante
                        </button>
                    </div>
                }
            />
            <DataTable
                columns={columns}
                data={studentRows}
                loading={loading}
                emptyMessage="No hay estudiantes registrados en tu institución"
            />
        </div>
    );
}