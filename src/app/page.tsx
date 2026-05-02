'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/stores/theme-store';

const overlayBg = 'rgba(10,8,40,0.65)';
const badgeBg = 'rgba(255,255,255,0.08)';
const badgeBorder = 'rgba(199,210,254,0.25)';
const regBorder = 'rgba(255,255,255,0.6)';

export default function LandingPage() {
    const [scrolled, setScrolled] = useState(false);
    const router = useRouter();
    const initialized = useRef(false);
    const { theme, toggleTheme } = useThemeStore();

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;
        async function init() {
            try {
                const { useAuthStore } = await import('@/stores/auth-store');
                useAuthStore.getState().initialize();
            } catch (e) {
                console.error('Auth init error:', e);
            }
        }
        init();
    }, []);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen flex flex-col">
            {/* Navbar */}
            <header
                className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-4 md:px-8 transition-all duration-300"
                style={{
                    background: scrolled ? 'rgba(10,8,40,0.85)' : 'transparent',
                    backdropFilter: scrolled ? 'blur(12px)' : 'none',
                    WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
                    borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
                    transition: 'background 0.3s ease, backdrop-filter 0.3s ease',
                }}
            >
                <div className="flex justify-between items-center w-full">
                    <div>
                        <img
                            src="/images/logov3.png"
                            alt="SIERCP"
                            className="h-8 md:h-10 w-auto cursor-pointer"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
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
                            style={{
                                borderColor: 'rgba(255,255,255,0.3)',
                                background: 'rgba(255,255,255,0.08)',
                                cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.18)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
                                e.currentTarget.style.transform = 'rotate(20deg)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                                e.currentTarget.style.transform = 'rotate(0deg)';
                            }}
                            onClick={toggleTheme}
                            aria-label="Toggle theme"
                            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                        >
                            <div style={{ transition: 'transform 0.4s ease, opacity 0.3s ease', transform: theme === 'dark' ? 'rotate(0deg)' : 'rotate(180deg)' }}>
                                {theme === 'dark'
                                    ? <Moon size={20} color="white" />
                                    : <Sun size={20} color="white" />
                                }
                            </div>
                        </button>

                        {/* Iniciar sesión */}
                        <button
                            className="text-sm font-medium transition-all duration-200 cursor-pointer"
                            style={{
                                color: '#FFFFFF',
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: '8px',
                                padding: '8px 18px',
                                fontSize: '14px',
                                fontWeight: '500',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                            }}
                            onClick={() => router.push('/login')}
                        >
                            Iniciar sesión
                        </button>

                        {/* Registrarse */}
                        <button
                            className="text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer"
                            style={{
                                background: '#1800AD',
                                color: '#FFFFFF',
                                border: '1px solid #1800AD',
                                borderRadius: '8px',
                                padding: '8px 18px',
                                fontSize: '14px',
                            }}
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
                    </div>
                </div>
            </header>

            {/* Hero Full-Width with Background Image */}
            <main className="relative w-full" style={{ height: '100vh' }}>
                {/* Background Image */}
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        backgroundImage: "url('/images/background-mid.png')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                    }}
                />
                {/* Overlay */}
                <div
                    className="absolute inset-0 z-0"
                    style={{ background: overlayBg }}
                />
                {/* Content */}
                <div
                    className="relative z-10 flex flex-col items-center justify-center text-center px-6"
                    style={{ height: '100%' }}
                >
                    <div className="space-y-6 md:space-y-8" style={{ maxWidth: '640px' }}>
                        <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                            Entrena mejor, salva más vidas.
                        </h1>
                        <p className="text-base md:text-lg leading-relaxed mx-auto" style={{ color: '#A5B4FC', maxWidth: '520px' }}>
                            Accede a tu plataforma de entrenamiento RCP con métricas clínicas en tiempo real.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                className="cursor-pointer select-none font-semibold text-base transition-all duration-200"
                                style={{
                                    background: '#1800AD',
                                    color: '#FFFFFF',
                                    border: '2px solid #1800AD',
                                    borderRadius: '10px',
                                    padding: '14px 32px',
                                    fontSize: '16px',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#FFFFFF';
                                    e.currentTarget.style.color = '#1800AD';
                                    e.currentTarget.style.border = '2px solid #FFFFFF';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#1800AD';
                                    e.currentTarget.style.color = '#FFFFFF';
                                    e.currentTarget.style.border = '2px solid #1800AD';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                                onClick={() => router.push('/login')}
                            >
                                Comenzar ahora
                            </button>
                            <button
                                className="cursor-pointer select-none font-semibold text-base transition-all duration-200"
                                style={{
                                    background: 'transparent',
                                    color: '#FFFFFF',
                                    border: '2px solid rgba(255,255,255,0.6)',
                                    borderRadius: '10px',
                                    padding: '14px 32px',
                                    fontSize: '16px',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                                    e.currentTarget.style.borderColor = '#FFFFFF';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                                onClick={() => {
                                    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
                                    if (appUrl && appUrl !== '#') window.open(appUrl, '_blank');
                                }}
                            >
                                Descargar App
                            </button>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap justify-center gap-3 pt-4">
                            {[
                                'Estándares AHA 2024',
                                'Métricas en tiempo real',
                                'Historial certificado',
                            ].map((text) => (
                                <div
                                    key={text}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full"
                                    style={{
                                        background: badgeBg,
                                        border: '1px solid ' + badgeBorder,
                                        color: '#C7D2FE',
                                    }}
                                >
                                    <svg className="w-4 h-4" style={{ color: '#38BDF8' }} fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-xs uppercase tracking-wider">{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-6 text-xs" style={{ background: '#0A005C', color: '#6B7FCC' }}>
                <div className="flex flex-col md:flex-row justify-between items-center px-4 md:px-8 gap-4">
                    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                        <span className="font-bold text-white">SIERCP</span>
                        <span>© 2026 SIERCP Medical Training. Profesionales de la salud.</span>
                    </div>
                    <nav className="flex flex-wrap justify-center gap-4 md:gap-6">
                        <a className="hover:underline cursor-pointer" style={{ color: '#C7D2FE' }}>¿Quieres implementar SIERCP?</a>
                        <a className="hover:underline cursor-pointer" style={{ color: '#C7D2FE' }}>Solicitar demo</a>
                        <a className="hover:underline cursor-pointer" style={{ color: '#C7D2FE' }}>Contacto</a>
                    </nav>
                </div>
            </footer>
        </div>
    );
}
