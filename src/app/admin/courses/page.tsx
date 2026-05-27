'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { CourseModel } from '@/models/course';
import { Plus, BookOpen, User, Users, ChevronRight, Search, FileText } from 'lucide-react';
import { PageHero } from '@/components/ui/page-hero';
import { DataTable } from '@/components/ui/data-table';
import { downloadCsv } from '@/shared/lib/export-utils';
import toast from 'react-hot-toast';

export default function AdminCoursesPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [courses, setCourses] = useState<CourseModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const institutionId: string | null = user?.institutionId ?? null;

    useEffect(() => {
        if (authLoading) return;
        if (!institutionId) { setLoading(false); return; }

        getDocs(query(
            collection(db, 'courses'),
            where('institutionId', '==', institutionId),
        ))
            .then(snap => setCourses(snap.docs.map(d => ({ ...d.data(), id: d.id } as CourseModel))))
            .catch(err => console.error('Error fetching courses:', err))
            .finally(() => setLoading(false));
    }, [institutionId, authLoading]);

    const filtered = courses.filter(c =>
        searchTerm === '' ||
        c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.instructorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.certification?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        {
            key: 'title',
            label: 'Curso / Programa',
            render: (_: any, row: CourseModel) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' }}>
                        <BookOpen size={22} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: 15 }}>{row.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{row.certification}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'instructorName',
            label: 'Instructor',
            render: (val: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <User size={14} style={{ color: 'var(--text-muted)' }} />
                    <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{val}</div>
                </div>
            )
        },
        {
            key: 'studentCount',
            label: 'Matrícula',
            render: (val: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                    <Users size={14} style={{ color: 'var(--text-muted)' }} />
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--foreground)' }}>{val}</div>
                </div>
            )
        },
        {
            key: 'isActive',
            label: 'Estado',
            render: (val: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: val ? '#10B981' : 'var(--border-strong)' }} />
                    <span style={{
                        fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 20,
                        background: val ? '#DCFCE7' : 'var(--muted)',
                        color: val ? '#166534' : 'var(--text-secondary)',
                        letterSpacing: '0.05em'
                    }}>
                        {val ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                </div>
            )
        },
        {
            key: 'actions',
            label: '',
            render: () => <ChevronRight size={18} style={{ color: 'var(--border-strong)' }} />
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Gestión Académica" />

            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero
                    title="Oferta Formativa"
                    subtitle={`Control centralizado de programas y cohortes (${courses.length} cursos activos)`}
                    parentTitle="Admin"
                    parentHref="/admin/dashboard"
                    actions={
                        <button onClick={() => router.push('/admin/courses/new')} style={{
                            padding: '10px 20px', borderRadius: 12, background: 'var(--brand)', color: 'var(--text-on-brand)',
                            border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                            boxShadow: '0 4px 12px rgba(24, 0, 173, 0.2)'
                        }}>
                            <Plus size={16} /> Crear Curso
                        </button>
                    }
                />

                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 20 }}>
                        <div style={{ position: 'relative', maxWidth: 400, flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Buscar por título, instructor o certificación..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%', height: 48, padding: '0 16px 0 48px', borderRadius: 14, border: '1px solid var(--border)',
                                    fontSize: 14, outline: 'none', transition: 'all 0.2s', background: 'var(--muted)'
                                }}
                            />
                        </div>
                        <button onClick={() => {
                            if (courses.length === 0) return toast.error('No hay cursos para exportar');
                            downloadCsv(courses.map(c => ({
                                Curso: c.title,
                                Instructor: c.instructorName,
                                Certificación: c.certification,
                                Matrícula: c.studentCount ?? 0,
                                Estado: c.isActive ? 'Activo' : 'Inactivo'
                            })), 'oferta-formativa');
                            toast.success('Reporte exportado');
                        }} style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'var(--card)',
                            border: '1px solid var(--border)', borderRadius: 12, fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', cursor: 'pointer'
                        }}>
                            <FileText size={16} /> Exportar Reporte
                        </button>
                    </div>

                    <DataTable
                        columns={columns}
                        data={filtered}
                        loading={loading}
                        onRowClick={(row) => router.push(`/admin/courses/${row.id}`)}
                        emptyMessage="No se han encontrado cursos que coincidan con los criterios de búsqueda."
                    />
                </div>
            </div>
        </div>
    );
}
