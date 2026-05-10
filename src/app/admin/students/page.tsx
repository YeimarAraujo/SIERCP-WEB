'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { DataTable } from '@/components/ui/data-table';
import { Upload, UserPlus, Search, FileText, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { UserService } from '@/services/firestore.service';
import { downloadCsv } from '@/shared/lib/export-utils';
import toast from 'react-hot-toast';
import { getFullName } from '@/models/user';
import { ROLE_STUDENT } from '@/shared/lib/constants';
import type { UserModel } from '@/models/user';

export default function AdminStudentsPage() {
    const router = useRouter();
    const [students, setStudents] = useState<UserModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        UserService.getAll()
            .then(users => users.filter(u => u.role === ROLE_STUDENT))
            .then(setStudents)
            .finally(() => setLoading(false));
    }, []);

    const filtered = students.filter(u =>
        getFullName(u).toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        {
            key: 'displayName',
            label: 'Estudiante',
            render: (_: any, row: UserModel) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1800AD', fontWeight: 700 }}>
                        {getFullName(row).charAt(0) || 'E'}
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 14 }}>{getFullName(row)}</div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>ID: {row.identificacion || '—'}</div>
                    </div>
                </div>
            )
        },
        { key: 'email', label: 'Correo Electrónico' },
        {
            key: 'coursesCount',
            label: 'Matrículas',
            render: (_: any, row: UserModel) => (
                <div style={{ textAlign: 'center', fontWeight: 700, color: '#475569' }}>
                    {row.stats?.totalSessions || 0} cursos
                </div>
            )
        },
        {
            key: 'status',
            label: 'Estado',
            render: (val: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: val === 'ACTIVE' ? '#10B981' : '#F59E0B' }} />
                    <span style={{
                        fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 20,
                        background: val === 'ACTIVE' ? '#DCFCE7' : '#FEF3C7',
                        color: val === 'ACTIVE' ? '#166534' : '#92400E',
                        letterSpacing: '0.05em'
                    }}>
                        {val === 'ACTIVE' ? 'ACTIVO' : 'PENDIENTE'}
                    </span>
                </div>
            ),
        },
        {
            key: 'actions',
            label: '',
            render: () => <ChevronRight size={18} style={{ color: '#CBD5E1' }} />
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
            <Header title="Gestión Estudiantil" />

            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero
                    title="Directorio de Alumnos"
                    subtitle={`Administración integral de expedientes académicos (${students.length} estudiantes registrados)`}
                    parentTitle="Admin"
                    parentHref="/admin/dashboard"
                    actions={
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => router.push('/admin/students/import')}
                                style={{
                                    padding: '10px 18px', borderRadius: 12, background: '#FFFFFF', color: '#64748B',
                                    border: '1px solid #E2E8F0', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 8
                                }}
                            >
                                <Upload size={16} /> Importar CSV
                            </button>
                            <button
                                onClick={() => router.push('/admin/students/new')}
                                style={{
                                    padding: '10px 18px', borderRadius: 12, background: '#1800AD', color: '#FFFFFF',
                                    border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(24, 0, 173, 0.2)'
                                }}
                            >
                                <UserPlus size={16} /> Nuevo Alumno
                            </button>
                        </div>
                    }
                />

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 20 }}>
                        <div style={{ position: 'relative', maxWidth: 400, flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por nombre, ID o correo..."
                                style={{
                                    width: '100%', height: 48, padding: '0 16px 0 48px', borderRadius: 14, border: '1px solid #E2E8F0',
                                    fontSize: 14, outline: 'none', transition: 'all 0.2s', background: '#F8FAFC'
                                }}
                            />
                        </div>
                        <button onClick={() => {
                            if (students.length === 0) return toast.error('No hay estudiantes para exportar');
                            downloadCsv(students.map(s => ({
                                Estudiante: getFullName(s),
                                Email: s.email,
                                ID: s.identificacion || '—',
                                Estado: s.status === 'ACTIVE' ? 'Activo' : 'Pendiente'
                            })), 'reporte-matricula');
                            toast.success('Reporte exportado');
                        }} style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#FFFFFF',
                            border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 13, fontWeight: 700, color: '#64748B', cursor: 'pointer'
                        }}>
                            <FileText size={16} /> Reporte de Matrícula
                        </button>
                    </div>

                    <DataTable
                        columns={columns}
                        data={filtered}
                        loading={loading}
                        onRowClick={(row) => router.push(`/admin/students/${row.uid}`)}
                        emptyMessage="No se han encontrado estudiantes registrados en la base de datos institucional."
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
