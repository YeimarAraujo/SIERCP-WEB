'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import toast from 'react-hot-toast';
import { useThemeStore } from '@/stores/theme-store';
import {
    LayoutDashboard, Monitor, BookOpen, Users, Clock,
    BarChart2, Award, Trophy, CheckSquare, User, LogOut,
    Sun, Moon, Globe, CalendarDays,
    GraduationCap
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
}

const navItems: NavItem[] = [
    { label: 'Mi panel', href: '/instructor/dashboard', icon: LayoutDashboard },
    { label: 'Monitor en vivo', href: '/instructor/monitor', icon: Monitor },
    { label: 'Calendario', href: '/instructor/calendar', icon: CalendarDays },
    { label: 'Mis cursos', href: '/instructor/courses', icon: BookOpen },
    { label: 'Estudiantes', href: '/instructor/students', icon: Users },
    { label: 'Evaluaciones', href: '/instructor/evaluations', icon: CheckSquare },
    { label: 'Historial', href: '/instructor/history', icon: Clock },
    { label: 'Reportes', href: '/instructor/reports', icon: BarChart2 },
    { label: 'Certificados', href: '/instructor/certificates', icon: Award },
    { label: 'Ranking', href: '/instructor/ranking', icon: Trophy },
];

export function InstructorSidebar({ collapsed, onToggle }: { collapsed?: boolean; onToggle?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const [hovered, setHovered] = useState(false);
    const { theme, toggleTheme } = useThemeStore();

    const isCollapsed = collapsed && !hovered;

    const isActive = (href: string) => {
        if (href === '/instructor/dashboard' && pathname === '/instructor/dashboard') return true;
        if (pathname.startsWith(href)) return true;
        return false;
    };

    const handleLogout = async () => {
        try { await logout(); } catch {
            toast.error('Error al cerrar sesión. Intenta de nuevo.');
        }
        router.replace('/');
    };

    const sidebarWidth = isCollapsed ? '68px' : '240px';

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
            transition: 'width 0.3s ease, min-width 0.3s ease',
            zIndex: 50,
        }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Branding header */}
            <div style={{
                padding: '20px 20px 16px',
                borderBottom: '1px solid var(--sidebar-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: isCollapsed ? 0 : '10px',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32, height: 32,
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255,255,255,0.15)',
                    color: 'var(--sidebar-text)',
                    flexShrink: 0,
                }}>
                    <GraduationCap size={18} />
                </div>
                <span style={{
                    fontSize: '15px',
                    fontWeight: '700',
                    color: 'var(--sidebar-text)',
                    letterSpacing: '-0.3px',
                    opacity: isCollapsed ? 0 : 1,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    maxWidth: isCollapsed ? 0 : '160px',
                    transition: 'opacity 0.2s ease, max-width 0.2s ease',
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
                                justifyContent: isCollapsed ? 'center' : 'flex-start',
                                gap: isCollapsed ? 0 : '10px',
                                padding: isCollapsed ? '10px' : '10px 12px',
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
                                transition: 'all 0.15s ease',
                                cursor: 'pointer',
                                width: isCollapsed ? 44 : 'auto',
                                marginLeft: isCollapsed ? 'auto' : 0,
                                marginRight: isCollapsed ? 'auto' : 0,
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
                                    opacity: isCollapsed ? 0 : 1,
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    maxWidth: isCollapsed ? 0 : '200px',
                                    transition: 'opacity 0.2s ease, max-width 0.2s ease',
                                }}>{item.label}</span>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div style={{
                padding: isCollapsed ? '8px' : '12px',
                borderTop: '1px solid var(--sidebar-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                alignItems: isCollapsed ? 'center' : 'stretch',
            }}>

                <Link href="/" style={{ textDecoration: 'none' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        gap: isCollapsed ? 0 : '10px',
                        padding: isCollapsed ? '10px' : '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        color: 'var(--sidebar-text)',
                        fontSize: '14px',
                        fontWeight: 500,
                        width: isCollapsed ? 44 : 'auto',
                        marginLeft: isCollapsed ? 'auto' : 0,
                        marginRight: isCollapsed ? 'auto' : 0,
                        marginBottom: '4px',
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--sidebar-hover-bg)';
                            e.currentTarget.style.color = 'var(--sidebar-hover-text)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--sidebar-text)';
                        }}
                        title={isCollapsed ? 'Volver al sitio' : undefined}
                    >
                        <Globe size={20} />
                        <span style={{
                            opacity: isCollapsed ? 0 : 1,
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            maxWidth: isCollapsed ? 0 : '200px',
                            transition: 'opacity 0.2s ease, max-width 0.2s ease',
                        }}>Volver al sitio</span>
                    </div>
                </Link>

                <Link href="/instructor/profile" style={{ textDecoration: 'none' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        gap: isCollapsed ? 0 : '10px',
                        padding: isCollapsed ? '10px' : '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        color: 'var(--sidebar-text)',
                        fontSize: '14px',
                        fontWeight: 500,
                        width: isCollapsed ? 44 : 'auto',
                        marginLeft: isCollapsed ? 'auto' : 0,
                        marginRight: isCollapsed ? 'auto' : 0,
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--sidebar-hover-bg)';
                            e.currentTarget.style.color = 'var(--sidebar-hover-text)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--sidebar-text)';
                        }}
                        title={isCollapsed ? 'Mi perfil' : undefined}
                    >
                        <User size={20} />
                        <span style={{
                            opacity: isCollapsed ? 0 : 1,
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            maxWidth: isCollapsed ? 0 : '200px',
                            transition: 'opacity 0.2s ease, max-width 0.2s ease',
                        }}>Mi perfil</span>
                    </div>
                </Link>

                <button
                    onClick={toggleTheme}
                    style={{
                        width: isCollapsed ? 44 : '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        gap: isCollapsed ? 0 : '10px',
                        padding: isCollapsed ? '10px' : '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--sidebar-text)',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginLeft: isCollapsed ? 'auto' : 0,
                        marginRight: isCollapsed ? 'auto' : 0,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--sidebar-hover-bg)';
                        e.currentTarget.style.color = 'var(--sidebar-hover-text)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--sidebar-text)';
                    }}
                    title={isCollapsed ? (theme === 'dark' ? 'Modo claro' : 'Modo oscuro') : undefined}
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    <span style={{
                        opacity: isCollapsed ? 0 : 1,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        maxWidth: isCollapsed ? 0 : '200px',
                        transition: 'opacity 0.2s ease, max-width 0.2s ease',
                    }}>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
                </button>

                <button
                    onClick={handleLogout}
                    style={{
                        width: isCollapsed ? 44 : '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        gap: isCollapsed ? 0 : '10px',
                        padding: isCollapsed ? '10px' : '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--danger-text)',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginLeft: isCollapsed ? 'auto' : 0,
                        marginRight: isCollapsed ? 'auto' : 0,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--sidebar-hover-bg)';
                        e.currentTarget.style.color = 'var(--sidebar-hover-text)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--sidebar-text)';
                    }}
                    title={isCollapsed ? 'Cerrar sesión' : undefined}
                >
                    <LogOut size={20} />
                    <span style={{
                        opacity: isCollapsed ? 0 : 1,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        maxWidth: isCollapsed ? 0 : '200px',
                        transition: 'opacity 0.2s ease, max-width 0.2s ease',
                    }}>Cerrar sesión</span>
                </button>
            </div>
        </aside>
    );
}
