'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { DataTable } from '@/components/ui/data-table';
import { UserPlus, Search, ShieldCheck, Mail, BookOpen, ChevronRight, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { UserService, CourseService } from '@/services/firestore.service';
import type { UserModel } from '@/models/user';

export default function AdminInstructorsPage() {
    const router = useRouter();
    const [instructors, setInstructors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchInstructors = async () => {
            try {
                setLoading(true);
                const allUsers = await UserService.getAll();
                const instructorUsers = allUsers.filter(u => u.role === 'INSTRUCTOR');
                
                // Enriquecer con conteo de cursos
                const enriched = await Promise.all(instructorUsers.map(async (u) => {
                    const courses = await CourseService.getByInstructor(u.uid);
                    return {
                        ...u,
                        coursesCount: courses.length,
                        studentsCount: courses.reduce((acc, c) => acc + (c.studentCount || 0), 0)
                    };
                }));

                setInstructors(enriched);
            } catch (error) {
                console.error('Error fetching instructors:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInstructors();
    }, []);

    const filteredInstructors = instructors.filter(i => 
        i.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        { 
            key: 'displayName', 
            label: 'Instructor',
            render: (_: any, row: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', fontWeight: 700 }}>
                        {row.displayName?.charAt(0) || 'I'}
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: 14 }}>{row.displayName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{row.specialty || 'Instructor RCP'}</div>
                    </div>
                </div>
            )
        },
        { 
            key: 'email', 
            label: 'Contacto',
            render: (val: string) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
                    <Mail size={14} /> {val}
                </div>
            )
        },
        { 
            key: 'coursesCount', 
            label: 'Carga Académica',
            render: (_: any, row: any) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>{row.coursesCount} Cursos</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.studentsCount} Alumnos totales</div>
                </div>
            )
        },
        {
            key: 'status', 
            label: 'Estado',
            render: (val: string) => (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: '#DCFCE7', color: '#166534', fontSize: 11, fontWeight: 800 }}>
                    <UserCheck size={12} /> ACTIVO
                </div>
            ),
        },
        {
            key: 'actions',
            label: '',
            render: (_: any, row: any) => (
                <button 
                    onClick={() => router.push(`/admin/instructors/${row.uid}`)}
                    style={{ background: 'none', border: 'none', color: 'var(--border-strong)', cursor: 'pointer', padding: 8 }}
                >
                    <ChevronRight size={20} />
                </button>
            )
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Gestión de Facultad" />
            
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero 
                    title="Directorio de Instructores" 
                    subtitle="Administración de credenciales, asignación de cursos y seguimiento docente"
                    parentTitle="Admin"
                    parentHref="/admin/dashboard"
                    actions={
                        <button 
                            onClick={() => router.push('/admin/instructors/new')}
                            style={{ 
                                padding: '12px 24px', borderRadius: 14, background: 'var(--brand)', color: 'var(--text-on-brand)', 
                                border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', 
                                display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 12px rgba(24, 0, 173, 0.2)' 
                            }}
                        >
                            <UserPlus size={18} /> Registrar Instructor
                        </button>
                    }
                />

                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
                            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o correo..."
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
                        data={filteredInstructors}
                        loading={loading}
                        emptyMessage="No se han encontrado instructores registrados en la base de datos institucional."
                    />
                </div>
            </div>
        </div>
    );
}
