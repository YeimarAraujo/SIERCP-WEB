'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, AlertCircle, CreditCard, Building2, Lock, ShieldCheck, ChevronDown, X, Eye, EyeOff, KeyRound, UserCheck, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '@/components/page/Navbar';
import Footer from '@/components/page/Footer';
import { fmt, COLOMBIAN_BANKS } from '../_lib';
import { auth } from '@/shared/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import AuthNavbar from '@/components/layout/auth-navbar';

// ── Style constants ───────────────────────────────────────────────────────────

export const inputStyle: React.CSSProperties = {
    width: '100%', height: 46, padding: '0 14px', borderRadius: 10,
    border: '1.5px solid var(--clr-border,#e5e7eb)',
    background: 'var(--clr-bg-input,#fff)',
    color: 'var(--clr-text,#111827)', fontSize: 14, fontWeight: 500,
    outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
};

export const btnPrimary: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 800,
    background: 'var(--clr-primary,#2563eb)', color: '#fff', border: 'none',
    cursor: 'pointer', transition: 'opacity 0.15s',
};

export const btnSecondary: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700,
    background: 'var(--clr-bg-card,#fff)', color: 'var(--clr-text-secondary,#374151)',
    border: '1.5px solid var(--clr-border,#e5e7eb)', cursor: 'pointer',
};

// ── Form primitives ───────────────────────────────────────────────────────────

export function FieldError({ msg }: { msg?: string }) {
    if (!msg) return null;
    return (
        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--clr-danger,#ef4444)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertCircle size={11} />{msg}
        </p>
    );
}

export function Field({ label, required, error, children }: {
    label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--clr-text-muted,#6b7280)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                {label}{required && <span style={{ color: 'var(--clr-danger,#ef4444)', marginLeft: 2 }}>*</span>}
            </label>
            {children}
            <FieldError msg={error} />
        </div>
    );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            value={props.value ?? ''}
            style={{ ...inputStyle, ...props.style }}
            onFocus={e => { e.target.style.borderColor = 'var(--clr-primary,#2563eb)'; props.onFocus?.(e); }}
            onBlur={e => { e.target.style.borderColor = 'var(--clr-border,#e5e7eb)'; props.onBlur?.(e); }}
        />
    );
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select
            {...props}
            style={{ ...inputStyle, cursor: 'pointer', ...props.style }}
            onFocus={e => { e.target.style.borderColor = 'var(--clr-primary,#2563eb)'; props.onFocus?.(e); }}
            onBlur={e => { e.target.style.borderColor = 'var(--clr-border,#e5e7eb)'; props.onBlur?.(e); }}
        />
    );
}

// ── Document type select ──────────────────────────────────────────────────────
// Shared across every checkout form for individuals (companies/institutions use NIT).

export const DOCUMENT_TYPES: { value: string; label: string }[] = [
    { value: 'CC', label: 'CC — Cédula de Ciudadanía' },
    { value: 'CE', label: 'CE — Cédula de Extranjería' },
    { value: 'TI', label: 'TI — Tarjeta de Identidad' },
    { value: 'PP', label: 'PP — Pasaporte' },
    { value: 'NIT', label: 'NIT' },
    { value: 'DIE', label: 'DIE — Doc. Identidad Extranjero' },
];

