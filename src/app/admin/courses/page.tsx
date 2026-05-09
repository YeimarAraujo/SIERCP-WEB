'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';
import { CourseService } from '@/services/firestore.service';
import type { CourseModel } from '@/models/course';
import { Edit2, Trash2, Plus, BookOpen, User, Users, ChevronRight, Search, FileText } from 'lucide-react';
import { PageHero } from '@/components/ui/page-hero';
import { DataTable } from '@/components/ui/data-table';

export default function AdminCoursesPage() {
    const [courses, setCourses] = useState<CourseModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        CourseService.getAll()
            .then(setCourses)
            .finally(() => setLoading(false));
    }, []);

    const columns = [
        {
            key: 'title',
            label: 'Curso / Programa',
            render: (_: any, row: CourseModel) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1800AD' }}>
                        <BookOpen size={22} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 15 }}>{row.title}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{row.certification}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'instructorName',
            label: 'Instructor',
            render: (val: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <User size={14} style={{ color: '#94A3B8' }} />
                    <div style={{ color: '#475569', fontWeight: 600 }}>{val}</div>
                </div>
            )
        },
        {
            key: 'studentCount',
            label: 'Matrícula',
            render: (val: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                    <Users size={14} style={{ color: '#94A3B8' }} />
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{val}</div>
                </div>
            )
        },
        {
            key: 'isActive',
            label: 'Estado',
            render: (val: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: val ? '#10B981' : '#CBD5E1' }} />
                    <span style={{ 
                        fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 20,
                        background: val ? '#DCFCE7' : '#F1F5F9',
                        color: val ? '#166534' : '#64748B',
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
            render: () => <ChevronRight size={18} style={{ color: '#CBD5E1' }} />
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
            <Header title="Gestión Académica" />
            
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero 
                    title="Oferta Formativa" 
                    subtitle={`Control centralizado de programas y cohortes (${courses.length} cursos activos)`} 
                    parentTitle="Admin"
                    parentHref="/admin/dashboard"
                    actions={
                        <button style={{
                            padding: '10px 20px', borderRadius: 12, background: '#1800AD', color: '#FFFFFF',
                            border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                            boxShadow: '0 4px 12px rgba(24, 0, 173, 0.2)'
                        }}>
                            <Plus size={16} /> Crear Curso
                        </button>
                    }
                />

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 20 }}>
                        <div style={{ position: 'relative', maxWidth: 400, flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                            <input
                                type="text"
                                placeholder="Buscar por título, instructor o certificación..."
                                style={{
                                    width: '100%', height: 48, padding: '0 16px 0 48px', borderRadius: 14, border: '1px solid #E2E8F0',
                                    fontSize: 14, outline: 'none', transition: 'all 0.2s', background: '#F8FAFC'
                                }}
                            />
                        </div>
                        <button style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#FFFFFF', 
                            border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 13, fontWeight: 700, color: '#64748B', cursor: 'pointer'
                        }}>
                            <FileText size={16} /> Exportar Reporte
                        </button>
                    </div>

                    <DataTable 
                        columns={columns}
                        data={courses}
                        loading={loading}
                        emptyMessage="No se han encontrado cursos que coincidan con los criterios de búsqueda."
                    />
                </div>
            </div>
            <style jsx>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}
