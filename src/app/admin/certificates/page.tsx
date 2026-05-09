'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { DataTable } from '@/components/ui/data-table';
import { Award, Download, Search, ShieldCheck, User, Calendar, ExternalLink } from 'lucide-react';
import { SessionService } from '@/services/firestore.service';
import type { SessionModel } from '@/models/session';

export default function AdminCertificatesPage() {
    const [certificates, setCertificates] = useState<SessionModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchCertificates = async () => {
            try {
                setLoading(true);
                const allRecent = await SessionService.getAllRecent(100);
                // En Admin, mostramos todas las sesiones con score >= 85 como certificados emitidos
                const validCerts = allRecent.filter(s => (s.metrics?.qualityScore || s.metrics?.score || 0) >= 85);
                setCertificates(validCerts);
            } catch (error) {
                console.error('Error fetching certificates:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCertificates();
    }, []);

    const filteredCerts = certificates.filter(c => 
        c.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.scenarioTitle?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        { 
            key: 'studentName', 
            label: 'Estudiante',
            render: (val: string) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1800AD' }}>
                        <User size={18} />
                    </div>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>{val}</div>
                </div>
            )
        },
        { 
            key: 'scenarioTitle', 
            label: 'Certificación',
            render: (val: string) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={16} style={{ color: '#10B981' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{val || 'RCP Avanzado'}</span>
                </div>
            )
        },
        { 
            key: 'metrics', 
            label: 'Calidad',
            render: (metrics: any) => (
                <div style={{ fontWeight: 800, color: '#10B981', fontSize: 14 }}>
                    {metrics?.qualityScore || metrics?.score || 0}%
                </div>
            )
        },
        { 
            key: 'startedAt', 
            label: 'Fecha Emisión',
            render: (val: Date) => (
                <div style={{ fontSize: 12, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={14} /> {val.toLocaleDateString()}
                </div>
            )
        },
        {
            key: 'actions',
            label: '',
            render: () => (
                <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ padding: 8, borderRadius: 8, background: '#F1F5F9', border: 'none', color: '#1800AD', cursor: 'pointer' }}>
                        <Download size={16} />
                    </button>
                    <button style={{ padding: 8, borderRadius: 8, background: '#F1F5F9', border: 'none', color: '#64748B', cursor: 'pointer' }}>
                        <ExternalLink size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
            <Header title="Control de Certificaciones" />
            
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero 
                    title="Repositiorio de Títulos" 
                    subtitle="Validación y auditoría de certificados oficiales emitidos bajo estándares AHA"
                    parentTitle="Admin"
                    parentHref="/admin/dashboard"
                    actions={
                        <button style={{ 
                            padding: '12px 20px', borderRadius: 12, background: '#FFFFFF', color: '#1800AD', 
                            border: '1px solid #1800AD', fontWeight: 700, fontSize: 13, cursor: 'pointer', 
                            display: 'flex', alignItems: 'center', gap: 8 
                        }}>
                            <Download size={18} /> Exportar Auditoría (.csv)
                        </button>
                    }
                />

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
                            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                            <input
                                type="text"
                                placeholder="Buscar por estudiante o curso..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%', height: 48, padding: '0 16px 0 48px', borderRadius: 14, border: '1px solid #E2E8F0',
                                    fontSize: 14, outline: 'none', background: '#F8FAFC'
                                }}
                            />
                        </div>
                    </div>

                    <DataTable 
                        columns={columns}
                        data={filteredCerts}
                        loading={loading}
                        emptyMessage="No se han encontrado certificados emitidos en el historial institucional."
                    />
                </div>
            </div>
        </div>
    );
}
