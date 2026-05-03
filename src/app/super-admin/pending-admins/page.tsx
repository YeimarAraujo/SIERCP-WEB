'use client';

import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { UserCheck } from 'lucide-react';

export default function SuperAdminPendingAdminsPage() {
    const columns = [
        { key: 'name', label: 'Nombre' },
        { key: 'institution', label: 'Institución' },
        { key: 'email', label: 'Email' },
        { key: 'requestDate', label: 'Fecha solicitud' },
        {
            key: 'actions', label: 'Acciones',
            render: () => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{
                        background: 'var(--success-bg)', color: 'var(--success-text)',
                        border: 'none', borderRadius: 'var(--radius-md)',
                        padding: '6px 12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                    }}>
                        Aprobar
                    </button>
                    <button style={{
                        background: 'var(--danger-bg)', color: 'var(--danger-text)',
                        border: 'none', borderRadius: 'var(--radius-md)',
                        padding: '6px 12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                    }}>
                        Rechazar
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Administradores pendientes"
                subtitle="Aprueba o rechaza solicitudes de administradores"
            />
            <DataTable
                columns={columns}
                data={[]}
                emptyMessage="No hay administradores pendientes de aprobación"
            />
        </div>
    );
}
