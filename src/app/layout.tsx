import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ThemeInitializer from '@/components/theme-initializer';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './landing.css';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'SIERCP — Sistema de Entrenamiento RCP',
    description: 'Plataforma web para evaluación y retroalimentación de RCP basada en guías AHA 2020/2025',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
                <ThemeInitializer />
                {children}
            </body>
        </html>
    );
}
