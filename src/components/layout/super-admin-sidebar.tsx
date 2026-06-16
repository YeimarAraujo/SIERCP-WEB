'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import toast from 'react-hot-toast';
import { useThemeStore } from '@/stores/theme-store';
import {
    LayoutDashboard, Building2, UserCheck, CreditCard,
    ScrollText, Settings, User, LogOut,
    Sun, Moon, GraduationCap, Users, BookOpen,
    BookMarked, ShoppingCart, Package, Briefcase,
    ShieldCheckIcon,
    Building,
    Bell,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
}

const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/super-admin/dashboard', icon: LayoutDashboard },
    //     { label: 'Instituciones', href: '/super-admin/institutions', icon: Building2 },
    //     { label: 'Usuarios', href: '/super-admin/usuarios', icon: Users },
    //     { label: 'Instructores', href: '/super-admin/instructores', icon: GraduationCap },
    //     { label: 'Cursos plataforma', href: '/super-admin/cursos', icon: BookOpen },

    { label: 'Planes y licencias', href: '/super-admin/plans', icon: CreditCard },
    { label: 'Pedidos y compras', href: '/super-admin/pedidos', icon: ShoppingCart },
    // { label: 'Cursos Jomar', href: '/super-admin/cursos-jomar', icon: BookMarked },
    { label: 'Servicios Jomar', href: '/super-admin/servicios-jomar', icon: Briefcase },
    { label: 'Stock de maniquíes', href: '/super-admin/stock', icon: Package },
    { label: 'Instituciones pendientes', href: '/super-admin/pending-institutions', icon: Building },
    { label: 'Admins pendientes', href: '/super-admin/pending-admins', icon: UserCheck },
    { label: 'Instructores pendientes', href: '/super-admin/pending-instructors', icon: UserCheck },
    { label: 'Notificaciones', href: '/super-admin/notifications', icon: Bell },
    { label: 'Logs de actividad', href: '/super-admin/logs', icon: ScrollText },
];

export function SuperAdminSidebar({ collapsed, onToggle }: { collapsed?: boolean; onToggle?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const [hovered, setHovered] = useState(false);
    const { theme, toggleTheme } = useThemeStore();

    const isCollapsed = collapsed && !hovered;

    const isActive = (href: string) => {
        if (href === '/super-admin/dashboard' && pathname === '/super-admin/dashboard') return true;
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
                padding: '40px 20px 16px',
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
                ><ShieldCheckIcon size={25} />
                </div>
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
                    SUPER ADMIN
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

            <nav style={{ flex: 1, padding: '22px 12px', overflowY: 'auto' }}>
                {navItems.map((item, idx) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;

                    return (
                        <div key={item.href} style={{ marginBottom: '4px' }}>
                            <Link href={item.href} style={{ textDecoration: 'none' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                                    gap: isCollapsed ? 0 : '10px',
                                    padding: isCollapsed ? '10px' : '9px 12px',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: '1px',
                                    background: active ? 'var(--sidebar-active-bg)' : 'transparent',
                                    color: active ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
                                    fontWeight: active ? '600' : '500',
                                    fontSize: '13px',
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
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                                    <span style={{
                                        opacity: isCollapsed ? 0 : 1,
                                        overflow: 'hidden',
                                        whiteSpace: 'nowrap',
                                        maxWidth: isCollapsed ? 0 : '200px',
                                        transition: 'opacity 0.2s ease, max-width 0.2s ease',
                                    }}>{item.label}</span>
                                </div>
                            </Link>
                        </div>
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
                {/* {user && !isCollapsed && (
                    <div style={{ padding: '8px 12px' }}>
                        <p style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: 'var(--sidebar-text)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {user.firstName} {user.lastName}
                        </p>
                        <p style={{
                            fontSize: 11,
                            color: 'rgba(255,255,255,0.55)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {user.role}
                        </p>
                    </div>
                )} */}

                {/* <Link href="/super-admin/settings" style={{ textDecoration: 'none' }}>
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
                        title={isCollapsed ? 'Configuración' : undefined}
                    >
                        <User size={20} />
                        <span style={{
                            opacity: isCollapsed ? 0 : 1,
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            maxWidth: isCollapsed ? 0 : '200px',
                            transition: 'opacity 0.2s ease, max-width 0.2s ease',
                        }}>Configuración</span>
                    </div>
                </Link> */}

                <Link href="/super-admin/settings" style={{ textDecoration: 'none' }}>
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
                        title={isCollapsed ? 'Configuración' : undefined}
                    >
                        <Settings size={20} />
                        <span style={{
                            opacity: isCollapsed ? 0 : 1,
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            maxWidth: isCollapsed ? 0 : '200px',
                            transition: 'opacity 0.2s ease, max-width 0.2s ease',
                        }}>Configuración</span>
                    </div>
                </Link>

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
