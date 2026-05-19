'use client';

import { Header } from '@/components/layout/header';
import { CalendarView } from '@/components/ui/calendar-view';
import { PageHero } from '@/components/ui/page-hero';
import { useCalendar } from '@/shared/hooks/use-calendar';
import { useAuthStore } from '@/stores';
import { Calendar, Shield } from 'lucide-react';

export default function StudentCalendarPage() {
    const user = useAuthStore((s) => s.user);
    const { events, loading, error, refresh } = useCalendar(user?.uid);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Mi Calendario" />

            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero
                    title="Mi Calendario"
                    subtitle="Historial de evaluaciones, sesiones y certificados"
                    parentTitle="Inicio"
                    parentHref="/student/home"
                    actions={<>
                        <div style={{
                            background: 'var(--card)', border: '1px solid var(--border)',
                            borderRadius: 16, padding: '14px 18px', textAlign: 'center', backdropFilter: 'blur(10px)',
                        }}>
                            <Calendar size={22} color="var(--foreground)" />
                            <div style={{ fontSize: 10, color: 'var(--foreground)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 6 }}>
                                {`${events.length} evento${events.length !== 1 ? 's' : ''}`}
                            </div>
                        </div>
                    </>}
                />


                {/* Calendario  */}
                <div style={{
                    background: 'var(--card)',
                    border: '1.5px solid var(--border)',
                    borderRadius: 24,
                    overflow: 'hidden',
                    boxShadow: '0 1px 4px var(--border)',
                }}>
                    <CalendarView
                        events={events}
                        loading={loading}
                        error={error}
                        onRefresh={refresh}
                        title="Mi calendario"
                        subtitle="Historial de evaluaciones, sesiones y certificados"
                    />
                </div>
            </div>
        </div>
    );
}
