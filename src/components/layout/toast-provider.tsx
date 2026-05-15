'use client';

import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                duration: 3000,
                style: {
                    borderRadius: '12px',
                    background: 'var(--card)',
                    color: 'var(--foreground)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    fontSize: '14px',
                    fontWeight: 500,
                    border: '1px solid var(--border)',
                },
                success: {
                    iconTheme: { primary: '#10B981', secondary: 'var(--text-on-brand)' },
                },
                error: {
                    iconTheme: { primary: '#EF4444', secondary: 'var(--text-on-brand)' },
                },
            }}
        />
    );
}
