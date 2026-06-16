'use client';

import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { Award, BadgeCheck, DollarSign, RefreshCcw, Repeat, TrendingUp } from 'lucide-react';

/**
 * KPIs de Skills, Badges, Ingresos y Retención (S5).
 * Lee platformMetrics/global (calculado por Cloud Function) y permite recalcular.
 */

interface Metrics {
  skillsIssued?: number; skillsActive?: number; badgesIssued?: number;
  revenueCents?: number; ticketAvgCents?: number; retention30d?: number;
  approvedTransactions?: number; updatedAt?: { toDate: () => Date };
}

function cop(cents = 0): string {
  const v = cents / 100;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export function SkillsKpiRow() {
  const [m, setM] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'platformMetrics', 'global'));
      setM(snap.exists() ? (snap.data() as Metrics) : {});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const recompute = async () => {
    setBusy(true);
    try {
      // Spark: API route Vercel en vez de Cloud Function.
      const res = await fetch('/api/super-admin/metrics/recompute', { method: 'POST' });
      if (res.ok) setM((await res.json()) as Metrics);
    } catch (e) {
      console.error('recompute metrics', e);
    } finally {
      setBusy(false);
    }
  };

  const cards = [
    { label: 'Skills emitidas', value: m?.skillsIssued ?? 0, icon: Award, accent: '#14b8a6' },
    { label: 'Skills activas', value: m?.skillsActive ?? 0, icon: BadgeCheck, accent: '#10b981' },
    { label: 'Insignias', value: m?.badgesIssued ?? 0, icon: Award, accent: '#f59e0b' },
    { label: 'Ingresos', value: cop(m?.revenueCents), icon: DollarSign, accent: '#059669' },
    { label: 'Ticket prom.', value: cop(m?.ticketAvgCents), icon: TrendingUp, accent: '#6366f1' },
    { label: 'Retención 30d', value: `${m?.retention30d ?? 0}%`, icon: Repeat, accent: '#0ea5e9' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: 'var(--text-primary)' }}>Competencias e ingresos</h3>
          <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
            platformMetrics/global {m?.updatedAt?.toDate ? `· act. ${new Intl.DateTimeFormat('es-CO', { dateStyle: 'short', timeStyle: 'short' }).format(m.updatedAt.toDate())}` : ''}
          </p>
        </div>
        <button onClick={recompute} disabled={busy}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700 }}>
          <RefreshCcw size={14} style={{ animation: busy ? 'spin 1s linear infinite' : undefined }} /> Recalcular
        </button>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {cards.map((c) => (
          <div key={c.label} style={{ padding: 16, borderRadius: 18, border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase' }}>{c.label}</p>
              <c.icon size={16} style={{ color: c.accent }} />
            </div>
            <h2 style={{ margin: '8px 0 0', fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              {loading ? '—' : c.value}
            </h2>
          </div>
        ))}
      </div>
    </div>
  );
}
