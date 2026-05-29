'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/features/auth/store/auth-store';

type NavItem = { label: string; href: string; icon: string };
type NavGroup = { group?: string; items: NavItem[] };

const NAV_GROUPS: Record<string, NavGroup[]> = {
    ADMIN: [
        {
            items: [
                { label: 'Panel de control', href: '/admin/dashboard', icon: '▦' },
                { label: 'Sesiones en vivo',  href: '/admin/sessions',  icon: '◉' },
            ],
        },
        {
            group: 'Organización',
            items: [
                { label: 'Sedes',        href: '/admin/sedes',        icon: '🏢' },
                { label: 'Instructores', href: '/admin/instructors',  icon: '🎓' },
                { label: 'Alumnos',      href: '/admin/students',     icon: '👤' },
                { label: 'Usuarios',     href: '/admin/users',        icon: '⚙' },
            ],
        },
        {
            group: 'Académico',
            items: [
                { label: 'Cursos',        href: '/admin/courses',       icon: '📚' },
                { label: 'Certificados',  href: '/admin/certificates',  icon: '🏅' },
                { label: 'Reportes',      href: '/admin/reports',       icon: '📊' },
            ],
        },
        {
            group: 'Sistema',
            items: [
                { label: 'Dispositivos', href: '/admin/devices',   icon: '⊡' },
                { label: 'Mi Plan',      href: '/admin/tienda',    icon: '💳' },
                { label: 'Ajustes',      href: '/admin/settings',  icon: '🔧' },
            ],
        },
    ],
    SUPER_ADMIN: [
        {
            items: [
                { label: 'Dashboard',               href: '/super-admin/dashboard',           icon: '▦' },
                { label: 'Instituciones',            href: '/super-admin/institutions',        icon: '🏛' },
                { label: 'Instructores pendientes',  href: '/super-admin/pending-instructors', icon: '⏳' },
            ],
        },
    ],
    INSTRUCTOR: [
        {
            items: [
                { label: 'Mi panel',            href: '/instructor/dashboard', icon: '▦' },
                { label: 'Sesiones en vivo',    href: '/instructor/monitor',   icon: '◉' },
                { label: 'Gestionar cursos',    href: '/instructor/courses',   icon: '📚' },
                { label: 'Historial del grupo', href: '/instructor/history',   icon: '📋' },
            ],
        },
    ],
    USUARIO: [
        {
            items: [
                { label: 'Inicio',         href: '/home',    icon: '⌂' },
                { label: 'Mis sesiones',   href: '/history', icon: '📋' },
                { label: 'Cursos',         href: '/courses', icon: '📚' },
                { label: 'Mi dispositivo', href: '/device',  icon: '⊡' },
            ],
        },
    ],
};

export function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const router = useRouter();
    const membershipRole = useAuthStore((s) => s.membershipRole);

    // Un USUARIO con membership INSTRUCTOR ve la nav de instructor completa
    const isInstructorByMembership = membershipRole === 'INSTRUCTOR';

    const groups = (() => {
        if (!user) return [];
        if (user.role === 'USUARIO' && isInstructorByMembership) return NAV_GROUPS['INSTRUCTOR'] ?? [];
        return NAV_GROUPS[user.role] ?? [];
    })();

    const handleLogout = async () => {
        try {
            await logout();
            router.replace('/');
        } catch {
            router.replace('/');
        }
    };

    const isActive = (href: string) => {
        if (href === '/home' && pathname === '/home') return true;
        if (href !== '/home' && pathname.startsWith(href)) return true;
        return false;
    };

    const linkStyle = (active: boolean): React.CSSProperties => ({
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderRadius: 8,
        padding: '9px 10px',
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        textDecoration: 'none',
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? 'var(--brand)' : '#4A5568',
        transition: 'background 0.15s',
    });

    return (
        <aside style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            width: 220,
            flexShrink: 0,
            background: 'var(--card)',
            borderRight: '1px solid var(--border)',
        }}>
            {/* Logo */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 54,
                borderBottom: '1px solid var(--border)',
                padding: '0 14px',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: 'var(--brand)',
                    color: 'var(--text-on-brand)',
                    fontSize: 12,
                    fontWeight: 700,
                }}>
                    S
                </div>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--foreground)' }}>SIERCP</span>
            </div>

            {/* Nav */}
            <nav style={{
                flex: 1,
                padding: '10px 8px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
            }}>
                {groups.map((g, gi) => (
                    <div key={gi} style={{ marginBottom: 4 }}>
                        {g.group && (
                            <div style={{
                                fontSize: 10,
                                fontWeight: 800,
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.07em',
                                padding: '10px 10px 4px',
                            }}>
                                {g.group}
                            </div>
                        )}
                        {g.items.map(({ href, label, icon }) => (
                            <Link
                                key={href}
                                href={href}
                                style={linkStyle(isActive(href))}
                                onMouseEnter={e => {
                                    if (!isActive(href)) e.currentTarget.style.background = '#F4F5FF';
                                }}
                                onMouseLeave={e => {
                                    if (!isActive(href)) e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                <span style={{ fontSize: 15, width: 18, textAlign: 'center' }}>{icon}</span>
                                {label}
                            </Link>
                        ))}
                    </div>
                ))}
            </nav>

            {/* User + Logout */}
            <div style={{ borderTop: '1px solid var(--border)', padding: '8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {user && (
                    <div style={{ padding: '6px 10px', marginBottom: 2 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                            {user.firstName} {user.lastName}
                        </p>
                        <p style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '2px 0 0' }}>
                            {user.role}
                        </p>
                    </div>
                )}
                <Link
                    href="/profile"
                    style={linkStyle(pathname.startsWith('/profile'))}
                    onMouseEnter={e => { if (!pathname.startsWith('/profile')) e.currentTarget.style.background = '#F4F5FF'; }}
                    onMouseLeave={e => { if (!pathname.startsWith('/profile')) e.currentTarget.style.background = 'transparent'; }}
                >
                    <span style={{ fontSize: 15, width: 18, textAlign: 'center' }}>👤</span>
                    Perfil
                </Link>
                <button
                    onClick={handleLogout}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        borderRadius: 8, padding: '9px 10px', fontSize: 13, fontWeight: 500,
                        border: 'none', cursor: 'pointer', color: '#4A5568',
                        background: 'transparent', width: '100%', textAlign: 'left',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#FFF1F2'; e.currentTarget.style.color = '#DC2626'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4A5568'; }}
                >
                    <span style={{ fontSize: 15, width: 18, textAlign: 'center' }}>↪</span>
                    Cerrar sesión
                </button>
            </div>
        </aside>
    );
}
