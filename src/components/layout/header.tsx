'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getUserInitials, getFullName } from '@/models/user';
import { useRouter } from 'next/navigation';
import { Bell, Mail, Search, Sun, Moon, ChevronDown } from 'lucide-react';

interface HeaderProps {
    title?: string;
    role?: 'ADMIN' | 'INSTRUCTOR' | 'SUPER_ADMIN';
}

export function Header({ title, role }: HeaderProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    const fullName = user ? getFullName(user) : 'Usuario';
    const initials = user ? getUserInitials(user) : 'U';
    const roleLabel = role === 'ADMIN' ? 'Administrador' : role === 'INSTRUCTOR' ? 'Instructor' : role === 'SUPER_ADMIN' ? 'Super Admin' : '';

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
        if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark');
        }
    };

    return (
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 bg-background/80 backdrop-blur-md border-b border-border/30 shadow-sm">
            {/* ───────── LEFT SIDE ───────── */}
            <div className="flex items-center gap-4">
                <img 
                    src="/images/logov3.png" 
                    alt="SIERCP" 
                    className="h-8 w-auto dark:brightness-0 dark:invert" 
                />
                
                <div 
                    className="flex items-center gap-2 bg-muted hover:bg-muted/80 rounded-full px-3 py-1.5 cursor-pointer transition-colors"
                    onClick={() => {}}
                >
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                        {initials}
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-sm font-semibold text-foreground leading-tight">{fullName}</span>
                        <span className="text-xs text-muted-foreground">{roleLabel}</span>
                    </div>
                    <ChevronDown size={14} className="text-muted-foreground" />
                </div>
            </div>

            {/* ───────── RIGHT SIDE ───────── */}
            <div className="flex items-center gap-4">
                {/* Search bar */}
                <div className="flex items-center gap-2 bg-muted rounded-full px-3 py-1.5 w-56 hidden md:flex">
                    <Search size={16} className="text-muted-foreground shrink-0" />
                    <input 
                        placeholder="Buscar sesión, estudiante..." 
                        className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
                    />
                </div>

                {/* Theme toggle */}
                <button
                    onClick={toggleTheme}
                    className="w-10 h-6 rounded-full relative bg-muted hover:bg-muted-foreground/20 transition-colors flex items-center justify-center"
                    suppressHydrationWarning
                >
                    {theme === 'dark' ? (
                        <Moon size={14} className="text-muted-foreground" />
                    ) : (
                        <Sun size={14} className="text-muted-foreground" />
                    )}
                </button>

                {/* Notifications */}
                <button className="relative">
                    <Bell size={20} className="text-muted-foreground hover:text-foreground transition-colors" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center">
                        4
                    </span>
                </button>

                {/* Email */}
                <button className="relative">
                    <Mail size={20} className="text-muted-foreground hover:text-foreground transition-colors" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                        1
                    </span>
                </button>

                {/* Role switcher - ONLY for INSTRUCTOR */}
                {role === 'INSTRUCTOR' && (
                    <div className="flex bg-muted rounded-full p-1 border border-border/30">
                        <button className="bg-card text-blue-600 font-semibold rounded-full px-3 py-1 text-sm shadow-sm">
                            Instructor
                        </button>
                        <button 
                            onClick={() => router.push('/student/home')}
                            className="text-muted-foreground text-sm px-3 py-1 rounded-full hover:bg-muted/50 transition-colors"
                        >
                            Estudiante
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}