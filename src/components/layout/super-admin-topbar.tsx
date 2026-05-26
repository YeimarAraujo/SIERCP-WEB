'use client';

import { useState } from 'react';
import { Bell, Search, X } from 'lucide-react';

export function SuperAdminTopbar() {
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');

    return (
        <header style={{
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 8,
            padding: '0 24px',
            borderBottom: '1px solid var(--clr-border, #e5e7eb)',
            background: 'var(--bg-card, #fff)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
        }}>
            {/* Search bar */}
            {searchOpen ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 400 }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        flex: 1, height: 38, padding: '0 12px',
                        borderRadius: 10, border: '1.5px solid var(--clr-primary, #2563eb)',
                        background: 'var(--clr-bg-input, #f9fafb)',
                    }}>
                        <Search size={15} style={{ color: 'var(--clr-text-muted, #6b7280)', flexShrink: 0 }} />
                        <input
                            autoFocus
                            value={searchValue}
                            onChange={e => setSearchValue(e.target.value)}
                            placeholder="Buscar institución, usuario, orden…"
                            style={{
                                flex: 1, border: 'none', outline: 'none',
                                fontSize: 13, background: 'transparent',
                                color: 'var(--clr-text, #111827)',
                            }}
                            onKeyDown={e => { if (e.key === 'Escape') { setSearchOpen(false); setSearchValue(''); } }}
                        />
                    </div>
                    <button
                        onClick={() => { setSearchOpen(false); setSearchValue(''); }}
                        style={{
                            width: 34, height: 34, borderRadius: 8, border: 'none',
                            background: 'var(--clr-bg-hover, #f3f4f6)',
                            color: 'var(--clr-text-muted, #6b7280)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <X size={15} />
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setSearchOpen(true)}
                    title="Buscar"
                    style={{
                        width: 38, height: 38, borderRadius: 10, border: 'none',
                        background: 'var(--clr-bg-hover, #f3f4f6)',
                        color: 'var(--clr-text-muted, #6b7280)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.15s',
                    }}
                >
                    <Search size={17} />
                </button>
            )}

            {/* Notifications */}
            <button
                title="Notificaciones"
                style={{
                    position: 'relative',
                    width: 38, height: 38, borderRadius: 10, border: 'none',
                    background: 'var(--clr-bg-hover, #f3f4f6)',
                    color: 'var(--clr-text-muted, #6b7280)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.15s',
                }}
            >
                <Bell size={17} />
                {/* Badge */}
                <span style={{
                    position: 'absolute', top: 7, right: 7,
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--clr-danger, #ef4444)',
                    border: '1.5px solid var(--bg-card, #fff)',
                }} />
            </button>
        </header>
    );
}