export function DocumentTypeSelect({ value, onChange }: {
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <SelectInput value={value} onChange={e => onChange(e.target.value)}>
            {DOCUMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </SelectInput>
    );
}

// ── SearchableSelect ──────────────────────────────────────────────────────────

export function SearchableSelect({
    value, onChange, options, placeholder = 'Buscar…', disabled,
}: {
    value: string;
    onChange: (v: string) => void;
    options: string[];
    placeholder?: string;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = query.trim()
        ? options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
        : options;

    useEffect(() => {
        function onOutsideClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery('');
            }
        }
        document.addEventListener('mousedown', onOutsideClick);
        return () => document.removeEventListener('mousedown', onOutsideClick);
    }, []);

    const openDropdown = () => {
        if (disabled) return;
        setOpen(true);
        setQuery('');
        setTimeout(() => inputRef.current?.focus(), 10);
    };

    const select = (opt: string) => {
        onChange(opt);
        setOpen(false);
        setQuery('');
    };

    const clear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
    };

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            {open ? (
                <input
                    ref={inputRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={placeholder}
                    style={inputStyle}
                    onKeyDown={e => {
                        if (e.key === 'Escape') { setOpen(false); setQuery(''); }
                        if (e.key === 'Enter' && filtered.length > 0) select(filtered[0]);
                    }}
                    onFocus={e => { e.target.style.borderColor = 'var(--clr-primary,#2563eb)'; }}
                />
            ) : (
                <div
                    onClick={openDropdown}
                    style={{
                        ...inputStyle,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        opacity: disabled ? 0.5 : 1,
                    }}
                >
                    <span style={{ color: value ? 'var(--clr-text,#111827)' : 'var(--clr-text-muted,#9ca3af)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {value || placeholder}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                        {value && !disabled && (
                            <span onClick={clear} style={{ display: 'flex', color: 'var(--clr-text-muted,#9ca3af)', padding: 2 }}>
                                <X size={12} />
                            </span>
                        )}
                        <ChevronDown size={14} style={{ color: 'var(--clr-text-muted,#9ca3af)' }} />
                    </div>
                </div>
            )}
            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                    zIndex: 200,
                    background: 'var(--clr-bg-card,#fff)',
                    border: '1.5px solid var(--clr-primary,#2563eb)',
                    borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    maxHeight: 220, overflowY: 'auto',
                }}>
                    {filtered.length === 0 ? (
                        <div style={{ padding: '10px 14px', fontSize: 13, color: 'var(--clr-text-muted,#6b7280)' }}>
                            Sin resultados
                        </div>
                    ) : filtered.map((opt, i) => (
                        <div
                            key={`${opt}-${i}`}
                            onMouseDown={() => select(opt)}
                            style={{
                                padding: '9px 14px', fontSize: 14,
                                cursor: 'pointer',
                                background: opt === value ? 'var(--clr-primary-light,#eff6ff)' : undefined,
                                color: opt === value ? 'var(--clr-primary,#2563eb)' : 'var(--clr-text,#111827)',
                                fontWeight: opt === value ? 700 : 500,
                            }}
                            onMouseEnter={e => { if (opt !== value) (e.currentTarget as HTMLDivElement).style.background = 'var(--clr-bg-hover,#f9fafb)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = opt === value ? 'var(--clr-primary-light,#eff6ff)' : ''; }}
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Steps bar ─────────────────────────────────────────────────────────────────

export function CheckoutSteps({ current, labels }: { current: number; labels: string[] }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 36, justifyContent: 'center' }}>
            {labels.map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            border: `2px solid ${i <= current ? 'var(--clr-primary,#2563eb)' : 'var(--clr-border,#e5e7eb)'}`,
                            background: i < current ? 'var(--clr-primary,#2563eb)' : i === current ? 'transparent' : 'var(--clr-bg-muted,#f9fafb)',
                            color: i < current ? '#fff' : i === current ? 'var(--clr-primary,#2563eb)' : 'var(--clr-text-muted,#9ca3af)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900,
                        }}>
                            {i < current ? <Check size={14} strokeWidth={3} /> : i + 1}
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 800, color: i === current ? 'var(--clr-primary,#2563eb)' : 'var(--clr-text-muted,#9ca3af)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{s}</span>
                    </div>
                    {i < labels.length - 1 && (
                        <div style={{ width: 60, height: 2, background: i < current ? 'var(--clr-primary,#2563eb)' : 'var(--clr-border,#e5e7eb)', margin: '0 8px', marginBottom: 22, flexShrink: 0 }} />
                    )}
                </div>
            ))}
        </div>
    );
}

// ── Password input with show/hide toggle ─────────────────────────────────────

