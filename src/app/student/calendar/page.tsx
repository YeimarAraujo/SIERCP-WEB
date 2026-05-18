'use client';

import { Header } from '@/components/layout/header';
import { CalendarView } from '@/components/ui/calendar-view';
import { useCalendar } from '@/shared/hooks/use-calendar';
import { useAuthStore } from '@/stores';

export default function StudentCalendarPage() {
    const user = useAuthStore((s) => s.user);
    const { events, loading, error, refresh } = useCalendar(user?.uid);

    return (
        <>
            <Header />
            <main style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
                <CalendarView
                    events={events}
                    loading={loading}
                    error={error}
                    onRefresh={refresh}
                    title="Mi calendario"
                    subtitle="Historial de evaluaciones, sesiones y certificados"
                />
            </main>
        </>
    );
}
