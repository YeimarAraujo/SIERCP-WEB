'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { getUserInitials } from '@/models/user';
import { Home, Library, History, Cpu, BarChart2, Trophy, Download, Pin, PinOff, LogOut } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    badge?: boolean;
    badgeColor?: string;
}

const navItems: NavItem[] = [
    { label: 'Inicio', href: '/student/home', icon: Home },
    { label: 'Mis cursos', href: '/student/courses', icon: Library },
    { label: 'Historial', href: '/student/history', icon: History },
    { label: 'Mi dispositivo', href: '/student/device', icon: Cpu, badge: true },
    { label: 'Reportes', href: '/student/reports', icon: BarChart2 },
    { label: 'Ranking', href: '/student/ranking', icon: Trophy },
    { label: 'Descargar app', href: '/student/download', icon: Download },
];

function getRoleLabel(role?: string): string {
    const labels: Record<string, string> = {
        SUPER_ADMIN: 'Super Admin',
        ADMIN: 'Administrador',
        INSTRUCTOR: 'Instructor',
        ESTUDIANTE: 'Estudiante',
    };
    return labels[role ?? ''] ?? role ?? '';
}

export function StudentSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const sidebarRef = useRef<HTMLDivElement>(null);
    
    const [isExpanded, setIsExpanded] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    useEffect(() => {
        const pinned = localStorage.getItem('siercp-sidebar-pinned');
        if (pinned === 'true') {
            setIsPinned(true);
            setIsExpanded(true);
        }
    }, []);

    const handleMouseEnter = () => {
        if (!isPinned) setIsExpanded(true);
    };

    const handleMouseLeave = () => {
        if (!isPinned) setIsExpanded(false);
    };

    const togglePin = () => {
        const newPinned = !isPinned;
        setIsPinned(newPinned);
        setIsExpanded(newPinned);
        localStorage.setItem('siercp-sidebar-pinned', String(newPinned));
    };

    const handleLogout = async () => {
        try { await logout(); } catch {} finally { router.replace('/'); }
    };

    const getUserName = (): string => {
        if (!user) return 'Usuario';
        return `${user.firstName} ${user.lastName}`.trim() || 'Usuario';
    };

    const isActive = (href: string) => {
        if (href === '/student/home' && pathname === '/student/home') return true;
        if (href !== '/student/home' && pathname.startsWith(href)) return true;
        return false;
    };

    const sidebarWidth = isExpanded ? '240px' : '64px';

    return (
        <aside
            ref={sidebarRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                width: sidebarWidth,
                minWidth: sidebarWidth,
                height: '100vh',
                position: 'sticky',
                top: 0,
                background: 'var(--sidebar-bg)',
                borderRight: '1px solid var(--sidebar-border)',
                display: 'flex',
                flexDirection: 'column',
                overflowX: 'hidden',
                overflowY: 'auto',
                transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 50,
                flexShrink: 0,
            }}
        >
            {/* LOGO AREA */}
            <div style={{
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                padding: isExpanded ? '0 12px' : '0',
                justifyContent: isExpanded ? 'space-between' : 'center',
                borderBottom: '1px solid var(--sidebar-border)',
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <img
                        src="/images/logov3.png"
                        alt="SIERCP"
                        style={{ width: '32px', height: '32px', flexShrink: 0 }}
                    />
                    {isExpanded && (
                        <span style={{
                            fontSize: '15px',
                            fontWeight: '700',
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                        }}>
                            SIERCP
                        </span>
                    )}
                </div>
                {isExpanded && (
                    <button
                        onClick={togglePin}
                        title={isPinned ? 'Desfijar sidebar' : 'Fijar sidebar'}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            color: isPinned ? 'var(--brand)' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            flexShrink: 0,
                        }}
                    >
                        {isPinned ? <Pin size={14} /> : <PinOff size={14} />}
                    </button>
                )}
            </div>

            {/* NAV ITEMS */}
            <nav style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {navItems.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={!isExpanded ? item.label : undefined}
                            style={{ textDecoration: 'none' }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: isExpanded ? '10px' : '0',
                                padding: isExpanded ? '10px 12px' : '10px 0',
                                justifyContent: isExpanded ? 'flex-start' : 'center',
                                borderRadius: '8px',
                                background: active ? 'var(--sidebar-active-bg)' : 'transparent',
                                color: active ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
                                fontWeight: active ? '600' : '500',
                                fontSize: '14px',
                                borderLeft: active && isExpanded ? '3px solid var(--brand)' : '3px solid transparent',
                                transition: 'all 0.15s ease',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                position: 'relative',
                            }}>
                                {active && !isExpanded && (
                                    <div style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: '3px',
                                        height: '20px',
                                        background: 'var(--brand)',
                                        borderRadius: '0 2px 2px 0',
                                    }} />
                                )}
                                <Icon size={18} strokeWidth={active ? 2.5 : 2} style={{ flexShrink: 0 }} />
                                {isExpanded && <span>{item.label}</span>}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* FOOTER */}
            <div style={{ padding: '8px', borderTop: '1px solid var(--sidebar-border)', flexShrink: 0 }}>
                {/* Perfil */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isExpanded ? '10px' : '0',
                    padding: isExpanded ? '10px 12px' : '10px 0',
                    justifyContent: isExpanded ? 'flex-start' : 'center',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginBottom: '4px',
                }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--brand)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '700',
                        flexShrink: 0,
                    }}>
                        {user ? getUserInitials(user) : 'U'}
                    </div>
                    {isExpanded && (
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {getUserName()}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {getRoleLabel(user?.role)}
                            </div>
                        </div>
                    )}
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    title={!isExpanded ? 'Cerrar sesión' : undefined}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: isExpanded ? '10px' : '0',
                        padding: isExpanded ? '10px 12px' : '10px 0',
                        justifyContent: isExpanded ? 'flex-start' : 'center',
                        borderRadius: '8px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--danger-text)',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.15s ease',
                    }}
                >
                    <LogOut size={18} style={{ flexShrink: 0 }} />
                    {isExpanded && <span>Cerrar sesión</span>}
                </button>
            </div>
        </aside>
    );
}