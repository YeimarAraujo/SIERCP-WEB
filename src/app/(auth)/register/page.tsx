'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '',
        identificacion: '', password: '', confirm: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
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

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
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
            });
            // Give Firebase a moment to update, then redirect
            setTimeout(() => {
                window.location.href = '/home';
            }, 300);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al registrar');
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center space-y-1">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground text-xl font-bold mb-2">
                        S
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight">Crear cuenta</h1>
                    <p className="text-sm text-muted-foreground">Registro de estudiante</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { name: 'firstName', label: 'Nombre', placeholder: 'Juan' },
                            { name: 'lastName', label: 'Apellido', placeholder: 'Pérez' },
                        ].map(({ name, label, placeholder }) => (
                            <div key={name} className="space-y-1">
                                <label className="text-sm font-medium">{label}</label>
                                <input
                                    name={name} required value={form[name as keyof typeof form]}
                                    onChange={handleChange} placeholder={placeholder}
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                            </div>
                        ))}
                    </div>

                    {[
                        { name: 'email', type: 'email', label: 'Correo electrónico', placeholder: 'correo@ejemplo.com', autoComplete: 'email' },
                        { name: 'identificacion', type: 'text', label: 'Número de identificación', placeholder: '123456789', autoComplete: 'off' },
                        { name: 'password', type: 'password', label: 'Contraseña', placeholder: '••••••••', autoComplete: 'new-password' },
                        { name: 'confirm', type: 'password', label: 'Confirmar contraseña', placeholder: '••••••••', autoComplete: 'new-password' },
                    ].map(({ name, type, label, placeholder, autoComplete }) => (
                        <div key={name} className="space-y-1">
                            <label className="text-sm font-medium">{label}</label>
                            <input
                                name={name} type={type} required={name !== 'identificacion'}
                                value={form[name as keyof typeof form]}
                                onChange={handleChange} placeholder={placeholder}
                                autoComplete={autoComplete}
                                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                        </div>
                    ))}

                    <button
                        type="submit" disabled={loading}
                        className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                    </button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                    ¿Ya tienes cuenta?{' '}
                    <a href="/login" className="text-primary underline-offset-4 hover:underline">
                        Inicia sesión
                    </a>
                </p>
            </div>
        </div>
    );
}