export function PasswordInput({ value, onChange, placeholder, error, label, required }: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    error?: string;
    label: string;
    required?: boolean;
}) {
    const [show, setShow] = useState(false);
    return (
        <Field label={label} required={required} error={error}>
            <div style={{ position: 'relative' }}>
                <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder ?? '••••••••'}
                    autoComplete="new-password"
                    style={{ ...inputStyle, paddingRight: 46 }}
                    onFocus={e => { e.target.style.borderColor = 'var(--clr-primary,#2563eb)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--clr-border,#e5e7eb)'; }}
                />
                <button
                    type="button"
                    onClick={() => setShow(s => !s)}
                    tabIndex={-1}
                    style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                        color: 'var(--clr-text-muted,#9ca3af)', display: 'flex', alignItems: 'center',
                    }}
                >
                    {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
            </div>
        </Field>
    );
}

export function validatePasswordPair(pass: string, confirm: string): { contrasena?: string; confirmarContrasena?: string } {
    const errs: { contrasena?: string; confirmarContrasena?: string } = {};
    if (pass.length < 8) errs.contrasena = 'Mínimo 8 caracteres';
    else if (!/[A-Za-z]/.test(pass) || !/\d/.test(pass)) errs.contrasena = 'Debe incluir letras y números';
    if (!confirm) errs.confirmarContrasena = 'Confirma tu contraseña';
    else if (pass !== confirm) errs.confirmarContrasena = 'Las contraseñas no coinciden';
    return errs;
}

export function PasswordStrengthBar({ value }: { value: string }) {
    const hasSpecial = /[!@#$%^&*()\-_=+{};:,<.>/?]/.test(value);
    const score = !value ? 0
        : value.length < 6 ? 1
            : value.length < 8 ? 2
                : /[A-Z]/.test(value) && /\d/.test(value) && hasSpecial && value.length >= 10 ? 4
                    : /[A-Za-z]/.test(value) && /\d/.test(value) && (hasSpecial || value.length >= 10) ? 3
                        : 2;
    const colors = ['#e5e7eb', '#ef4444', '#f97316', '#eab308', '#22c55e'];
    const labels = ['', 'Muy débil', 'Débil', 'Aceptable', 'Fuerte'];
    if (!value) return null;
    return (
        <div style={{ marginTop: 6 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= score ? colors[score] : 'var(--clr-border,#e5e7eb)', transition: 'background 0.2s' }} />
                ))}
            </div>
            <span style={{ fontSize: 11, color: colors[score], fontWeight: 700 }}>{labels[score]}</span>
        </div>
    );
}

// ── Account access types & validation ────────────────────────────────────────

export interface AccountData {
    mode: 'new' | 'existing';
    // New account fields
    confirmarEmail: string;
    contrasena: string;
    confirmarContrasena: string;
    aceptaTerminos: boolean;
    // Existing account fields
    existingEmail: string;
    existingPassword: string;
    existingVerified: boolean;
}
export type AccountErrors = Partial<Record<string, string>>;
export const emptyAccountData: AccountData = {
    mode: 'new', confirmarEmail: '', contrasena: '', confirmarContrasena: '', aceptaTerminos: false,
    existingEmail: '', existingPassword: '', existingVerified: false,
};

