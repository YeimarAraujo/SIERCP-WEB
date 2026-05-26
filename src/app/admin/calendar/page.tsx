'use client';

import { Header } from '@/components/layout/header';
import { CalendarView } from '@/components/ui/calendar-view';
import { PageHero } from '@/components/ui/page-hero';
import { useAdminCalendar } from '@/shared/hooks/use-calendar';
import { useAuthStore } from '@/stores';
import { Calendar } from 'lucide-react';

export default function AdminCalendarPage() {
    const user = useAuthStore((s) => s.user);
    const { events, loading, error, refresh } = useAdminCalendar(user?.institutionId);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
            <Header title="Calendario Institucional" />

            <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <PageHero
                    title="Calendario Institucional"
                    subtitle="Sesiones, evaluaciones y certificados de toda tu institución"
                    parentTitle="Panel de Control"
                    parentHref="/admin/dashboard"
                    actions={
                        <div style={{
                            background: 'var(--card)', border: '1px solid var(--border)',
                            borderRadius: 16, padding: '14px 18px', textAlign: 'center',
                        }}>
                            <Calendar size={22} color="var(--foreground)" />
                            <div style={{ fontSize: 10, color: 'var(--foreground)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 6 }}>
                                {`${events.length} evento${events.length !== 1 ? 's' : ''}`}
                            </div>
                        </div>
                    }
                />

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
                        title="Calendario institucional"
                        subtitle="Sesiones, evaluaciones y certificados de tu institución"
                    />
                </div>
            </div>
        </div>
    );
}
