'use client';

import { useState, useCallback } from 'react';

export interface DiscountResult {
  code: string;
  discountCents: number;
  discountPercent: number;
  description: string;
}

interface Props {
  amountCents: number;
  onApply: (discount: DiscountResult | null) => void;
}

export default function DiscountCode({ amountCents, onApply }: Props) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');
  const [applied, setApplied] = useState<DiscountResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const validate = useCallback(async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed, amountCents }),
      });
      const json = await res.json() as {
        valid: boolean;
        discountCents?: number;
        discountPercent?: number;
        description?: string;
        error?: string;
      };

      if (!res.ok || !json.valid) {
        setStatus('invalid');
        setErrorMsg(json.error ?? 'Código inválido o expirado');
        setApplied(null);
        onApply(null);
        return;
      }

      const result: DiscountResult = {
        code: trimmed,
        discountCents: json.discountCents ?? 0,
        discountPercent: json.discountPercent ?? 0,
        description: json.description ?? '',
      };
      setStatus('valid');
      setApplied(result);
      onApply(result);
    } catch {
      setStatus('invalid');
      setErrorMsg('Error al validar el código. Intenta de nuevo.');
      setApplied(null);
      onApply(null);
    }
  }, [code, amountCents, onApply]);

  const remove = useCallback(() => {
    setCode('');
    setStatus('idle');
    setApplied(null);
    setErrorMsg('');
    onApply(null);
  }, [onApply]);

  // Already applied — show badge + remove button
  if (applied) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px',
        background: 'rgba(22, 163, 74, 0.06)',
        border: '1.5px solid rgba(22, 163, 74, 0.25)',
        borderRadius: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="bi bi-tag-fill" style={{ color: '#16A34A', fontSize: '0.85rem' }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#16A34A' }}>
              {applied.code} aplicado
            </div>
            {applied.description && (
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                {applied.description}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={remove}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#94A3B8', fontSize: 18, lineHeight: 1, padding: '2px 4px',
          }}
          title="Quitar descuento"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
        Código de descuento
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setStatus('idle'); setErrorMsg(''); }}
          onKeyDown={e => e.key === 'Enter' && validate()}
          placeholder="PROMO123"
          maxLength={30}
          style={{
            flex: 1,
            padding: '10px 14px',
            border: `1.5px solid ${status === 'invalid' ? '#FCA5A5' : '#E2E8F0'}`,
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            color: '#0F172A',
            letterSpacing: '0.05em',
            outline: 'none',
            background: '#fff',
            transition: 'border-color 0.2s ease',
          }}
        />
        <button
          onClick={validate}
          disabled={!code.trim() || status === 'loading'}
          style={{
            padding: '10px 18px',
            background: !code.trim() || status === 'loading' ? '#E2E8F0' : '#1800AD',
            color: !code.trim() || status === 'loading' ? '#94A3B8' : '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 800,
            cursor: !code.trim() || status === 'loading' ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          {status === 'loading'
            ? <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', animation: 'spin 0.6s linear infinite' }} /></>
            : 'Validar'
          }
        </button>
      </div>

      {errorMsg && (
        <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 600, marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="bi bi-x-circle-fill" style={{ fontSize: 11 }} />
          {errorMsg}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
