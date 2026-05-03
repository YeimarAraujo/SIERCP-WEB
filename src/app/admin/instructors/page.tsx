'use client';

import { useRouter } from 'next/navigation';
import { useInstitutionData } from '@/hooks/use-institution-data';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { UserPlus, RefreshCw } from 'lucide-react';

export default function AdminInstructorsPage() {
    const router = useRouter();
    const { instructors, loading, error, refetch } = useInstitutionData();

    const instructorRows = instructors.map((i) => ({
        id: i.uid,
        displayName: `${i.firstName} ${i.lastName}`.trim(),
        email: i.email,
        status: i.status,
        createdAt: i.createdAt,
    }));

    const columns = [
        {
            key: 'displayName',
            label: 'Nombre',
            render: (_: unknown, row: any) => (
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {row.displayName || '—'}
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
                    onClick={() => router.push(`/admin/instructors/${row.id}`)}
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
                <PageHeader title="Instructores" />
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
                title={`Instructores ${!loading ? `(${instructors.length})` : ''}`}
                subtitle="Gestiona los instructores de tu institución"
                actions={
                    <button
                        onClick={() => router.push('/admin/instructors/new')}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <UserPlus size={16} /> Nuevo instructor
                    </button>
                }
            />
            <DataTable
                columns={columns}
                data={instructorRows}
                loading={loading}
                emptyMessage="No hay instructores registrados en tu institución"
            />
        </div>
    );
}