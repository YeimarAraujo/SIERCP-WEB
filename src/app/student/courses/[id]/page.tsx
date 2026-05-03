import { Header } from '@/components/layout/header';
import { PageHeader } from '@/components/ui/page-header';

export default function StudentCourseDetailPage() {
    return (
        <div style={{ padding: 24 }}>
            <PageHeader title="Detalle del curso" subtitle="Próximamente" />
            <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E4F0',
                borderRadius: 12,
                padding: 40,
                textAlign: 'center',
            }}>
                <p style={{ color: '#8892A4' }}>Contenido del curso en construcción</p>
            </div>
        </div>
    );
}
