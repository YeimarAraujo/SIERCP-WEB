'use client';

import { useAuth } from '@/hooks/use-auth';
import { RoleGuard } from '@/components/layout/role-guard';
import { ROLE_ADMIN, ROLE_SUPER_ADMIN } from '@/lib/constants';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();

    return (
        <RoleGuard allowedRoles={[ROLE_ADMIN, ROLE_SUPER_ADMIN]}>
            <div className="min-h-screen bg-background">
                <header className="border-b">
                    <div className="container mx-auto flex h-16 items-center justify-between px-4">
                        <div className="flex items-center gap-6">
                            <span className="font-bold">Panel Institucional</span>
                            <nav className="flex gap-4 text-sm">
                                <Link href="/admin/dashboard" className="hover:underline">Dashboard</Link>
                                <Link href="/admin/users" className="hover:underline">Usuarios</Link>
                            </nav>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">{user?.email}</span>
                            <button onClick={() => logout()} className="text-sm text-destructive">Salir</button>
                        </div>
                    </div>
                </header>
                <main className="container mx-auto px-4 py-8">
                    {children}
                </main>
            </div>
        </RoleGuard>
    );
}
