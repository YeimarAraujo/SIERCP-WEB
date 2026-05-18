'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { DataTable } from '@/components/ui/data-table';
import { Award, Download, Search, ShieldCheck, User, Calendar, ExternalLink } from 'lucide-react';
import { SessionService } from '@/services/firestore.service';
import { downloadCertificatePdf, downloadCsvReport, formatReportFilename } from '@/shared/lib/export-utils';
import { CertificateService } from '@/features/certificates/services/certificate.service';
import toast from 'react-hot-toast';
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
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' }}>
                        <User size={18} />
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--foreground)', fontSize: 14 }}>{val}</div>
                </div>
            )
        },
        { 
            key: 'scenarioTitle', 
            label: 'Certificación',
            render: (val: string) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={16} style={{ color: '#10B981' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{val || 'RCP Avanzado'}</span>
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
                <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={14} /> {val.toLocaleDateString()}
                </div>
            )
        },
        {
            key: 'actions',
            label: '',
            render: (_: any, row: SessionModel) => (
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={async () => {
                        await downloadCertificatePdf({
                            filename: formatReportFilename(`certificado-${row.id}`, 'pdf'),
                            studentName: row.studentName || 'Estudiante SIERCP',
                            certification: row.scenarioTitle || 'Certificacion RCP',
                            score: row.metrics?.qualityScore || (row.metrics as any)?.score || 0,
                            issuedAt: row.startedAt,
                            sessionId: row.id,
                        });
                        toast.success('Certificado PDF generado');
                    }} style={{ padding: 8, borderRadius: 8, background: 'var(--muted)', border: 'none', color: 'var(--brand)', cursor: 'pointer' }}>
                        <Download size={16} />
                    </button>
                    <button onClick={async () => {
                        const certificateId = await CertificateService.issue({
                            id: row.id,
                            studentName: row.studentName || 'Estudiante SIERCP',
                            certification: row.scenarioTitle || 'Certificacion RCP',
                            score: row.metrics?.qualityScore || (row.metrics as any)?.score || 0,
                            issuedAt: row.startedAt,
                            sessionId: row.id,
                        });
                        window.open(CertificateService.buildVerificationUrl(certificateId), '_blank', 'noopener,noreferrer');
                    }} style={{ padding: 8, borderRadius: 8, background: 'var(--muted)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <ExternalLink size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Control de Certificaciones" />
            
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero 
                    title="Repositiorio de Títulos" 
                    subtitle="Validación y auditoría de certificados oficiales emitidos bajo estándares AHA"
                    parentTitle="Admin"
                    parentHref="/admin/dashboard"
                    actions={
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button onClick={() => { window.location.href = '/admin/certificates/templates'; }} style={{ 
                            padding: '12px 20px', borderRadius: 12, background: 'var(--card)', color: 'var(--text-secondary)', 
                            border: '1px solid var(--border-strong)', fontWeight: 700, fontSize: 13, cursor: 'pointer', 
                            display: 'flex', alignItems: 'center', gap: 8 
                        }}>
                            <ShieldCheck size={18} /> Plantilla
                        </button>
                        <button onClick={() => {
                            if (filteredCerts.length === 0) return toast.error('No hay certificados para exportar');
                            downloadCsvReport(filteredCerts.map(c => ({
                                Estudiante: c.studentName,
                                Certificación: c.scenarioTitle || 'RCP Avanzado',
                                Calidad: `${c.metrics?.qualityScore || c.metrics?.score || 0}%`,
                                'Fecha Emisión': c.startedAt.toLocaleDateString()
                            })), {
                                filename: formatReportFilename('auditoria-certificados', 'csv'),
                                title: 'Auditoria de certificados RCP',
                                filters: { Busqueda: searchTerm || 'Todos' },
                            });
                            toast.success('Auditoría exportada');
                        }} style={{ 
                            padding: '12px 20px', borderRadius: 12, background: 'var(--card)', color: 'var(--brand)', 
                            border: '1px solid var(--brand)', fontWeight: 700, fontSize: 13, cursor: 'pointer', 
                            display: 'flex', alignItems: 'center', gap: 8 
                        }}>
                            <Download size={18} /> Exportar Auditoría (.csv)
                        </button>
                        </div>
                    }
                />

                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
                            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Buscar por estudiante o curso..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%', height: 48, padding: '0 16px 0 48px', borderRadius: 14, border: '1px solid var(--border)',
                                    fontSize: 14, outline: 'none', background: 'var(--muted)'
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
