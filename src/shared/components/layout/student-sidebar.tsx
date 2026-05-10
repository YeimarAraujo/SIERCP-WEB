'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/auth-store';
import {
    Home, BookOpen, Clock, BarChart2, Award, Trophy,
    Radio, Smartphone, Cpu, User, LogOut
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
}

const navItems: NavItem[] = [
    { label: 'Inicio',         href: '/student/home',         icon: Home },
    { label: 'Mis cursos',     href: '/student/courses',      icon: BookOpen },
    { label: 'Historial',      href: '/student/history',      icon: Clock },
    { label: 'Mis reportes',   href: '/student/reports',      icon: BarChart2 },
    { label: 'Certificados',   href: '/student/certificates', icon: Award },
    { label: 'Ranking',        href: '/student/ranking',      icon: Trophy },
];

export function StudentSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    const isActive = (href: string) => {
        if (href === '/student/home' && pathname === '/student/home') return true;
        if (href !== '/student/home' && pathname.startsWith(href)) return true;
        return false;
    };

    const handleLogout = async () => {
        try { await logout(); } catch {}
        router.replace('/');
    };

    return (
        <aside style={{
            width: '240px',
            minWidth: '240px',
            height: '100vh',
            position: 'sticky',
            top: 0,
            background: 'var(--sidebar-bg)',
            borderRight: '1px solid var(--sidebar-border)',
            display: 'flex',
            flexDirection: 'column',
            padding: '0',
            overflowY: 'auto',
        }}>
            <div style={{
                padding: '20px 20px 16px',
                borderBottom: '1px solid var(--sidebar-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32, height: 32,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--brand)',
                    color: 'var(--text-on-brand)',
                    fontSize: 14, fontWeight: 700,
                }}>S</div>
                <span style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.3px',
                }}>
                    SIERCP
                </span>
            </div>

            <nav style={{ flex: 1, padding: '12px 12px' }}>
                {navItems.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;

                    return (
                        <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 12px',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: '2px',
                                background: active
                                    ? 'var(--sidebar-active-bg)'
                                    : 'transparent',
                                color: active
                                    ? 'var(--sidebar-active-text)'
                                    : 'var(--sidebar-text)',
                                fontWeight: active ? '600' : '500',
                                fontSize: '14px',
                                borderLeft: active
                                    ? '3px solid var(--brand)'
                                    : '3px solid transparent',
                                transition: 'all 0.15s ease',
                                cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                                if (!active) {
                                    e.currentTarget.style.background = 'var(--sidebar-hover-bg)';
                                    e.currentTarget.style.color = 'var(--sidebar-hover-text)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!active) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--sidebar-text)';
                                }
                            }}
                            >
                                <Icon
                                    size={18}
                                    strokeWidth={active ? 2.5 : 2}
                                />
                                <span>{item.label}</span>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div style={{
                padding: '12px',
                borderTop: '1px solid var(--sidebar-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
            }}>
                {user && (
                    <div style={{ padding: '8px 12px' }}>
                        <p style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: 'var(--text-primary)',
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

                <Link href="/student/profile" style={{ textDecoration: 'none' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        color: 'var(--sidebar-text)',
                        fontSize: '14px',
                        fontWeight: 500,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--sidebar-hover-bg)';
                        e.currentTarget.style.color = 'var(--sidebar-hover-text)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--sidebar-text)';
                    }}
                    >
                        <User size={18} />
                        <span>Mi perfil</span>
                    </div>
                </Link>

                <button
                    onClick={handleLogout}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--danger-text)',
                        fontSize: '14px',
                        fontWeight: '500',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--sidebar-hover-bg)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                    }}
                >
                    <LogOut size={18} />
                    <span>Cerrar sesión</span>
                </button>
            </div>
        </aside>
    );
}
