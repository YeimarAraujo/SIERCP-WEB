'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import { DataTable } from '@/components/ui/data-table';
import { Upload, UserPlus, Search, FileText, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { downloadCsv } from '@/shared/lib/export-utils';
import toast from 'react-hot-toast';
import { getFullName } from '@/models/user';
import type { UserModel } from '@/models/user';

const STUDENT_ROLES = ['USUARIO', 'USUARIO_SST', 'USUARIO_PROFESIONAL', 'STUDENT'];

export default function AdminStudentsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [students, setStudents] = useState<UserModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const institutionId: string | null = user?.institutionId ?? null;

    useEffect(() => {
        if (authLoading) return;
        if (!institutionId) { setLoading(false); return; }

        const fetchStudents = async () => {
            try {
                // Obtener memberships activas con rol de estudiante en esta institución
                const memSnap = await getDocs(query(
                    collection(db, 'memberships'),
                    where('institutionId', '==', institutionId),
                    where('isActive', '==', true),
                ));
                // Scope por sede: un admin de sede (user.sedeId) solo ve estudiantes
                // de SU sede; el admin principal (sin sedeId) ve toda la institución.
                const scopeSedeId = user?.sedeId;
                const studentMemberships = memSnap.docs
                    .map(d => d.data())
                    .filter(m => STUDENT_ROLES.includes(m.role))
                    .filter(m => !scopeSedeId || m.sedeId === scopeSedeId);

                // Fetch user docs en paralelo
                const userDocs = await Promise.all(
                    studentMemberships.map(m => getDoc(doc(db, 'users', m.userId)))
                );
                const users = userDocs
                    .filter(s => s.exists())
                    .map(s => ({ ...s.data(), uid: s.id } as UserModel));
                setStudents(users);
            } catch (err) {
                console.error('Error fetching students:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [institutionId, authLoading, user?.sedeId]);

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
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', fontWeight: 700 }}>
                        {getFullName(row).charAt(0) || 'E'}
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: 14 }}>{getFullName(row)}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>ID: {row.identification || '—'}</div>
                    </div>
                </div>
            )
        },
        { key: 'email', label: 'Correo Electrónico' },
        {
            key: 'coursesCount',
            label: 'Matrículas',
            render: (_: any, row: UserModel) => (
                <div style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-secondary)' }}>
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
            render: () => <ChevronRight size={18} style={{ color: 'var(--border-strong)' }} />
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
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
                                    padding: '10px 18px', borderRadius: 12, background: 'var(--card)', color: 'var(--text-secondary)',
                                    border: '1px solid var(--border)', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 8
                                }}
                            >
                                <Upload size={16} /> Importar CSV
                            </button>
                            <button
                                onClick={() => router.push('/admin/students/new')}
                                style={{
                                    padding: '10px 18px', borderRadius: 12, background: 'var(--brand)', color: 'var(--text-on-brand)',
                                    border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(24, 0, 173, 0.2)'
                                }}
                            >
                                <UserPlus size={16} /> Nuevo Alumno
                            </button>
                        </div>
                    }
                />

                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 20 }}>
                        <div style={{ position: 'relative', maxWidth: 400, flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por nombre, ID o correo..."
                                style={{
                                    width: '100%', height: 48, padding: '0 16px 0 48px', borderRadius: 14, border: '1px solid var(--border)',
                                    fontSize: 14, outline: 'none', transition: 'all 0.2s', background: 'var(--muted)'
                                }}
                            />
                        </div>
                        <button onClick={() => {
                            if (students.length === 0) return toast.error('No hay estudiantes para exportar');
                            downloadCsv(students.map(s => ({
                                Estudiante: getFullName(s),
                                Email: s.email,
                                ID: s.identification || '—',
                                Estado: s.status === 'ACTIVE' ? 'Activo' : 'Pendiente'
                            })), 'reporte-matricula');
                            toast.success('Reporte exportado');
                        }} style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'var(--card)',
                            border: '1px solid var(--border)', borderRadius: 12, fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', cursor: 'pointer'
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
