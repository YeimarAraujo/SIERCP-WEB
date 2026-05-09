'use client';

import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { DataTable } from '@/components/ui/data-table';
import { FileText, Search, Download, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SessionService, CourseService } from '@/services/firestore.service';
import { useAuth } from '@/hooks/use-auth';
import type { SessionModel } from '@/models/session';

export default function StudentReportsPage() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<SessionModel[]>([]);
    const [totalSessionsCount, setTotalSessionsCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        
        const fetchReports = async () => {
            try {
                setLoading(true);
                // Usamos la misma lógica robusta que en el Home
                const userSessions = await SessionService.getByStudent(user.uid, 500);

                const uniqueSessions = Array.from(new Map(userSessions.map(s => [s.id, s])).values())
                    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

                setSessions(uniqueSessions);
                
                const count = await SessionService.getCountByStudent(user.uid);
                setTotalSessionsCount(count);
            } catch (error) {
                console.error('Error fetching reports:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [user]);

    const columns = [
        { 
            key: 'startedAt', 
            label: 'Fecha y Hora',
            render: (val: any) => {
                const date = val as Date;
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                            <Calendar size={18} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 14 }}>{date.toLocaleDateString()}</div>
                            <div style={{ fontSize: 12, color: '#94A3B8' }}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                    </div>
                );
            }
        },
        { 
            key: 'scenarioTitle', 
            label: 'Escenario',
            render: (val: any) => (
                <div style={{ fontWeight: 700, color: '#475569' }}>{val || 'Práctica Libre'}</div>
            )
        },
        { 
            key: 'metrics', 
            label: 'Calidad AHA',
            render: (metrics: any) => {
                const score = metrics?.qualityScore || metrics?.score || 0;
                const color = score >= 85 ? '#10B981' : score >= 70 ? '#F59E0B' : '#EF4444';
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, height: 6, background: '#F1F5F9', borderRadius: 3, minWidth: 60, overflow: 'hidden' }}>
                            <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 900, color: color }}>{score}%</span>
                    </div>
                );
            }
        },
        {
            key: 'metrics_detail',
            label: 'Prof. / Frec.',
            render: (_: any, row: any) => (
                <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                    {(row.metrics as any)?.averageDepthMm?.toFixed(1) || 0}mm / {(row.metrics as any)?.averageRatePerMin?.toFixed(0) || 0}cpm
                </div>
            )
        },
        {
            key: 'actions',
            label: '',
            render: () => (
                <button style={{ 
                    padding: '8px 16px', borderRadius: 10, background: '#F1F5F9', border: 'none', 
                    color: '#1800AD', fontSize: 12, fontWeight: 800, cursor: 'pointer', 
                    display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' 
                }}>
                    <FileText size={14} /> PDF
                </button>
            ),
        },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
            <Header title="Reportes Clínicos" />
            
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero 
                    title="Historial de Rendimiento" 
                    subtitle={`Has completado ${totalSessionsCount > 0 ? totalSessionsCount : sessions.length} sesiones de entrenamiento oficial.`} 
                    parentTitle="Estudiante"
                    parentHref="/student/home"
                    actions={
                        <button style={{ 
                            padding: '10px 18px', borderRadius: 12, background: '#FFFFFF', color: '#1800AD', 
                            border: '1px solid #1800AD', fontWeight: 700, fontSize: 13, cursor: 'pointer', 
                            display: 'flex', alignItems: 'center', gap: 8 
                        }}>
                            <Download size={16} /> Exportar Todo (.csv)
                        </button>
                    }
                />

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 20 }}>
                        <div style={{ position: 'relative', maxWidth: 400, flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                            <input
                                type="text"
                                placeholder="Filtrar por escenario o fecha..."
                                style={{
                                    width: '100%', height: 48, padding: '0 16px 0 48px', borderRadius: 14, border: '1px solid #E2E8F0',
                                    fontSize: 14, outline: 'none', background: '#F8FAFC'
                                }}
                            />
                        </div>
                    </div>

                    <DataTable 
                        columns={columns}
                        data={sessions}
                        loading={loading}
                        emptyMessage="No se han encontrado registros de sesiones. ¡Comienza a practicar para generar tu primer reporte!"
                        enablePagination={true}
                    />
                </div>
            </div>
        </div>
    );
}
