import type { SessionModel } from '@/shared/types/session';
import { downloadCsvReport, formatReportFilename } from '@/shared/lib/export-utils';

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendiente',
    active: 'En curso',
    completed: 'Completada',
    aborted: 'Abortada',
};

const PATIENT_LABELS: Record<string, string> = {
    adult: 'Adulto',
    pediatric: 'Pediátrico',
    infant: 'Infante',
};

export function sessionToCsvRow(session: SessionModel): Record<string, string | number> {
    const m = session.metrics;
    const score = m?.score ?? m?.qualityScore ?? 0;

    return {
        ID: session.id,
        Fecha: session.startedAt.toLocaleDateString('es-CO'),
        Hora: session.startedAt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        Escenario: session.scenarioTitle || 'Práctica Libre',
        Curso: session.courseTitle || '—',
        Estudiante: session.studentName,
        'Tipo de paciente': PATIENT_LABELS[session.patientType] ?? session.patientType,
        Estado: STATUS_LABELS[session.status] ?? session.status,
        'Duración (s)': session.duration ?? 0,
        'Compresiones totales': m?.totalCompressions ?? 0,
        'Compresiones correctas': m?.correctCompressions ?? 0,
        '% Compresiones correctas': m?.correctCompressionsPct ?? 0,
        'Profundidad promedio (mm)': (m?.averageDepthMm ?? 0).toFixed(1),
        'Frecuencia promedio (cpm)': (m?.averageRatePerMin ?? 0).toFixed(0),
        'Fuerza promedio (kg)': (m?.averageForceKg ?? 0).toFixed(1),
        'Recoil (%)': m?.recoilPct ?? 0,
        'CCF (%)': m?.ccfPct ?? 0,
        Interrupciones: m?.interruptionCount ?? 0,
        'Pausa máxima (s)': (m?.maxPauseSeconds ?? 0).toFixed(1),
        'Puntos profundidad': m?.depthScore ?? 0,
        'Puntos frecuencia': m?.rateScore ?? 0,
        'Puntos recoil': m?.recoilScore ?? 0,
        'Puntos interrupciones': m?.interruptionScore ?? 0,
        'Calidad AHA (%)': score,
        Resultado: m ? (m.approved ? 'APROBADO' : 'REPROBADO') : '—',
        Violaciones: (m?.violations ?? [])
            .map((v) => `${v.message} (${v.count}×)`)
            .join(' | ') || '—',
    };
}

export function downloadSessionCsv(session: SessionModel, generatedBy?: string): void {
    downloadCsvReport([sessionToCsvRow(session)], {
        filename: formatReportFilename(`sesion-${session.id}`, 'csv'),
        title: 'Detalle de sesión RCP',
        generatedBy,
        filters: {
            Estudiante: session.studentName,
            Escenario: session.scenarioTitle || 'Práctica Libre',
        },
    });
}
