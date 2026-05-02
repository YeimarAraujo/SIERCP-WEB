'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { SessionService, CourseService } from '@/services/firestore.service';
import type { SessionModel } from '@/models/session';
import type { CourseModel } from '@/models/course';
import {
    Home, BookOpen, Clock, Activity, User,
    Bell, Search, ChevronDown,
    TrendingUp, Zap, Ruler,
    ChevronRight, ArrowUpRight,
    Circle, Play, Battery
} from 'lucide-react';



export default function HomePage() {
    const { user, isAdmin, isInstructor, initialized } = useAuth();
    const router = useRouter();
    const [showPasswordMenu, setShowPasswordMenu] = useState(false);
    const [sessions, setSessions] = useState<SessionModel[]>([]);
    const [courses, setCourses] = useState<CourseModel[]>([]);
    const [loading, setLoading] = useState(true);

    // Role-based redirect
    useEffect(() => {
        if (!initialized || !user) return;
        if (user.role === 'ADMIN') {
            router.replace('/admin/users');
        } else if (user.role === 'INSTRUCTOR') {
            router.replace('/courses');
        }
    }, [initialized, user, router]);

    // Fetch real data from Firebase
    useEffect(() => {
        if (!user) return;
        
        const fetchData = async () => {
            try {
                const [sessionsData, coursesData] = await Promise.all([
                    SessionService.getByStudent(user.uid, 20),
                    CourseService.getAll(),
                ]);
                setSessions(sessionsData);
                setCourses(coursesData);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const stats = {
        totalSessions: user?.stats?.totalSessions ?? sessions.length,
        averageScore: user?.stats?.averageScore ?? 
            (sessions.length > 0 
                ? Math.round(sessions.reduce((acc, s) => acc + (s.metrics?.score ?? 0), 0) / sessions.length) 
                : 0),
        avgDepth: user?.stats?.averageDepthMm ?? 0,
        avgRate: user?.stats?.averageRatePerMin ?? 0,
        deviceBattery: 87,
        deviceConnected: true,
    };

    const getInitials = () => {
        if (!user) return 'U';
        return ((user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '')).toUpperCase();
    };

    const formatDate = (d: Date) => {
        return d.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatSessionDate = (d: Date) => {
        return d.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' }).toUpperCase();
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const getScoreColor = (score: number) => {
        if (score >= 85) return { bg: 'rgba(16,185,129,0.15)', color: '#10B981', border: 'rgba(16,185,129,0.3)' };
        if (score >= 70) return { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: 'rgba(245,158,11,0.3)' };
        return { bg: 'rgba(239,68,68,0.15)', color: '#EF4444', border: 'rgba(239,68,68,0.3)' };
    };

    return (
        <div className="dashboard-page">
            {/* TOP BAR - 3-zone layout */}
            <header 
                className="fixed top-0 left-0 right-0 z-50 h-[60px] flex items-center justify-between px-4 md:px-7"
                style={{ 
                    background: 'rgba(14, 0, 128, 0.75)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(199, 210, 254, 0.1)'
                }}
            >
                {/* LEFT - Logo */}
                <div className="flex items-center min-w-[100px]">
                    <img src="/images/logov3.png" alt="SIERCP" className="h-8 w-auto" />
                </div>

                {/* CENTER - Nav items inline */}
                <nav className="hidden md:flex items-center gap-0.5">
                    {[
                        { icon: Home, label: 'Inicio', active: true },
                        { icon: BookOpen, label: 'Cursos', href: '/courses' },
                        { icon: Clock, label: 'Historial', href: '/history' },
                        { icon: Activity, label: 'Maniquí', href: '/device' },
                        { icon: User, label: 'Perfil', href: '/profile' },
                    ].map((item) => (
                        <a
                            key={item.label}
                            href={item.href ?? '#'}
                            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg border-none ${item.active ? 'active' : ''}`}
                            style={{ 
                                background: item.active ? 'rgba(24, 0, 173, 0.55)' : 'transparent',
                                color: item.active ? '#FFFFFF' : '#6B7FCC',
                                fontSize: '11px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                letterSpacing: '0.02em',
                                boxShadow: item.active ? '0 0 12px rgba(24, 0, 173, 0.35), 0 0 0 1px rgba(199, 210, 254, 0.12) inset' : 'none'
                            }}
                        >
                            <item.icon className="w-5 h-5" style={{ flexShrink: 0 }} />
                            <span>{item.label}</span>
                        </a>
                    ))}
                </nav>

                {/* RIGHT - Search + Bell + Avatar */}
                <div className="flex items-center gap-3 min-w-[100px] justify-end">
                    {/* Search bar */}
                    <div 
                        className="hidden md:flex items-center gap-2 px-3.5"
                        style={{ 
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(199,210,254,0.12)',
                            height: '34px',
                            borderRadius: '999px',
                            color: '#6B7FCC',
                            fontSize: '12px',
                            width: '160px'
                        }}
                    >
                        <Search className="w-4 h-4" />
                        <span>Buscar...</span>
                    </div>
                    
                    <button className="relative p-1.5" style={{ color: '#6B7FCC' }}>
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full" style={{ background: '#38BDF8', border: '1.5px solid #0E0080' }} />
                    </button>
                    
                    <div className="relative flex items-center gap-1.5 cursor-pointer">
                        <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                            style={{ background: '#1800AD', color: '#FFFFFF', border: '2px solid rgba(199,210,254,0.2)' }}
                        >
                            {getInitials()}
                        </div>
                        <ChevronDown className="w-4 h-4 hidden md:block" style={{ color: '#6B7FCC' }} />
                    </div>
                </div>
            </header>

            {/* PAGE CONTENT */}
            <div className="pt-[76px]" style={{ paddingBottom: '100px' }}>
                {/* HERO WELCOME CARD */}
                <div 
                    className="float-3 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row gap-8 md:gap-12"
                    style={{ 
                        background: 'linear-gradient(135deg, #1C1070 0%, #1A0090 60%, #200098 100%)',
                        border: '1px solid rgba(199, 210, 254, 0.12)',
                        marginBottom: '24px'
                    }}
                >
                    {/* LEFT */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-3 h-3" style={{ color: '#38BDF8' }} />
                            <span className="text-xs uppercase tracking-widest" style={{ color: '#38BDF8' }}>SIERCP Platform</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ lineHeight: 1.2 }}>
                            Bienvenido, {user?.firstName ?? 'Usuario'}
                        </h1>
                        <p className="text-sm mt-1.5" style={{ color: '#6B7FCC' }}>
                            {formatDate(new Date())}
                        </p>
                        <p className="text-base mt-3" style={{ color: '#A5B4FC' }}>
                            Tu puntaje promedio esta semana es {stats.averageScore}%. Sigue entrenando.
                        </p>
                        
                        <button 
                            className="mt-7 flex items-center gap-2 px-6 h-11 rounded-xl font-semibold"
                            style={{ background: '#FFFFFF', color: '#0E0080' }}
                        >
                            <Play className="w-4 h-4 fill-current" />
                            <span className="text-sm">Iniciar entrenamiento</span>
                        </button>

                        <div className="flex gap-3 mt-5 flex-wrap">
                            <span 
                                className="px-3 py-1.5 rounded-full text-xs"
                                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(199,210,254,0.15)', color: '#A5B4FC' }}
                            >
                                {stats.totalSessions} sesiones
                            </span>
                            <span 
                                className="px-3 py-1.5 rounded-full text-xs"
                                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(199,210,254,0.15)', color: '#A5B4FC' }}
                            >
                                {stats.averageScore}% promedio
                            </span>
                            <span 
                                className="px-3 py-1.5 rounded-full text-xs"
                                style={{ color: '#10B981' }}
                            >
                                Dispositivo activo
                            </span>
                        </div>
                    </div>

                    {/* RIGHT - Illustration */}
                    <div className="hidden md:flex items-center justify-center flex-1">
                        <img 
                            src="/images/vector-login.png" 
                            alt="SIERCP" 
                            className="max-w-xs opacity-80"
                        />
                    </div>
                </div>

                {/* STATS ROW */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { icon: Activity, label: 'SESIONES TOTALES', value: stats.totalSessions, trend: '+3 esta semana', trendColor: '#10B981' },
                        { icon: TrendingUp, label: 'PUNTAJE PROMEDIO', value: `${stats.averageScore}%`, trend: '+2.1% esta semana', trendColor: '#10B981' },
                        { icon: Ruler, label: 'PROFUNDIDAD PROM.', value: `${stats.avgDepth} mm`, badge: 'Rango AHA', badgeColor: '#10B981' },
                        { icon: Zap, label: 'FRECUENCIA PROM.', value: `${stats.avgRate}/min`, badge: 'Rango AHA', badgeColor: '#10B981' },
                    ].map((stat, i) => (
                        <div 
                            key={i} 
                            className="float-1 rounded-2xl p-5"
                            style={{ background: '#1C1070', border: '1px solid rgba(199, 210, 254, 0.1)' }}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <stat.icon className="w-5 h-5" style={{ color: '#A5B4FC' }} />
                                {stat.trend && (
                                    <span className="text-xs" style={{ color: stat.trendColor }}>{stat.trend}</span>
                                )}
                                {stat.badge && (
                                    <span 
                                        className="text-xs px-2 py-0.5 rounded-full"
                                        style={{ background: 'rgba(16,185,129,0.1)', color: stat.badgeColor }}
                                    >
                                        {stat.badge}
                                    </span>
                                )}
                            </div>
                            <p className="text-3xl font-bold text-white font-mono">{stat.value}</p>
                            <p className="text-xs uppercase mt-1" style={{ color: '#6B7FCC' }}>{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* MAIN CONTENT GRID */}
                <div className="grid md:grid-cols-5 gap-5">
                    {/* LEFT COLUMN - 3fr */}
                    <div className="md:col-span-3 space-y-5">
                        {/* Score trend card */}
                        <div 
                            className="float-2 rounded-2xl p-7"
                            style={{ background: '#1C1070', border: '1px solid rgba(199, 210, 254, 0.1)' }}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-base font-semibold text-white">Progresión de puntajes</h3>
                                <span className="text-xs" style={{ color: '#6B7FCC' }}>Últimas 10 sesiones</span>
                            </div>
                            
                            {/* Chart with real data */}
                            <div className="h-48 flex items-end justify-between gap-2 px-2">
                                {loading ? (
                                    <div className="flex items-center justify-center w-full">
                                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                    </div>
                                ) : (
                                    sessions.slice(0, 10).reverse().map((session, i) => {
                                        const score = session.metrics?.score ?? 0;
                                        return (
                                            <div key={session.id} className="flex-1 flex flex-col items-center gap-2">
                                                <div 
                                                    className="w-full rounded-t-md"
                                                    style={{ 
                                                        height: `${score}%`, 
                                                        background: score >= 80 ? '#38BDF8' : score >= 70 ? '#F59E0B' : '#EF4444',
                                                        opacity: 0.8
                                                    }}
                                                />
                                                <span className="text-xs" style={{ color: '#6B7FCC' }}>S{i + 1}</span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            
                            {/* Reference line - fake visual */}
                            <div className="relative mt-4 h-px" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                <span className="absolute -top-3 left-0 text-xs" style={{ color: '#6B7FCC' }}>Mínimo (80%)</span>
                            </div>

                            {/* Footer chips */}
                            <div className="flex gap-3 mt-6 flex-wrap">
                                <span 
                                    className="px-3 py-1.5 rounded-full text-xs flex items-center gap-1"
                                    style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}
                                >
                                    <ArrowUpRight className="w-3 h-3" />
                                    Mejor sesión: 97%
                                </span>
                                <span 
                                    className="px-3 py-1.5 rounded-full text-xs flex items-center gap-1"
                                    style={{ background: 'rgba(56,189,248,0.15)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.3)' }}
                                >
                                    <TrendingUp className="w-3 h-3" />
                                    Tendencia: Mejorando
                                </span>
                            </div>
                        </div>

                        {/* Recent sessions card */}
                        <div 
                            className="float-2 rounded-2xl p-7"
                            style={{ background: '#1C1070', border: '1px solid rgba(199, 210, 254, 0.1)' }}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-base font-semibold text-white">Sesiones recientes</h3>
                                <a href="/history" className="text-sm flex items-center gap-1" style={{ color: '#38BDF8' }}>
                                    Ver todas <ChevronRight className="w-4 h-4" />
                                </a>
                            </div>

                            <div className="space-y-0">
                                {loading ? (
                                    [...Array(4)].map((_, i) => (
                                        <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                                    ))
                                ) : sessions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No hay sesiones recientes. ¡Inicia tu primera sesión!
                                    </p>
                                ) : (
                                    sessions.slice(0, 4).map((session) => (
                                        <div 
                                            key={session.id}
                                            className="flex items-center py-3 border-b"
                                            style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                                        >
                                            <span 
                                                className="text-xs uppercase px-2 py-1 rounded"
                                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(199,210,254,0.12)', color: '#6B7FCC' }}
                                            >
                                                {formatSessionDate(session.startedAt)}
                                            </span>
                                            <div className="flex-1 ml-4">
                                                <p className="text-sm font-semibold text-white">{session.scenarioTitle ?? 'Sesión RCP'}</p>
                                                <p className="text-xs" style={{ color: '#6B7FCC', marginTop: '2px' }}>{formatDuration(session.duration)}</p>
                                            </div>
                                            <span 
                                                className="text-sm font-bold px-2 py-1 rounded-lg"
                                                style={{ 
                                                    background: getScoreColor(session.metrics?.score ?? 0).bg, 
                                                    color: getScoreColor(session.metrics?.score ?? 0).color,
                                                    border: `1px solid ${getScoreColor(session.metrics?.score ?? 0).border}`
                                                }}
                                            >
                                                {session.metrics?.score ?? 0}%
                                            </span>
                                            <ChevronRight className="w-4 h-4 ml-3" style={{ color: '#6B7FCC' }} />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - 2fr */}
                    <div className="md:col-span-2 space-y-5">
                        {/* Device card */}
                        <div 
                            className="float-2 rounded-2xl p-6"
                            style={{ background: '#1C1070', border: '1px solid rgba(199, 210, 254, 0.1)' }}
                        >
                            <h3 className="text-base font-semibold text-white mb-4">Maniquí activo</h3>
                            
                            <div className="text-center py-4">
                                <div 
                                    className="w-3 h-3 rounded-full mx-auto"
                                    style={{ 
                                        background: '#10B981',
                                        boxShadow: '0 0 0 4px rgba(16,185,129,0.15), 0 0 0 8px rgba(16,185,129,0.07)'
                                    }}
                                />
                                <p className="text-xl font-bold text-white mt-3 font-mono">SIERCP-01</p>
                                <p className="text-sm" style={{ color: '#10B981', marginTop: '4px' }}>Conectado · Señal fuerte</p>
                            </div>

                            <div className="space-y-2 mt-4">
                                <div className="flex justify-between text-sm">
                                    <span style={{ color: '#A5B4FC' }}><Battery className="w-4 h-4 inline mr-1" />{stats.deviceBattery}%</span>
                                    <span style={{ color: '#A5B4FC' }}>Sincronizado hace 2 min</span>
                                </div>
                            </div>

                            <button 
                                className="w-full h-11 rounded-xl font-semibold text-sm mt-4 flex items-center justify-center gap-2"
                                style={{ 
                                    background: '#1800AD', 
                                    color: '#FFFFFF',
                                    boxShadow: '0 4px 16px rgba(24,0,173,0.4)'
                                }}
                            >
                                <Play className="w-4 h-4 fill-current" />
                                Iniciar entrenamiento
                            </button>
                        </div>

                        {/* Courses card */}
                        <div 
                            className="float-2 rounded-2xl p-6"
                            style={{ background: '#1C1070', border: '1px solid rgba(199, 210, 254, 0.1)' }}
                        >
                            <h3 className="text-base font-semibold text-white mb-4">Cursos activos</h3>
                            
                            <div className="space-y-4">
                                {loading ? (
                                    [...Array(3)].map((_, i) => (
                                        <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
                                    ))
                                ) : courses.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No hay cursos disponibles.</p>
                                ) : (
                                    courses.slice(0, 3).map((course) => (
                                        <div key={course.id}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-white font-medium">{course.title}</span>
                                                <span style={{ color: '#A5B4FC' }}>{course.studentCount} estudiantes</span>
                                            </div>
                                            <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                                                <div 
                                                    className="h-1 rounded-full"
                                                    style={{ 
                                                        width: `${course.studentCount > 0 ? Math.min(100, (course.studentCount / 20) * 100) : 0}%`, 
                                                        background: '#38BDF8'
                                                    }}
                                                />
                                            </div>
                                            <a href={`/courses/${course.id}`} className="text-xs mt-1 inline-flex items-center gap-1" style={{ color: '#38BDF8' }}>
                                                Ver curso <ChevronRight className="w-3 h-3" />
                                            </a>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* AHA compliance card */}
                        <div 
                            className="float-1 rounded-2xl p-5"
                            style={{ background: '#1C1070', border: '1px solid rgba(199, 210, 254, 0.1)' }}
                        >
                            <h3 className="text-sm font-semibold text-white mb-3">Cumplimiento AHA</h3>
                            
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span style={{ color: '#A5B4FC' }}>Profundidad</span>
                                    <span style={{ color: '#10B981' }}>91%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: '#A5B4FC' }}>Frecuencia</span>
                                    <span style={{ color: '#10B981' }}>87%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: '#A5B4FC' }}>Recoil completo</span>
                                    <span style={{ color: '#F59E0B' }}>73%</span>
                                </div>
                            </div>
                            
                            <p className="text-xs mt-3" style={{ color: '#6B7FCC' }}>Basado en últimas 12 sesiones</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}