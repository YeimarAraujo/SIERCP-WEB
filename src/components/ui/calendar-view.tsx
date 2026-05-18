'use client';

import { useState, useMemo } from 'react';
import {
    ChevronLeft, ChevronRight, Brain, Heart, Award,
    AlertTriangle, BookOpen, CheckCircle, XCircle, RefreshCw,
} from 'lucide-react';
import {
    type CalendarEvent, type CalendarEventType,
    eventsByDate, dateKey, EVENT_COLORS,
} from '@/shared/hooks/use-calendar';

const MONTHS_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function EventIcon({ type, size = 14 }: { type: CalendarEventType; size?: number }) {
    const color = EVENT_COLORS[type];
    switch (type) {
        case 'quiz':        return <Brain size={size} color={color} />;
        case 'session':     return <Heart size={size} color={color} />;
        case 'certificate': return <Award size={size} color={color} />;
        case 'plan_expiry': return <AlertTriangle size={size} color={color} />;
        case 'course':      return <BookOpen size={size} color={color} />;
    }
}

function EventTypeBadge({ type }: { type: CalendarEventType }) {
    const labels: Record<CalendarEventType, string> = {
        quiz: 'Evaluación',
        session: 'Sesión',
        certificate: 'Certificado',
        plan_expiry: 'Plan',
        course: 'Curso',
    };
    return (
        <span style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.4px',
            color: EVENT_COLORS[type],
            background: `${EVENT_COLORS[type]}18`,
            borderRadius: 20,
            padding: '2px 7px',
            textTransform: 'uppercase',
        }}>
            {labels[type]}
        </span>
    );
}

interface CalendarViewProps {
    events: CalendarEvent[];
    loading?: boolean;
    error?: string | null;
    title?: string;
    subtitle?: string;
    onRefresh?: () => void;
}

