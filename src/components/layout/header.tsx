'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getUserInitials, getFullName } from '@/models/user';
import { ChevronDown, ChevronLeft, Bell, Search, Settings, LogOut, User as UserIcon } from 'lucide-react';
import { GlobalSearch } from '@/components/ui/global-search';
import { NotificationsDrawer } from '@/components/ui/notifications-drawer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface HeaderProps {
    title?: string;
    dark?: boolean;
    showBack?: boolean;
    onBack?: () => void;
}

export function Header({ title, dark = false, showBack, onBack }: HeaderProps) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isProfileOpen) return;
        const handle = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, [isProfileOpen]);

    const bgColor = dark ? 'var(--foreground)' : 'var(--card)';
    const borderColor = dark ? 'rgba(255,255,255,0.1)' : 'var(--border)';
    const textColor = dark ? 'var(--text-on-brand)' : 'var(--foreground)';
    const subTextColor = dark ? 'var(--text-muted)' : 'var(--text-secondary)';

    const profileHref = user?.role === 'ADMIN'
        ? '/admin/profile'
        : user?.role === 'SUPER_ADMIN'
            ? '/super-admin/profile'
            : user?.role === 'INSTRUCTOR'
                ? '/instructor/profile'
                : '/student/profile';

    const settingsHref = user?.role === 'ADMIN'
        ? '/admin/settings'
        : user?.role === 'SUPER_ADMIN'
            ? '/super-admin/settings'
            : profileHref;

    return (
        <>
            <header className="surface-glass" style={{
                display: 'flex', height: 64, alignItems: 'center', justifyContent: 'space-between',
                borderBottom: `1px solid ${borderColor}`, background: bgColor, padding: '0 32px',
                position: 'sticky', top: 0, zIndex: 100, transition: 'all 0.3s ease'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {showBack && onBack && (
                        <button
                            onClick={onBack}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: 32, height: 32, borderRadius: 8, border: 'none',
                                background: dark ? 'rgba(255,255,255,0.1)' : 'var(--muted)',
                                color: textColor, cursor: 'pointer', padding: 0
                            }}
                        >
                            <ChevronLeft size={18} />
                        </button>
                    )}
                    {/* <h1 style={{ fontSize: 14, fontWeight: 700, color: textColor, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                        {title}
                    </h1> */}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    {/* Search & Notifications */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: subTextColor }}>
                        <div
                            onClick={() => setIsSearchOpen(true)}
                            style={{ cursor: 'pointer', padding: 8, borderRadius: 10, transition: 'background 0.2s' }}
                            className="header-icon-btn"
                        >
                            <Search size={18} />
                        </div>
                        <div
                            onClick={() => setIsNotificationsOpen(true)}
                            style={{ position: 'relative', cursor: 'pointer', padding: 8, borderRadius: 10, transition: 'background 0.2s' }}
                            className="header-icon-btn"
                        >
                            <Bell size={18} />
                            <div style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: '50%', background: '#EF4444', border: `2px solid ${bgColor}` }} />
                        </div>
                    </div>

                    <div style={{ width: 1, height: 24, background: borderColor }} />

                    {user && (
                        <div ref={profileRef} style={{ position: 'relative' }}>
                            <div
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', padding: '4px 8px', borderRadius: 12, transition: 'background 0.2s' }}
                                className="header-profile-hover"
                            >
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: textColor, margin: 0 }}>{getFullName(user)}</p>
                                    <p style={{ fontSize: 11, color: subTextColor, margin: 0, fontWeight: 500 }}>{user.role}</p>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <div style={{
                                        display: 'flex', width: 38, height: 38, alignItems: 'center', justifyContent: 'center',
                                        borderRadius: 12, background: 'linear-gradient(135deg, var(--brand) 0%, var(--clr-accent) 100%)',
                                        color: 'var(--text-on-brand)', fontSize: 13, fontWeight: 800, boxShadow: '0 4px 6px -1px rgba(24, 0, 173, 0.2)',
                                        border: '2px solid var(--card)', overflow: 'hidden'
                                    }}>
                                        {user.avatarUrl ? (
                                            <img src={user.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : getUserInitials(user)}
                                    </div>
                                    <div style={{
                                        position: 'absolute', bottom: -2, right: -2, width: 10, height: 10,
                                        borderRadius: '50%', background: '#10B981', border: `2px solid ${bgColor}`
                                    }} />
                                </div>
                                <ChevronDown size={14} style={{ color: subTextColor, transform: isProfileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </div>

                            {/* Profile Dropdown */}
                            {isProfileOpen && (
                                <div style={{
                                    position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: 220,
                                    background: 'var(--popover)', borderRadius: 16, border: '1px solid var(--border)',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', overflow: 'hidden', zIndex: 9999
                                }}>
                                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>MI CUENTA</p>
                                    </div>
                                    <div style={{ padding: 8 }}>
                                        <Link href={profileHref} onClick={() => setIsProfileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, textDecoration: 'none', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }} className="dropdown-item">
                                            <UserIcon size={16} /> Ver Perfil
                                        </Link>
                                        <Link href={settingsHref} onClick={() => setIsProfileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, textDecoration: 'none', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }} className="dropdown-item">
                                            <Settings size={16} /> Configuración
                                        </Link>
                                    </div>
                                    <div style={{ padding: 8, borderTop: '1px solid var(--border)' }}>
                                        <button onClick={() => { logout(); setIsProfileOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', background: 'transparent', color: '#EF4444', fontSize: 13, fontWeight: 700, cursor: 'pointer' }} className="dropdown-item-danger">
                                            <LogOut size={16} /> Cerrar Sesión
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <style jsx>{`
                    .header-profile-hover:hover {
                        background: ${dark ? 'rgba(255,255,255,0.05)' : 'var(--muted)'};
                    }
                    .header-icon-btn:hover {
                        background: ${dark ? 'rgba(255,255,255,0.05)' : 'var(--muted)'};
                        color: var(--brand);
                    }
                    .dropdown-item:hover {
                        background: var(--muted);
                        color: var(--brand) !important;
                    }
                    .dropdown-item-danger:hover {
                        background: var(--danger-bg);
                    }
                `}</style>
            </header>

            {/* Overlays */}
            <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
            <NotificationsDrawer isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />

        </>
    );
}
