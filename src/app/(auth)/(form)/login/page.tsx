'use client';

import type { FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useThemeStore } from '@/stores/theme-store';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
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
            const currentUser = useAuthStore.getState().user;
            const role = currentUser?.role ?? 'ESTUDIANTE';
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
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error al iniciar sesión';
            setError(msg);
            setLoading(false);
        }
    }

    return (
        <div className="w-full space-y-6">
            <div className="space-y-2">
                <h1 className="text-2xl font-bold" style={{ color: theme === 'dark' ? '#FFFFFF' : '#0F172A' }}>Iniciar sesión</h1>
                <p className="text-sm" style={{ color: theme === 'dark' ? '#A5B4FC' : '#475569' }}>Bienvenido de nuevo a SIERCP</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="px-4 py-3 rounded-lg text-sm" style={{ 
                        background: theme === 'dark' ? 'rgba(252, 165, 165, 0.1)' : '#FEF2F2', 
                        color: theme === 'dark' ? '#FCA5A5' : '#DC2626', 
                        border: `1px solid ${theme === 'dark' ? 'rgba(252, 165, 165, 0.3)' : '#FCA5A5'}` 
                    }}>
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-semibold block" style={{ color: theme === 'dark' ? '#A5B4FC' : '#64748B' }} htmlFor="email">
                        Correo electrónico
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="dr.ejemplo@hospital.com"
                        className="w-full px-4 py-3 outline-none text-base transition-all"
                        style={{ 
                            background: theme === 'dark' ? '#1e2040' : '#F8FAFC', 
                            border: `1px solid ${theme === 'dark' ? '#2a2e55' : '#E2E8F0'}`, 
                            borderRadius: '8px',
                            color: theme === 'dark' ? '#FFFFFF' : '#0F172A'
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#1800AD'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(24, 0, 173, 0.1)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = theme === 'dark' ? '#2a2e55' : '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-semibold block" style={{ color: theme === 'dark' ? '#A5B4FC' : '#64748B' }} htmlFor="password">
                        Contraseña
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 outline-none text-base pr-12 transition-all"
                            style={{ 
                                background: theme === 'dark' ? '#1e2040' : '#F8FAFC', 
                                border: `1px solid ${theme === 'dark' ? '#2a2e55' : '#E2E8F0'}`, 
                                borderRadius: '8px',
                                color: theme === 'dark' ? '#FFFFFF' : '#0F172A'
                            }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = '#1800AD'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(24, 0, 173, 0.1)'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = theme === 'dark' ? '#2a2e55' : '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
                            required
                        />
                        <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center p-1"
                            style={{ color: '#6B7FCC' }}
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div className="pt-2 space-y-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 font-semibold transition-opacity disabled:opacity-50 text-white"
                        style={{ background: '#1800AD', borderRadius: '8px' }}
                        onMouseOver={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                        onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; }}
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                    </button>

                    <div className="text-center">
                        <button
                            type="button"
                            className="transition-colors underline-offset-4 hover:underline text-sm font-semibold"
                            style={{ color: '#1800AD' }}
                            onClick={() => router.push('/register')}
                        >
                            ¿No tienes cuenta? Regístrate aquí
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
