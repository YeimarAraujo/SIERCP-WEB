'use client';

import { useEffect, useRef, useState } from 'react';
import lottie from 'lottie-web';
import { useThemeStore } from '@/stores/theme-store';

// Animaciones Lottie (vectoriales, transparentes) que se componen sobre el
// fondo del tema. `loop_carga_sicap` (logo a color) para tema claro y
// `loop_carga_white_sicap` (logo blanco) para tema oscuro.
const PATH_LIGHT = '/assets/Animation/loop_carga_sicap.json';
const PATH_DARK = '/assets/Animation/loop_carga_white_sicap.json';

interface VideoLoaderProps {
    /** Cubre toda la ventana (pantalla de carga de ruta). Por defecto se centra en 60vh. */
    fullScreen?: boolean;
    /** Ancho máximo de la animación en píxeles. */
    size?: number;
    /** Texto opcional bajo la animación. */
    label?: string;
    /** Altura mínima del contenedor. Útil para cargas parciales dentro de una card/tabla. */
    minHeight?: number | string;
}

export default function VideoLoader({ fullScreen = false, size = 220, label, minHeight }: VideoLoaderProps) {
    const theme = useThemeStore((state) => state.theme);
    const [mounted, setMounted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Evita el desajuste de hidratación: el tema persistido solo está disponible en el cliente.
    useEffect(() => setMounted(true), []);

    useEffect(() => {
        const container = containerRef.current;
        if (!mounted || !container) return;

        const anim = lottie.loadAnimation({
            container,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: theme === 'light' ? PATH_LIGHT : PATH_DARK,
        });

        return () => anim.destroy();
    }, [mounted, theme]);

    const resolvedMinHeight = minHeight ?? (fullScreen ? '100vh' : '60vh');

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                minHeight: resolvedMinHeight,
                width: '100%',
                background: fullScreen ? 'var(--background)' : 'transparent',
            }}
        >
            <div
                ref={containerRef}
                role="status"
                aria-label="Cargando"
                style={{ width: '100%', maxWidth: size, aspectRatio: '16 / 9' }}
            />
            {label && (
                <span style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>{label}</span>
            )}
        </div>
    );
}
