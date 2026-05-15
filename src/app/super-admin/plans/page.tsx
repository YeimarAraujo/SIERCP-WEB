'use client';

import { PageHeader } from '@/components/ui/page-header';
import { CreditCard, Users, Radio } from 'lucide-react';
import { useRouter } from 'next/navigation';

const plans = [
    {
        name: 'Básico',
        price: '—',
        devices: 5,
        students: 50,
        activeInstitutions: '—',
        icon: Users,
        color: 'var(--brand)',
    },
    {
        name: 'Pro',
        price: '—',
        devices: 20,
        students: 200,
        activeInstitutions: '—',
        icon: CreditCard,
        color: 'var(--brand-hover)',
    },
    {
        name: 'Enterprise',
        price: '—',
        devices: Infinity,
        students: Infinity,
        activeInstitutions: '—',
        icon: Radio,
        color: 'var(--brand-dark)',
    },
];

export default function SuperAdminPlansPage() {
    const router = useRouter();

    return (
        <div>
            <PageHeader
                title="Planes y licencias"
                subtitle="Gestiona los planes disponibles y asigna licencias"
            />

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '16px',
            }}>
                {plans.map((plan) => {
                    const Icon = plan.icon;
                    return (
                        <div key={plan.name} className="card-padded" style={{ textAlign: 'center' as const }}>
                            <div style={{
                                width: '56px', height: '56px',
                                borderRadius: 'var(--radius-lg)',
                                background: 'var(--brand-light)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 16px',
                            }}>
                                <Icon size={28} color={plan.color} />
                            </div>
                            <h3 style={{
                                fontSize: '20px', fontWeight: '700',
                                color: 'var(--text-primary)', margin: '0 0 4px',
                            }}>
                                {plan.name}
                            </h3>
                            <p style={{
                                fontSize: '28px', fontWeight: '700',
                                color: 'var(--brand)', margin: '0 0 16px',
                            }}>
                                {plan.price}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    fontSize: '14px', color: 'var(--text-secondary)',
                                    padding: '8px 0', borderBottom: '1px solid var(--border)',
                                }}>
                                    <span>Dispositivos</span>
                                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                        {plan.devices === Infinity ? 'Ilimitado' : plan.devices}
                                    </span>
                                </div>
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    fontSize: '14px', color: 'var(--text-secondary)',
                                    padding: '8px 0', borderBottom: '1px solid var(--border)',
                                }}>
                                    <span>Estudiantes</span>
                                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                        {plan.students === Infinity ? 'Ilimitado' : plan.students}
                                    </span>
                                </div>
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    fontSize: '14px', color: 'var(--text-secondary)',
                                    padding: '8px 0',
                                }}>
                                    <span>Instituciones activas</span>
                                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                        {plan.activeInstitutions}
                                    </span>
                                </div>
                            </div>

                            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => router.push('/super-admin/institutions')}>
                                Gestionar
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
