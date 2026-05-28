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
                set({ theme: next });
            },
        }),
        { name: 'siercp-theme' }
    )
);