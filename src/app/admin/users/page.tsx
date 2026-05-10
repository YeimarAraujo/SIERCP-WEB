'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';
import { UserService } from '@/services/firestore.service';
import { getFullName } from '@/models/user';
import type { UserModel } from '@/models/user';
import { Search, User, Mail, Shield, UserCircle, ChevronRight, UserPlus, FileText } from 'lucide-react';
import { PageHero } from '@/components/ui/page-hero';
import { DataTable } from '@/components/ui/data-table';

const ROLE_STYLES: Record<string, { bg: string, color: string }> = {
    ADMIN: { bg: '#F3E8FF', color: '#7E22CE' },
    INSTRUCTOR: { bg: '#E0E7FF', color: '#1D4ED8' },
    ESTUDIANTE: { bg: '#F1F5F9', color: '#475569' },
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        UserService.getAll().then(setUsers).finally(() => setLoading(false));
    }, []);

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
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontWeight: 700 }}>
                        {u.firstName?.charAt(0) || u.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 14 }}>{getFullName(u)}</div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>{u.email}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'role',
            label: 'Rol',
            render: (val: any) => {
                const style = ROLE_STYLES[val] || ROLE_STYLES.ESTUDIANTE;
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
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{u.stats?.totalSessions ?? 0}</div>
                    <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700 }}>SESIONES</div>
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
            <Header title="Gestión de Usuarios" />
            
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero 
                    title="Control de Accesos" 
                    subtitle={`Administración centralizada de identidades (${users.length} perfiles activos)`} 
                    parentTitle="Admin"
                    parentHref="/admin/dashboard"
                    actions={
                        <button style={{
                            padding: '10px 20px', borderRadius: 12, background: '#1800AD', color: '#FFFFFF',
                            border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                            boxShadow: '0 4px 12px rgba(24, 0, 173, 0.2)'
                        }}>
                            <UserPlus size={16} /> Crear Usuario
                        </button>
                    }
                />

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 20 }}>
                        <div style={{ position: 'relative', maxWidth: 400, flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por nombre, correo o rol..."
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
                            <FileText size={16} /> Reporte Global
                        </button>
                    </div>
                    <DataTable 
                        columns={columns}
                        data={filtered}
                        loading={loading}
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
