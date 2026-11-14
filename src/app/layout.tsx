import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import ThemeInitializer from '@/components/theme-initializer';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './landing.css';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], display: 'swap', variable: '--font-outfit', preload: false });

export const metadata: Metadata = {
    icons: {
        icon: "/assets/images/SICAP/webp/logo.webp",
    },
    title: 'SICAP - Sistema Inteligente de Capacitaciones',
    description: 'Sistema de Entrenamiento de Primeros Auxilios',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning data-scroll-behavior="smooth">
            <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
                <ThemeInitializer />
                {children}
            </body>
        </html>
    );
}
