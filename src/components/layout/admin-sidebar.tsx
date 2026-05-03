'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

const ITEMS = [
    { label: 'Panel de control', href: '/admin/dashboard', icon: '▦' },
    { label: 'Sesiones en vivo', href: '/admin/sessions', icon: '◉' },
    { label: 'Usuarios', href: '/admin/users', icon: '👤' },
    { label: 'Dispositivos', href: '/admin/devices', icon: '⊡' },
    { label: 'Cursos', href: '/admin/courses', icon: '📚' },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    const isActive = (href: string) => pathname.startsWith(href);

    const handleLogout = async () => {
        try { await logout(); } catch {}
        router.replace('/');
    };

    return (
        <aside style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            width: 224,
            flexShrink: 0,
            background: '#FFFFFF',
            borderRight: '1px solid #E2E4F0',
            position: 'sticky',
            top: 0,
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 56,
                borderBottom: '1px solid #E2E4F0',
                padding: '0 16px',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28, height: 28,
                    borderRadius: 6,
                    background: '#1800AD',
                    color: '#FFFFFF',
                    fontSize: 12, fontWeight: 700,
                }}>S</div>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#0B1C30' }}>SIERCP</span>
            </div>

            <nav style={{
                flex: 1,
                padding: 12,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
            }}>
                {ITEMS.map(({ href, label, icon }) => (
                    <Link key={href} href={href} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        borderRadius: 8,
                        padding: '10px 12px',
                        fontSize: 13,
                        fontWeight: isActive(href) ? 600 : 500,
                        textDecoration: 'none',
                        background: isActive(href) ? '#EEF0FF' : 'transparent',
                        color: isActive(href) ? '#1800AD' : '#4A5568',
                        transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { if (!isActive(href)) e.currentTarget.style.background = '#F4F5FF'; }}
                    onMouseLeave={(e) => { if (!isActive(href)) e.currentTarget.style.background = 'transparent'; }}
                    >
                        <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{icon}</span>
                        {label}
                    </Link>
                ))}
            </nav>

            <div style={{ borderTop: '1px solid #E2E4F0', padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {user && (
                    <div style={{ padding: '8px 12px' }}>
                        <p style={{ fontSize: 12, fontWeight: 500, color: '#0B1C30', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.firstName} {user.lastName}
                        </p>
                        <p style={{ fontSize: 11, color: '#8892A4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.role}
                        </p>
                    </div>
                )}
                <Link href="/student/profile" style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    borderRadius: 8, padding: '10px 12px',
                    fontSize: 13, fontWeight: 500,
                    textDecoration: 'none', color: '#4A5568',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F4F5FF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                    <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>👤</span>
                    Perfil
                </Link>
                <button onClick={handleLogout} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    borderRadius: 8, padding: '10px 12px',
                    fontSize: 13, fontWeight: 500,
                    border: 'none', cursor: 'pointer',
                    color: '#4A5568', background: 'transparent',
                    width: '100%', textAlign: 'left' as const,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F4F5FF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                    <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>↪</span>
                    Cerrar sesión
                </button>
            </div>
        </aside>
    );
}
