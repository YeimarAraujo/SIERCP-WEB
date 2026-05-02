'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import {
    HomeIcon, BookOpenIcon, ClipboardListIcon, ClockIcon,
    CpuIcon, UserIcon, UsersIcon, ShieldIcon, LogOutIcon,
    SmartphoneIcon,
} from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '#';

interface NavItem {
    href: string;
    label: string;
    icon: React.ElementType;
    roles: string[];
}

const NAV_ITEMS: NavItem[] = [
    { href: '/home', label: 'Inicio', icon: HomeIcon, roles: ['ADMIN', 'INSTRUCTOR', 'ESTUDIANTE'] },
    { href: '/courses', label: 'Cursos', icon: BookOpenIcon, roles: ['ADMIN', 'INSTRUCTOR', 'ESTUDIANTE'] },
    { href: '/history', label: 'Historial', icon: ClipboardListIcon, roles: ['ADMIN', 'INSTRUCTOR', 'ESTUDIANTE'] },
    { href: '/device', label: 'Maniquí', icon: CpuIcon, roles: ['ADMIN', 'INSTRUCTOR', 'ESTUDIANTE'] },
    { href: '/profile', label: 'Perfil', icon: UserIcon, roles: ['ADMIN', 'INSTRUCTOR', 'ESTUDIANTE'] },
    { href: '/admin/users', label: 'Usuarios', icon: UsersIcon, roles: ['ADMIN'] },
    { href: '/admin/devices', label: 'Dispositivos', icon: ShieldIcon, roles: ['ADMIN'] },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const router = useRouter();

    const visible = NAV_ITEMS.filter((item) =>
        user ? item.roles.includes(user.role) : false,
    );

    const handleDownloadApp = () => {
        if (APP_URL !== '#') {
            window.open(APP_URL, '_blank');
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            router.replace('/');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            router.replace('/');
        }
    };

    return (
        <aside className="flex h-screen w-56 flex-col border-r border-border bg-card">
            {/* Logo */}
            <div className="flex h-14 items-center gap-2 border-b border-border px-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
                    S
                </div>
                <span className="font-semibold text-sm tracking-tight">SIERCP</span>
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
                {visible.map(({ href, label, icon: Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        className={cn(
                            'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                            pathname.startsWith(href)
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                        )}
                    >
                        <Icon className="h-4 w-4 shrink-0" />
                        {label}
                    </Link>
                ))}
            </nav>

            {/* Descargar App */}
            <div className="border-t border-border p-3">
                <button
                    onClick={handleDownloadApp}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all hover:scale-[1.02]"
                    style={{
                        background: 'linear-gradient(135deg, #1800AD 0%, #2D1FD4 100%)',
                        color: '#FFFFFF',
                    }}
                >
                    <SmartphoneIcon className="h-4 w-4 shrink-0" />
                    Descargar App
                </button>
            </div>

            {/* User + Logout */}
            <div className="border-t border-border p-3 space-y-1">
                {user && (
                    <div className="px-3 py-2">
                        <p className="text-xs font-medium truncate">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.role}</p>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                    <LogOutIcon className="h-4 w-4" />
                    Cerrar sesión
                </button>
            </div>
        </aside>
    );
}
