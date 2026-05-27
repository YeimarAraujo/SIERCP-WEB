'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { Zap, Star } from 'lucide-react';

const XP_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500];

function getLevelInfo(xp: number) {
    let level = 1;
    for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
        if (xp >= XP_THRESHOLDS[i]) { level = i + 1; break; }
    }
    const currentThreshold = XP_THRESHOLDS[level - 1] ?? 0;
    const nextThreshold = XP_THRESHOLDS[level] ?? XP_THRESHOLDS[XP_THRESHOLDS.length - 1];
    const xpInLevel = xp - currentThreshold;
    const xpNeeded = nextThreshold - currentThreshold;
    const progress = level >= XP_THRESHOLDS.length ? 100 : Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));
    const xpToNext = level >= XP_THRESHOLDS.length ? 0 : nextThreshold - xp;
    return { level, progress, xpToNext, nextThreshold };
}

interface UserStats {
    xp: number;
    level: number;
    totalQuizSessions: number;
}

interface XpStripProps {
    userId: string;
    compact?: boolean;
}

export function XpStrip({ userId, compact = false }: XpStripProps) {
    const [stats, setStats] = useState<UserStats | null>(null);

    useEffect(() => {
        if (!userId) return;
        const unsub = onSnapshot(doc(db, 'userStats', userId), (snap) => {
            if (snap.exists()) {
                setStats(snap.data() as UserStats);
            } else {
                setStats({ xp: 0, level: 1, totalQuizSessions: 0 });
            }
        });
        return () => unsub();
    }, [userId]);

    if (!stats) return null;

    const xp = stats.xp ?? 0;
    const { level, progress, xpToNext } = getLevelInfo(xp);

    if (compact) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 16, padding: '12px 16px',
            }}>
                <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--brand)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800,
                }}>
                    {level}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--foreground)' }}>Nivel {level}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{xp} XP</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: 'var(--brand)', borderRadius: 99, transition: 'width 0.6s ease' }} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 20, padding: '20px 24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Level circle */}
                <div style={{
                    width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--brand), var(--clr-accent, #7c3aed))',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, fontWeight: 900,
                    boxShadow: '0 4px 12px rgba(24,0,173,0.25)',
                }}>
                    {level}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--foreground)' }}>Nivel {level}</span>
                            <span style={{
                                fontSize: 10, fontWeight: 800, color: 'var(--brand)',
                                background: 'color-mix(in srgb, var(--brand) 12%, transparent)',
                                padding: '2px 8px', borderRadius: 99, letterSpacing: '0.05em',
                            }}>
                                {xp} XP
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Star size={11} /> {stats.totalQuizSessions ?? 0} quizzes
                            </span>
                            {xpToNext > 0 && (
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Zap size={11} /> {xpToNext} XP para nivel {level + 1}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: 8, borderRadius: 99, background: 'var(--border)', overflow: 'hidden', position: 'relative' }}>
                        <div style={{
                            height: '100%', width: `${progress}%`,
                            background: 'linear-gradient(90deg, var(--brand), var(--clr-accent, #7c3aed))',
                            borderRadius: 99, transition: 'width 0.8s ease',
                        }} />
                    </div>

                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginTop: 5 }}>
                        {progress}% completado hacia nivel {level + 1}
                    </div>
                </div>
            </div>
        </div>
    );
}
