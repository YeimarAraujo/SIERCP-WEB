'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeStore {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>()(
    persist(
        (set, get) => ({
            theme: 'dark',
            toggleTheme: () => {
                const next = get().theme === 'dark' ? 'light' : 'dark';
                if (typeof document !== 'undefined') {
                    document.documentElement.classList.toggle('dark', next === 'dark');
                }
                set({ theme: next });
            },
        }),
        { name: 'siercp-theme' }
    )
);
