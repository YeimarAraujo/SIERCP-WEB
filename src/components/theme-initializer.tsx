'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/stores/theme-store';

export default function ThemeInitializer() {
    const theme = useThemeStore((state) => state.theme);

    useEffect(() => {
        // Al cargar la app, aplicamos la clase correspondiente al documentElement
        if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', theme === 'dark');
            // También podemos enviar este estado a otros sistemas si fuera necesario
            console.log(`[THEME] Aplicando modo: ${theme}`);
        }
    }, [theme]);

    return null;
}
