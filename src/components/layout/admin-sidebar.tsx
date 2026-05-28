'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import toast from 'react-hot-toast';
import { useThemeStore } from '@/stores/theme-store';
import {
    LayoutDashboard, Monitor, GraduationCap, Users, Cpu,
    BookOpen, BarChart2, FileText, Settings, Shield, User, LogOut,
    Sun, Moon, Globe, Award, Zap, CalendarDays, ShoppingBag, Building2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
}

const navItems: NavItem[] = [
    { label: 'Panel de control', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Sesiones en vivo', href: '/admin/sessions', icon: Monitor },
    { label: 'Sedes', href: '/admin/sedes', icon: Building2 },
    { label: 'Instructores', href: '/admin/instructors', icon: GraduationCap },
    { label: 'Estudiantes', href: '/admin/students', icon: Users },
    { label: 'Dispositivos', href: '/admin/devices', icon: Cpu },
    { label: 'Cursos', href: '/admin/courses', icon: BookOpen },
    { label: 'Reportes', href: '/admin/reports', icon: BarChart2 },
    { label: 'Certificados', href: '/admin/certificates', icon: Award },
    { label: 'Calendario', href: '/admin/calendar', icon: CalendarDays },
    { label: 'Mi Plan / Tienda', href: '/admin/tienda', icon: ShoppingBag },
    // { label: 'Configuración', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar({ collapsed, onToggle }: { collapsed?: boolean; onToggle?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const [hovered, setHovered] = useState(false);
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const { theme, toggleTheme } = useThemeStore();

    const isCollapsed = collapsed && !hovered;

    const isActive = (href: string) => {
        if (href === '/admin/dashboard' && pathname === '/admin/dashboard') return true;
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
            transition: 'width 0.25s ease, min-width 0.25s ease',
            zIndex: 50,
        }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div style={{
                padding: '20px 20px 16px',
                borderBottom: '1px solid var(--sidebar-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: isCollapsed ? 0 : '10px',
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
                    title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
                >S</div>
                <span style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: 'var(--sidebar-text)',
                    letterSpacing: '-0.3px',
                    opacity: isCollapsed ? 0 : 1,
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
                                // borderLeft: active
                                //     ? '3px solid var(--brand)'
                                //     : '3px solid transparent',
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

                {/* <Link href="/admin/profile" style={{ textDecoration: 'none' }}>
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
                </Link> */}

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
                        color: 'var(--sidebar-text)',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginLeft: isCollapsed ? 'auto' : 0,
                        marginRight: isCollapsed ? 'auto' : 0,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--sidebar-hover-bg)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
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
