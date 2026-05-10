'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { UserCheck, UserX } from 'lucide-react';
import { UserService } from '@/services/firestore.service';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { ROLE_ADMIN } from '@/shared/lib/constants';
import type { UserModel } from '@/models/user';

export default function SuperAdminPendingAdminsPage() {
    const [admins, setAdmins] = useState<UserModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        UserService.getAll()
            .then(users => users.filter(u => u.role === ROLE_ADMIN && u.status === 'PENDING'))
            .then(setAdmins)
            .finally(() => setLoading(false));
    }, []);

    const handleApprove = async (uid: string) => {
        await updateDoc(doc(db, 'users', uid), { status: 'ACTIVE', updatedAt: serverTimestamp() });
        setAdmins(prev => prev.filter(a => a.uid !== uid));
    };

    const handleReject = async (uid: string) => {
        await updateDoc(doc(db, 'users', uid), { status: 'REJECTED', updatedAt: serverTimestamp() });
        setAdmins(prev => prev.filter(a => a.uid !== uid));
    };

    const columns = [
        {
            key: 'name', label: 'Nombre',
            render: (_: any, row: UserModel) => `${row.firstName} ${row.lastName}`,
        },
        { key: 'institutionId', label: 'Institución' },
        { key: 'email', label: 'Email' },
        {
            key: 'createdAt', label: 'Fecha solicitud',
            render: (val: any) => val ? new Date(val).toLocaleDateString() : '—',
        },
        {
            key: 'actions', label: 'Acciones',
            render: (_: any, row: UserModel) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleApprove(row.uid)} style={{
                        background: '#DCFCE7', color: '#166534',
                        border: 'none', borderRadius: 8,
                        padding: '6px 12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        <UserCheck size={14} /> Aprobar
                    </button>
                    <button onClick={() => handleReject(row.uid)} style={{
                        background: '#FEE2E2', color: '#991B1B',
                        border: 'none', borderRadius: 8,
                        padding: '6px 12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        <UserX size={14} /> Rechazar
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Administradores pendientes"
                subtitle={`Aprueba o rechaza solicitudes de administradores (${admins.length} pendientes)`}
            />
            <DataTable
                columns={columns}
                data={admins}
                loading={loading}
                emptyMessage="No hay administradores pendientes de aprobación"
            />
        </div>
    );
}
