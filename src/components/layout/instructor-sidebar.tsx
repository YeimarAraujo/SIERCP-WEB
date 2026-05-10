'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import {
    LayoutDashboard, Monitor, BookOpen, Users, Clock,
    BarChart2, Award, Trophy, CheckSquare, User, LogOut
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
}

const navItems: NavItem[] = [
    { label: 'Mi panel',        href: '/instructor/dashboard',    icon: LayoutDashboard },
    { label: 'Monitor en vivo', href: '/instructor/monitor',      icon: Monitor },
    { label: 'Mis cursos',      href: '/instructor/courses',      icon: BookOpen },
    { label: 'Estudiantes',     href: '/instructor/students',     icon: Users },
    { label: 'Historial',       href: '/instructor/history',      icon: Clock },
    { label: 'Reportes',        href: '/instructor/reports',      icon: BarChart2 },
    { label: 'Certificados',    href: '/instructor/certificates', icon: Award },
    { label: 'Ranking',         href: '/instructor/ranking',      icon: Trophy },
    { label: 'Evaluaciones',    href: '/instructor/evaluations',  icon: CheckSquare },
];

export function InstructorSidebar({ collapsed, onToggle }: { collapsed?: boolean; onToggle?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    const isActive = (href: string) => {
        if (href === '/instructor/dashboard' && pathname === '/instructor/dashboard') return true;
        if (pathname.startsWith(href)) return true;
        return false;
    };

    const handleLogout = async () => {
        try { await logout(); } catch {}
        router.replace('/');
    };

    const sidebarWidth = collapsed ? '68px' : '240px';

    return (
        <aside style={{
            width: sidebarWidth,
            minWidth: sidebarWidth,
            height: '100vh',
            position: 'sticky',
            top: 0,
            background: 'var(--sidebar-bg)',
            borderRight: '1px solid var(--sidebar-border)',
            display: 'flex',
            flexDirection: 'column',
            padding: '0',
            overflowY: 'auto',
            transition: 'width 0.25s ease, min-width 0.25s ease',
        }}>
            <div style={{
                padding: collapsed ? '16px 12px' : '20px 20px 16px',
                borderBottom: '1px solid var(--sidebar-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: collapsed ? 0 : '10px',
                position: 'relative',
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
                    cursor: 'pointer',
                }}
                onClick={onToggle}
                title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
                >S</div>
                <span style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.3px',
                    opacity: collapsed ? 0 : 1,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    transition: 'opacity 0.2s ease',
                }}>
                    SIERCP
                </span>
                {collapsed && (
                    <div style={{
                        position: 'absolute', bottom: -8, left: '50%',
                        transform: 'translateX(-50%)',
                        width: 24, height: 2, borderRadius: 1,
                        background: 'var(--brand)',
                        opacity: 0.3,
                    }} />
                )}
            </div>

            <nav style={{ flex: 1, padding: collapsed ? '8px 6px' : '12px 12px' }}>
                {navItems.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;

                    return (
                        <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                gap: collapsed ? 0 : '10px',
                                padding: collapsed ? '10px' : '10px 12px',
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
                                width: collapsed ? 44 : 'auto',
                                marginLeft: collapsed ? 'auto' : 0,
                                marginRight: collapsed ? 'auto' : 0,
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
                                    size={20}
                                    strokeWidth={active ? 2.5 : 2}
                                />
                                <span style={{
                                    opacity: collapsed ? 0 : 1,
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    maxWidth: collapsed ? 0 : '200px',
                                    transition: 'opacity 0.2s ease, max-width 0.2s ease',
                                }}>{item.label}</span>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div style={{
                padding: collapsed ? '8px' : '12px',
                borderTop: '1px solid var(--sidebar-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                alignItems: collapsed ? 'center' : 'stretch',
            }}>
                {user && !collapsed && (
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

                <Link href="/instructor/profile" style={{ textDecoration: 'none' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        gap: collapsed ? 0 : '10px',
                        padding: collapsed ? '10px' : '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        color: 'var(--sidebar-text)',
                        fontSize: '14px',
                        fontWeight: 500,
                        width: collapsed ? 44 : 'auto',
                        marginLeft: collapsed ? 'auto' : 0,
                        marginRight: collapsed ? 'auto' : 0,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--sidebar-hover-bg)';
                        e.currentTarget.style.color = 'var(--sidebar-hover-text)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--sidebar-text)';
                    }}
                    title={collapsed ? 'Mi perfil' : undefined}
                    >
                        <User size={20} />
                        <span style={{
                            opacity: collapsed ? 0 : 1,
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            maxWidth: collapsed ? 0 : '200px',
                            transition: 'opacity 0.2s ease, max-width 0.2s ease',
                        }}>Mi perfil</span>
                    </div>
                </Link>

                <button
                    onClick={handleLogout}
                    style={{
                        width: collapsed ? 44 : '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        gap: collapsed ? 0 : '10px',
                        padding: collapsed ? '10px' : '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--danger-text)',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginLeft: collapsed ? 'auto' : 0,
                        marginRight: collapsed ? 'auto' : 0,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--sidebar-hover-bg)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                    }}
                    title={collapsed ? 'Cerrar sesión' : undefined}
                >
                    <LogOut size={20} />
                    <span style={{
                        opacity: collapsed ? 0 : 1,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        maxWidth: collapsed ? 0 : '200px',
                        transition: 'opacity 0.2s ease, max-width 0.2s ease',
                    }}>Cerrar sesión</span>
                </button>
            </div>
        </aside>
    );
}
