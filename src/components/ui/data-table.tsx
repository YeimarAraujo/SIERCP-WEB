'use client';

import { useState } from 'react';

interface Column<T = any> {
    key: string;
    label: string;
    width?: string;
    render?: (value: any, row: T) => React.ReactNode;
}

interface DataTableProps<T = any> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    emptyMessage?: string;
    onRowClick?: (row: T) => void;
    enablePagination?: boolean;
    defaultPageSize?: number;
}

export function DataTable<T = any>({
    columns,
    data,
    loading = false,
    emptyMessage = 'No hay datos disponibles',
    onRowClick,
    enablePagination = false,
    defaultPageSize = 20,
}: DataTableProps<T>) {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);

    const totalPages = Math.ceil(data.length / pageSize);
    const paginatedData = enablePagination 
        ? data.slice((currentPage - 1) * pageSize, currentPage * pageSize)
        : data;

    if (loading) {
        return (
            <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
            }}>
                {[...Array(5)].map((_, i) => (
                    <div key={i} style={{
                        height: '52px',
                        background: i % 2 === 0
                            ? 'var(--bg-surface)'
                            : 'var(--bg-surface-2)',
                        borderBottom: '1px solid var(--border)',
                        animation: 'pulse 1.5s ease-in-out infinite',
                    }} />
                ))}
                <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '48px 24px',
                textAlign: 'center' as const,
                color: 'var(--text-muted)',
                fontSize: '14px',
            }}>
                {emptyMessage}
            </div>
        );
    }

    return (
        <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
        }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: 'var(--bg-surface-2)' }}>
                        {columns.map((col) => (
                            <th key={String(col.key)} style={{
                                padding: '12px 16px',
                                textAlign: 'left',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                borderBottom: '1px solid var(--border)',
                                width: col.width,
                            }}>
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {paginatedData.map((row, i) => (
                        <tr
                            key={(row as any).id ?? i}
                            onClick={() => onRowClick?.(row)}
                            style={{
                                borderBottom: '1px solid var(--border)',
                                cursor: onRowClick ? 'pointer' : 'default',
                                transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                                if (onRowClick) {
                                    e.currentTarget.style.background = 'var(--bg-surface-2)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            {columns.map((col) => (
                                <td key={String(col.key)} style={{
                                    padding: '14px 16px',
                                    fontSize: '14px',
                                    color: 'var(--text-primary)',
                                }}>
                                    {col.render
                                        ? col.render(
                                            row[col.key as keyof T] as unknown,
                                            row
                                        )
                                        : String(row[col.key as keyof T] ?? '—')
                                    }
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            {enablePagination && data.length > 0 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 24px',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        <span>Filas por página:</span>
                        <select 
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            style={{
                                padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)',
                                background: 'var(--bg-surface)', fontSize: '13px', outline: 'none', cursor: 'pointer'
                            }}
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span>
                            Mostrando {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, data.length)} de {data.length}
                        </span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            style={{
                                padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)',
                                background: currentPage === 1 ? 'var(--bg-surface-2)' : 'var(--bg-surface)',
                                color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600'
                            }}
                        >
                            Anterior
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '13px', fontWeight: '600' }}>
                            Página {currentPage} de {totalPages}
                        </div>
                        <button 
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            style={{
                                padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)',
                                background: currentPage === totalPages ? 'var(--bg-surface-2)' : 'var(--bg-surface)',
                                color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600'
                            }}
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