export function CalendarView({ events, loading, error, title = 'Calendario', subtitle, onRefresh }: CalendarViewProps) {
    const today = new Date();
    const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState<string>(dateKey(today));

    const byDate = useMemo(() => eventsByDate(events), [events]);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const prev = () => setViewDate(new Date(year, month - 1, 1));
    const next = () => setViewDate(new Date(year, month + 1, 1));

    const selectedEvents = byDate.get(selectedDate) ?? [];

    // upcoming 5 events from today
    const todayTs = today.getTime();
    const upcoming = events
        .filter((e) => e.date.getTime() >= todayTs - 86400000)
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 8);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{
                        fontSize: 22, fontWeight: 700,
                        color: 'var(--text-primary)', margin: 0,
                    }}>{title}</h1>
                    {subtitle && (
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                            {subtitle}
                        </p>
                    )}
                </div>
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        disabled={loading}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '7px 14px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--card-border)',
                            background: 'var(--card-bg)',
                            color: 'var(--text-secondary)',
                            fontSize: 13, fontWeight: 500,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.6 : 1,
                        }}
                    >
                        <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                        Actualizar
                    </button>
                )}
            </div>
            {error && (
                <div style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: '#ef444412',
                    border: '1px solid #ef444430',
                    color: '#ef4444',
                    fontSize: 13,
                }}>
                    {error}
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            style={{ marginLeft: 10, fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                        >
                            Reintentar
                        </button>
                    )}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
                {/* ── Month grid ─────────────────────────────────────────── */}
                <div style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                }}>
                    {/* Month nav */}
                    <div style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        borderBottom: '1px solid var(--card-border)',
                    }}>
                        <button onClick={prev} style={navBtnStyle}>
                            <ChevronLeft size={16} />
                        </button>
                        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                            {MONTHS_ES[month]} {year}
                        </span>
                        <button onClick={next} style={navBtnStyle}>
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Day names */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                        {DAYS_ES.map((d) => (
                            <div key={d} style={{
                                textAlign: 'center', padding: '8px 0',
                                fontSize: 11, fontWeight: 600,
                                color: 'var(--text-muted)',
                                letterSpacing: '0.3px',
                            }}>{d}</div>
                        ))}
                    </div>

                    {/* Day cells */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                        {/* Empty cells */}
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`e${i}`} style={{ padding: '6px 4px', minHeight: 60 }} />
                        ))}
                        {/* Day cells */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const dayEvents = byDate.get(key) ?? [];
                            const isToday = key === dateKey(today);
                            const isSelected = key === selectedDate;

                            return (
                                <div
                                    key={key}
                                    onClick={() => setSelectedDate(key)}
                                    style={{
                                        padding: '4px',
                                        minHeight: 60,
                                        cursor: 'pointer',
                                        borderRadius: 'var(--radius-sm)',
                                        background: isSelected
                                            ? 'var(--brand-subtle)'
                                            : 'transparent',
                                        border: isSelected
                                            ? '1px solid var(--brand)'
                                            : '1px solid transparent',
                                        transition: 'all 0.1s ease',
                                    }}
                                >
                                    <div style={{
                                        width: 26, height: 26,
                                        borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: isToday ? 'var(--brand)' : 'transparent',
                                        color: isToday
                                            ? 'white'
                                            : isSelected
                                                ? 'var(--brand)'
                                                : 'var(--text-primary)',
                                        fontSize: 12,
                                        fontWeight: isToday || isSelected ? 700 : 400,
                                        margin: '0 auto 4px',
                                    }}>{day}</div>

                                    {/* Event dots */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                                        {dayEvents.slice(0, 3).map((ev) => (
                                            <div key={ev.id} style={{
                                                width: 6, height: 6, borderRadius: '50%',
                                                background: EVENT_COLORS[ev.type],
                                            }} />
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>
                                                +{dayEvents.length - 3}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Selected day events */}
                    {selectedEvents.length > 0 && (
                        <div style={{
                            borderTop: '1px solid var(--card-border)',
                            padding: '12px 16px',
                        }}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                                {selectedDate === dateKey(today) ? 'HOY' : selectedDate}
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {selectedEvents.map((ev) => (
                                    <SelectedEventRow key={ev.id} event={ev} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Right panel ────────────────────────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Summary */}
                    <div style={panelStyle}>
                        <p style={panelTitleStyle}>Resumen del mes</p>
                        <MonthlySummary events={events} month={month} year={year} />
                    </div>

                    {/* Upcoming */}
                    <div style={panelStyle}>
                        <p style={panelTitleStyle}>Últimos eventos</p>
                        {loading ? (
                            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cargando...</p>
                        ) : upcoming.length === 0 ? (
                            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sin eventos próximos</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {upcoming.map((ev) => <UpcomingRow key={ev.id} event={ev} />)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SelectedEventRow({ event }: { event: CalendarEvent }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px',
            borderRadius: 'var(--radius-md)',
            background: `${EVENT_COLORS[event.type]}0d`,
            border: `1px solid ${EVENT_COLORS[event.type]}25`,
        }}>
            <EventIcon type={event.type} size={14} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    fontSize: 12, fontWeight: 600,
                    color: 'var(--text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    margin: 0,
                }}>{event.title}</p>
                {event.subtitle && (
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>{event.subtitle}</p>
                )}
            </div>
            {event.passed !== undefined && (
                event.passed
                    ? <CheckCircle size={14} color="#10b981" />
                    : <XCircle size={14} color="#ef4444" />
            )}
        </div>
    );
}

function UpcomingRow({ event }: { event: CalendarEvent }) {
    const day = event.date.getDate();
    const month = MONTHS_ES[event.date.getMonth()].slice(0, 3);
    return (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{
                minWidth: 36, textAlign: 'center',
                padding: '4px 0',
                borderRadius: 'var(--radius-sm)',
                background: `${EVENT_COLORS[event.type]}12`,
            }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: EVENT_COLORS[event.type], margin: 0 }}>{day}</p>
                <p style={{ fontSize: 9, color: EVENT_COLORS[event.type], margin: 0, textTransform: 'uppercase' }}>{month}</p>
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <EventTypeBadge type={event.type} />
                </div>
                <p style={{
                    fontSize: 12, fontWeight: 600,
                    color: 'var(--text-primary)', margin: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{event.title}</p>
                {event.subtitle && (
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>{event.subtitle}</p>
                )}
            </div>
        </div>
    );
}

function MonthlySummary({ events, month, year }: { events: CalendarEvent[]; month: number; year: number }) {
    const monthEvents = events.filter((e) => e.date.getMonth() === month && e.date.getFullYear() === year);
    const quizzes = monthEvents.filter((e) => e.type === 'quiz');
    const sessions = monthEvents.filter((e) => e.type === 'session');
    const certs = monthEvents.filter((e) => e.type === 'certificate');
    const passedQuizzes = quizzes.filter((e) => e.passed).length;

    const rows = [
        { label: 'Evaluaciones', value: `${quizzes.length}`, sub: `${passedQuizzes} aprobadas`, color: EVENT_COLORS.quiz },
        { label: 'Sesiones RCP', value: `${sessions.length}`, color: EVENT_COLORS.session },
        { label: 'Certificados', value: `${certs.length}`, color: EVENT_COLORS.certificate },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rows.map((r) => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.label}</span>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: r.color }}>{r.value}</span>
                        {r.sub && (
                            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>{r.sub}</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const navBtnStyle: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid var(--card-border)',
    borderRadius: 'var(--radius-sm)',
    padding: '4px 8px',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    display: 'flex', alignItems: 'center',
};

const panelStyle: React.CSSProperties = {
    background: 'var(--card-bg)',
    border: '1px solid var(--card-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '16px',
};

const panelTitleStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.5px',
    textTransform: 'uppercase', color: 'var(--text-muted)',
    marginBottom: 12, margin: '0 0 12px',
};
