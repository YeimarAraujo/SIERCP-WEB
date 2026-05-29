'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Download } from 'lucide-react';

interface CourseQrProps {
  inviteCode: string;
  courseTitle?: string;
  /** Si es true muestra solo el badge pequeño con el código y el QR al hacer hover/click */
  compact?: boolean;
}

export function CourseQr({ inviteCode, courseTitle, compact = false }: CourseQrProps) {
  const [copied, setCopied] = useState(false);
  const [showFull, setShowFull] = useState(false);

  const qrValue = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${inviteCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    const svg = document.getElementById(`qr-svg-${inviteCode}`);
    if (!svg) return;
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 460;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 400, 460);
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 20, 20, 360, 360);
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(inviteCode, 200, 430);
      const link = document.createElement('a');
      link.download = `qr-${inviteCode}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  if (compact) {
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          onClick={() => setShowFull(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 8,
            background: 'var(--brand-alpha-10, rgba(24,0,173,0.08))',
            border: '1px solid var(--brand-alpha-25, rgba(24,0,173,0.2))',
            cursor: 'pointer', fontFamily: 'monospace',
            fontSize: 13, fontWeight: 700, color: 'var(--brand)',
            letterSpacing: 2,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
          {inviteCode}
        </button>

        {showFull && (
          <>
            {/* backdrop */}
            <div
              onClick={() => setShowFull(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            />
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 16, padding: 20, zIndex: 1000,
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              minWidth: 200,
            }}>
              {courseTitle && (
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 180 }}>
                  {courseTitle}
                </p>
              )}
              <QRCodeSVG
                id={`qr-svg-${inviteCode}`}
                value={qrValue}
                size={160}
                level="M"
                style={{ background: '#fff', padding: 8, borderRadius: 8 }}
              />
              <span style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: 'var(--brand)', letterSpacing: 3 }}>
                {inviteCode}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleCopy} style={btnStyle}>
                  {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
                <button onClick={handleDownload} style={btnStyle}>
                  <Download size={14} />
                  Descargar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Full (card)
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      background: 'var(--card)', borderRadius: 16, padding: 24,
      border: '1px solid var(--border)',
    }}>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
        Código de Acceso al Curso
      </p>
      <QRCodeSVG
        id={`qr-svg-${inviteCode}`}
        value={qrValue}
        size={160}
        level="M"
        style={{ background: '#fff', padding: 10, borderRadius: 10 }}
      />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--muted)', borderRadius: 10, padding: '8px 16px',
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 800, color: 'var(--brand)', letterSpacing: 4 }}>
          {inviteCode}
        </span>
        <button onClick={handleCopy} title="Copiar código" style={{ ...btnStyle, padding: '4px 8px' }}>
          {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
        </button>
      </div>
      <button onClick={handleDownload} style={{ ...btnStyle, width: '100%', justifyContent: 'center' }}>
        <Download size={14} />
        Descargar QR
      </button>
      {courseTitle && (
        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
          {courseTitle}
        </p>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '6px 12px', borderRadius: 8,
  background: 'var(--muted)', border: '1px solid var(--border)',
  fontSize: 12, fontWeight: 600, cursor: 'pointer',
  color: 'var(--text-secondary)',
};