export function validateAccount(_email: string, data: AccountData): AccountErrors {
    const errs: AccountErrors = {};
    if (data.mode === 'new') {
        if (!data.contrasena) errs.contrasena = 'Crea una contraseña';
        else if (data.contrasena.length < 8) errs.contrasena = 'Mínimo 8 caracteres';
        else if (!/[A-Za-z]/.test(data.contrasena) || !/\d/.test(data.contrasena)) errs.contrasena = 'Debe incluir letras y números';
        else if (!/[!@#$%^&*()\-_=+{};:,<.>/?]/.test(data.contrasena)) errs.contrasena = 'Incluye al menos un carácter especial (!@#...)';
        if (!data.confirmarContrasena) errs.confirmarContrasena = 'Confirma tu contraseña';
        else if (data.contrasena !== data.confirmarContrasena) errs.confirmarContrasena = 'Las contraseñas no coinciden';
    } else {
        if (!data.existingVerified) errs.existingVerified = 'Inicia sesión para verificar tu cuenta antes de continuar';
    }
    if (!data.aceptaTerminos) errs.aceptaTerminos = 'Acepta los términos para continuar';
    return errs;
}

// ── Account access section (new/existing account toggle) ─────────────────────

export function TermsRow({ checked, onToggle, error }: { checked: boolean; onToggle: () => void; error?: string }) {
    return (
        <div style={{ marginTop: 2 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }} onClick={onToggle}>
                <div style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
                    border: `2px solid ${checked ? 'var(--clr-primary,#2563eb)' : error ? 'var(--clr-danger,#ef4444)' : 'var(--clr-border,#d1d5db)'}`,
                    background: checked ? 'var(--clr-primary,#2563eb)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s', cursor: 'pointer',
                }}>
                    {checked && <Check size={11} color="#fff" strokeWidth={3} />}
                </div>
                <div>
                    <span style={{ fontSize: 12, color: 'var(--clr-text-secondary,#374151)', lineHeight: 1.5 }}>
                        Acepto los{' '}
                        <a href="/terminos" target="_blank" rel="noopener" onClick={e => e.stopPropagation()} style={{ color: 'var(--clr-primary,#2563eb)', fontWeight: 700, textDecoration: 'none' }}>Términos y condiciones</a>
                        {' '}y la{' '}
                        <a href="/privacidad" target="_blank" rel="noopener" onClick={e => e.stopPropagation()} style={{ color: 'var(--clr-primary,#2563eb)', fontWeight: 700, textDecoration: 'none' }}>Política de privacidad</a>
                        {' '}de SIERCP.
                    </span>
                    <FieldError msg={error} />
                </div>
            </div>
        </div>
    );
}

