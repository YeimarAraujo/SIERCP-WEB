'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useThemeStore } from '@/stores/theme-store';

export default function RegisterPage() {
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '',
        identificacion: '', password: '', confirm: '',
        role: 'ESTUDIANTE', institutionCode: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
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

    function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        
        if (form.password !== form.confirm) {
            setError('Las contraseñas no coinciden');
            return;
        }
        if (form.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        
        setLoading(true);
        try {
            const { useAuthStore } = await import('@/stores/auth-store');
            await useAuthStore.getState().register({
                email: form.email,
                password: form.password,
                firstName: form.firstName,
                lastName: form.lastName,
                identificacion: form.identificacion,
                role: form.role,
                institutionCode: form.institutionCode || undefined,
            });
            router.replace(form.role === 'INSTRUCTOR' ? '/pending-approval' : '/home');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al registrar');
            setLoading(false);
        }
    }

    const inputStyle = {
        background: theme === 'dark' ? '#1e2040' : '#F8FAFC',
        border: `1px solid ${theme === 'dark' ? '#2a2e55' : '#E2E8F0'}`,
        borderRadius: '8px',
        color: theme === 'dark' ? '#FFFFFF' : '#0F172A',
    };

    return (
        <div className="w-full space-y-6">
            <div className="space-y-2">
                <h1 className="text-2xl font-bold" style={{ color: theme === 'dark' ? '#FFFFFF' : '#0F172A' }}>Crear cuenta</h1>
                <p className="text-sm" style={{ color: theme === 'dark' ? '#A5B4FC' : '#475569' }}>Registro de usuario</p>
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
                    <label className="text-xs uppercase tracking-widest font-semibold block" style={{ color: theme === 'dark' ? '#A5B4FC' : '#64748B' }}>Tipo de usuario</label>
                    <select
                        name="role" value={form.role}
                        onChange={handleChange}
                        className="w-full h-11 px-4 text-sm outline-none transition-all"
                        style={inputStyle}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#1800AD'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(24, 0, 173, 0.1)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = theme === 'dark' ? '#2a2e55' : '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                        <option value="ESTUDIANTE" style={{ background: '#1e2040' }}>Estudiante</option>
                        <option value="INSTRUCTOR" style={{ background: '#1e2040' }}>Instructor</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {[
                        { name: 'firstName', label: 'Nombre', placeholder: 'Juanito' },
                        { name: 'lastName', label: 'Apellido', placeholder: 'Acosta' },
                    ].map(({ name, label, placeholder }) => (
                        <div key={name} className="space-y-2">
                            <label className="text-xs uppercase tracking-widest font-semibold block" style={{ color: theme === 'dark' ? '#A5B4FC' : '#64748B' }}>{label}</label>
                            <input
                                name={name} required value={form[name as keyof typeof form]}
                                onChange={handleChange} placeholder={placeholder}
                                className="w-full px-4 py-3 text-sm outline-none transition-all"
                                style={inputStyle}
                                onFocus={(e) => { e.currentTarget.style.borderColor = '#1800AD'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(24, 0, 173, 0.1)'; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = theme === 'dark' ? '#2a2e55' : '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
                            />
                        </div>
                    ))}
                </div>

                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-semibold block" style={{ color: theme === 'dark' ? '#A5B4FC' : '#64748B' }}>Código de institución (opcional)</label>
                    <input
                        name="institutionCode" type="text"
                        value={form.institutionCode}
                        onChange={handleChange} placeholder="Ej: UPC-VALLEDUPAR"
                        className="w-full px-4 py-3 text-sm outline-none transition-all"
                        style={inputStyle}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#1800AD'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(24, 0, 173, 0.1)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = theme === 'dark' ? '#2a2e55' : '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                    <p className="text-xs" style={{ color: theme === 'dark' ? '#6B7FCC' : '#64748B' }}>
                        {form.role === 'INSTRUCTOR'
                            ? 'Instructores independientes pueden dejar este campo vacío'
                            : 'Déjalo vacío si eres estudiante independiente'}
                    </p>
                </div>

                {[
                    { name: 'email', type: 'email', label: 'Correo electrónico', placeholder: 'correo@ejemplo.com' },
                    { name: 'identificacion', type: 'text', label: 'Número de identificación', placeholder: '123456789' },
                    { name: 'password', type: 'password', label: 'Contraseña', placeholder: '••••••••' },
                    { name: 'confirm', type: 'password', label: 'Confirmar contraseña', placeholder: '••••••••' },
                ].map(({ name, type, label, placeholder }) => (
                    <div key={name} className="space-y-2">
                        <label className="text-xs uppercase tracking-widest font-semibold block" style={{ color: theme === 'dark' ? '#A5B4FC' : '#64748B' }}>{label}</label>
                        <input
                            name={name} type={type} required={name !== 'identificacion'}
                            value={form[name as keyof typeof form]}
                            onChange={handleChange} placeholder={placeholder}
                            className="w-full px-4 py-3 text-sm outline-none transition-all"
                            style={inputStyle}
                            onFocus={(e) => { e.currentTarget.style.borderColor = '#1800AD'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(24, 0, 173, 0.1)'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = theme === 'dark' ? '#2a2e55' : '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                    </div>
                ))}

                <div className="pt-2 space-y-4">
                    <button
                        type="submit" disabled={loading}
                        className="w-full py-3 font-semibold text-white transition-opacity disabled:opacity-50"
                        style={{ background: '#1800AD', borderRadius: '8px' }}
                        onMouseOver={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                        onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; }}
                    >
                        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                    </button>

                    <div className="text-center">
                        <button
                            type="button"
                            className="transition-colors underline-offset-4 hover:underline text-sm font-semibold"
                            style={{ color: '#1800AD' }}
                            onClick={() => router.push('/login')}
                        >
                            ¿Ya tienes cuenta? Inicia sesión
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
