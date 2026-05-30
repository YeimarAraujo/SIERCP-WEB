'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { useAuth } from '@/hooks/use-auth';
import { GuideService } from '@/services/firestore.service';
import { formatDate } from '@/lib/utils';
import type { Enrollment } from '@/models/course';
import type { SessionModel } from '@/models/session';
import { CATEGORY_LABELS, CATEGORY_EMOJIS, type GuideModel } from '@/models/guide';
import { getAuth } from 'firebase/auth';
import {
    Users, BookOpen, BarChart2, Clock, Plus, Trash2, FileText,
    ChevronRight, User, Mail, Settings, BarChart,
    GraduationCap, TrendingUp, Target, Award, Download, Filter
} from 'lucide-react';
import { CourseQr } from '@/components/ui/course-qr';
import toast from 'react-hot-toast';
import { downloadSessionPdfReport, formatReportFilename } from '@/shared/lib/export-utils';

type TabType = 'alumnos' | 'contenido' | 'sesiones' | 'config';

interface Props {
    /** ID del curso a gestionar */
    courseId: string;
    /** Base de ruta del shell actual, p.ej. "/instructor/courses" o "/student/instructor-courses" */
    basePath: string;
    /** Destino del botón "Monitor Live" (p.ej. "/instructor/monitor" o "/student/live") */
    monitorHref: string;
}

