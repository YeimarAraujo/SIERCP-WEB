'use client';

import { Header } from '@/components/layout/header';
import { CalendarView } from '@/components/ui/calendar-view';
import { useAdminCalendar } from '@/shared/hooks/use-calendar';
import { useAuthStore } from '@/stores';

export default function AdminCalendarPage() {
    const user = useAuthStore((s) => s.user);
    const { events, loading, error, refresh } = useAdminCalendar(user?.institutionId);

    return (
        <>
            <Header />
            <main style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
                <CalendarView
                    events={events}
                    loading={loading}
                    error={error}
                    onRefresh={refresh}
                    title="Calendario institucional"
                    subtitle="Sesiones, evaluaciones y certificados de tu institución"
                />
            </main>
        </>
    );
}
