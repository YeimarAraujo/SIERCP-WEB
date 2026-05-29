'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { DataTable } from '@/components/ui/data-table';
import { downloadCsv } from '@/shared/lib/export-utils';
import toast from 'react-hot-toast';
import { Plus, BookOpen, Users, ChevronRight, Search, FileText, Layers } from 'lucide-react';

interface TemplateWithCohorts {
    id: string;
    title: string;
    slug: string;
    description: string;
    level: string;
    isActive: boolean;
    icon: string;
    modules: any[];
    cohorts: any[];
    priceCOP: number;
    isAutomated: boolean;
}

export default function AdminCoursesPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<TemplateWithCohorts[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const { getAuth } = await import('firebase/auth');
            const auth = getAuth();
            const idToken = await auth.currentUser?.getIdToken();
            if (!idToken) return;

            const res = await fetch('/api/admin/courses', {
                headers: { Authorization: `Bearer ${idToken}` },
            });
            const data = await res.json();

            if (data.templates) {
                const cohortsRes = await fetch('/api/admin/cohorts', {
                    headers: { Authorization: `Bearer ${idToken}` },
                });
                const cohortsData = await cohortsRes.json();
                const cohortsByTemplate: Record<string, any[]> = {};
                for (const c of cohortsData.cohorts || []) {
                    if (!cohortsByTemplate[c.templateId]) cohortsByTemplate[c.templateId] = [];
                    cohortsByTemplate[c.templateId].push(c);
                }

                setTemplates(
                    data.templates.map((t: any) => ({
                        ...t,
                        cohorts: cohortsByTemplate[t.id] || [],
                    })),
                );
            }
        } catch (err) {
            console.error('Error fetching templates:', err);
            toast.error('Error al cargar los cursos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const filtered = templates.filter(c =>
        searchTerm === '' ||
        (c.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.slug || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalEnrolled = templates.reduce(
        (sum, t) => sum + t.cohorts.reduce((s: number, c: any) => s + (c.enrolledCount || 0), 0),
        0,
    );
    const openCohorts = templates.reduce(
        (sum, t) => sum + t.cohorts.filter((c: any) => c.status === 'OPEN').length,
        0,
    );

    const columns = [
        {
            key: 'title',
            label: 'Curso / Programa',
            render: (_: any, row: TemplateWithCohorts) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: row.isAutomated ? '#EEF2FF' : 'var(--muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: row.isAutomated ? '#6366F1' : 'var(--brand)',
                    }}>
                        <BookOpen size={22} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: 15 }}>{row.title}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            {row.isAutomated && (
                                <span style={{
                                    fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 20,
                                    background: '#EEF2FF', color: '#4338CA', letterSpacing: '0.05em',
                                }}>
                                    AUTO
                                </span>
                            )}
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
                                {row.modules?.length || 0} módulos
                            </span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'cohorts',
            label: 'Grupos',
            render: (_: any, row: TemplateWithCohorts) => {
                const open = row.cohorts.filter((c: any) => c.status === 'OPEN').length;
                const total = row.cohorts.length;
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Layers size={14} style={{ color: 'var(--text-muted)' }} />
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--foreground)' }}>{total}</div>
                            <div style={{ fontSize: 10, color: open > 0 ? '#10B981' : 'var(--text-muted)', fontWeight: 700 }}>
                                {open} abierto{open !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'enrolledCount',
            label: 'Inscritos',
            render: (_: any, row: TemplateWithCohorts) => {
                const enrolled = row.cohorts.reduce((s: number, c: any) => s + (c.enrolledCount || 0), 0);
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                        <Users size={14} style={{ color: 'var(--text-muted)' }} />
                        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--foreground)' }}>{enrolled}</div>
                    </div>
                );
            },
        },
        {
            key: 'priceCOP',
            label: 'Precio',
            render: (val: any) => (
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0)}
                </div>
            ),
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
                    subtitle={`Control centralizado de programas y grupos (${templates.length} cursos, ${openCohorts} grupos abiertos)`}
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
                                placeholder="Buscar por título o slug..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%', height: 48, padding: '0 16px 0 48px', borderRadius: 14, border: '1px solid var(--border)',
                                    fontSize: 14, outline: 'none', transition: 'all 0.2s', background: 'var(--muted)'
                                }}
                            />
                        </div>
                        <button onClick={() => {
                            if (templates.length === 0) return toast.error('No hay cursos para exportar');
                            downloadCsv(templates.map(t => ({
                                Curso: t.title,
                                Slug: t.slug,
                                'Grupos': t.cohorts.length,
                                'Inscritos': t.cohorts.reduce((s: number, c: any) => s + (c.enrolledCount || 0), 0),
                                'Precio COP': t.priceCOP || 0,
                                Estado: t.isActive ? 'Activo' : 'Inactivo'
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
                        emptyMessage="No se han encontrado cursos. Crea uno nuevo."
                    />
                </div>
            </div>
        </div>
    );
}