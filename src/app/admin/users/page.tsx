'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';
import { UserService } from '@/services/firestore.service';
import { getFullName } from '@/models/user';
import type { UserModel } from '@/models/user';
import { Search, User, Mail, Shield, UserCircle } from 'lucide-react';

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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Header title="Gestión de usuarios" />
            <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <PageHeader
                        title="Gestión de usuarios"
                        subtitle={`Administra las cuentas y roles del sistema (${users.length} usuarios)`}
                    />
                    <div style={{ position: 'relative', width: 320 }}>
                        <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por nombre o correo..."
                            style={{
                                width: '100%', height: 44, padding: '0 12px 0 40px', borderRadius: 12, border: '1px solid #E2E8F0',
                                fontSize: 14, outline: 'none', transition: 'border-color 0.2s', background: '#FFFFFF'
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = '#1800AD'}
                            onBlur={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'grid', gap: 12 }}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} style={{ height: 64, background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: 12, animation: 'pulse 2s infinite' }} />
                        ))}
                    </div>
                ) : (
                    <div style={{ background: '#FFFFFF', border: '1px solid #E2E4F0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E4F0' }}>
                                <tr>
                                    <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em' }}>Usuario</th>
                                    <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em' }}>Rol</th>
                                    <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em' }}>Estado</th>
                                    <th style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em' }}>Sesiones</th>
                                    <th style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((u) => {
                                    const style = ROLE_STYLES[u.role] || ROLE_STYLES.ESTUDIANTE;
                                    return (
                                        <tr key={u.uid} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                                                        <User size={18} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{getFullName(u)}</div>
                                                        <div style={{ fontSize: 12, color: '#64748B' }}>{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <span style={{ 
                                                    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20,
                                                    background: style.bg, color: style.color, fontSize: 11, fontWeight: 700
                                                }}>
                                                    {u.role === 'ADMIN' ? <Shield size={12} /> : u.role === 'INSTRUCTOR' ? <UserCircle size={12} /> : null}
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: u.isActive ? '#10B981' : '#EF4444' }} />
                                                    <span style={{ color: u.isActive ? '#059669' : '#DC2626', fontWeight: 500 }}>
                                                        {u.isActive ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 20px', textAlign: 'center', color: '#0F172A', fontWeight: 600 }}>
                                                {u.stats?.totalSessions ?? 0}
                                            </td>
                                            <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                                <button style={{ background: 'none', border: 'none', color: '#1800AD', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                                                    Editar
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filtered.length === 0 && (
                            <div style={{ padding: 48, textAlign: 'center', color: '#64748B', fontSize: 14 }}>
                                No se encontraron usuarios que coincidan con la búsqueda.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
