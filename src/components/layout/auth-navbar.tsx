'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useThemeStore } from '@/stores/theme-store';

export default function AuthNavbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const { theme, toggleTheme } = useThemeStore();
    const isDark = theme === 'dark';

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isLogin = pathname === '/login';

    if (!mounted) return null;

    const navStyle: React.CSSProperties = {
        position: 'fixed',
        top: scrolled ? '12px' : '0',
        left: '50%',
        transform: 'translateX(-50%)',
        width: scrolled ? '95%' : '100%',
        maxWidth: scrolled ? '1400px' : '100%',
        height: scrolled ? '70px' : '90px',
        background: isDark ? 'rgba(11, 15, 25, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        // Use individual properties to avoid shorthand conflicts
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
        borderLeftWidth: scrolled ? '1px' : '0',
        borderRightWidth: scrolled ? '1px' : '0',
        borderTopWidth: scrolled ? '1px' : '0',
        borderLeftStyle: 'solid',
        borderRightStyle: 'solid',
        borderTopStyle: 'solid',
        borderLeftColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
        borderRightColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
        borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
        borderRadius: scrolled ? '22px' : '0',
        boxShadow: scrolled ? (isDark ? '0 20px 40px rgba(0,0,0,0.4)' : '0 20px 40px rgba(0,0,0,0.05)') : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 9999,
    };

    const containerStyle: React.CSSProperties = {
        width: '100%',
        maxWidth: '1300px',
        padding: '0 30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    };

    const linkStyle: React.CSSProperties = {
        color: 'var(--clr-text)',
        fontSize: '0.85rem',
        fontWeight: 600,
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
    };

    return (
        <header style={navStyle}>
            <div style={containerStyle}>
                {/* Logo Area */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img
                        src={isDark ? "assets/images/SICAP/webp/logo_sicap_white.webp" : "assets/images/SICAP/webp/logo_sicap.webp"}
                        alt="SIERCP"
                        style={{ height: scrolled ? '38px' : '45px', width: 'auto', cursor: 'pointer', transition: 'all 0.3s ease' }}
                        onClick={() => router.push('/')}
                    />
                </div>

                {/* Nav Links (Desktop)
                <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }} className="d-none d-lg-flex">
                    {['Documentación', 'Planes', 'Contacto', 'Sobre nosotros'].map((item) => (
                        <a key={item} style={linkStyle} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--clr-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--clr-text)'}>
                            {item}
                        </a>
                    ))}
                </div> */}
                {/* <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button
                        onClick={toggleTheme}
                        style={{
                            background: isDark ? 'rgba(255,255,255,0.05)' : 'var(--clr-primary-alpha)',
                            border: 'none',
                            color: 'var(--clr-primary)',
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <i className={`bi ${isDark ? 'bi-sun-fill' : 'bi-moon-stars-fill'}`} style={{ fontSize: '1rem' }} />
                    </button>

                    <button
                        onClick={() => router.push(isLogin ? '/' : '/login')}
                        style={{
                            background: 'transparent',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                            borderRadius: '12px',
                            padding: '10px 20px',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: 'var(--clr-text)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--clr-bg-light)'; e.currentTarget.style.borderColor = 'var(--clr-primary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'; }}
                    >
                        {isLogin ? '← Inicio' : 'Acceder'}
                    </button>

                    <button
                        onClick={() => router.push('/register')}
                        className="btn-brand"
                        style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 15px var(--clr-primary-alpha)',
                        }}
                    >
                        {isLogin ? 'Registrarse' : 'Crear Cuenta'}
                        <i className="bi bi-chevron-right" style={{ fontSize: '0.75rem' }} />
                    </button>
                </div> */}
            </div>
        </header>
    );
}
