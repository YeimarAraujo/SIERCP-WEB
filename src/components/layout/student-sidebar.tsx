'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { useAuthStore } from '@/stores/auth-store';
import toast from 'react-hot-toast';
import { useThemeStore } from '@/stores/theme-store';
import {
    Home, BookOpen, Clock, BarChart2, Award, Trophy,
    User, LogOut, Sun, Moon, Globe, CalendarDays,
    GraduationCap, ShoppingBag, Monitor, Radio,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    highlight?: boolean;
    pulse?: boolean;
}

const studentNavItems: NavItem[] = [
    { label: 'Inicio', href: '/student/home', icon: Home },
    { label: 'Mis cursos', href: '/student/courses', icon: BookOpen },
    { label: 'Calendario', href: '/student/calendar', icon: CalendarDays },
    { label: 'Ranking', href: '/student/ranking', icon: Trophy },
    { label: 'Mis reportes', href: '/student/reports', icon: BarChart2 },
    { label: 'Credenciales', href: '/student/profile/certificados', icon: Award },
    { label: 'Historial', href: '/student/history', icon: Clock },
];

const instructorNavItems: NavItem[] = [
    {
        label: 'Cursos como instructor',
        href: '/student/instructor-courses',
        icon: GraduationCap,
        highlight: false,
    },
    {
        label: 'Sesiones en Vivo',
        href: '/student/live',
        icon: Monitor,
        highlight: false,
        pulse: true,
    },
];

async function checkIsInstructor(uid: string, role: string, membershipRole: string): Promise<boolean> {
    // Chequeo rápido por rol — sin Firestore
    if (['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'].includes(role)) return true;
    if (['INSTRUCTOR', 'ADMIN'].includes(membershipRole)) return true;

    // Chequeo por membership en cualquier org
    try {
        const q = query(
            collection(db, 'memberships'),
            where('userId', '==', uid),
            where('role', '==', 'INSTRUCTOR'),
            where('isActive', '==', true),
            limit(1),
        );
        const snap = await getDocs(q);
        return !snap.empty;
    } catch {
        return false;
    }
}

export function StudentSidebar({ collapsed }: { collapsed?: boolean }) {
    const pathname = usePathname();
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const membershipRole = useAuthStore((s) => s.membershipRole) ?? '';
    const logout = useAuthStore((s) => s.logout);
    const [hovered, setHovered] = useState(false);
    const [isInstructor, setIsInstructor] = useState(false);
    const { theme, toggleTheme } = useThemeStore();

    const isCollapsed: boolean = !!collapsed && !hovered;

    useEffect(() => {
        if (!user) return;
        checkIsInstructor(user.uid, user.role ?? '', membershipRole)
            .then(setIsInstructor);
    }, [user, membershipRole]);

    const navItems: NavItem[] = [
        ...studentNavItems,
        ...(isInstructor ? instructorNavItems : []),
    ];

    const isActive = (href: string) => {
        if (href === '/student/home' && pathname === '/student/home') return true;
        if (href !== '/student/home' && pathname.startsWith(href)) return true;
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
        <aside
            style={{
                width: sidebarWidth, minWidth: sidebarWidth,
                height: '100vh', position: 'sticky', top: 0,
                background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)',
                display: 'flex', flexDirection: 'column',
                overflowY: 'auto',
                transition: 'width 0.25s ease, min-width 0.25s ease',
                zIndex: 50,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Branding */}
            <div style={{
                padding: '80px 20px 16px',
                display: 'flex', alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: isCollapsed ? 0 : '10px',
            }}>
                {/* <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 32, height: 32, borderRadius: 'var(--radius-md)',
                    background: 'rgba(255,255,255,0.15)', color: 'var(--sidebar-text)', flexShrink: 0,
                }}>
                    <GraduationCap size={18} />
                </div>
                <span style={{
                    fontSize: '15px', fontWeight: '700', color: 'var(--sidebar-text)',
                    letterSpacing: '-0.3px',
                    opacity: isCollapsed ? 0 : 1, overflow: 'hidden', whiteSpace: 'nowrap',
                    maxWidth: isCollapsed ? 0 : '160px',
                    transition: 'opacity 0.2s ease, max-width 0.2s ease',
                }}>
                    SIERCP
                </span> */}
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: '12px' }}>

                {studentNavItems.map((item) => (
                    <NavLink key={item.href} item={item} active={isActive(item.href)} isCollapsed={isCollapsed} />
                ))}

                {/* Bloque instructor */}
                {isInstructor && (
                    <>

                        {isCollapsed}
                        {instructorNavItems.map((item) => (
                            <NavLink key={item.href} item={item} active={isActive(item.href)} isCollapsed={isCollapsed} />
                        ))}
                    </>
                )}
            </nav>

            {/* Footer */}
            <div style={{
                padding: isCollapsed ? '8px' : '12px',
                borderTop: '1px solid var(--sidebar-border)',
                display: 'flex', flexDirection: 'column', gap: 4,
                alignItems: isCollapsed ? 'center' : 'stretch',
            }}>

                <SidebarLink href="/student/tienda" icon={<ShoppingBag size={20} />} label="Tienda" isCollapsed={isCollapsed} />
                <SidebarLink href="/" icon={<Globe size={20} />} label="Volver al sitio" isCollapsed={isCollapsed} />
                <SidebarBtn onClick={handleLogout} icon={<LogOut size={20} />} label="Cerrar sesión" isCollapsed={isCollapsed} />
            </div>

            <style jsx global>{`
                @keyframes inst-pulse {
                    0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
                    50%       { opacity: 0.8; box-shadow: 0 0 0 4px rgba(16,185,129,0); }
                }
            `}</style>
        </aside>
    );
}

