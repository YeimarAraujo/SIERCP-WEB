'use client';

import { useEffect, useState } from 'react';
import { PageHero } from '@/components/ui/page-hero';
import { DataTable } from '@/components/ui/data-table';
import { UserCheck, UserX } from 'lucide-react';
import {
    collection,
    getDocs,
    updateDoc,
    doc,
    serverTimestamp,
} from 'firebase/firestore';

import { db } from '@/shared/lib/firebase';
import { Header } from '@/components/layout/header';

interface Institution {
    id: string;
    name: string;
    contactEmail?: string;
    contactPhone?: string;
    plan?: string;
    status: string;
    createdAt?: any;
}

export default function SuperAdminPendingInstitutionsPage() {

    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInstitutions();
    }, []);


    const loadInstitutions = async () => {
        try {

            const snapshot = await getDocs(collection(db, 'institutions'));

            const data: Institution[] = snapshot.docs.map(docItem => ({
                id: docItem.id,
                ...docItem.data(),
            })) as Institution[];
            console.log(data);

            const pending = data.filter(
                institution => institution.status === 'pending'
            );

            setInstitutions(pending);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (institutionId: string) => {

        await updateDoc(
            doc(db, 'institutions', institutionId),
            {
                status: 'active',
                updatedAt: serverTimestamp(),
            }
        );

        setInstitutions(prev =>
            prev.filter(i => i.id !== institutionId)
        );
    };

    const handleReject = async (institutionId: string) => {

        await updateDoc(
            doc(db, 'institutions', institutionId),
            {
                status: 'rejected',
                updatedAt: serverTimestamp(),
            }
        );

        setInstitutions(prev =>
            prev.filter(i => i.id !== institutionId)
        );
    };

    const columns = [
        {
            key: 'name',
            label: 'Institución',
        },

        {
            key: 'contactEmail',
            label: 'Correo',
        },

        {
            key: 'contactPhone',
            label: 'Teléfono',
        },

        {
            key: 'plan',
            label: 'Plan',
        },

        {
            key: 'createdAt',
            label: 'Fecha solicitud',

            render: (val: any) =>
                val
                    ? new Date(
                        val.seconds
                            ? val.seconds * 1000
                            : val
                    ).toLocaleDateString()
                    : '—',
        },

        {
            key: 'actions',

            label: 'Acciones',

            render: (_: any, row: Institution) => (

                <div
                    style={{
                        display: 'flex',
                        gap: '8px',
                    }}
                >


                    <button
                        onClick={() => handleApprove(row.id)}
                        style={{
                            background: '#DCFCE7',
                            color: '#166534',
                            border: 'none',
                            borderRadius: 8,
                            padding: '6px 12px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <UserCheck size={14} />
                        Aprobar
                    </button>

                    <button
                        onClick={() => handleReject(row.id)}
                        style={{
                            background: '#FEE2E2',
                            color: '#991B1B',
                            border: 'none',
                            borderRadius: 8,
                            padding: '6px 12px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <UserX size={14} />
                        Rechazar
                    </button>

                </div>
            ),
        },
    ];

    return (
        <div
            style={{
                display: 'grid',
                gap: 22,
            }}
        >

            <Header />

            <PageHero
                title="Instituciones Pendientes"
                subtitle={`Aprueba o rechaza instituciones — ${institutions.length} pendientes`}
                parentTitle="Super Admin"
                parentHref="/super-admin/dashboard"
            />

            <div
                style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 24,
                    padding: 24,
                    boxShadow: 'var(--shadow-sm)',
                }}
            >

                <DataTable
                    columns={columns}
                    data={institutions}
                    loading={loading}
                    emptyMessage="No hay instituciones pendientes"
                />

            </div>

        </div>
    );
}