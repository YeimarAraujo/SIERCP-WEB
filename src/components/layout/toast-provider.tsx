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
                    background: '#FFFFFF',
                    color: '#0F172A',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    fontSize: '14px',
                    fontWeight: 500,
                    border: '1px solid #E2E8F0',
                },
                success: {
                    iconTheme: { primary: '#10B981', secondary: '#FFFFFF' },
                },
                error: {
                    iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' },
                },
            }}
        />
    );
}
