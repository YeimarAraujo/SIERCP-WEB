'use client';

import type { PasswordStrengthResult } from '@/hooks/usePasswordStrength';

interface Props {
  result: PasswordStrengthResult;
  password: string;
  confirmPassword?: string;
}

export default function PasswordStrength({ result, password, confirmPassword }: Props) {
  if (!password) return null;

  const confirmMismatch =
    confirmPassword !== undefined && confirmPassword.length > 0 && confirmPassword !== password;

  return (
    <div style={{ marginTop: 10 }}>
      {/* 4-segment strength bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 3,
              background: i <= result.score ? result.barColor : '#E2E8F0',
              transition: 'background 0.3s ease',
            }}
          />
        ))}
      </div>

      {result.label && (
        <div style={{ fontSize: 11, fontWeight: 700, color: result.color, marginBottom: 8 }}>
          {result.label}
        </div>
      )}

      {/* Requirements checklist — 2 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 12px' }}>
        {result.requirements.map(req => (
          <div key={req.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
            <span style={{
              fontSize: 11,
              fontWeight: 900,
              color: req.met ? '#16A34A' : '#CBD5E1',
              flexShrink: 0,
              marginTop: 1,
              lineHeight: 1,
            }}>
              {req.met ? '✓' : '○'}
            </span>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: req.met ? '#374151' : '#94A3B8',
              lineHeight: 1.4,
            }}>
              {req.label}
            </span>
          </div>
        ))}
      </div>

      {/* Confirm password feedback */}
      {confirmMismatch && (
        <div style={{
          marginTop: 8, fontSize: 12, fontWeight: 700,
          color: '#DC2626', display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <span>✗</span> Las contraseñas no coinciden
        </div>
      )}
      {confirmPassword !== undefined && confirmPassword.length > 0 && !confirmMismatch && (
        <div style={{
          marginTop: 8, fontSize: 12, fontWeight: 700,
          color: '#16A34A', display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <span>✓</span> Las contraseñas coinciden
        </div>
      )}
    </div>
  );
}
