'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { FileText, Download, Filter, Search, TrendingUp, Calendar, User, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { CourseService, SessionService } from '@/services/firestore.service';
import { downloadCsvReport, downloadSessionPdfReport, formatReportFilename } from '@/shared/lib/export-utils';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';

export default function InstructorReportsPage() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterCourse, setFilterCourse] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                const myCourses = await CourseService.getByInstructor(user.uid);
                setCourses(myCourses);

                const sessionPromises = myCourses.map(async (c) => {
                    const sess = await SessionService.getByCourse(c.id);
                    return sess.map(s => ({
                        ...s,
                        courseName: c.title
                    }));
                });

                const allSessions = (await Promise.all(sessionPromises)).flat();
                setSessions(allSessions);
            } catch (error) {
                console.error('Error fetching reports data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const filteredSessions = sessions.filter(s => {
        const matchesCourse = filterCourse === '' || s.courseId === filterCourse;
        const matchesSearch = s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             s.scenarioTitle.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCourse && matchesSearch;
    });

    const columns: any[] = [
        { 
            key: 'studentName', 
            label: 'Alumno',
            render: (_: unknown, row: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-accent)', fontWeight: 700, fontSize: 11 }}>
                        {row.studentName?.charAt(0)}
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{row.studentName}</span>
                </div>
            )
        },
        { 
            key: 'courseName', 
            label: 'Curso',
            render: (_: unknown, row: any) => <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{row.courseName}</span>
        },
        { 
            key: 'scenarioTitle', 
            label: 'Escenario',
            render: (_: unknown, row: any) => <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>{row.scenarioTitle}</span>
        },
        { 
            key: 'qualityScore', 
            label: 'Score',
            render: (_: unknown, row: any) => {
                const score = row.metrics?.qualityScore ?? 0;
                return (
                    <div style={{ fontWeight: 800, color: score >= 85 ? '#10B981' : '#F59E0B' }}>
                        {score}%
                    </div>
                );
            }
        },
        { 
            key: 'startedAt', 
            label: 'Fecha',
            render: (_: unknown, row: any) => (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(row.startedAt)}</div>
            )
        },
    ];

    const averageScore = sessions.length > 0 
        ? sessions.reduce((acc, s) => acc + (s.metrics?.qualityScore || 0), 0) / sessions.length 
        : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Reportes Analíticos" />
            
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero 
                    title="Análisis de Rendimiento" 
                    subtitle="Generación de informes clínicos y exportación de datos"
                    parentTitle="Instructor"
                    parentHref="/instructor/dashboard"
                    actions={
                        <>
                            <button onClick={async () => {
                                if (filteredSessions.length === 0) return toast.error('No hay datos para exportar');
                                const avgScore = filteredSessions.reduce((acc, s) => acc + (s.metrics?.qualityScore || 0), 0) / filteredSessions.length;
                                await downloadSessionPdfReport({
                                    filename: formatReportFilename('analisis-rendimiento-instructor', 'pdf'),
                                    title: 'Analisis de rendimiento RCP',
                                    subtitle: 'Consolidado por instructor, curso y escenario',
                                    generatedBy: user ? `${user.firstName} ${user.lastName}` : undefined,
                                    summary: [
                                        { label: 'Sesiones', value: filteredSessions.length },
                                        { label: 'Score promedio', value: `${avgScore.toFixed(1)}%` },
                                        { label: 'Alumnos', value: new Set(filteredSessions.map(s => s.studentId)).size },
                                        { label: 'Cursos', value: courses.length },
                                    ],
                                    filters: {
                                        Curso: filterCourse ? courses.find(c => c.id === filterCourse)?.title : 'Todos',
                                        Busqueda: searchTerm || 'Todos',
                                    },
                                    columns: ['Alumno', 'Curso', 'Escenario', 'Score', 'Profundidad', 'Frecuencia', 'Fecha'],
                                    rows: filteredSessions.map(s => [
                                        s.studentName,
                                        s.courseName,
                                        s.scenarioTitle || 'Practica libre',
                                        `${s.metrics?.qualityScore ?? 0}%`,
                                        `${s.metrics?.averageDepthMm?.toFixed(1) || 0} mm`,
                                        `${s.metrics?.averageRatePerMin?.toFixed(0) || 0} cpm`,
                                        s.startedAt ? new Date(s.startedAt).toLocaleDateString('es-CO') : '-',
                                    ]),
                                });
                                toast.success('PDF generado');
                            }} style={{ 
                                padding: '10px 18px', borderRadius: 12, background: 'var(--brand)', color: 'var(--text-on-brand)', 
                                border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 
                            }}>
                                <Download size={16} /> Exportar PDF
                            </button>
                            <button onClick={() => {
                                if (filteredSessions.length === 0) return toast.error('No hay datos para exportar');
                                downloadCsvReport(filteredSessions.map(s => ({
                                    Alumno: s.studentName,
                                    Curso: s.courseName,
                                    Escenario: s.scenarioTitle,
                                    Score: `${s.metrics?.qualityScore ?? 0}%`,
                                    Fecha: s.startedAt ? new Date(s.startedAt).toLocaleDateString() : '—'
                                })), {
                                    filename: formatReportFilename('analisis-rendimiento', 'csv'),
                                    title: 'Analisis de rendimiento RCP',
                                    generatedBy: user ? `${user.firstName} ${user.lastName}` : undefined,
                                    filters: {
                                        Curso: filterCourse ? courses.find(c => c.id === filterCourse)?.title : 'Todos',
                                        Busqueda: searchTerm || 'Todos',
                                    },
                                });
                                toast.success('CSV descargado');
                            }} style={{ 
                                padding: '10px 18px', borderRadius: 12, background: 'var(--muted)', color: 'var(--text-secondary)', 
                                border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' 
                            }}>
                                Descargar CSV
                            </button>
                        </>
                    }
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
                    <StatCard label="Total Sesiones" value={sessions.length} icon={TrendingUp} color="var(--clr-accent)" />
                    <StatCard label="Score Promedio" value={`${averageScore.toFixed(1)}%`} icon={TrendingUp} color="#10B981" />
                    <StatCard label="Alumnos Activos" value={new Set(sessions.map(s => s.studentId)).size} icon={User} color="#F59E0B" />
                    <StatCard label="Cursos" value={courses.length} icon={BookOpen} color="var(--brand)" />
                </div>

                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
                            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                                type="text" 
                                placeholder="Buscar por alumno o escenario..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '10px 14px 10px 42px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, outline: 'none' }}
                            />
                        </div>
                        <select 
                            value={filterCourse}
                            onChange={(e) => setFilterCourse(e.target.value)}
                            style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, background: 'var(--card)', minWidth: 200 }}
                        >
                            <option value="">Todos los cursos</option>
                            {courses.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </select>
                    </div>

                    <DataTable
                        columns={columns}
                        data={filteredSessions}
                        loading={loading}
                        emptyMessage="No se encontraron sesiones registradas para los criterios seleccionados."
                    />
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color }: any) {
    return (
        <div style={{ background: 'var(--card)', padding: 20, borderRadius: 20, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
                <Icon size={24} />
            </div>
            <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--foreground)' }}>{value}</div>
            </div>
        </div>
    );
}
