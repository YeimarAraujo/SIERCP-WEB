'use client';

import type { FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useThemeStore } from '@/stores/theme-store';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const nextParam = searchParams.get('next');
    const { theme } = useThemeStore();

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        async function init() {
            try {
                const { useAuthStore } = await import('@/stores/auth-store');
                unsubscribe = useAuthStore.getState().initialize();
            } catch (e) {
                console.error('Auth init error:', e);
            }
        }
        init();
        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, []);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { useAuthStore } = await import('@/stores/auth-store');
            await useAuthStore.getState().login(email, password);
            toast.success('Inicio de sesión exitoso');
            const currentUser = useAuthStore.getState().user;
            const role = currentUser?.role ?? 'ESTUDIANTE';
            if (nextParam) {
                router.replace(nextParam);
            } else {
                switch (role) {
                    case 'ADMIN':
                    case 'SUPER_ADMIN':
                        router.replace('/admin/dashboard');
                        break;
                    case 'INSTRUCTOR':
                        router.replace('/instructor/dashboard');
                        break;
                    default:
                        router.replace('/student/home');
                }
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error al iniciar sesión';
            setError(msg);
            toast.error(msg);
            setLoading(false);
        }
    }

    const inputStyle = {
        width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--clr-border)",
        background: "var(--clr-bg)", color: "var(--clr-text)", fontSize: "0.95rem", transition: "all 0.2s ease"
    };

    return (
        <div className="w-full">
            <div className="text-center mb-8">
                <h1 style={{ fontSize: "2.5rem", fontWeight: 900, marginBottom: "12px", color: "var(--clr-text-head)", letterSpacing: "-1px" }}>¡Bienvenido!</h1>
                <p style={{ color: "var(--clr-muted)", fontSize: "1.05rem" }}>Inicia sesión para acceder a tu panel de control SIERCP.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="px-4 py-3 rounded-xl text-sm d-flex align-items-center gap-3" style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        <i className="bi bi-exclamation-circle-fill" />
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--clr-text)", marginBottom: "8px", display: "block" }} htmlFor="email">
                            Correo electrónico
                        </label>
                        <div className="position-relative">
                            <i className="bi bi-envelope position-absolute" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-muted)' }} />
                            <input
                                id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@correo.com"
                                style={{ ...inputStyle, paddingLeft: '45px' }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--clr-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--clr-primary-alpha)'; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--clr-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--clr-text)", margin: 0 }} htmlFor="password">
                                Contraseña
                            </label>
                            <a href="#" style={{ fontSize: "0.8rem", color: "var(--clr-primary)", fontWeight: 700, textDecoration: "none" }}>¿Olvidaste tu contraseña?</a>
                        </div>
                        <div className="position-relative">
                            <i className="bi bi-shield-lock position-absolute" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-muted)' }} />
                            <input
                                id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{ ...inputStyle, paddingLeft: '45px', paddingRight: '45px' }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--clr-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--clr-primary-alpha)'; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--clr-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                                required
                            />
                            <button
                                type="button"
                                className="position-absolute border-0 bg-transparent p-0"
                                style={{ right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-muted)', display: 'flex' }}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-4 space-y-4">
                    <button
                        type="submit" disabled={loading}
                        className="btn-brand w-100"
                        style={{ padding: "16px", borderRadius: "16px", fontSize: "1.1rem", justifyContent: "center" }}
                    >
                        {loading ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-box-arrow-in-right me-2" />}
                        {loading ? 'Cargando...' : 'Iniciar Sesión'}
                    </button>

                    <p className="text-center" style={{ fontSize: "0.95rem", color: "var(--clr-muted)" }}>
                        ¿Aún no tienes cuenta?{' '}
                        <button type="button" onClick={() => router.push('/register')} style={{ color: "var(--clr-primary)", fontWeight: 800, background: "none", border: "none", padding: 0 }}>Regístrate aquí</button>
                    </p>
                </div>
            </form>
        </div>
    );
}
