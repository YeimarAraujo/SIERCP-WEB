'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { DataTable } from '@/components/ui/data-table';
import { FileText, Download, TrendingUp, Users, BookOpen, Search, Filter } from 'lucide-react';
import { SessionService, CourseService, UserService } from '@/services/firestore.service';
import { downloadCsv } from '@/shared/lib/export-utils';
import toast from 'react-hot-toast';

export default function AdminReportsPage() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({
        avgScore: 0,
        totalStudents: 0,
        totalCourses: 0
    });

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                setLoading(true);
                const [allSessions, allCourses, allUsers] = await Promise.all([
                    SessionService.getAllRecent(200),
                    CourseService.getAll(),
                    UserService.getAll()
                ]);

                const scores = allSessions.map(s => (s.metrics as any)?.qualityScore || (s.metrics as any)?.score || 0);
                const avg = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;

                setStats({
                    avgScore: avg,
                    totalStudents: allUsers.filter(u => u.role === 'ESTUDIANTE').length,
                    totalCourses: allCourses.length
                });

                setSessions(allSessions);
            } catch (error) {
                console.error('Error fetching report data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, []);

    const filteredSessions = sessions.filter(s =>
        searchTerm === '' ||
        s.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.scenarioTitle?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        { 
            key: 'startedAt', 
            label: 'Fecha',
            render: (val: any) => (
                <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>{(val as Date).toLocaleDateString()}</div>
            )
        },
        { 
            key: 'studentName', 
            label: 'Estudiante',
            render: (val: any) => (
                <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>{val}</div>
            )
        },
        { 
            key: 'scenarioTitle', 
            label: 'Actividad',
            render: (val: any) => (
                <span style={{ fontSize: 13, color: '#475569' }}>{val || 'Práctica Libre'}</span>
            )
        },
        { 
            key: 'metrics', 
            label: 'Calidad',
            render: (metrics: any) => {
                const score = metrics?.qualityScore || metrics?.score || 0;
                return (
                    <div style={{ fontWeight: 800, color: score >= 85 ? '#10B981' : '#F59E0B' }}>
                        {score}%
                    </div>
                );
            }
        },
        {
            key: 'duration',
            label: 'Duración',
            render: (val: any) => (
                <div style={{ fontSize: 12, color: '#94A3B8' }}>{Math.floor((val as number) / 60)}m {(val as number) % 60}s</div>
            )
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
            <Header title="Inteligencia Institucional" />
            
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero 
                    title="Reportes de Operación" 
                    subtitle="Consolidado global de rendimiento académico y métricas de simulación clínica"
                    parentTitle="Admin"
                    parentHref="/admin/dashboard"
                    actions={
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => toast.error('La generación de PDF estará disponible próximamente')} style={{ padding: '10px 18px', borderRadius: 12, background: '#1800AD', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FileText size={16} /> Exportar PDF
                            </button>
                            <button onClick={() => {
                                if (sessions.length === 0) return toast.error('No hay datos para exportar');
                                downloadCsv(sessions.map(s => ({
                                    Fecha: s.startedAt.toLocaleDateString(),
                                    Estudiante: s.studentName,
                                    Actividad: s.scenarioTitle || 'Práctica Libre',
                                    Calidad: `${s.metrics?.qualityScore || s.metrics?.score || 0}%`,
                                    Duración: s.duration ? `${Math.floor(s.duration / 60)}m ${s.duration % 60}s` : '—'
                                })), 'reportes-operacion');
                                toast.success('CSV exportado');
                            }} style={{ padding: '10px 18px', borderRadius: 12, background: '#F1F5F9', color: '#475569', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Download size={16} /> CSV
                            </button>
                        </div>
                    }
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
                    {[
                        { label: 'Calidad Promedio', value: `${stats.avgScore}%`, icon: TrendingUp, color: '#10B981' },
                        { label: 'Alumnos Evaluados', value: stats.totalStudents, icon: Users, color: '#1800AD' },
                        { label: 'Cursos Vigentes', value: stats.totalCourses, icon: BookOpen, color: '#6366F1' },
                    ].map((s, i) => (
                        <div key={i} style={{ background: '#FFFFFF', padding: 24, borderRadius: 20, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 20 }}>
                            <div style={{ width: 52, height: 52, borderRadius: 14, background: `${s.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                                <s.icon size={26} />
                            </div>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 4 }}>{s.label}</div>
                                <div style={{ fontSize: 26, fontWeight: 900, color: '#0F172A' }}>{loading ? '...' : s.value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Log de Sesiones Globales</h4>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                <input type="text" placeholder="Filtrar reporte..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '8px 12px 8px 36px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13, outline: 'none' }} />
                            </div>
                            <button style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#FFFFFF', fontSize: 13, fontWeight: 600, color: '#64748B', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Filter size={16} /> Filtros
                            </button>
                        </div>
                    </div>

                    <DataTable 
                        columns={columns}
                        data={filteredSessions}
                        loading={loading}
                        emptyMessage="No hay datos suficientes para generar el reporte de operaciones."
                    />
                </div>
            </div>
        </div>
    );
}
