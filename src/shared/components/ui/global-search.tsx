'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, Users, Monitor, BookOpen, Loader2, ChevronRight, User } from 'lucide-react';
import Link from 'next/link';
import { SearchService } from '@/shared/lib/firestore.service';
import { useAuth } from '@/shared/hooks/use-auth';

export function GlobalSearch({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const { user } = useAuth();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!user || query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await SearchService.globalSearch(user.uid, query);
                setResults(data);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, user]);

    if (!isOpen) return null;

    const getIcon = (type: string) => {
        switch(type) {
            case 'Curso': return BookOpen;
            case 'Estudiante': return User;
            default: return FileText;
        }
    };

    return (
        <div style={{ 
            position: 'fixed', inset: 0, zIndex: 9999, 
            background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'center', padding: '100px 20px'
        }} onClick={onClose}>
            <div 
                style={{ 
                    width: '100%', maxWidth: 650, background: '#FFFFFF', borderRadius: 24, 
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column', height: 'fit-content', maxHeight: '80vh'
                }} 
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #F1F5F9' }}>
                    <Search size={22} style={{ color: '#1800AD' }} />
                    <input 
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Buscar alumnos, cursos, reportes o herramientas..." 
                        style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, padding: '0 16px', fontWeight: 500, color: '#0F172A' }}
                    />
                    {query && (
                        <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>
                    )}
                    <div style={{ marginLeft: 16, padding: '4px 8px', borderRadius: 6, background: '#F1F5F9', fontSize: 10, fontWeight: 700, color: '#64748B' }}>ESC</div>
                </div>

                {/* Results Section */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
                    {loading ? (
                        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                            <Loader2 size={32} style={{ color: '#1800AD', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
                            <p style={{ color: '#64748B', fontSize: 14, marginTop: 12 }}>Buscando en el ecosistema...</p>
                            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                        </div>
                    ) : query.length < 2 ? (
                        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                            <Search size={40} style={{ color: '#E2E8F0', marginBottom: 12, margin: '0 auto' }} />
                            <p style={{ color: '#64748B', fontSize: 14 }}>Escribe al menos 2 caracteres para buscar en el ecosistema SIERCP</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                            <p style={{ color: '#64748B', fontSize: 14 }}>No se encontraron resultados para "{query}"</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: 4 }}>
                            {results.map((res, i) => {
                                const Icon = getIcon(res.type);
                                return (
                                    <Link 
                                        key={i} 
                                        href={res.href} 
                                        onClick={onClose}
                                        style={{ 
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                            padding: '12px 24px', textDecoration: 'none', transition: 'background 0.2s'
                                        }}
                                        className="search-result-item"
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F8FAFC', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1800AD' }}>
                                                <Icon size={20} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>{res.title}</div>
                                                <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>{res.type}</div>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} style={{ color: '#E2E8F0' }} />
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ background: '#F8FAFC', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94A3B8' }}>
                            <span style={{ padding: '2px 6px', borderRadius: 4, background: '#FFFFFF', border: '1px solid #E2E8F0', fontWeight: 700 }}>↑↓</span> Navegar
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94A3B8' }}>
                            <span style={{ padding: '2px 6px', borderRadius: 4, background: '#FFFFFF', border: '1px solid #E2E8F0', fontWeight: 700 }}>↵</span> Seleccionar
                        </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1800AD' }}>SIERCP Smart Search</div>
                </div>
            </div>
            <style jsx>{`
                .search-result-item:hover {
                    background: #F8FAFC;
                }
                .search-result-item:hover :last-child {
                    color: #1800AD !important;
                }
            `}</style>
        </div>
    );
}
