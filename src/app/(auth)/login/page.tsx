'use client';

import type { FormEvent } from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scrolled, setScrolled] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const initialized = useRef(false);

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
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            const { useAuthStore } = await import('@/stores/auth-store');
            await useAuthStore.getState().login(email, password);
            await new Promise(resolve => setTimeout(resolve, 200));
            window.location.replace('/home');
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error al iniciar sesión';
            setError(msg);
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col" style={{ background: '#0E0080' }}>
            {/* Navbar */}
            <header 
                className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-4 md:px-8 transition-all duration-300"
                style={{ 
                    background: scrolled ? 'rgba(14, 0, 128, 0.85)' : 'transparent',
                    backdropFilter: scrolled ? 'blur(16px)' : 'none',
                    WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
                    borderBottom: scrolled ? '1px solid rgba(199, 210, 254, 0.12)' : '1px solid transparent'
                }}
            >
                <div className="flex justify-between items-center w-full">
                    <div>
                        <img 
                            src="/images/logov3.png" 
                            alt="SIERCP" 
                            className="h-8 md:h-10 w-auto"
                        />
                    </div>
                    <nav className="hidden md:flex gap-8">
                        <a className="text-sm font-medium transition-colors" style={{ color: '#C7D2FE' }} href="#">Documentación</a>
                        <a className="text-sm font-medium transition-colors" style={{ color: '#C7D2FE' }} href="#">Planes</a>
                        <a className="text-sm font-medium transition-colors" style={{ color: '#C7D2FE' }} href="#">Contacto</a>
                        <a className="text-sm font-medium transition-colors" style={{ color: '#C7D2FE' }} href="#">Sobre nosotros</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <a 
                            href="/register" 
                            className="px-3 md:px-5 py-1.5 md:py-2 rounded-lg font-semibold text-sm transition-colors"
                            style={{ 
                                background: '#FFFFFF', 
                                color: '#0E0080'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = '#E0E7FF';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = '#FFFFFF';
                            }}
                        >
                            Acceder
                        </a>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow flex flex-col md:flex-row pt-16" style={{ minHeight: 'calc(100vh - 64px)' }}>
                {/* Left Column: Login Form */}
                <div 
                    className="flex flex-col justify-center px-6 md:px-12 lg:px-24 py-10"
                    style={{ 
                        flex: '1', 
                        width: '100%',
                        background: '#1C1070' 
                    }}
                >
                    <div className="w-full max-w-md mx-auto space-y-6 md:space-y-8">
                        {/* Mobile logo - only visible on mobile (<640px) */}
                        <div className="flex justify-center items-center md:hidden" style={{ paddingTop: '8px', paddingBottom: '28px', marginBottom: '4px' }}>
                            <img 
                                src="/images/logov3.png" 
                                alt="SIERCP" 
                                style={{
                                    width: '88px',
                                    height: '88px',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 0 20px rgba(45, 31, 212, 0.5))'
                                }}
                            />
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                                Entrena mejor, salva más vidas.
                            </h1>
                            <p className="text-base md:text-lg leading-relaxed" style={{ color: '#A5B4FC' }}>
                                Accede a tu plataforma de entrenamiento RCP con métricas clínicas en tiempo real.
                            </p>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                            {error && (
                                <div className="px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(255,255,255,0.1)', color: '#FCA5A5', border: '1px solid rgba(252, 165, 165, 0.3)' }}>
                                    {error}
                                </div>
                            )}
                            
                            <div className="space-y-2">
                                <label 
                                    className="text-xs uppercase tracking-widest font-semibold block" 
                                    style={{ color: '#A5B4FC' }}
                                    htmlFor="email"
                                >
                                    Correo electrónico
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="dr.ejemplo@hospital.com"
                                    className="w-full text-white px-4 py-3 rounded-xl transition-all outline-none text-base placeholder:text-[#6B7FCC]"
                                    style={{ 
                                        background: 'rgba(255, 255, 255, 0.06)',
                                        border: '1px solid rgba(199, 210, 254, 0.25)'
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = '#38BDF8';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.15)';
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(199, 210, 254, 0.25)';
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                    }}
                                    required
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label 
                                    className="text-xs uppercase tracking-widest font-semibold block" 
                                    style={{ color: '#A5B4FC' }}
                                    htmlFor="password"
                                >
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full text-white px-4 py-3 rounded-xl transition-all outline-none text-base placeholder:text-[#6B7FCC] pr-12"
                                        style={{ 
                                            background: 'rgba(255, 255, 255, 0.06)',
                                            border: '1px solid rgba(199, 210, 254, 0.25)'
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.borderColor = '#38BDF8';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.15)';
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)';
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.borderColor = 'rgba(199, 210, 254, 0.25)';
                                            e.currentTarget.style.boxShadow = 'none';
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                        }}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center p-1"
                                        style={{ color: '#6B7FCC' }}
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="pt-2 md:pt-4 flex flex-col space-y-4">
                                <button 
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                                    style={{ 
                                        background: '#FFFFFF', 
                                        color: '#0E0080'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.background = '#E0E7FF';
                                        e.currentTarget.style.color = '#0E0080';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.background = '#FFFFFF';
                                        e.currentTarget.style.color = '#0E0080';
                                    }}
                                >
                                    {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                                </button>
                                
                                <div className="text-center">
                                    <a 
                                        className="transition-colors underline-offset-4 hover:underline" 
                                        style={{ color: '#38BDF8' }} 
                                        href="/register"
                                    >
                                        ¿No tienes cuenta? Regístrate aquí
                                    </a>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Column: Visual & Trust - hidden on mobile, visible on tablet+ */}
                <div 
                    className="hidden md:flex flex-col items-center justify-center px-8 lg:px-10 py-8 lg:py-0 relative" 
                    style={{ 
                        flex: '0 0 50%', 
                        minHeight: '300px',
                        background: 'radial-gradient(ellipse at 60% 35%, #1F0EA0 0%, #130060 65%)'
                    }}
                >
                    <div className="relative flex items-center justify-center mb-8 md:mb-12">
                        <div 
                            className="absolute w-64 md:w-80 h-64 md:h-80 rounded-full"
                            style={{ 
                                background: 'radial-gradient(circle, rgba(45, 31, 212, 0.4) 0%, transparent 70%)',
                                transform: 'translate(-50%, -50%)',
                                top: '50%',
                                left: '50%'
                            }}
                        />
                        
                        <img 
                            src="/images/vector-login.png" 
                            alt="Entrenamiento RCP SIERCP" 
                            className="max-w-xs md:max-w-md w-full h-auto relative z-10"
                            style={{
                                borderRadius: '24px',
                                boxShadow: `
                                    0 0 0 1px rgba(199, 210, 254, 0.15),
                                    0 4px 6px rgba(0, 0, 0, 0.25),
                                    0 20px 60px rgba(0, 0, 0, 0.45),
                                    inset 0 1px 0 rgba(255, 255, 255, 0.08)
                                `
                            }}
                        />
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                        <div 
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                            style={{ 
                                background: 'rgba(255, 255, 255, 0.08)', 
                                border: '1px solid rgba(199, 210, 254, 0.25)',
                                color: '#C7D2FE'
                            }}
                        >
                            <svg className="w-4 h-4" style={{ color: '#38BDF8' }} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs uppercase tracking-wider">Estándares AHA 2024</span>
                        </div>
                        <div 
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                            style={{ 
                                background: 'rgba(255, 255, 255, 0.08)', 
                                border: '1px solid rgba(199, 210, 254, 0.25)',
                                color: '#C7D2FE'
                            }}
                        >
                            <svg className="w-4 h-4" style={{ color: '#38BDF8' }} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs uppercase tracking-wider">Métricas en tiempo real</span>
                        </div>
                        <div 
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                            style={{ 
                                background: 'rgba(255, 255, 255, 0.08)', 
                                border: '1px solid rgba(199, 210, 254, 0.25)',
                                color: '#C7D2FE'
                            }}
                        >
                            <svg className="w-4 h-4" style={{ color: '#38BDF8' }} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs uppercase tracking-wider">Historial certificado</span>
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
                        <a className="hover:underline cursor-pointer" href="#">¿Quieres implementar SIERCP?</a>
                        <a className="hover:underline cursor-pointer" href="#">Solicitar demo</a>
                        <a className="hover:underline cursor-pointer" href="#">Contacto</a>
                    </nav>
                </div>
            </footer>
        </div>
    );
}