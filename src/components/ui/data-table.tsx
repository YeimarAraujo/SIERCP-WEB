'use client';

import { useState } from 'react';

interface Column<T> {
    key: keyof T | string;
    label: string;
    width?: string;
    render?: (value: unknown, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    emptyMessage?: string;
    onRowClick?: (row: T) => void;
}

export function DataTable<T extends { id?: string }>({
    columns,
    data,
    loading = false,
    emptyMessage = 'No hay datos disponibles',
    onRowClick,
}: DataTableProps<T>) {

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
                    {data.map((row, i) => (
                        <tr
                            key={row.id ?? i}
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
        </div>
    );
}
