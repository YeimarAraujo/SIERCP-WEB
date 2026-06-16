'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { CourseService } from '@/services/firestore.service';
import type { CourseModel, Enrollment } from '@/models/course';
import {
    BookOpen, Users, Award,
    Trash2, Edit2, Download, Search,
    CheckCircle, AlertCircle,
    Copy, Power, Layers
} from 'lucide-react';
import { CourseQr } from '@/components/ui/course-qr';
import { PageHero } from '@/components/ui/page-hero';
import { DataTable } from '@/components/ui/data-table';
import { AttendancePanel } from '@/features/attendance/components/attendance-panel';
import toast from 'react-hot-toast';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';

export default function AdminCourseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.uid as string;

    const [course, setCourse] = useState<CourseModel | null>(null);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [modules, setModules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const getIdToken = async () => {
        const token = await getAuth().currentUser?.getIdToken();
        if (!token) throw new Error('No autenticado');
        return token;
    };

    useEffect(() => {
        if (!courseId) return;

        Promise.all([
            CourseService.get(courseId, true),
            getDocs(query(collection(db, 'courses', courseId, 'enrollments'), orderBy('enrolledAt', 'desc')))
                .then(snap => snap.docs.map(d => ({
                    studentId: d.id, ...d.data(),
                    enrolledAt: d.data().enrolledAt?.toDate() || new Date(),
                } as Enrollment)))
                .catch(() => [] as Enrollment[]),
            // Los módulos viven en la subcolección courses/{id}/modules (no en el doc).
            getDocs(query(collection(db, 'courses', courseId, 'modules'), orderBy('order')))
                .then(snap => snap.docs.map(d => {
                    const data = d.data() as any;
                    const cfg = data.config || {};
                    return {
                        id: d.id,
                        title: data.title || '',
                        type: data.type || 'teoria',
                        duration: cfg.duration || '',
                    };
                }))
                .catch(() => [] as any[]),
        ])
            .then(([courseData, enrollData, moduleData]) => {
                setCourse(courseData);
                setEnrollments(enrollData);
                setModules(moduleData);
            })
            .catch(() => toast.error('Error al cargar el curso'))
            .finally(() => setLoading(false));
    }, [courseId]);

    const handleToggleActive = async () => {
        if (!course) return;
        try {
            setActionLoading(true);
            const idToken = await getIdToken();
            const res = await fetch('/api/admin/courses', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({ id: courseId, isActive: !course.isActive }),
            });
            if (!res.ok) throw new Error((await res.json()).error);
            setCourse(c => c ? { ...c, isActive: !c.isActive } : c);
            toast.success(course.isActive ? 'Curso desactivado' : 'Curso activado');
        } catch (e: any) {
            toast.error(e.message || 'Error al cambiar estado');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('¿Eliminar este curso permanentemente? Esta acción no se puede deshacer.')) return;
        try {
            setActionLoading(true);
            const idToken = await getIdToken();
            const res = await fetch(`/api/admin/courses?id=${courseId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${idToken}` },
            });
            if (!res.ok) throw new Error((await res.json()).error);
            toast.success('Curso eliminado');
            router.push('/admin/courses');
        } catch (e: any) {
            toast.error(e.message || 'Error al eliminar');
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--muted)' }}>
                <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTop: '3px solid var(--brand)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                <style jsx>{`@keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }`}</style>
            </div>
        );
    }

    if (!course) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--muted)', gap: 16 }}>
                <AlertCircle size={48} color="#DC2626" />
                <h2 style={{ color: 'var(--foreground)', fontSize: 20, fontWeight: 700 }}>Curso no encontrado</h2>
                <p style={{ color: 'var(--text-secondary)' }}>El curso con ID {courseId} no existe o fue eliminado.</p>
                <button onClick={() => router.push('/admin/courses')} style={{ marginTop: 16, padding: '10px 20px', background: 'var(--brand)', color: 'var(--text-on-brand)', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    Volver a Cursos
                </button>
            </div>
        );
    }

    const filteredEnrollments = enrollments.filter(e =>
        searchTerm === '' ||
        (e.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.studentEmail || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCount = enrollments.filter(e => e.status === 'active').length;
    const completedCount = enrollments.filter(e => e.status === 'completed').length;

    const avgScore = enrollments.length > 0
        ? enrollments.reduce((s, e) => s + (e.avgScore || 0), 0) / enrollments.length
        : 0;

    const enrollColumns = [
        {
            key: 'studentName',
            label: 'Estudiante',
            render: (_: any, row: Enrollment) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', fontWeight: 700, fontSize: 14 }}>
                        {row.studentName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: 14 }}>{row.studentName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{row.studentEmail}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'completedModules',
            label: 'Progreso',
            render: (_: any, row: Enrollment) => {
                const total = Math.max(course.moduleCount || modules.length || 1, 1);
                const pct = Math.round(((row.completedModules || 0) / total) * 100);
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 80, height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? '#10B981' : 'var(--brand)', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{pct}%</span>
                    </div>
                );
            },
        },
        {
            key: 'avgScore',
            label: 'Promedio',
            render: (val: any) => (
                <span style={{ fontWeight: 700, fontSize: 14, color: val >= (course.minScore || 70) ? '#10B981' : '#F59E0B' }}>
                    {val?.toFixed(1) || '0.0'}%
                </span>
            ),
        },
        {
            key: 'status',
            label: 'Estado',
            render: (val: any) => (
                <span style={{ fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 20, background: val === 'completed' ? '#DCFCE7' : '#FEF3C7', color: val === 'completed' ? '#166534' : '#92400E', letterSpacing: '0.05em' }}>
                    {val === 'completed' ? 'COMPLETADO' : 'ACTIVO'}
                </span>
            ),
        },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Gestión Académica" />
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero
                    title={course.title}
                    subtitle={`Certificación: ${course.certification}`}
                    parentTitle="Cursos"
                    parentHref="/admin/courses"
                    actions={
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={handleToggleActive}
                                disabled={actionLoading}
                                style={{
                                    padding: '10px 16px', borderRadius: 12,
                                    background: course.isActive ? '#FEF3C7' : '#DCFCE7',
                                    color: course.isActive ? '#92400E' : '#166534',
                                    border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                }}
                            >
                                <Power size={15} /> {course.isActive ? 'Desactivar' : 'Activar'}
                            </button>
                            <button
                                onClick={() => router.push(`/admin/courses/${courseId}/edit`)}
                                style={{ padding: '10px 16px', borderRadius: 12, background: 'var(--card)', color: 'var(--text-secondary)', border: '1px solid var(--border)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                                <Edit2 size={15} /> Editar
                            </button>
                            <button
                                onClick={() => {
                                    if (enrollments.length === 0) return toast.error('No hay inscripciones');
                                    const csv = [
                                        ['Nombre', 'Email', 'Progreso', 'Promedio', 'Estado'].join(','),
                                        ...enrollments.map(e => [
                                            e.studentName, e.studentEmail,
                                            `${Math.round(((e.completedModules || 0) / Math.max(course.moduleCount || 1, 1)) * 100)}%`,
                                            e.avgScore?.toFixed(1) || '0', e.status,
                                        ].join(','))
                                    ].join('\n');
                                    const a = Object.assign(document.createElement('a'), {
                                        href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
                                        download: `inscritos-${course.title.toLowerCase().replace(/\s+/g, '-')}.csv`,
                                    });
                                    a.click();
                                    toast.success('Exportado');
                                }}
                                style={{ padding: '10px 16px', borderRadius: 12, background: 'var(--brand)', color: 'var(--text-on-brand)', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(24,0,173,0.2)' }}
                            >
                                <Download size={15} /> Exportar
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={actionLoading}
                                style={{ padding: '10px 16px', borderRadius: 12, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FEE2E2', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                                <Trash2 size={15} /> Eliminar
                            </button>
                        </div>
                    }
                />

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20, marginBottom: 24 }}>
                    {[
                        { icon: Users, label: 'Inscritos', value: enrollments.length, bg: 'var(--accent)', color: 'var(--brand)' },
                        { icon: CheckCircle, label: 'Activos', value: activeCount, bg: '#DCFCE7', color: '#10B981' },
                        { icon: Award, label: 'Completados', value: completedCount, bg: '#FEF3C7', color: '#F59E0B' },
                        { icon: BookOpen, label: 'Promedio', value: `${avgScore.toFixed(1)}%`, bg: 'var(--muted)', color: 'var(--text-secondary)' },
                        { icon: Layers, label: 'Módulos', value: modules.length || course.moduleCount || 0, bg: 'var(--muted)', color: 'var(--brand)' },
                    ].map(({ icon: Icon, label, value, bg, color }) => (
                        <div key={label} style={{ background: 'var(--card)', borderRadius: 16, padding: 20, border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                                    <Icon size={20} />
                                </div>
                                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
                            </div>
                            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--foreground)' }}>{value}</div>
                        </div>
                    ))}
                </div>

                {/* QR + Invite Code */}
                {course.inviteCode && (
                    <div style={{ background: 'var(--card)', borderRadius: 24, padding: 24, marginBottom: 24, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 32 }}>
                        <CourseQr inviteCode={course.inviteCode} courseTitle={course.title} />
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Código de Acceso</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 900, color: 'var(--brand)', letterSpacing: 4 }}>{course.inviteCode}</span>
                                <button onClick={() => { navigator.clipboard.writeText(course.inviteCode ?? ''); toast.success('Código copiado'); }} style={{ background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    <Copy size={14} />
                                </button>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Los estudiantes usan este código en la App SIERCP</div>
                        </div>
                    </div>
                )}

                {/* Modules list */}
                {modules.length > 0 && (
                    <div style={{ background: 'var(--card)', borderRadius: 24, padding: 24, marginBottom: 24, border: '1px solid var(--border)' }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, color: 'var(--foreground)' }}>Plan de Estudios</h3>
                        <div style={{ display: 'grid', gap: 8 }}>
                            {modules.map((m: any, i: number) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'var(--muted)', border: '1px solid var(--border)' }}>
                                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                                        {i + 1}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--foreground)' }}>{m.title}</div>
                                        {m.duration && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.duration}</div>}
                                    </div>
                                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 8, background: 'var(--accent)', color: 'var(--brand)' }}>
                                        {m.type === 'teoria' ? '📖 Teoría' : m.type === 'evaluacion_teorica' ? '📝 Evaluación' : m.type === 'practica_guiada' ? '❤️ Práctica' : '🏆 Cert.'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Enrollments */}
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 20 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Inscripciones</h3>
                        <div style={{ position: 'relative', maxWidth: 300 }}>
                            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Buscar estudiante..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', height: 44, padding: '0 16px 0 48px', borderRadius: 12, border: '1px solid var(--border)', fontSize: 14, outline: 'none', background: 'var(--muted)' }}
                            />
                        </div>
                    </div>
                    <DataTable columns={enrollColumns} data={filteredEnrollments} loading={loading} emptyMessage="No hay inscripciones en este curso." />
                </div>

                {/* Asistencia (impacta el gating de certificación) */}
                <AttendancePanel
                    courseId={courseId}
                    roster={enrollments.map(e => ({
                        studentId: e.studentId,
                        studentName: e.studentName,
                        attendanceRate: (e as { attendanceRate?: number }).attendanceRate,
                    }))}
                />

                {/* Certificados Tipo A retirados (S6.2) — reemplazados por Skills/Passport. */}
            </div>
        </div>
    );
}