export function AccountAccessSection({ email, data, setData, errors, submitRef }: {
    email: string;
    data: AccountData;
    setData: (d: AccountData) => void;
    errors: AccountErrors;
    submitRef?: React.RefObject<(() => Promise<boolean>) | null>;
}) {
    const isNew = data.mode === 'new';
    const [verifyError, setVerifyError] = useState('');
    const setNew = (k: keyof AccountData) => (e: React.ChangeEvent<HTMLInputElement>) => setData({ ...data, [k]: e.target.value });

    const switchToExisting = () => setData({ ...emptyAccountData, mode: 'existing' });
    const switchToNew = () => setData({ ...emptyAccountData, mode: 'new' });

    // Register verify function on submitRef whenever data changes so the ref always holds a fresh closure.
    useEffect(() => {
        if (!submitRef) return;
        submitRef.current = async (): Promise<boolean> => {
            setVerifyError('');
            if (!data.existingEmail.trim()) { setVerifyError('Ingresa tu correo electrónico'); return false; }
            if (!data.existingPassword) { setVerifyError('Ingresa tu contraseña'); return false; }
            try {
                await signInWithEmailAndPassword(auth, data.existingEmail.trim(), data.existingPassword);
                setData({ ...data, existingVerified: true });
                return true;
            } catch (err: unknown) {
                const code = (err as { code?: string }).code ?? '';
                if (code.includes('user-not-found') || code.includes('invalid-credential') || code.includes('invalid-email') || code.includes('wrong-password')) {
                    setVerifyError('Correo o contraseña incorrectos');
                } else if (code.includes('too-many-requests')) {
                    setVerifyError('Demasiados intentos. Espera unos minutos e intenta de nuevo.');
                } else {
                    setVerifyError('No se pudo verificar. Revisa tu conexión e intenta de nuevo.');
                }
                return false;
            }
        };
        return () => { if (submitRef) submitRef.current = null; };
    }, [data, setData, submitRef]);



    // ── Existing account — verified state ──────────────────────────────────────
    if (!isNew && data.existingVerified) {
        return (
            <div style={{ marginTop: 24 }}>

                <div style={{ display: 'grid', gap: 14 }}>
                    <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(5,150,105,0.06)', border: '1.5px solid rgba(5,150,105,0.25)', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(5,150,105,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <UserCheck size={18} style={{ color: '#059669' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#059669', marginBottom: 1 }}>Sesión verificada</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--clr-text,#111827)' }}>{data.existingEmail}</div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setData({ ...data, existingVerified: false, existingPassword: '' })}
                            style={{ background: 'none', border: '1px solid rgba(5,150,105,0.3)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 11, color: '#059669', fontWeight: 700 }}
                        >
                            Cambiar
                        </button>
                    </div>
                    <TermsRow checked={data.aceptaTerminos} onToggle={() => setData({ ...data, aceptaTerminos: !data.aceptaTerminos })} error={errors.aceptaTerminos} />
                </div>
            </div>
        );
    }

    // ── Existing account — login form ──────────────────────────────────────────
    if (!isNew) {
        return (
            <div style={{ marginTop: 24 }}>

                <div style={{ display: 'grid', gap: 14 }}>
                    <Field label="Correo electrónico de tu cuenta" required>
                        <Input
                            type="email"
                            value={data.existingEmail}
                            onChange={setNew('existingEmail')}
                            placeholder="tu@correo.com"
                            autoComplete="email"
                        />
                    </Field>
                    <PasswordInput
                        label="Contraseña"
                        required
                        value={data.existingPassword}
                        onChange={setNew('existingPassword')}
                        placeholder="Tu contraseña actual"
                        error={verifyError || errors.existingVerified}
                    />
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--clr-text-muted,#6b7280)', textAlign: 'center' }}>
                        ¿No tienes cuenta?{' '}
                        <button type="button" onClick={switchToNew} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-primary,#2563eb)', fontWeight: 700, fontSize: 12, padding: 0 }}>
                            Regístrate aquí
                        </button>
                    </p>
                    <TermsRow checked={data.aceptaTerminos} onToggle={() => setData({ ...data, aceptaTerminos: !data.aceptaTerminos })} error={errors.aceptaTerminos} />
                </div>
            </div>
        );
    }

    // ── New account form ───────────────────────────────────────────────────────
    return (
        <div style={{ marginTop: 24 }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {/* <Field label="Confirmar correo electrónico" required error={errors.confirmarEmail}>
                    <Input type="email" value={data.confirmarEmail} onChange={setNew('confirmarEmail')} placeholder="Repite exactamente tu correo" autoComplete="email" />
                </Field> */}
                <div>
                    <PasswordInput label="Contraseña" required value={data.contrasena} onChange={setNew('contrasena')} placeholder="Mín. 8 chars, letras, números y símbolo" error={errors.contrasena} />
                    <PasswordStrengthBar value={data.contrasena} />
                </div>
                <PasswordInput label="Confirmar contraseña" required value={data.confirmarContrasena} onChange={setNew('confirmarContrasena')} error={errors.confirmarContrasena} />

            </div>
            <div style={{ marginTop: 14, gap: 14 }}>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--clr-text-muted,#6b7280)', textAlign: 'center' }}>
                    ¿Ya tienes cuenta?{' '}
                    <button type="button" onClick={switchToExisting} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-primary,#2563eb)', fontWeight: 700, fontSize: 12, padding: 0 }}>
                        Inicia sesión aquí
                    </button>
                </p>

                <TermsRow checked={data.aceptaTerminos} onToggle={() => setData({ ...data, aceptaTerminos: !data.aceptaTerminos })} error={errors.aceptaTerminos} />
            </div>
        </div>
    );
}

/** Último paso del checkout: resume la compra y lleva a la página segura de Wompi. */
export function HostedPaymentStep({ rows, totalLabel, total, payLabel, processing, onBack, onPay }: {
    rows: { label: string; value: string; green?: boolean }[];
    totalLabel: string;
    total: string;
    payLabel: string;
    processing: boolean;
    onBack: () => void;
    onPay: () => void;
}) {
    return (
        <div style={{ display: 'grid', gap: 16 }}>
            <PaymentSummaryBox rows={rows} totalLabel={totalLabel} total={total} />
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#475569' }}>
                Te llevaremos a la página segura de Wompi para pagar con tarjeta, PSE, Nequi u otros medios.
                Tu compra se confirma cuando Wompi apruebe el pago.
            </p>
            <div style={{ display: 'grid', gap: 8 }}>
                <button onClick={onPay} disabled={processing} style={{ ...btnPrimary, width: '100%', justifyContent: 'center', opacity: processing ? 0.75 : 1 }}>
                    <Lock size={14} /> {processing ? 'Preparando el pago…' : payLabel}
                </button>
                <button onClick={onBack} disabled={processing} style={{ ...btnSecondary, width: '100%', justifyContent: 'center' }}>Atrás</button>
            </div>
        </div>
    );
}

export function PaymentSummaryBox({ rows, totalLabel, total }: {
    rows: Array<{ label: string; value: string; green?: boolean }>;
    totalLabel: string;
    total: string;
}) {
    return (
        <div style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--clr-bg-muted,#f8fafc)', border: '1px solid var(--clr-border,#e5e7eb)', marginBottom: 22 }}>
            {rows.map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--clr-text-muted,#6b7280)', marginBottom: 4 }}>
                    <span>{r.label}</span>
                    {r.green
                        ? <span style={{ color: '#059669', fontWeight: 700 }}>{r.value}</span>
                        : <strong style={{ color: 'var(--clr-text,#111827)' }}>{r.value}</strong>
                    }
                </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 16, color: 'var(--clr-text,#111827)', borderTop: '1px solid var(--clr-border,#e5e7eb)', paddingTop: 10, marginTop: 8 }}>
                <span>{totalLabel}</span>
                <span style={{ color: 'var(--clr-primary,#2563eb)' }}>{total}</span>
            </div>
        </div>
    );
}

// ── Order summary shell ───────────────────────────────────────────────────────

export function OrderSummaryShell({ title = 'Resumen del pedido', badge, children, footerContent }: {
    title?: string;
    badge?: React.ReactNode;
    children: React.ReactNode;
    footerContent?: React.ReactNode;
}) {
    return (
        <aside style={{ border: '1px solid var(--clr-border,#e5e7eb)', borderRadius: 16, background: 'var(--clr-bg-card,#fff)', padding: '22px 24px', position: 'sticky', top: 24 }}>
            <p style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 800, color: 'var(--clr-text-muted,#6b7280)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</p>
            {children}
            {badge}
            {footerContent && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--clr-border,#e5e7eb)' }}>
                    {footerContent}
                </div>
            )}
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--clr-text-muted,#6b7280)' }}>
                <Lock size={11} />Pago seguro con Wompi · PCI DSS compliant
            </div>
        </aside>
    );
}

export function SummaryProductCard({ name, desc, badge }: { name: string; desc?: string; badge?: React.ReactNode }) {
    return (
        <div style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--clr-bg-muted,#f8fafc)', border: '1px solid var(--clr-border,#e5e7eb)', marginBottom: 16 }}>
            <p style={{ margin: '0 0 2px', fontWeight: 900, fontSize: 16, color: 'var(--clr-text,#111827)' }}>{name}</p>
            {desc && <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--clr-text-muted,#6b7280)' }}>{desc}</p>}
            {badge}
        </div>
    );
}

export function SummaryFeatureList({ features }: { features: string[] }) {
    return (
        <div style={{ display: 'grid', gap: 5, marginBottom: 18 }}>
            {features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12, color: 'var(--clr-text-secondary,#374151)' }}>
                    <Check size={12} style={{ color: '#059669', marginTop: 2, flexShrink: 0 }} strokeWidth={3} />{f}
                </div>
            ))}
        </div>
    );
}

