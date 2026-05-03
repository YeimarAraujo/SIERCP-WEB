'use client';

import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';

export default function InstructorMonitorPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Header title="Monitor en vivo" />
            <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
                <PageHeader title="Monitor en vivo" subtitle="Aquí verás las sesiones activas de tus alumnos" />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E2E4F0', borderRadius: 12, padding: 32, textAlign: 'center' }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#F0F1FA', margin: '0 auto 12px' }} />
                            <p style={{ fontSize: 14, fontWeight: 500, color: '#0B1C30' }}>Sin sesión activa</p>
                            <p style={{ fontSize: 12, color: '#8892A4', marginTop: 4 }}>Slot disponible</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
