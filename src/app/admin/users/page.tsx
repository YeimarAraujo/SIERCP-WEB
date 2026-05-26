'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { getFullName } from '@/models/user';
import type { UserModel } from '@/models/user';
import { Search, Shield, UserCircle, ChevronRight, UserPlus, FileText } from 'lucide-react';
import { PageHero } from '@/components/ui/page-hero';
import { DataTable } from '@/components/ui/data-table';
import { downloadCsv } from '@/shared/lib/export-utils';
import toast from 'react-hot-toast';

const ROLE_STYLES: Record<string, { bg: string, color: string }> = {
    ADMIN: { bg: '#F3E8FF', color: '#7E22CE' },
    INSTRUCTOR: { bg: 'var(--accent)', color: 'var(--brand)' },
    USUARIO: { bg: 'var(--muted)', color: 'var(--text-secondary)' },
    USUARIO_SST: { bg: '#ECFDF5', color: '#059669' },
    USUARIO_PROFESIONAL: { bg: '#EEF0FF', color: '#1800AD' },
};

export default function AdminUsersPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [users, setUsers] = useState<UserModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const institutionId: string | null = user?.institutionId ?? null;

    useEffect(() => {
        if (authLoading) return;
        if (!institutionId) { setLoading(false); return; }

        const fetchUsers = async () => {
            try {
                const memSnap = await getDocs(query(
                    collection(db, 'memberships'),
                    where('institutionId', '==', institutionId),
                    where('isActive', '==', true),
                ));
                const userDocs = await Promise.all(
                    memSnap.docs.map(m => getDoc(doc(db, 'users', m.data().userId)))
                );
                setUsers(userDocs.filter(s => s.exists()).map(s => ({ ...s.data(), uid: s.id } as UserModel)));
            } catch (err) {
                console.error('Error fetching users:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [institutionId, authLoading]);

    const filtered = users.filter((u) =>
        getFullName(u).toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()),
    );

    const columns = [
        {
            key: 'name',
            label: 'Usuario',
            render: (_: any, u: UserModel) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontWeight: 700 }}>
                        {u.firstName?.charAt(0) || u.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: 14 }}>{getFullName(u)}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'role',
            label: 'Rol',
            render: (val: any) => {
                const style = ROLE_STYLES[val] || ROLE_STYLES.USUARIO;
                return (
                    <span style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20,
                        background: style.bg, color: style.color, fontSize: 11, fontWeight: 800, letterSpacing: '0.02em'
                    }}>
                        {val === 'ADMIN' ? <Shield size={12} /> : val === 'INSTRUCTOR' ? <UserCircle size={12} /> : null}
                        {val}
                    </span>
                );
            }
        },
        {
            key: 'isActive',
            label: 'Estado',
            render: (val: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: val ? '#10B981' : '#EF4444', boxShadow: `0 0 0 4px ${val ? '#10B98120' : '#EF444420'}` }} />
                    <span style={{ color: val ? '#059669' : '#DC2626', fontWeight: 700, fontSize: 13 }}>
                        {val ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                </div>
            )
        },
        {
            key: 'sessions',
            label: 'Actividad',
            render: (_: any, u: UserModel) => (
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--foreground)' }}>{u.stats?.totalSessions ?? 0}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>SESIONES</div>
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
            <Header title="Gestión de Usuarios" />
            
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero 
                    title="Control de Accesos" 
                    subtitle={`Administración centralizada de identidades (${users.length} perfiles activos)`} 
                    parentTitle="Admin"
                    parentHref="/admin/dashboard"
                    actions={
                        <button onClick={() => router.push('/admin/users/new')} style={{
                            padding: '10px 20px', borderRadius: 12, background: 'var(--brand)', color: 'var(--text-on-brand)',
                            border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                            boxShadow: '0 4px 12px rgba(24, 0, 173, 0.2)'
                        }}>
                            <UserPlus size={16} /> Crear Usuario
                        </button>
                    }
                />

                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 20 }}>
                        <div style={{ position: 'relative', maxWidth: 400, flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por nombre, correo o rol..."
                                style={{
                                    width: '100%', height: 48, padding: '0 16px 0 48px', borderRadius: 14, border: '1px solid var(--border)',
                                    fontSize: 14, outline: 'none', transition: 'all 0.2s', background: 'var(--muted)'
                                }}
                            />
                        </div>
                        <button onClick={() => {
                            if (users.length === 0) return toast.error('No hay usuarios para exportar');
                            downloadCsv(users.map(u => ({
                                Usuario: getFullName(u),
                                Email: u.email,
                                Rol: u.role,
                                Estado: u.isActive ? 'Activo' : 'Inactivo',
                                Sesiones: u.stats?.totalSessions ?? 0
                            })), 'reporte-global-usuarios');
                            toast.success('Reporte exportado');
                        }} style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'var(--card)', 
                            border: '1px solid var(--border)', borderRadius: 12, fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', cursor: 'pointer'
                        }}>
                            <FileText size={16} /> Reporte Global
                        </button>
                    </div>
                    <DataTable 
                        columns={columns}
                        data={filtered}
                        loading={loading}
                        onRowClick={(row) => router.push(`/admin/users/${row.uid}`)}
                        emptyMessage="No se encontraron usuarios registrados con esos criterios."
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