export function SummaryPriceBlock({ subtotalLabel, subtotal, ivaAmount, totalLabel, total, extras }: {
    subtotalLabel: string;
    subtotal: number;
    ivaAmount: number;
    totalLabel: string;
    total: number;
    extras?: React.ReactNode;
}) {
    return (
        <div style={{ borderTop: '1px solid var(--clr-border,#e5e7eb)', paddingTop: 14, display: 'grid', gap: 8 }}>
            {extras}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--clr-text-muted,#6b7280)' }}>
                <span>{subtotalLabel}</span><span>{fmt(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--clr-text-muted,#6b7280)' }}>
                <span>IVA 19%</span><span>{fmt(ivaAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 17, color: 'var(--clr-text,#111827)', borderTop: '1px solid var(--clr-border,#e5e7eb)', paddingTop: 12, marginTop: 4 }}>
                <span>{totalLabel}</span><span>{fmt(total)} COP</span>
            </div>
        </div>
    );
}

export function SummaryBadge({ color = 'green', icon, children }: {
    color?: 'green' | 'amber';
    icon?: React.ReactNode;
    children: React.ReactNode;
}) {
    const styles = {
        green: { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#059669' },
        amber: { background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#92400e' },
    };
    return (
        <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 10, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, ...styles[color] }}>
            {icon}{children}
        </div>
    );
}

// ── Selectable option row ─────────────────────────────────────────────────────

export function SelectableOption({ active, onClick, children }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <div onClick={onClick} style={{ padding: '16px 20px', borderRadius: 14, border: `2px solid ${active ? 'var(--clr-primary,#2563eb)' : 'var(--clr-border,#e5e7eb)'}`, background: active ? 'rgba(37,99,235,0.05)' : 'var(--clr-bg-card,#fff)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'all 0.15s' }}>
            {children}
        </div>
    );
}

export function RadioDot({ active }: { active: boolean }) {
    return (
        <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${active ? 'var(--clr-primary,#2563eb)' : 'var(--clr-border,#d1d5db)'}`, background: active ? 'var(--clr-primary,#2563eb)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
        </div>
    );
}

export function OptionBadge({ children }: { children: React.ReactNode }) {
    return (
        <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 20, background: 'var(--clr-primary,#2563eb)', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {children}
        </span>
    );
}

// ── Page layout ───────────────────────────────────────────────────────────────

interface CheckoutLayoutProps {
    eyebrow: string;
    title: string;
    maxWidth?: number;
    currentStep: number;
    stepLabels: string[];
    formContent: React.ReactNode;
    summary: React.ReactNode;
}

export function CheckoutLayout({ eyebrow, title, maxWidth = 980, currentStep, stepLabels, formContent, summary }: CheckoutLayoutProps) {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--clr-bg,#f8fafc)' }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <AuthNavbar />
            <main style={{ maxWidth, margin: '0 auto', padding: '48px 20px 80px' }}>
                <div style={{ marginBottom: 32, marginTop: 64 }}>
                    <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 800, color: 'var(--clr-primary,#2563eb)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{eyebrow}</p>
                    <h1 style={{ margin: 0, fontSize: 'clamp(22px,4vw,30px)', fontWeight: 950, color: 'var(--clr-text,#111827)', letterSpacing: '-0.03em' }}>{title}</h1>
                </div>
                <CheckoutSteps current={currentStep} labels={stepLabels} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, alignItems: 'start' }}>
                    <div style={{ border: '1px solid var(--clr-border,#e5e7eb)', borderRadius: 20, background: 'var(--clr-bg-card,#fff)', padding: '32px 36px' }}>
                        {formContent}
                    </div>
                    {summary}
                </div>
            </main>
            <Footer />
        </div>
    );
}

export function CheckoutSuspenseFallback() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--clr-bg,#f8fafc)', color: 'var(--clr-text-muted,#6b7280)', fontSize: 14 }}>
            Cargando…
        </div>
    );
}

// Re-export ShieldCheck for summary badges
export { ShieldCheck };
