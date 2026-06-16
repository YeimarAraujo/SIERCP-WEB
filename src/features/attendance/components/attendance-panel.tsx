'use client';

/**
 * Panel de ASISTENCIA del instructor (frente 2.3 / 7).
 *
 * Una "clase" se identifica por fecha (classId = YYYY-MM-DD, idempotente). El
 * instructor marca presente/ausente/tarde/justificada por estudiante, justifica
 * ausencias y guarda. La API recalcula `attendanceRate` en la matrícula, que
 * alimenta el gating de certificación. Prefill: lee los registros de esa fecha.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CalendarCheck, Save, Loader2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { AttendanceApi } from '@/features/attendance/services/attendance-api.client';
import { ATTENDANCE_STATUS_LABEL, type AttendanceStatus, type AttendanceMode } from '@/shared/types/attendance';

interface RosterStudent { studentId: string; studentName?: string; attendanceRate?: number }

const STATUS_ORDER: AttendanceStatus[] = ['present', 'late', 'excused', 'absent'];
const STATUS_COLOR: Record<AttendanceStatus, { bg: string; fg: string }> = {
    present: { bg: '#DCFCE7', fg: '#166534' },
    late: { bg: '#DBEAFE', fg: '#1E40AF' },
    excused: { bg: '#FEF3C7', fg: '#92400E' },
    absent: { bg: '#FEE2E2', fg: '#991B1B' },
};

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

export function AttendancePanel({ courseId, roster }: { courseId: string; roster: RosterStudent[] }) {
    const [classDate, setClassDate] = useState(todayISO());
    const [mode, setMode] = useState<AttendanceMode>('presencial');
    const [marks, setMarks] = useState<Record<string, { status: AttendanceStatus; justification: string }>>({});
    const [busy, setBusy] = useState(false);
    const [loadingClass, setLoadingClass] = useState(false);

    const classId = classDate; // idempotente por fecha

    // Prefill: cargar registros existentes de esta clase (fecha).
    const loadClass = useCallback(async () => {
        if (!classId) return;
        setLoadingClass(true);
        try {
            const snap = await getDocs(query(
                collection(db, 'courses', courseId, 'attendance'),
                where('classId', '==', classId),
            ));
            const next: Record<string, { status: AttendanceStatus; justification: string }> = {};
            snap.docs.forEach((d) => {
                const data = d.data();
                next[String(data.studentId)] = {
                    status: (data.status as AttendanceStatus) || 'present',
                    justification: String(data.justification || ''),
                };
            });
            // Default: presentes los no registrados.
            roster.forEach((r) => { if (!next[r.studentId]) next[r.studentId] = { status: 'present', justification: '' }; });
            setMarks(next);
        } catch (e) {
            console.error('[attendance] load', e);
            const def: Record<string, { status: AttendanceStatus; justification: string }> = {};
            roster.forEach((r) => { def[r.studentId] = { status: 'present', justification: '' }; });
            setMarks(def);
        } finally {
            setLoadingClass(false);
        }
    }, [courseId, classId, roster]);

    useEffect(() => { loadClass(); }, [loadClass]);

    const counts = useMemo(() => {
        const c = { present: 0, late: 0, excused: 0, absent: 0 };
        Object.values(marks).forEach((m) => { c[m.status]++; });
        return c;
    }, [marks]);

    const setStatus = (studentId: string, status: AttendanceStatus) =>
        setMarks((p) => ({ ...p, [studentId]: { status, justification: p[studentId]?.justification || '' } }));
    const setJustification = (studentId: string, justification: string) =>
        setMarks((p) => ({ ...p, [studentId]: { status: p[studentId]?.status || 'present', justification } }));

    const save = async () => {
        if (busy || roster.length === 0) return;
        setBusy(true);
        try {
            const entries = roster.map((r) => ({
                studentId: r.studentId,
                studentName: r.studentName,
                status: marks[r.studentId]?.status || 'present',
                justification: marks[r.studentId]?.justification || '',
            }));
            const result = await AttendanceApi.markBulk({
                courseId, classId,
                classLabel: `Clase ${classDate}`,
                mode, date: classDate, entries,
            });
            toast.success(`Asistencia guardada (${result.updated} estudiantes)`);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error al guardar');
        } finally {
            setBusy(false);
        }
    };

    const cell: React.CSSProperties = { padding: '10px 12px', fontSize: 13, color: 'var(--text-secondary)' };

    return (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 24, marginTop: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' }}>
                        <CalendarCheck size={20} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--foreground)' }}>Asistencia</h3>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Impacta el gating de certificación automáticamente.</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input type="date" value={classDate} onChange={(e) => setClassDate(e.target.value)}
                        style={{ height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--muted)', fontSize: 13, color: 'var(--foreground)' }} />
                    <select value={mode} onChange={(e) => setMode(e.target.value as AttendanceMode)}
                        style={{ height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--muted)', fontSize: 13, color: 'var(--foreground)' }}>
                        <option value="presencial">Presencial</option>
                        <option value="virtual">Virtual</option>
                    </select>
                    <button onClick={save} disabled={busy || loadingClass}
                        style={{ padding: '10px 16px', borderRadius: 12, background: 'var(--brand)', color: 'var(--text-on-brand)', border: 'none', fontSize: 13, fontWeight: 700, cursor: busy ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: busy ? 0.6 : 1 }}>
                        {busy ? <Loader2 size={15} className="spin" /> : <Save size={15} />} Guardar asistencia
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
                {STATUS_ORDER.map((s) => (
                    <div key={s} style={{ background: STATUS_COLOR[s].bg, borderRadius: 14, padding: '12px 16px' }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: STATUS_COLOR[s].fg }}>{counts[s]}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLOR[s].fg, opacity: 0.85 }}>{ATTENDANCE_STATUS_LABEL[s]}</div>
                    </div>
                ))}
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 14 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'var(--muted)', textAlign: 'left' }}>
                            <th style={{ ...cell, fontWeight: 800, color: 'var(--foreground)' }}><Users size={14} style={{ verticalAlign: 'middle' }} /> Estudiante</th>
                            <th style={{ ...cell, fontWeight: 800, color: 'var(--foreground)' }}>% Acumulado</th>
                            <th style={{ ...cell, fontWeight: 800, color: 'var(--foreground)' }}>Estado de la clase</th>
                            <th style={{ ...cell, fontWeight: 800, color: 'var(--foreground)' }}>Justificación</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roster.map((r) => {
                            const m = marks[r.studentId] || { status: 'present' as AttendanceStatus, justification: '' };
                            const needsJust = m.status === 'excused' || m.status === 'late';
                            return (
                                <tr key={r.studentId} style={{ borderTop: '1px solid var(--border)' }}>
                                    <td style={{ ...cell, fontWeight: 600, color: 'var(--foreground)' }}>{r.studentName || r.studentId}</td>
                                    <td style={cell}>{r.attendanceRate != null ? `${Math.round(r.attendanceRate)}%` : '—'}</td>
                                    <td style={cell}>
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                            {STATUS_ORDER.map((s) => {
                                                const active = m.status === s;
                                                return (
                                                    <button key={s} onClick={() => setStatus(r.studentId, s)} type="button"
                                                        style={{ padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer',
                                                            border: active ? 'none' : '1px solid var(--border)',
                                                            background: active ? STATUS_COLOR[s].bg : 'transparent',
                                                            color: active ? STATUS_COLOR[s].fg : 'var(--text-muted)' }}>
                                                        {ATTENDANCE_STATUS_LABEL[s]}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </td>
                                    <td style={cell}>
                                        <input value={m.justification} onChange={(e) => setJustification(r.studentId, e.target.value)}
                                            placeholder={needsJust ? 'Motivo…' : '—'} disabled={!needsJust}
                                            style={{ width: '100%', height: 34, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border)', background: needsJust ? 'var(--muted)' : 'transparent', fontSize: 12, color: 'var(--foreground)', opacity: needsJust ? 1 : 0.4 }} />
                                    </td>
                                </tr>
                            );
                        })}
                        {roster.length === 0 && (
                            <tr><td colSpan={4} style={{ ...cell, textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No hay estudiantes inscritos.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <style jsx>{`.spin { animation: spin 0.8s linear infinite } @keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
    );
}
