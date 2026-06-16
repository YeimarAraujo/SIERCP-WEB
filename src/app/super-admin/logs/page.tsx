'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, RefreshCcw, Search, ShieldAlert } from 'lucide-react';
import { PageHero } from '@/components/ui/page-hero';
import { DataTable } from '@/components/ui/data-table';
import { AuditService, type AuditLog } from '@/features/audit/services/audit.service';
import { downloadCsvReport, downloadPdfReport, formatReportFilename } from '@/shared/lib/export-utils';
import { Header } from '@/components/layout/header';

const actionOptions = [
    { value: '', label: 'Todas las acciones' },
    { value: 'auth.login', label: 'Login' },
    { value: 'auth.logout', label: 'Logout' },
    { value: 'create', label: 'Creación' },
    { value: 'update', label: 'Actualización' },
    { value: 'delete', label: 'Eliminación' },
    { value: 'export.csv', label: 'Exportación CSV' },
    { value: 'export.pdf', label: 'Exportación PDF' },
    { value: 'certificate.generate', label: 'Certificados' },
    { value: 'role.change', label: 'Cambio de rol' },
    { value: 'system.error', label: 'Errores' },
];

function formatDate(value: Date): string {
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(value);
}

function severityBadge(severity: AuditLog['severity']) {
    const palette = {
        info: ['#dbeafe', 'var(--brand)', 'Info'],
        warning: ['#fef3c7', '#b45309', 'Alerta'],
        critical: ['#fee2e2', '#b91c1c', 'Crítico'],
    } as const;
    const [bg, color, label] = palette[severity || 'info'];
    return <span style={{ padding: '5px 9px', borderRadius: 999, background: bg, color, fontSize: 12, fontWeight: 800 }}>{label}</span>;
}

export default function SuperAdminLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [action, setAction] = useState('');
    const [institutionId, setInstitutionId] = useState('');

    async function loadLogs() {
        setLoading(true);
        try {
            const result = await AuditService.list({
                action: action || undefined,
                institutionId: institutionId || undefined,
                search,
                limit: 100,
            });
            setLogs(result.logs);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const timer = window.setTimeout(loadLogs, 250);
        return () => window.clearTimeout(timer);
    }, [action, institutionId, search]);

    const exportRows = useMemo(() => logs.map((log) => ({
        Fecha: formatDate(log.timestamp),
        Actor: log.actor.name || log.actor.email || log.actor.uid || 'Sistema',
        Rol: log.actor.role || '-',
        Accion: log.action,
        Recurso: log.resource,
        RecursoId: log.resourceId || '-',
        Institucion: log.institutionId || '-',
        Severidad: log.severity || 'info',
        Metadata: JSON.stringify(log.metadata || {}),
    })), [logs]);

    const columns = [
        { key: 'timestamp', label: 'Fecha', render: (value: Date) => formatDate(value) },
        {
            key: 'actor',
            label: 'Actor',
            render: (_: unknown, row: AuditLog) => (
                <div>
                    <div style={{ fontWeight: 800 }}>{row.actor.name || row.actor.email || 'Sistema'}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{row.actor.role || row.actor.uid || '-'}</div>
                </div>
            ),
        },
        { key: 'action', label: 'Acción' },
        {
            key: 'resource',
            label: 'Recurso',
            render: (_: unknown, row: AuditLog) => (
                <div>
                    <div>{row.resource}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{row.resourceId || '-'}</div>
                </div>
            ),
        },
        { key: 'institutionId', label: 'Institución', render: (value: string) => value || '-' },
        { key: 'severity', label: 'Estado', render: (value: AuditLog['severity']) => severityBadge(value) },
    ];

    async function exportPdf() {
        await downloadPdfReport({
            filename: formatReportFilename('auditoria-super-admin', 'pdf'),
            title: 'Auditoría global SIERCP',
            subtitle: 'Eventos críticos y operativos auditLogs',
            summary: [
                { label: 'Eventos', value: logs.length },
                { label: 'Críticos', value: logs.filter((log) => log.severity === 'critical').length },
                { label: 'Alertas', value: logs.filter((log) => log.severity === 'warning').length },
                { label: 'Acción', value: action || 'Todas' },
            ],
            filters: {
                Busqueda: search || '-',
                Accion: action || 'Todas',
                Institucion: institutionId || 'Todas',
            },
            columns: ['Fecha', 'Actor', 'Acción', 'Recurso', 'Institución', 'Severidad'],
            rows: logs.map((log) => [
                formatDate(log.timestamp),
                log.actor.name || log.actor.email || 'Sistema',
                log.action,
                log.resource,
                log.institutionId || '-',
                log.severity || 'info',
            ]),
        });
    }

    return (
        <div style={{ display: 'grid', gap: 12 }}>
            <Header />
            <PageHero
                title="Auditoría y Observabilidad"
                subtitle={`Eventos registrados desde auditLogs — ${logs.length} visibles`}
                parentTitle="Super Admin"
                parentHref="/super-admin/dashboard"
                actions={
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button onClick={loadLogs} className="btn-secondary" disabled={loading}>
                            <RefreshCcw size={16} />
                            Actualizar
                        </button>
                        <button
                            onClick={() => downloadCsvReport(exportRows, {
                                filename: formatReportFilename('auditoria-super-admin', 'csv'),
                                title: 'Auditoría global SIERCP',
                                filters: { search, action, institutionId },
                            })}
                            className="btn-secondary"
                            disabled={!logs.length}
                        >
                            <Download size={16} />
                            CSV
                        </button>
                        <button onClick={exportPdf} className="btn-primary" disabled={!logs.length}>
                            <FileText size={16} />
                            PDF
                        </button>
                    </div>
                }
            />

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(240px, 1.4fr) minmax(180px, .7fr) minmax(180px, .7fr)',
                gap: 14,
                padding: 18,
                borderRadius: 22,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
            }}>
                <label style={{ display: 'grid', gap: 7 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Buscar</span>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--text-muted)' }} />
                        <input
                            className="input-field"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Actor, recurso, metadata..."
                            style={{ paddingLeft: 38 }}
                        />
                    </div>
                </label>
                <label style={{ display: 'grid', gap: 7 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Acción</span>
                    <select className="input-field" value={action} onChange={(event) => setAction(event.target.value)}>
                        {actionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                </label>
                <label style={{ display: 'grid', gap: 7 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Institución</span>
                    <input className="input-field" value={institutionId} onChange={(event) => setInstitutionId(event.target.value)} placeholder="Código institución" />
                </label>
            </div>

            <div style={{ padding: 16, borderRadius: 18, background: 'rgba(24,0,173,.06)', color: 'var(--text-secondary)', display: 'flex', gap: 10 }}>
                <ShieldAlert size={18} color="var(--brand)" />
                <span>La tabla usa paginación visual y consulta limitada a los últimos 100 eventos. Para auditoría histórica completa se recomienda exportación backend por rango.</span>
            </div>

            <DataTable
                columns={columns}
                data={logs}
                loading={loading}
                emptyMessage="No hay eventos de auditoría registrados todavía"
                enablePagination
                defaultPageSize={20}
            />
        </div>
    );
}
