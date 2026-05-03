'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { UserService } from '@/services/firestore.service';
import { getFullName } from '@/models/user';
import type { UserModel } from '@/models/user';

const ROLE_COLORS: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-700',
    INSTRUCTOR: 'bg-blue-100 text-blue-700',
    ESTUDIANTE: 'bg-gray-100 text-gray-700',
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

                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nombre o correo..."
                    className="w-full max-w-sm h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />

                {loading ? (
                    <div className="space-y-2">
                        {[...Array(6)].map((_, i) => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}
                    </div>
                ) : (
                    <div className="rounded-lg border border-border overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted text-muted-foreground text-xs uppercase">
                                <tr>
                                    {['Nombre', 'Correo', 'Rol', 'Estado', 'Sesiones'].map((h) => (
                                        <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filtered.map((u) => (
                                    <tr key={u.uid} className="bg-card hover:bg-accent/50 transition-colors">
                                        <td className="px-4 py-3 font-medium">{getFullName(u)}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[u.role] ?? ''}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {u.isActive ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground tabular-nums">
                                            {u.stats?.totalSessions ?? 0}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filtered.length === 0 && (
                            <div className="p-8 text-center text-sm text-muted-foreground">
                                No se encontraron usuarios.
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