export function CourseManagementView({ courseId: id, basePath, monitorHref }: Props) {
    const { user } = useAuth();
    const router = useRouter();

    const [course, setCourse] = useState<any | null>(null);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [sessions, setSessions] = useState<SessionModel[]>([]);
    const [guides, setGuides] = useState<GuideModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('alumnos');

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                const token = await getAuth().currentUser?.getIdToken();
                if (!token) return;

                // API server-side (Admin SDK) — evita problemas de permisos Firestore
                const res = await fetch(`/api/instructor/courses/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    console.error('Error fetching course detail:', err.error);
                    setErrorMsg(err.error || 'No se pudo cargar el curso');
                    return;
                }
                setErrorMsg(null);
                const data = await res.json();
                setCourse(data.course);
                setEnrollments(data.enrollments || []);
                setSessions(data.sessions || []);

                try {
                    const gds = await GuideService.getByCourse(id);
                    setGuides(gds);
                } catch (_) {}
            } catch (error) {
                console.error('Error fetching course detail:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleDeleteGuide = async (guideId: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este módulo?')) return;
        try {
            await GuideService.delete(guideId);
            setGuides(prev => prev.filter(g => g.id !== guideId));
        } catch (error) {
            console.error('Error deleting guide:', error);
        }
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTop: '3px solid var(--brand)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Sincronizando ecosistema...</span>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        </div>
    );

    if (!course) return <div style={{ padding: 40, textAlign: 'center', color: '#EF4444' }}>{errorMsg || 'Curso no encontrado'}</div>;

    const avgScore = sessions.length > 0
        ? Math.round(sessions.reduce((acc, s) => acc + (s.metrics?.qualityScore ?? 0), 0) / sessions.length)
        : 0;

    const tabs: { id: TabType, label: string, icon: any }[] = [
        { id: 'alumnos', label: 'Estudiantes', icon: Users },
        { id: 'contenido', label: 'Contenido', icon: BookOpen },
        { id: 'sesiones', label: 'Sesiones', icon: BarChart2 },
        { id: 'config', label: 'Configuración', icon: Settings },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title={course.title} />
            <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--brand)', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', marginBottom: 6 }}>
                            <Target size={14} /> GESTIÓN ACADÉMICA
                        </div>
                        <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--foreground)', letterSpacing: '-0.02em', margin: 0 }}>{course.title}</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '4px 0 0 0' }}>Instructor: <span style={{ fontWeight: 600, color: 'var(--brand)' }}>{course.instructorName}</span></p>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={async () => {
                            await downloadSessionPdfReport({
                                filename: formatReportFilename(`reporte-curso-${course.id}`, 'pdf'),
                                title: 'Reporte academico de curso RCP',
                                subtitle: course.title,
                                generatedBy: user ? `${user.firstName} ${user.lastName}` : undefined,
                                summary: [
                                    { label: 'Estudiantes', value: enrollments.length },
                                    { label: 'Calidad promedio', value: `${avgScore}%` },
                                    { label: 'Modulos', value: guides.length },
                                    { label: 'Sesiones', value: sessions.length },
                                ],
                                columns: ['Estudiante', 'Escenario', 'Calidad', 'Profundidad', 'Frecuencia', 'Fecha'],
                                rows: sessions.map(s => [
                                    s.studentName || '-',
                                    s.scenarioTitle || 'Practica libre',
                                    `${s.metrics?.qualityScore || 0}%`,
                                    `${s.metrics?.averageDepthMm?.toFixed(1) || 0} mm`,
                                    `${s.metrics?.averageRatePerMin?.toFixed(0) || 0} cpm`,
                                    s.startedAt.toLocaleDateString('es-CO'),
                                ]),
                            });
                            toast.success('PDF generado');
                        }} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Download size={16} /> Reporte PDF
                        </button>
                        <Link href={monitorHref} style={{ textDecoration: 'none' }}>
                            <button style={{ background: 'var(--brand)', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, color: 'var(--text-on-brand)', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 6px -1px rgba(24, 0, 173, 0.3)' }}>
                                <TrendingUp size={16} /> Monitor Live
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Stats Summary Panel */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 40 }}>
                    {[
                        { label: 'Matrícula Total', value: enrollments.length, sub: 'Alumnos activos', icon: Users, color: 'var(--brand)' },
                        { label: 'Calidad del Grupo', value: `${avgScore}%`, sub: 'Cumplimiento global', icon: BarChart, color: avgScore >= 85 ? '#10B981' : '#F59E0B' },
                        { label: 'Estructura', value: course.moduleCount ?? guides.length, sub: 'Módulos cargados', icon: BookOpen, color: 'var(--clr-accent)' },
                        { label: 'Actividad Hoy', value: sessions.filter(s => new Date(s.startedAt).toDateString() === new Date().toDateString()).length, sub: 'Sesiones ejecutadas', icon: Clock, color: '#8B5CF6' },
                    ].map((m, i) => (
                        <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${m.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color }}>
                                    <m.icon size={20} />
                                </div>
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{m.label}</div>
                            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--foreground)' }}>{m.value}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 4 }}>{m.sub}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs Navigation */}
                <div style={{ display: 'flex', gap: 40, borderBottom: '2px solid var(--border)', marginBottom: 32 }}>
                    {tabs.map(tab => {
                        const active = activeTab === tab.id;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10, padding: '16px 4px', border: 'none',
                                    borderBottom: active ? '3px solid var(--brand)' : '3px solid transparent',
                                    background: 'transparent', color: active ? 'var(--brand)' : 'var(--text-muted)',
                                    fontWeight: active ? 800 : 600, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s',
                                    marginBottom: -2
                                }}
                            >
                                <Icon size={20} /> {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div style={{ minHeight: 400 }}>
                    {activeTab === 'alumnos' && (
                        <div style={{ display: 'grid', gap: 16 }}>
                            {enrollments.length === 0 ? (
                                <div style={{ padding: 80, textAlign: 'center', background: 'var(--card)', borderRadius: 24, border: '1px solid var(--border)' }}>
                                    <Users size={48} style={{ color: 'var(--border)', marginBottom: 16 }} />
                                    <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>No hay estudiantes inscritos en este programa.</p>
                                </div>
                            ) : (
                                enrollments.map(en => (
                                    <div key={en.studentId} style={{
                                        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: '20px 24px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s hover',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                                            <div style={{ width: 48, height: 48, borderRadius: 24, background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', border: '2px solid var(--card)', boxShadow: '0 0 0 1px var(--border)' }}>
                                                <User size={24} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: 16 }}>{en.studentName}</div>
                                                <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Mail size={12} /> {en.studentEmail}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
                                            <div style={{ textAlign: 'center', width: 120 }}>
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.05em', marginBottom: 6 }}>PROGRESO</div>
                                                <div style={{ height: 6, background: 'var(--muted)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                                                    <div style={{ width: `${Math.round((en.completedModules / (course.moduleCount || 1)) * 100)}%`, height: '100%', background: 'var(--brand)', borderRadius: 3 }} />
                                                </div>
                                                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--brand)' }}>{Math.round((en.completedModules / (course.moduleCount || 1)) * 100)}%</div>
                                            </div>
                                            <div style={{ textAlign: 'center', minWidth: 80 }}>
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.05em', marginBottom: 4 }}>SCORE AVG</div>
                                                <div style={{ fontSize: 18, fontWeight: 900, color: en.avgScore >= 85 ? '#10B981' : '#F59E0B' }}>{en.avgScore.toFixed(1)}%</div>
                                            </div>
                                            <button style={{ background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 12, padding: 8, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'contenido' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <BookOpen size={20} style={{ color: 'var(--brand)' }} />
                                    <h4 style={{ margin: 0, color: 'var(--foreground)', fontSize: 18, fontWeight: 800 }}>Estructura Pedagógica</h4>
                                </div>
                                <Link href={`${basePath}/${id}/edit`} style={{ textDecoration: 'none' }}>
                                    <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: 'var(--brand)', color: 'var(--text-on-brand)', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(24, 0, 173, 0.2)' }}>
                                        <Plus size={18} /> Gestionar Módulos
                                    </button>
                                </Link>
                            </div>

                            {/* Módulos del curso (subcolección) */}
                            {Array.isArray(course.modules) && course.modules.length > 0 && (
                                <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
                                    {course.modules.map((m: any, idx: number) => (
                                        <div key={m.id ?? idx} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                                                {idx + 1}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--foreground)' }}>{m.title}</div>
                                            </div>
                                            <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: 'var(--accent)', color: 'var(--brand)' }}>
                                                {m.type === 'teoria' ? '📖 Teoría' : m.type === 'evaluacion_teorica' ? '📝 Evaluación' : m.type === 'practica_guiada' ? '🫀 Práctica' : '🏆 Cert.'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: 'grid', gap: 14 }}>
                                {guides.length === 0 && (!Array.isArray(course.modules) || course.modules.length === 0) ? (
                                    <div style={{ padding: 80, textAlign: 'center', background: 'var(--card)', borderRadius: 24, border: '1px solid var(--border)' }}>
                                        <BookOpen size={48} style={{ color: 'var(--border)', marginBottom: 16 }} />
                                        <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>No hay contenido cargado. Usa "Gestionar Módulos" para añadir módulos al curso.</p>
                                    </div>
                                ) : (
                                    guides.map(g => (
                                        <div key={g.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                                <div style={{ fontSize: 32, width: 60, height: 60, background: 'var(--muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--muted)' }}>{CATEGORY_EMOJIS[g.category]}</div>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: 17 }}>{g.title}</div>
                                                        {g.required && (
                                                            <div style={{ background: 'var(--accent)', color: 'var(--brand)', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, letterSpacing: '0.05em' }}>OBLIGATORIO</div>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <span style={{ fontWeight: 600 }}>{CATEGORY_LABELS[g.category]}</span>
                                                        <span style={{ color: 'var(--border-strong)' }}>•</span>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {g.estimatedMinutes} min lectura</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <button onClick={() => window.open(g.contentUrl, '_blank')} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} title="Ver material">
                                                    <FileText size={18} /> <span style={{ fontSize: 13, fontWeight: 700 }}>Ver Material</span>
                                                </button>
                                                <button onClick={() => handleDeleteGuide(g.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 8 }} title="Eliminar">
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'sesiones' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <BarChart2 size={20} style={{ color: 'var(--brand)' }} />
                                    <h4 style={{ margin: 0, color: 'var(--foreground)', fontSize: 18, fontWeight: 800 }}>Historial de Prácticas</h4>
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Filter size={14} /> Filtrar
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gap: 14 }}>
                                {sessions.length === 0 ? (
                                    <div style={{ padding: 80, textAlign: 'center', background: 'var(--card)', borderRadius: 24, border: '1px solid var(--border)' }}>
                                        <BarChart2 size={48} style={{ color: 'var(--border)', marginBottom: 16 }} />
                                        <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>No se han registrado sesiones prácticas en este curso.</p>
                                    </div>
                                ) : (
                                    sessions.map(s => (
                                        <div key={s.id} style={{
                                            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: '20px 24px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                                <div style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', border: '1px solid var(--border)' }}>
                                                    <GraduationCap size={26} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: 16 }}>{s.studentName}</div>
                                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                                                        <span style={{ fontWeight: 700, color: 'var(--brand)' }}>{s.scenarioTitle}</span>
                                                        <span style={{ color: 'var(--border-strong)' }}>•</span>
                                                        <span>{formatDate(s.startedAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.05em', marginBottom: 4 }}>DESEMPEÑO</div>
                                                    <div style={{ fontSize: 20, fontWeight: 900, color: (s.metrics?.qualityScore ?? 0) >= 85 ? '#10B981' : '#F59E0B' }}>{s.metrics?.qualityScore ?? 0}%</div>
                                                </div>
                                                <div style={{ width: 100, height: 40, background: 'var(--muted)', borderRadius: 12, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 2, padding: '4px 8px' }}>
                                                    {[40, 70, 85, 60, 95, 88].map((h, j) => (
                                                        <div key={j} style={{ flex: 1, height: `${h}%`, background: (s.metrics?.qualityScore ?? 0) >= 85 ? '#10B981' : '#F59E0B', opacity: 0.3 + (j * 0.1), borderRadius: 2 }} />
                                                    ))}
                                                </div>
                                                <div style={{
                                                    fontSize: 10, fontWeight: 900, padding: '6px 12px', borderRadius: 10,
                                                    background: (s.metrics?.qualityScore ?? 0) >= 85 ? '#DCFCE7' : '#FEE2E2',
                                                    color: (s.metrics?.qualityScore ?? 0) >= 85 ? '#166534' : '#991B1B',
                                                    letterSpacing: '0.05em'
                                                }}>
                                                    {(s.metrics?.qualityScore ?? 0) >= 85 ? 'CERTIFICADO' : 'FALLIDO'}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'config' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32 }}>
                            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 32 }}>
                                <Settings size={48} style={{ color: 'var(--brand)', marginBottom: 20, opacity: 0.8 }} />
                                <h3 style={{ margin: 0, color: 'var(--foreground)', fontSize: 20, fontWeight: 900 }}>Ajustes del Programa</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, marginTop: 12 }}>Configura los parámetros de evaluación, módulos, códigos de acceso y visibilidad del curso.</p>
                                <div style={{ marginTop: 32, display: 'grid', gap: 12 }}>
                                    <button onClick={() => router.push(`${basePath}/${id}/edit`)} style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'var(--brand)', color: 'var(--text-on-brand)', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Editar Información y Módulos</button>
                                </div>
                            </div>
                            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 32 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                                    <Award size={20} style={{ color: 'var(--brand)' }} />
                                    <h4 style={{ margin: 0, color: 'var(--foreground)', fontSize: 18, fontWeight: 800 }}>Reglas de Certificación</h4>
                                </div>
                                <div style={{ display: 'grid', gap: 24 }}>
                                    <div style={{ padding: '16px 20px', borderRadius: 16, background: 'var(--muted)', border: '1px solid var(--muted)' }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>UMBRAL DE APROBACIÓN</div>
                                        <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--foreground)' }}>{course.minScore ?? 85}% <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>(Estándar AHA 2025)</span></div>
                                    </div>
                                    {course.inviteCode && (
                                        <CourseQr
                                            inviteCode={course.inviteCode}
                                            courseTitle={course.title}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
