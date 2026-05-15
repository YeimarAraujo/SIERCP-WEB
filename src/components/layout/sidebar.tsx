'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

const NAV_ITEMS: Record<string, { label: string; href: string; icon: string }[]> = {
    ADMIN: [
        { label: 'Panel de control', href: '/admin/dashboard', icon: '▦' },
        { label: 'Sesiones en vivo', href: '/admin/sessions', icon: '◉' },
        { label: 'Usuarios', href: '/admin/users', icon: '👤' },
        { label: 'Dispositivos', href: '/admin/devices', icon: '⊡' },
        { label: 'Cursos', href: '/admin/courses', icon: '📚' },
    ],
    SUPER_ADMIN: [
        { label: 'Dashboard', href: '/super-admin/dashboard', icon: '▦' },
        { label: 'Instituciones', href: '/super-admin/institutions', icon: '🏛' },
        { label: 'Instructores pendientes', href: '/super-admin/pending-instructors', icon: '⏳' },
    ],
    INSTRUCTOR: [
        { label: 'Mi panel', href: '/instructor/dashboard', icon: '▦' },
        { label: 'Monitor en vivo', href: '/instructor/monitor', icon: '◉' },
        { label: 'Mis cursos', href: '/instructor/courses', icon: '📚' },
        { label: 'Historial del grupo', href: '/instructor/history', icon: '📋' },
    ],
    ESTUDIANTE: [
        { label: 'Inicio', href: '/home', icon: '⌂' },
        { label: 'Mis sesiones', href: '/history', icon: '📋' },
        { label: 'Cursos', href: '/courses', icon: '📚' },
        { label: 'Mi dispositivo', href: '/device', icon: '⊡' },
    ],
};

export function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const router = useRouter();

    const visible = user ? (NAV_ITEMS[user.role] ?? []) : [];

    const handleLogout = async () => {
        try {
            await logout();
            router.replace('/');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            router.replace('/');
        }
    };

    const isActive = (href: string) => {
        if (href === '/home' && pathname === '/home') return true;
        if (href !== '/home' && pathname.startsWith(href)) return true;
        return false;
    };

    return (
        <aside style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            width: 224,
            flexShrink: 0,
            background: 'var(--card)',
            borderRight: '1px solid var(--border)',
        }}>
            {/* Logo */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 56,
                borderBottom: '1px solid var(--border)',
                padding: '0 16px',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: 'var(--brand)',
                    color: 'var(--text-on-brand)',
                    fontSize: 12,
                    fontWeight: 700,
                }}>
                    S
                </div>
                <span style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: 'var(--foreground)',
                }}>
                    SIERCP
                </span>
            </div>

            {/* Nav */}
            <nav style={{
                flex: 1,
                padding: 12,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
            }}>
                {visible.map(({ href, label, icon }) => (
                    <Link
                        key={href}
                        href={href}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            borderRadius: 8,
                            padding: '10px 12px',
                            fontSize: 13,
                            fontWeight: 500,
                            textDecoration: 'none',
                            background: isActive(href) ? 'var(--accent)' : 'transparent',
                            color: isActive(href) ? 'var(--brand)' : '#4A5568',
                            transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive(href)) {
                                e.currentTarget.style.background = '#F4F5FF';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive(href)) {
                                e.currentTarget.style.background = 'transparent';
                            }
                        }}
                    >
                        <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{icon}</span>
                        {label}
                    </Link>
                ))}
            </nav>

            {/* User + Logout */}
            <div style={{
                borderTop: '1px solid var(--border)',
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
            }}>
                {user && (
                    <div style={{ padding: '8px 12px' }}>
                        <p style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: 'var(--foreground)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {user.firstName} {user.lastName}
                        </p>
                        <p style={{
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {user.role}
                        </p>
                    </div>
                )}
                <Link
                    href="/profile"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        borderRadius: 8,
                        padding: '10px 12px',
                        fontSize: 13,
                        fontWeight: 500,
                        textDecoration: 'none',
                        color: '#4A5568',
                        background: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F4F5FF';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                    }}
                >
                    <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>👤</span>
                    Perfil
                </Link>
                <button
                    onClick={handleLogout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        borderRadius: 8,
                        padding: '10px 12px',
                        fontSize: 13,
                        fontWeight: 500,
                        border: 'none',
                        cursor: 'pointer',
                        color: '#4A5568',
                        background: 'transparent',
                        width: '100%',
                        textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F4F5FF';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                    }}
                >
                    <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>↪</span>
                    Cerrar sesión
                </button>
            </div>
        </aside>
    );
}
