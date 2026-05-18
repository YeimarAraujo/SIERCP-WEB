'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/stores/theme-store';

export default function ThemeInitializer() {
    const theme = useThemeStore((state) => state.theme);

    useEffect(() => {
        if (typeof document === 'undefined') return;

        document.documentElement.classList.toggle('dark', theme === 'dark');
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    return null;
}
