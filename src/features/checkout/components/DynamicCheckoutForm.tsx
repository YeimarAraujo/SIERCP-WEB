'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodSchema } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check, ChevronDown, Eye, EyeOff, Info } from 'lucide-react';
import { useState, useCallback } from 'react';
import type { FieldConfig, StepConfig } from '../config/checkout.config';

interface DynamicCheckoutFormProps {
  step: StepConfig;
  defaultValues?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  isSubmitting?: boolean;
  backLabel?: string;
  onBack?: () => void;
}

export function DynamicCheckoutForm({
  step,
  defaultValues,
  onSubmit,
  isSubmitting,
  backLabel = '← Atrás',
  onBack,
}: DynamicCheckoutFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting: formSubmitting },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<any>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(step.schema as any),
    defaultValues: defaultValues ?? {},
    mode: 'onBlur',
  });

  const watchedValues = watch();
  const busy = isSubmitting ?? formSubmitting;

  const isFieldVisible = useCallback(
    (field: FieldConfig): boolean => {
      if (!field.dependsOn) return true;
      return watchedValues[field.dependsOn.field] === field.dependsOn.value;
    },
    [watchedValues],
  );

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data as Record<string, unknown>))} noValidate>
      <motion.div
        key={step.id}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -24 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Grid de campos */}
        <div className="grid grid-cols-2 gap-4">
          {step.fields.map((field) => {
            if (!isFieldVisible(field)) return null;
            return (
              <div
                key={field.name}
                className={field.colSpan === 2 ? 'col-span-2' : 'col-span-2 sm:col-span-1'}
              >
                <FieldRenderer
                  field={field}
                  register={register}
                  error={errors[field.name]?.message as string | undefined}
                  value={watchedValues[field.name]}
                  setValue={(v) => setValue(field.name, v)}
                />
              </div>
            );
          })}
        </div>

        {/* Errores globales del paso (scroll hasta el primero) */}
        <AnimatePresence>
          {Object.keys(errors).length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div
                className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm"
                style={{ background: 'var(--danger-bg)', border: '1px solid color-mix(in srgb, var(--color-error) 30%, transparent)' }}
              >
                <AlertCircle size={15} style={{ color: 'var(--color-error)', flexShrink: 0, marginTop: 1 }} />
                <span style={{ color: 'var(--danger-text)', fontWeight: 600 }}>
                  Revisa los campos marcados antes de continuar.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botones de navegación */}
        <div className="flex items-center justify-between mt-6 gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              disabled={busy}
              className="px-5 py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
              style={{
                border: '1.5px solid var(--clr-border)',
                background: 'transparent',
                color: 'var(--text-primary)',
              }}
            >
              {backLabel}
            </button>
          ) : (
            <div />
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-black transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: busy
                ? 'var(--clr-muted)'
                : 'linear-gradient(135deg, var(--clr-primary), var(--clr-accent))',
              color: '#fff',
              boxShadow: busy ? 'none' : '0 6px 20px color-mix(in srgb, var(--clr-primary) 30%, transparent)',
            }}
          >
            {busy ? (
              <>
                <Spinner />
                Procesando…
              </>
            ) : (
              step.ctaLabel
            )}
          </button>
        </div>
      </motion.div>
    </form>
  );
}

// ── Renderizador por tipo de campo ────────────────────────────────────────────

interface FieldRendererProps {
  field: FieldConfig;
  register: ReturnType<typeof useForm>['register'];
  error?: string;
  value: unknown;
  setValue: (v: unknown) => void;
}

function FieldRenderer({ field, register, error, value, setValue }: FieldRendererProps) {
  const baseInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    background: 'var(--bg-surface, var(--clr-bg-light))',
    color: 'var(--text-primary)',
    border: `1.5px solid ${error ? 'var(--color-error)' : 'var(--clr-border)'}`,
    boxSizing: 'border-box' as const,
  };

  const label = (
    <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
      {field.label}
      {field.optional && (
        <span className="ml-1 font-normal" style={{ color: 'var(--clr-muted)' }}>(opcional)</span>
      )}
    </label>
  );

  let input: React.ReactNode;

  switch (field.type) {
    case 'select':
      input = (
        <div className="relative">
          <select
            {...register(field.name)}
            style={{ ...baseInputStyle, paddingRight: 36, cursor: 'pointer', appearance: 'none' as const }}
          >
            <option value="">Seleccionar…</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--clr-muted)' }}
          />
        </div>
      );
      break;

    case 'textarea':
      input = (
        <textarea
          {...register(field.name)}
          placeholder={field.placeholder}
          maxLength={field.name === 'instructions' ? 250 : undefined}
          rows={3}
          style={{ ...baseInputStyle, resize: 'vertical', minHeight: 80 }}
        />
      );
      break;

    case 'password':
      input = <PasswordField field={field} register={register} baseStyle={baseInputStyle} />;
      break;

    case 'phone':
      input = (
        <input
          {...register(field.name)}
          type="tel"
          placeholder={field.placeholder ?? '+57 300 000 0000'}
          style={baseInputStyle}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d+\s]/g, '');
            setValue(raw);
          }}
        />
      );
      break;

    case 'date':
      input = (
        <input
          {...register(field.name)}
          type="date"
          style={baseInputStyle}
        />
      );
      break;

    case 'toggle':
      input = <ToggleField label={field.label} checked={!!value} onChange={(v) => setValue(v)} />;
      break;

    case 'email':
      input = (
        <input
          {...register(field.name)}
          type="email"
          placeholder={field.placeholder}
          style={baseInputStyle}
          autoComplete="email"
        />
      );
      break;

    default:
      input = (
        <input
          {...register(field.name)}
          type="text"
          placeholder={field.placeholder}
          style={baseInputStyle}
        />
      );
  }

  return (
    <div>
      {field.type !== 'toggle' && label}  {/* toggle renders su propio label */}
      {input}
      {field.hint && !error && (
        <p className="mt-1 flex items-center gap-1 text-[11px]" style={{ color: 'var(--clr-muted)' }}>
          <Info size={10} /> {field.hint}
        </p>
      )}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
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

// ── Componentes especializados ────────────────────────────────────────────────

function PasswordField({
  field,
  register,
  baseStyle,
}: {
  field: FieldConfig;
  register: ReturnType<typeof useForm>['register'];
  baseStyle: React.CSSProperties;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        {...register(field.name)}
        type={show ? 'text' : 'password'}
        placeholder={field.placeholder}
        style={{ ...baseStyle, paddingRight: 40 }}
        autoComplete="new-password"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2"
        style={{ color: 'var(--clr-muted)' }}
        tabIndex={-1}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors text-left"
      style={{
        background: checked ? 'color-mix(in srgb, var(--clr-primary) 8%, transparent)' : 'var(--bg-surface-2, var(--clr-bg-light))',
        border: `1.5px solid ${checked ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
      }}
    >
      <div
        className="relative w-10 h-6 rounded-full flex-shrink-0 transition-colors"
        style={{ background: checked ? 'var(--clr-primary)' : 'var(--clr-border)' }}
      >
        <motion.div
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
          animate={{ left: checked ? '1.25rem' : '0.25rem' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
      <div className="flex items-center gap-2">
        {checked && <Check size={13} style={{ color: 'var(--clr-primary)' }} />}
        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          {label}
        </span>
      </div>
    </button>
  );
}

function Spinner() {
  return (
    <div
      className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
    />
  );
}
