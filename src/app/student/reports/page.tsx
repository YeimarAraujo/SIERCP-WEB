'use client';

import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { DataTable } from '@/components/ui/data-table';
import { FileText, Search, Download, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SessionService } from '@/services/firestore.service';
import { useAuth } from '@/hooks/use-auth';
import type { SessionModel } from '@/models/session';
import { downloadCsvReport, downloadSessionPdfReport, formatReportFilename } from '@/shared/lib/export-utils';
import toast from 'react-hot-toast';

export default function StudentReportsPage() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<SessionModel[]>([]);
    const [totalSessionsCount, setTotalSessionsCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredSessions = sessions.filter(s =>
        searchTerm === '' ||
        (s.scenarioTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.startedAt.toLocaleDateString().includes(searchTerm)
    );

    const columns = [
        {
            key: 'startedAt',
            label: 'Fecha y Hora',
            render: (val: any) => {
                const date = val as Date;
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                            <Calendar size={18} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: 14 }}>{date.toLocaleDateString()}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'scenarioTitle',
            label: 'Escenario',
            render: (val: any) => (
                <div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{val || 'Práctica Libre'}</div>
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
                        <div style={{ flex: 1, height: 6, background: 'var(--muted)', borderRadius: 3, minWidth: 60, overflow: 'hidden' }}>
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
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {(row.metrics as any)?.averageDepthMm?.toFixed(1) || 0}mm / {(row.metrics as any)?.averageRatePerMin?.toFixed(0) || 0}cpm
                </div>
            )
        },
        {
            key: 'actions',
            label: '',
            render: (_: any, row: SessionModel) => (
                <button onClick={async () => {
                    const score = row.metrics?.qualityScore || (row.metrics as any)?.score || 0;
                    await downloadSessionPdfReport({
                        filename: formatReportFilename(`reporte-sesion-${row.id}`, 'pdf'),
                        title: 'Reporte clinico de sesion RCP',
                        subtitle: row.scenarioTitle || 'Practica libre',
                        generatedBy: user ? `${user.firstName} ${user.lastName}` : undefined,
                        summary: [
                            { label: 'Calidad AHA', value: `${Math.round(score)}%` },
                            { label: 'Profundidad', value: `${(row.metrics as any)?.averageDepthMm?.toFixed(1) || 0} mm` },
                            { label: 'Frecuencia', value: `${(row.metrics as any)?.averageRatePerMin?.toFixed(0) || 0} cpm` },
                            { label: 'Duracion', value: row.duration ? `${Math.floor(row.duration / 60)}m ${row.duration % 60}s` : '-' },
                        ],
                        columns: ['Metrica', 'Valor'],
                        rows: [
                            ['Fecha', row.startedAt.toLocaleString('es-CO')],
                            ['Escenario', row.scenarioTitle || 'Practica libre'],
                            ['Calidad AHA', `${Math.round(score)}%`],
                            ['Profundidad promedio', `${(row.metrics as any)?.averageDepthMm?.toFixed(1) || 0} mm`],
                            ['Frecuencia promedio', `${(row.metrics as any)?.averageRatePerMin?.toFixed(0) || 0} cpm`],
                            ['Compresiones correctas', `${row.metrics?.correctCompressions || 0} / ${row.metrics?.totalCompressions || 0}`],
                            ['Recoil', `${row.metrics?.recoilPct || 0}%`],
                        ],
                    });
                    toast.success('PDF generado');
                }} style={{
                    padding: '8px 16px', borderRadius: 10, background: 'var(--muted)', border: 'none',
                    color: 'var(--brand)', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
                }}>
                    <FileText size={14} /> PDF
                </button>
            ),
        },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Reportes Clínicos" />

            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero
                    title="Historial de Rendimiento"
                    subtitle={`Has completado ${totalSessionsCount > 0 ? totalSessionsCount : sessions.length} sesiones de entrenamiento oficial.`}
                    parentTitle="Inicio"
                    parentHref="/student/home"
                    actions={
                        <button onClick={() => {
                            if (filteredSessions.length === 0) return toast.error('No hay datos para exportar');
                            downloadCsvReport(filteredSessions.map(s => ({
                                Fecha: s.startedAt.toLocaleDateString(),
                                Hora: s.startedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                Escenario: s.scenarioTitle || 'Práctica Libre',
                                Calidad: `${s.metrics?.qualityScore || s.metrics?.score || 0}%`,
                                Profundidad: `${(s.metrics as any)?.averageDepthMm?.toFixed(1) || 0}mm`,
                                Frecuencia: `${(s.metrics as any)?.averageRatePerMin?.toFixed(0) || 0}cpm`
                            })), {
                                filename: formatReportFilename('historial-rendimiento', 'csv'),
                                title: 'Historial de rendimiento RCP',
                                generatedBy: user ? `${user.firstName} ${user.lastName}` : undefined,
                                filters: { Busqueda: searchTerm || 'Todos' },
                            });
                            toast.success('CSV exportado');
                        }} style={{
                            padding: '10px 18px', borderRadius: 12, background: 'var(--card)', color: 'var(--brand)',
                            border: '1px solid var(--brand)', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 8
                        }}>
                            <Download size={16} /> Exportar Todo (.csv)
                        </button>
                    }
                />

                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 20 }}>
                        <div style={{ position: 'relative', maxWidth: 400, flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Filtrar por escenario o fecha..."
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
                        data={filteredSessions}
                        loading={loading}
                        emptyMessage="No se han encontrado registros de sesiones. ¡Comienza a practicar para generar tu primer reporte!"
                        enablePagination={true}
                    />
                </div>
            </div>
        </div>
    );
}
