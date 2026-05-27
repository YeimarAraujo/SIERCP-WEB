'use client';

/**
 * AuthGate — Registro/login INLINE dentro del checkout.
 *
 * Nunca es un modal. Se renderiza como el primer paso del stepper
 * cuando el usuario no está autenticado. Al autenticarse, llama a
 * onAuthenticated() para avanzar automáticamente al siguiente paso.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, Check, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { emailSchema, colombianPhoneSchema, documentTypeSchema } from '../schemas/shared.schema';

// ── Schemas ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Contraseña requerida'),
});

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'Nombre requerido').max(80),
    lastName: z.string().min(2, 'Apellido requerido').max(80),
    email: emailSchema,
    emailConfirm: emailSchema,
    phone: colombianPhoneSchema.optional().or(z.literal('')),
    documentType: documentTypeSchema,
    documentNumber: z.string().min(4, 'Documento requerido').max(20),
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
      .regex(/[0-9]/, 'Debe tener al menos un número')
      .regex(/[^A-Za-z0-9]/, 'Debe tener al menos un símbolo'),
    passwordConfirm: z.string().min(1, 'Confirma tu contraseña'),
    termsAccepted: z.literal(true, { message: 'Debes aceptar los términos' }),
    dataConsent: z.literal(true, { message: 'Requerido por Ley 1581 de 2012' }),
  })
  .refine((d) => d.email === d.emailConfirm, {
    path: ['emailConfirm'],
    message: 'Los emails no coinciden',
  })
  .refine((d) => d.password === d.passwordConfirm, {
    path: ['passwordConfirm'],
    message: 'Las contraseñas no coinciden',
  });

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

type Tab = 'login' | 'register';

// ── Props ─────────────────────────────────────────────────────────────────────

interface AuthGateProps {
  onAuthenticated: () => void;
  /** Si true, muestra el botón "Continuar como invitado" */
  allowGuest?: boolean;
  onContinueAsGuest?: () => void;
}

// ── Componente principal ──────────────────────────────────────────────────────

