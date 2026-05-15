'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useThemeStore } from '@/stores/theme-store';
import toast from 'react-hot-toast';

function RegisterContent() {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '',
        identificacion: '', password: '', confirm: '',
        role: 'ESTUDIANTE', institutionCode: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const nextParam = searchParams.get('next');
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';

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

    const validateStep1 = () => {
        if (!form.firstName || !form.lastName || !form.identificacion) {
            setError('Por favor completa todos los campos personales');
            return false;
        }
        setError(null);
        return true;
    };

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
            toast.success('Registro exitoso');
            if (nextParam) {
                router.replace(nextParam);
            } else {
                router.replace(form.role === 'INSTRUCTOR' ? '/pending-approval' : '/home');
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error al registrar';
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
        <div className="w-full" style={{ maxWidth: '580px', margin: '0 auto' }}>
            <div className="text-center mb-6">
                <h1 style={{ fontSize: "2.2rem", fontWeight: 900, marginBottom: "8px", color: "var(--clr-text-head)", letterSpacing: "-1px" }}>Únete a SIERCP</h1>
                <p style={{ color: "var(--clr-muted)", fontSize: "0.95rem" }}>{step === 1 ? 'Cuéntanos un poco sobre ti.' : 'Configura tu acceso.'}</p>
            </div>

            {/* Progress Bar */}
            <div className="d-flex align-items-center mb-4 gap-3 px-2">
                <div style={{ flex: 1, height: '5px', borderRadius: '10px', background: 'var(--clr-primary)', transition: 'all 0.5s ease' }} />
                <div style={{ flex: 1, height: '5px', borderRadius: '10px', background: step >= 2 ? 'var(--clr-primary)' : 'var(--clr-border)', transition: 'all 0.5s ease' }} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="px-4 py-2 rounded-xl text-sm d-flex align-items-center gap-3 mb-3" style={{ 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        color: '#ef4444', 
                        border: '1px solid rgba(239, 68, 68, 0.2)' 
                    }}>
                        <i className="bi bi-exclamation-circle-fill" />
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <div className="animate__animated animate__fadeIn">
                        <div style={{ background: 'var(--clr-bg)', padding: '24px', borderRadius: '24px', border: '1px solid var(--clr-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.02)' }}>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--clr-text-head)", margin: 0 }}>Información Personal</h3>
                                <div className="d-flex gap-1 p-1" style={{ background: 'var(--clr-bg-light)', borderRadius: '12px', border: '1px solid var(--clr-border)' }}>
                                    <button type="button" onClick={() => setForm(f => ({...f, role: 'ESTUDIANTE'}))} style={{ padding: '6px 12px', borderRadius: '9px', border: 'none', fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.3s ease', background: form.role === 'ESTUDIANTE' ? 'var(--clr-primary)' : 'transparent', color: form.role === 'ESTUDIANTE' ? '#fff' : 'var(--clr-muted)' }}>Estudiante</button>
                                    <button type="button" onClick={() => setForm(f => ({...f, role: 'INSTRUCTOR'}))} style={{ padding: '6px 12px', borderRadius: '9px', border: 'none', fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.3s ease', background: form.role === 'INSTRUCTOR' ? 'var(--clr-primary)' : 'transparent', color: form.role === 'INSTRUCTOR' ? '#fff' : 'var(--clr-muted)' }}>Instructor</button>
                                </div>
                            </div>

                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--clr-text-head)", marginBottom: "6px", display: "block" }}>Nombre(s)</label>
                                    <div className="position-relative">
                                        <i className="bi bi-person position-absolute" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-muted)' }} />
                                        <input name="firstName" required value={form.firstName} onChange={handleChange} placeholder="Ej: Juan" style={{ ...inputStyle, paddingLeft: '45px', height: '46px', fontSize: '0.9rem' }} />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--clr-text-head)", marginBottom: "6px", display: "block" }}>Apellido(s)</label>
                                    <div className="position-relative">
                                        <i className="bi bi-person position-absolute" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-muted)' }} />
                                        <input name="lastName" required value={form.lastName} onChange={handleChange} placeholder="Ej: Pérez" style={{ ...inputStyle, paddingLeft: '45px', height: '46px', fontSize: '0.9rem' }} />
                                    </div>
                                </div>
                                <div className="col-12">
                                    <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--clr-text-head)", marginBottom: "6px", display: "block" }}>Documento de Identidad</label>
                                    <div className="position-relative">
                                        <i className="bi bi-card-heading position-absolute" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-muted)' }} />
                                        <input name="identificacion" required value={form.identificacion} onChange={handleChange} placeholder="DNI / Cédula" style={{ ...inputStyle, paddingLeft: '45px', height: '46px', fontSize: '0.9rem' }} />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => validateStep1() && setStep(2)}
                                className="btn-brand w-100 mt-4"
                                style={{ padding: '14px', borderRadius: '14px', fontSize: '0.95rem', fontWeight: 800, justifyContent: 'center' }}
                            >
                                Siguiente paso
                                <i className="bi bi-arrow-right ms-2" />
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate__animated animate__fadeIn">
                        <div style={{ background: 'var(--clr-bg)', padding: '24px', borderRadius: '24px', border: '1px solid var(--clr-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.02)' }}>
                            <div className="mb-4 d-flex align-items-center gap-3">
                                <button type="button" onClick={() => setStep(1)} style={{ background: 'var(--clr-bg-light)', border: 'none', width: '32px', height: '32px', borderRadius: '10px', color: 'var(--clr-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className="bi bi-chevron-left" style={{ fontSize: '0.8rem' }} />
                                </button>
                                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--clr-text-head)", margin: 0 }}>Seguridad y Acceso</h3>
                            </div>

                            <div className="row g-3">
                                <div className="col-12">
                                    <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--clr-text-head)", marginBottom: "6px", display: "block" }}>Email Institucional</label>
                                    <div className="position-relative">
                                        <i className="bi bi-envelope position-absolute" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-muted)' }} />
                                        <input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="juan@ejemplo.com" style={{ ...inputStyle, paddingLeft: '45px', height: '46px', fontSize: '0.9rem' }} />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--clr-text-head)", marginBottom: "6px", display: "block" }}>Contraseña</label>
                                    <div className="position-relative">
                                        <i className="bi bi-lock position-absolute" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-muted)' }} />
                                        <input name="password" type="password" required value={form.password} onChange={handleChange} placeholder="••••••••" style={{ ...inputStyle, paddingLeft: '45px', height: '46px', fontSize: '0.9rem' }} />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--clr-text-head)", marginBottom: "6px", display: "block" }}>Confirmar</label>
                                    <div className="position-relative">
                                        <i className="bi bi-shield-lock position-absolute" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-muted)' }} />
                                        <input name="confirm" type="password" required value={form.confirm} onChange={handleChange} placeholder="••••••••" style={{ ...inputStyle, paddingLeft: '45px', height: '46px', fontSize: '0.9rem' }} />
                                    </div>
                                </div>

                                {form.role === 'ESTUDIANTE' && (
                                    <div className="col-12 mt-2">
                                        <div style={{ background: 'var(--clr-primary-alpha)', padding: '16px', borderRadius: '16px', border: '1px solid var(--clr-primary-alpha)' }}>
                                            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--clr-primary)', marginBottom: '6px' }}>¿Tienes un Código?</h4>
                                            <input name="institutionCode" value={form.institutionCode} onChange={handleChange} placeholder="Opcional" style={{ ...inputStyle, background: 'var(--clr-bg)', border: 'none', height: '40px', fontSize: '0.85rem' }} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit" disabled={loading}
                                className="btn-brand w-100 mt-4"
                                style={{ padding: "14px", borderRadius: "14px", fontSize: "0.95rem", fontWeight: 800, justifyContent: "center" }}
                            >
                                {loading ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-person-plus-fill me-2" />}
                                {loading ? 'Procesando...' : 'Finalizar Registro'}
                            </button>
                        </div>
                    </div>
                )}

                <p className="text-center mt-5" style={{ fontSize: "0.95rem", color: "var(--clr-muted)" }}>
                    ¿Ya tienes cuenta?{' '}
                    <button type="button" onClick={() => router.push('/login')} style={{ color: "var(--clr-primary)", fontWeight: 800, background: "none", border: "none", padding: 0 }}>Inicia sesión aquí</button>
                </p>
            </form>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="w-full text-center py-8">Cargando...</div>}>
            <RegisterContent />
        </Suspense>
    );
}
