'use client';

import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminInstructorsPage() {
    const router = useRouter();

    const columns = [
        { key: 'displayName', label: 'Nombre' },
        { key: 'email', label: 'Correo electrónico' },
        { key: 'coursesCount', label: 'Cursos activos' },
        { key: 'studentsCount', label: 'Estudiantes' },
        {
            key: 'status', label: 'Estado',
            render: (val: unknown) => (
                <span style={{
                    background: val === 'ACTIVE'
                        ? 'var(--success-bg)' : 'var(--warning-bg)',
                    color: val === 'ACTIVE'
                        ? 'var(--success-text)' : 'var(--warning-text)',
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
            key: 'actions', label: 'Acciones',
            render: (_: unknown, row: Record<string, unknown>) => (
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

    return (
        <div>
            <PageHeader
                title="Instructores"
                subtitle="Gestiona los instructores de tu institución"
                actions={
                    <button
                        className="btn-primary"
                        onClick={() => router.push('/admin/instructors/new')}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <UserPlus size={16} />
                        Nuevo instructor
                    </button>
                }
            />
            <DataTable
                columns={columns}
                data={[]}
                emptyMessage="No hay instructores registrados en tu institución"
            />
        </div>
    );
}