export function AuthGate({ onAuthenticated, allowGuest, onContinueAsGuest }: AuthGateProps) {
  const [tab, setTab] = useState<Tab>('login');

  return (
    <div>
      {/* Título */}
      <div className="mb-6">
        <h2 className="font-black text-xl mb-1" style={{ color: 'var(--text-primary)' }}>
          Identifícate para continuar
        </h2>
        <p className="text-sm" style={{ color: 'var(--clr-muted)' }}>
          Necesitamos saber quién eres para emitir tu certificado y procesar el pago.
        </p>
      </div>

      {/* Pestañas */}
      <div
        className="flex rounded-xl p-1 mb-6"
        style={{ background: 'var(--bg-surface-2, var(--clr-bg-light))' }}
      >
        {(['login', 'register'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all"
            style={{
              background: tab === t ? 'var(--bg-surface, var(--clr-bg))' : 'transparent',
              color: tab === t ? 'var(--clr-primary)' : 'var(--clr-muted)',
              boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {t === 'login' ? <LogIn size={14} /> : <UserPlus size={14} />}
            {t === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        ))}
      </div>

      {/* Contenido de la pestaña activa */}
      <AnimatePresence mode="wait">
        {tab === 'login' ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <LoginForm onAuthenticated={onAuthenticated} onSwitchToRegister={() => setTab('register')} />
          </motion.div>
        ) : (
          <motion.div
            key="register"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <RegisterForm onAuthenticated={onAuthenticated} onSwitchToLogin={() => setTab('login')} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Continuar como invitado */}
      {allowGuest && onContinueAsGuest && (
        <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--clr-border)' }}>
          <button
            type="button"
            onClick={onContinueAsGuest}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{
              color: 'var(--clr-muted)',
              border: '1.5px solid var(--clr-border)',
            }}
          >
            Continuar como invitado
          </button>
          <p className="text-center text-[11px] mt-2" style={{ color: 'var(--clr-muted)' }}>
            Sin cuenta no podrás acceder a certificados ni historial de compras.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Formulario de Login ───────────────────────────────────────────────────────

function LoginForm({
  onAuthenticated,
  onSwitchToRegister,
}: {
  onAuthenticated: () => void;
  onSwitchToRegister: () => void;
}) {
  const { login, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema), mode: 'onBlur' });

  async function onSubmit(data: LoginForm) {
    setAuthError('');
    clearError();
    try {
      await login(data.email, data.password);
      onAuthenticated();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Credenciales inválidas');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Field label="Email" error={errors.email?.message}>
        <input
          {...register('email')}
          type="email"
          placeholder="correo@ejemplo.com"
          autoComplete="email"
          className={fieldCls(!!errors.email)}
        />
      </Field>

      <Field label="Contraseña" error={errors.password?.message}>
        <div className="relative">
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            placeholder="Tu contraseña"
            autoComplete="current-password"
            className={fieldCls(!!errors.password) + ' pr-10'}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--clr-muted)' }}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </Field>

      <AnimatePresence>
        {authError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
              style={{ background: 'var(--danger-bg)' }}
            >
              <AlertCircle size={14} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
              <span style={{ color: 'var(--danger-text)', fontWeight: 600 }}>{authError}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3.5 rounded-xl font-black text-sm text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        style={{
          background: 'linear-gradient(135deg, var(--clr-primary), var(--clr-accent))',
          boxShadow: '0 6px 20px color-mix(in srgb, var(--clr-primary) 28%, transparent)',
        }}
      >
        {isSubmitting ? <Spinner /> : <LogIn size={15} />}
        {isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
      </button>

      <p className="text-center text-xs" style={{ color: 'var(--clr-muted)' }}>
        ¿No tienes cuenta?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-bold underline"
          style={{ color: 'var(--clr-primary)' }}
        >
          Regístrate gratis
        </button>
      </p>
    </form>
  );
}

// ── Formulario de Registro ────────────────────────────────────────────────────

function RegisterForm({
  onAuthenticated,
  onSwitchToLogin,
}: {
  onAuthenticated: () => void;
  onSwitchToLogin: () => void;
}) {
  const { register: authRegister, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(registerSchema as any),
    mode: 'onBlur',
  });

  const password = watch('password', '');

  const passwordRequirements = [
    { label: 'Mínimo 8 caracteres', ok: password.length >= 8 },
    { label: 'Una mayúscula', ok: /[A-Z]/.test(password) },
    { label: 'Un número', ok: /[0-9]/.test(password) },
    { label: 'Un símbolo', ok: /[^A-Za-z0-9]/.test(password) },
  ];

  async function onSubmit(data: RegisterForm) {
    setAuthError('');
    clearError();
    try {
      await authRegister({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        identificacion: data.documentNumber,
        phoneNumber: data.phone || undefined,
      });
      onAuthenticated();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Error al registrar la cuenta');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3.5">
      {/* Nombre y apellido */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nombre" error={errors.firstName?.message}>
          <input {...register('firstName')} placeholder="Nombre" className={fieldCls(!!errors.firstName)} />
        </Field>
        <Field label="Apellido" error={errors.lastName?.message}>
          <input {...register('lastName')} placeholder="Apellido" className={fieldCls(!!errors.lastName)} />
        </Field>
      </div>

      {/* Documento */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo de doc." error={errors.documentType?.message}>
          <select {...register('documentType')} className={fieldCls(!!errors.documentType)}>
            <option value="">Tipo…</option>
            <option value="CC">Cédula (CC)</option>
            <option value="CE">Cédula ext. (CE)</option>
            <option value="PP">Pasaporte</option>
            <option value="TI">Tarjeta ID (TI)</option>
          </select>
        </Field>
        <Field label="Número" error={errors.documentNumber?.message}>
          <input
            {...register('documentNumber')}
            placeholder="Número"
            className={fieldCls(!!errors.documentNumber)}
          />
        </Field>
      </div>

      {/* Email */}
      <Field label="Email" error={errors.email?.message}>
        <input
          {...register('email')}
          type="email"
          placeholder="correo@ejemplo.com"
          autoComplete="email"
          className={fieldCls(!!errors.email)}
        />
      </Field>
      <Field label="Confirmar email" error={errors.emailConfirm?.message}>
        <input
          {...register('emailConfirm')}
          type="email"
          placeholder="Repite tu email"
          className={fieldCls(!!errors.emailConfirm)}
        />
      </Field>

      {/* Teléfono */}
      <Field label="Teléfono (opcional)" error={errors.phone?.message}>
        <input
          {...register('phone')}
          type="tel"
          placeholder="+57 300 000 0000"
          className={fieldCls(!!errors.phone)}
        />
      </Field>

      {/* Contraseña */}
      <Field label="Contraseña" error={errors.password?.message}>
        <div className="relative">
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            className={fieldCls(!!errors.password) + ' pr-10'}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--clr-muted)' }}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </Field>

      {/* Requisitos de contraseña */}
      {password.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5">
          {passwordRequirements.map(({ label, ok }) => (
            <div key={label} className="flex items-center gap-1.5 text-[11px]">
              <div
                className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0"
                style={{ background: ok ? 'var(--clr-success)' : 'var(--clr-border)' }}
              >
                {ok && <Check size={8} strokeWidth={3} className="text-white" />}
              </div>
              <span style={{ color: ok ? 'var(--clr-success)' : 'var(--clr-muted)' }}>{label}</span>
            </div>
          ))}
        </div>
      )}

      <Field label="Confirmar contraseña" error={errors.passwordConfirm?.message}>
        <input
          {...register('passwordConfirm')}
          type="password"
          placeholder="Repite tu contraseña"
          autoComplete="new-password"
          className={fieldCls(!!errors.passwordConfirm)}
        />
      </Field>

      {/* Términos y consentimiento */}
      <div className="space-y-2.5 pt-1">
        <ConsentRow
          id="terms"
          register={register('termsAccepted')}
          error={errors.termsAccepted?.message}
        >
          Acepto los{' '}
          <a href="/terminos" target="_blank" className="font-bold underline" style={{ color: 'var(--clr-primary)' }}>
            términos y condiciones
          </a>{' '}
          y la{' '}
          <a href="/privacidad" target="_blank" className="font-bold underline" style={{ color: 'var(--clr-primary)' }}>
            política de privacidad
          </a>.
        </ConsentRow>
        <ConsentRow
          id="data"
          register={register('dataConsent')}
          error={errors.dataConsent?.message}
        >
          Autorizo el tratamiento de mis datos personales de acuerdo con la{' '}
          <strong>Ley 1581 de 2012</strong> (Colombia).
        </ConsentRow>
      </div>

      <AnimatePresence>
        {authError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
              style={{ background: 'var(--danger-bg)' }}
            >
              <AlertCircle size={14} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
              <span style={{ color: 'var(--danger-text)', fontWeight: 600 }}>{authError}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3.5 rounded-xl font-black text-sm text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        style={{
          background: 'linear-gradient(135deg, var(--clr-primary), var(--clr-accent))',
          boxShadow: '0 6px 20px color-mix(in srgb, var(--clr-primary) 28%, transparent)',
        }}
      >
        {isSubmitting ? <Spinner /> : <UserPlus size={15} />}
        {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta y continuar'}
      </button>

      <p className="text-center text-xs" style={{ color: 'var(--clr-muted)' }}>
        ¿Ya tienes cuenta?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-bold underline"
          style={{ color: 'var(--clr-primary)' }}
        >
          Inicia sesión
        </button>
      </p>
    </form>
  );
}

// ── Helpers visuales ──────────────────────────────────────────────────────────

function fieldCls(hasError: boolean) {
  return `w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-colors ${
    hasError
      ? 'border-2 border-red-400'
      : 'border-2 border-[var(--clr-border)] focus:border-[var(--clr-primary)]'
  }`;
}

const fieldStyle: React.CSSProperties = {
  background: 'var(--bg-surface-2, var(--clr-bg-light))',
  color: 'var(--text-primary)',
};

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      <div style={fieldStyle}>{children}</div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            className="mt-1 text-[11px] font-semibold flex items-center gap-1"
            style={{ color: 'var(--color-error)' }}
          >
            <AlertCircle size={10} /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConsentRow({
  id,
  register,
  error,
  children,
}: {
  id: string;
  register: ReturnType<ReturnType<typeof useForm>['register']>;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <input
          {...register}
          type="checkbox"
          id={`consent-${id}`}
          className="mt-0.5 w-4 h-4 shrink-0 cursor-pointer rounded"
          style={{ accentColor: 'var(--clr-primary)' }}
        />
        <label
          htmlFor={`consent-${id}`}
          className="text-xs leading-relaxed cursor-pointer"
          style={{ color: 'var(--text-secondary)' }}
        >
          {children}
        </label>
      </div>
      {error && (
        <p className="mt-1 text-[11px] font-semibold" style={{ color: 'var(--color-error)' }}>
          {error}
        </p>
      )}
    </div>
  );
}

function Spinner() {
  return <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />;
}
