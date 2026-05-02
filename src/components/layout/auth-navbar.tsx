'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/stores/theme-store';

export default function AuthNavbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const { theme, toggleTheme } = useThemeStore();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setMounted(true);
    }, []);

    const pathname = mounted ? (typeof window !== 'undefined' ? window.location.pathname : '') : '';
    const isLogin = pathname === '/login';

    // Styles
    const headerStyles = {
        background: 'rgba(10, 8, 40, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    };

    const themeBtnStyle = {
        borderColor: 'rgba(255, 255, 255, 0.3)',
        background: 'rgba(255, 255, 255, 0.08)',
        cursor: 'pointer' as const,
    };

    const secondaryBtnStyle = {
        color: '#FFFFFF' as string,
        background: 'transparent',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '8px',
        padding: '8px 18px',
        fontSize: '14px',
        fontWeight: '500' as const,
        cursor: 'pointer' as const,
    };

    const primaryBtnStyle = {
        background: '#1800AD',
        color: '#FFFFFF',
        border: '1px solid #1800AD',
        borderRadius: '8px',
        padding: '8px 18px',
        fontSize: '14px',
        fontWeight: '500' as const,
        cursor: 'pointer' as const,
    };

    // Render neutral version until mounted (avoid hydration mismatch)
    if (!mounted) {
        return (
            <header
                className="sticky top-0 left-0 right-0 z-50 h-16 flex items-center px-4 md:px-8"
                style={headerStyles}
            >
                <div className="flex justify-between items-center w-full">
                    <div>
                        <img
                            src="/images/logov3.png"
                            alt="SIERCP"
                            className="h-8 md:h-10 w-auto cursor-pointer"
                            onClick={() => router.push('/')}
                        />
                    </div>
                    <nav className="hidden md:flex gap-8">
                        <a className="text-sm font-medium transition-colors hover:text-white cursor-pointer" style={{ color: '#C7D2FE' }}>Documentación</a>
                        <a className="text-sm font-medium transition-colors hover:text-white cursor-pointer" style={{ color: '#C7D2FE' }}>Planes</a>
                        <a className="text-sm font-medium transition-colors hover:text-white cursor-pointer" style={{ color: '#C7D2FE' }}>Contacto</a>
                        <a className="text-sm font-medium transition-colors hover:text-white cursor-pointer" style={{ color: '#C7D2FE' }}>Sobre nosotros</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <button
                            className="w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300"
                            style={themeBtnStyle}
                            aria-label="Toggle theme"
                        >
                            <Moon size={20} color="white" />
                        </button>
                        <button className="text-sm font-medium transition-all duration-200 cursor-pointer" style={secondaryBtnStyle}>
                            Iniciar sesión
                        </button>
                        <button className="text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer" style={primaryBtnStyle}>
                            Registrarse
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>
        );
    }

    // Once mounted, render with actual pathname logic
    return (
        <header
            className="sticky top-0 left-0 right-0 z-50 h-16 flex items-center px-4 md:px-8"
            style={headerStyles}
        >
            <div className="flex justify-between items-center w-full">
                <div>
                    <img
                        src="/images/logov3.png"
                        alt="SIERCP"
                        className="h-8 md:h-10 w-auto cursor-pointer"
                        onClick={() => router.push('/')}
                    />
                </div>
                <nav className="hidden md:flex gap-8">
                    <a className="text-sm font-medium transition-colors hover:text-white cursor-pointer" style={{ color: '#C7D2FE' }}>Documentación</a>
                    <a className="text-sm font-medium transition-colors hover:text-white cursor-pointer" style={{ color: '#C7D2FE' }}>Planes</a>
                    <a className="text-sm font-medium transition-colors hover:text-white cursor-pointer" style={{ color: '#C7D2FE' }}>Contacto</a>
                    <a className="text-sm font-medium transition-colors hover:text-white cursor-pointer" style={{ color: '#C7D2FE' }}>Sobre nosotros</a>
                </nav>
                <div className="flex items-center gap-4">
                    {/* Theme Toggle */}
                    <button
                        className="w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300"
                        style={themeBtnStyle}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
                            e.currentTarget.style.transform = 'rotate(20deg)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                            e.currentTarget.style.transform = 'rotate(0deg)';
                        }}
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                    >
                        <div style={{ transition: 'transform 0.4s ease', transform: theme === 'dark' ? 'rotate(0deg)' : 'rotate(180deg)' }}>
                            {theme === 'dark' ? <Moon size={20} color="white" /> : <Sun size={20} color="white" />}
                        </div>
                    </button>

                    {/* Left Button: "Iniciar sesión" or "← Volver" */}
                    {isLogin ? (
                        <button
                            className="text-sm font-medium transition-all duration-200 cursor-pointer flex items-center gap-1"
                            style={secondaryBtnStyle}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                            }}
                            onClick={() => router.push('/')}
                        >
                            ← Volver
                        </button>
                    ) : (
                        <button
                            className="text-sm font-medium transition-all duration-200 cursor-pointer"
                            style={secondaryBtnStyle}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                            }}
                            onClick={() => router.push('/login')}
                        >
                            Iniciar sesión
                        </button>
                    )}

                    {/* Right Button: "Registrarse →" or "← Volver" */}
                    {isLogin ? (
                        <button
                            className="text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer"
                            style={primaryBtnStyle}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#2200d4';
                                e.currentTarget.style.borderColor = '#2200d4';
                                e.currentTarget.style.transform = 'translateX(2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#1800AD';
                                e.currentTarget.style.borderColor = '#1800AD';
                                e.currentTarget.style.transform = 'translateX(0)';
                            }}
                            onClick={() => router.push('/register')}
                        >
                            Registrarse
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    ) : (
                        <button
                            className="text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer"
                            style={primaryBtnStyle}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#2200d4';
                                e.currentTarget.style.borderColor = '#2200d4';
                                e.currentTarget.style.transform = 'translateX(2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#1800AD';
                                e.currentTarget.style.borderColor = '#1800AD';
                                e.currentTarget.style.transform = 'translateX(0)';
                            }}
                            onClick={() => router.push('/')}
                        >
                            ← Volver
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
