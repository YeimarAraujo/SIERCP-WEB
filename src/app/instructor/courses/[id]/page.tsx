'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';
import { useParams } from 'next/navigation';

const TABS = [
    { key: 'alumnos', label: 'Alumnos' },
    { key: 'sesiones', label: 'Sesiones' },
    { key: 'progreso', label: 'Progreso' },
] as const;

export default function InstructorCourseDetailPage() {
    const params = useParams();
    const [activeTab, setActiveTab] = useState<string>('alumnos');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Header title="Detalle del curso" />
            <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
                <PageHeader title="Detalle del curso" subtitle={`Curso ID: ${params?.id ?? '—'}`} />

                <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #E2E4F0', paddingBottom: 12 }}>
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                                border: 'none', cursor: 'pointer',
                                background: activeTab === tab.key ? '#EEF0FF' : 'transparent',
                                color: activeTab === tab.key ? '#1800AD' : '#8892A4',
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E4F0', borderRadius: 12, padding: 32, textAlign: 'center' }}>
                    <p style={{ color: '#8892A4', fontSize: 14 }}>Contenido de {activeTab} — próximamente</p>
                </div>
            </div>
        </div>
    );
}