// ── NavLink ───────────────────────────────────────────────────────────────────
function NavLink({ item, active, isCollapsed }: { item: NavItem; active: boolean; isCollapsed: boolean }) {
    const Icon = item.icon;
    const isHighlight = item.highlight && !active;

    const bgBase = isHighlight ? 'rgba(16,185,129,0.12)' : 'transparent';
    const colorBase = isHighlight ? '#10B981' : 'var(--sidebar-text)';
    const bgHover = isHighlight ? 'rgba(16,185,129,0.22)' : 'var(--sidebar-hover-bg)';
    const colorHover = isHighlight ? '#059669' : 'var(--sidebar-hover-text)';

    return (
        <Link href={item.href} style={{ textDecoration: 'none' }}>
            <div
                style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    gap: isCollapsed ? 0 : '10px',
                    padding: isCollapsed ? '10px' : '10px 12px',
                    borderRadius: 'var(--radius-md)', marginBottom: '2px',
                    background: active ? 'var(--sidebar-active-bg)' : bgBase,
                    color: active ? 'var(--sidebar-active-text)' : colorBase,
                    fontWeight: active ? '600' : '500',
                    fontSize: '14px', transition: 'all 0.15s ease', cursor: 'pointer',
                    width: isCollapsed ? 44 : 'auto',
                    marginLeft: isCollapsed ? 'auto' : 0,
                    marginRight: isCollapsed ? 'auto' : 0,
                    border: isHighlight && !active
                        ? '1px solid rgba(16,185,129,0.25)'
                        : '1px solid transparent',
                    animation: item.pulse && !active ? 'inst-pulse 3s ease-in-out infinite' : 'none',
                }}
                onMouseEnter={(e) => {
                    if (!active) {
                        e.currentTarget.style.background = bgHover;
                        e.currentTarget.style.color = colorHover;
                    }
                }}
                onMouseLeave={(e) => {
                    if (!active) {
                        e.currentTarget.style.background = bgBase;
                        e.currentTarget.style.color = colorBase;
                    }
                }}
                title={isCollapsed ? item.label : undefined}
            >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                    {item.pulse && !active && (
                        <span style={{
                            position: 'absolute', top: -2, right: -2,
                            width: 7, height: 7, borderRadius: '50%',
                            background: '#10B981',
                            boxShadow: '0 0 5px rgba(16,185,129,0.7)',
                        }} />
                    )}
                </div>
                <span style={{
                    opacity: isCollapsed ? 0 : 1, overflow: 'hidden', whiteSpace: 'nowrap',
                    maxWidth: isCollapsed ? 0 : '200px',
                    transition: 'opacity 0.2s ease, max-width 0.2s ease',
                }}>
                    {item.label}
                </span>
            </div>
        </Link>
    );
}

// ── Footer helpers ────────────────────────────────────────────────────────────
function SidebarLink({ href, icon, label, isCollapsed }: { href: string; icon: React.ReactNode; label: string; isCollapsed: boolean }) {
    return (
        <Link href={href} style={{ textDecoration: 'none' }}>
            <div style={footerItemStyle(isCollapsed)}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--sidebar-hover-bg)'; e.currentTarget.style.color = 'var(--sidebar-hover-text)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sidebar-text)'; }}
                title={isCollapsed ? label : undefined}
            >
                {icon}
                <FadeLabel label={label} isCollapsed={isCollapsed} />
            </div>
        </Link>
    );
}

function SidebarBtn({ onClick, icon, label, isCollapsed }: { onClick: () => void; icon: React.ReactNode; label: string; isCollapsed: boolean }) {
    return (
        <button onClick={onClick} style={{ ...footerItemStyle(isCollapsed), border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--sidebar-hover-bg)'; e.currentTarget.style.color = 'var(--sidebar-hover-text)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sidebar-text)'; }}
            title={isCollapsed ? label : undefined}
        >
            {icon}
            <FadeLabel label={label} isCollapsed={isCollapsed} />
        </button>
    );
}

function FadeLabel({ label, isCollapsed }: { label: string; isCollapsed: boolean }) {
    return (
        <span style={{
            opacity: isCollapsed ? 0 : 1, overflow: 'hidden', whiteSpace: 'nowrap',
            maxWidth: isCollapsed ? 0 : '200px',
            transition: 'opacity 0.2s ease, max-width 0.2s ease',
        }}>{label}</span>
    );
}

function footerItemStyle(isCollapsed: boolean): React.CSSProperties {
    return {
        display: 'flex', alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        gap: isCollapsed ? 0 : '10px',
        padding: isCollapsed ? '10px' : '10px 12px',
        borderRadius: 'var(--radius-md)', cursor: 'pointer',
        background: 'transparent', color: 'var(--sidebar-text)',
        fontSize: '14px', fontWeight: 500,
        width: isCollapsed ? 44 : '100%',
        marginLeft: isCollapsed ? 'auto' : 0,
        marginRight: isCollapsed ? 'auto' : 0,
    };
}
