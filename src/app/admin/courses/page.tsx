'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { DataTable } from '@/components/ui/data-table';
import { downloadCsv } from '@/shared/lib/export-utils';
import toast from 'react-hot-toast';
import { Plus, BookOpen, Users, ChevronRight, Search, FileText } from 'lucide-react';

export default function AdminCoursesPage() {
    const router = useRouter();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const { getAuth } = await import('firebase/auth');
            const idToken = await getAuth().currentUser?.getIdToken();
            if (!idToken) { toast.error('No autenticado'); return; }

            const res = await fetch('/api/admin/courses', {
                headers: { Authorization: `Bearer ${idToken}` },
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                console.error('API error:', data.error);
                toast.error(data.error || 'Error al cargar los cursos');
                return;
            }
            setCourses(data.courses || []);
        } catch (err) {
            console.error(err);
            toast.error('Error al cargar los cursos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCourses(); }, []);

    const filtered = courses.filter(c =>
        searchTerm === '' ||
        (c.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.certification || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCourses = courses.filter(c => c.isActive).length;
    const totalStudents = courses.reduce((sum, c) => sum + (c.studentCount || 0), 0);

    const columns = [
        {
            key: 'title',
            label: 'Curso / Programa',
            render: (_: any, row: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)',
                    }}>
                        <BookOpen size={22} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: 15 }}>{row.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>
                            {row.certification || '—'} · {(row.modules?.length || row.moduleCount || 0)} módulos
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: 'studentCount',
            label: 'Inscritos',
            render: (val: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Users size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--foreground)' }}>{val || 0}</span>
                </div>
            ),
        },
        {
            key: 'minScore',
            label: 'Puntaje mín.',
            render: (val: any) => (
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>{val || 85}%</span>
            ),
        },
        {
            key: 'inviteCode',
            label: 'Código',
            render: (val: any) => (
                <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 14, color: 'var(--foreground)', letterSpacing: 2 }}>
                    {val || '—'}
                </span>
            ),
        },
        {
            key: 'isActive',
            label: 'Estado',
            render: (val: any) => (
                <span style={{
                    fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 20,
                    background: val ? '#DCFCE7' : 'var(--muted)',
                    color: val ? '#166534' : 'var(--text-secondary)',
                    letterSpacing: '0.05em',
                }}>
                    {val ? 'ACTIVO' : 'INACTIVO'}
                </span>
            ),
        },
        {
            key: 'actions',
            label: '',
            render: () => <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />,
        },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Gestión Académica" />
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero
                    title="Oferta Formativa"
                    subtitle={`${activeCourses} cursos activos · ${totalStudents} estudiantes inscritos`}
                    parentTitle="Admin"
                    parentHref="/admin/dashboard"
                    actions={
                        <button onClick={() => router.push('/admin/courses/new')} style={{
                            padding: '10px 20px', borderRadius: 12, background: 'var(--brand)', color: 'var(--text-on-brand)',
                            border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                            boxShadow: '0 4px 12px rgba(24, 0, 173, 0.2)',
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
                                placeholder="Buscar por título o certificación..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', height: 48, padding: '0 16px 0 48px', borderRadius: 14, border: '1px solid var(--border)', fontSize: 14, outline: 'none', background: 'var(--muted)' }}
                            />
                        </div>
                        <button onClick={() => {
                            if (courses.length === 0) return toast.error('No hay cursos para exportar');
                            downloadCsv(courses.map(c => ({
                                Título: c.title,
                                Certificación: c.certification || '',
                                Inscritos: c.studentCount || 0,
                                'Puntaje mín.': c.minScore || 85,
                                Código: c.inviteCode || '',
                                Estado: c.isActive ? 'Activo' : 'Inactivo',
                            })), 'oferta-formativa');
                            toast.success('Reporte exportado');
                        }} style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'var(--card)',
                            border: '1px solid var(--border)', borderRadius: 12, fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', cursor: 'pointer',
                        }}>
                            <FileText size={16} /> Exportar
                        </button>
                    </div>

                    <DataTable
                        columns={columns}
                        data={filtered}
                        loading={loading}
                        onRowClick={(row) => router.push(`/admin/courses/${row.id}`)}
                        emptyMessage="No hay cursos creados. Crea uno nuevo."
                    />
                </div>
            </div>
        </div>
    );
}
