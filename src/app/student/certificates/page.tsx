'use client';

import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Award, Download } from 'lucide-react';

export default function StudentCertificatesPage() {
    return (
        <div>
            <PageHeader
                title="Mis certificados"
                subtitle="Certificados obtenidos por tus sesiones de entrenamiento"
            />

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px',
            }}>
                {/* Empty state when no certificates */}
            </div>

            <EmptyState
                title="Sin certificados aún"
                description="Aún no tienes certificados aprobados. Completa tus sesiones de entrenamiento para obtenerlos."
            />
        </div>
    );
}
