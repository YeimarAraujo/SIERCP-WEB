'use client';

import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

export default function InstructorCoursesPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Header title="Mis cursos" />
            <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
                <PageHeader title="Mis cursos" />
                <EmptyState
                    title="No tienes cursos asignados aún"
                    description="Cuando un administrador te asigne cursos, aparecerán aquí."
                />
            </div>
        </div>
    );
}
