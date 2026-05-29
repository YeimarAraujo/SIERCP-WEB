'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    collection, doc, updateDoc, deleteDoc, addDoc, onSnapshot,
    query, orderBy, serverTimestamp, writeBatch,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import {
    BookMarked, Plus, Search, Pencil, Trash2, Eye, EyeOff, X,
    DollarSign, Clock, ChevronDown, ChevronUp, Layers,
    Calendar, Download,
} from 'lucide-react';
import { cursos as cursosEstaticos } from '@/data/cursos';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Grupo {
    id: string;
    horario: 'mañana' | 'tarde';
    horarioLabel: string;
    inscripcionInicio: string;
    inscripcionFin: string;
    inicioClases: string;
    maxEstudiantes: number;
    inscritos: number;
    estado: 'proximo' | 'abierto' | 'agotado' | 'en_curso' | 'finalizado';
}

interface Modulo {
    nombre: string;
    temas: string[];
    duracion: string;
}

interface JomarCurso {
    id: string;
    slug: string;
    nombre: string;
    descripcion: string;
    descripcionLarga: string;
    nivel: 'basico' | 'intermedio' | 'avanzado';
    modalidad: 'presencial' | 'virtual' | 'hibrida';
    duracion: string;
    sesiones: number;
    precioCOP: number;
    precioUSD: number;
    objetivos: string[];
    requisitos: string[];
    incluyeCertificado: boolean;
    normativa: string[];
    tags: string[];
    icono: string;
    paraQuien: string;
    grupos: Grupo[];
    modulos: Modulo[];
    isPublished: boolean;
    createdAt?: { toDate?: () => Date };
}

const EMPTY_CURSO: Omit<JomarCurso, 'id' | 'createdAt'> = {
    slug: '', nombre: '', descripcion: '', descripcionLarga: '',
    nivel: 'basico', modalidad: 'presencial', duracion: '8 horas', sesiones: 1,
    precioCOP: 0, precioUSD: 0,
    objetivos: [], requisitos: [], incluyeCertificado: true,
    normativa: [], tags: [], icono: 'bi-heart-pulse', paraQuien: '',
    grupos: [], modulos: [], isPublished: false,
};

const LEVEL_META: Record<JomarCurso['nivel'], { label: string; color: string }> = {
    basico: { label: 'Básico', color: '#10b981' },
    intermedio: { label: 'Intermedio', color: '#f59e0b' },
    avanzado: { label: 'Avanzado', color: '#ef4444' },
};

const ESTADO_META: Record<Grupo['estado'], { label: string; color: string }> = {
    proximo: { label: 'Próximo', color: '#6366f1' },
    abierto: { label: 'Abierto', color: '#10b981' },
    agotado: { label: 'Agotado', color: '#ef4444' },
    en_curso: { label: 'En curso', color: '#f59e0b' },
    finalizado: { label: 'Finalizado', color: '#64748b' },
};

function formatCOP(n: number) {
    if (n === 0) return 'Gratis';
    return `$${n.toLocaleString('es-CO')} COP`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function newGrupo(): Grupo {
    const now = new Date();
    const inicio = new Date(now);
    inicio.setDate(inicio.getDate() + 7);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 21);
    const clases = new Date(fin);
    clases.setDate(clases.getDate() + 1);
    return {
        id: `grp-${Date.now()}`,
        horario: 'mañana', horarioLabel: '7:00 AM - 6:00 PM',
        inscripcionInicio: inicio.toISOString().split('T')[0],
        inscripcionFin: fin.toISOString().split('T')[0],
        inicioClases: clases.toISOString().split('T')[0],
        maxEstudiantes: 20, inscritos: 0, estado: 'proximo',
    };
}

function autoSlug(name: string, existingSlugs: string[] = []): string {
    const base = name
        .toLowerCase()
        .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e').replace(/[íìïî]/g, 'i')
        .replace(/[óòöô]/g, 'o').replace(/[úùüû]/g, 'u').replace(/[ñ]/g, 'n')
        .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
        .trim();
    
    if (!existingSlugs.includes(base)) return base;
    
    let counter = 2;
    while (existingSlugs.includes(`${base}-${counter}`)) {
        counter++;
    }
    return `${base}-${counter}`;
}

function newModulo(): Modulo {
    return { nombre: '', temas: [''], duracion: '2 horas' };
}

// ── Shared input style ────────────────────────────────────────────────────────

const inputSt: React.CSSProperties = {
    height: 36, padding: '0 10px', borderRadius: 9,
    border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
    color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, width: '100%', outline: 'none',
};
const labelSt: React.CSSProperties = { fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' };
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: 'var(--brand)', color: '#fff', border: 'none', cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer' };
const btnIcon: React.CSSProperties = { width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface-2)', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' };

// ── Section collapsible ───────────────────────────────────────────────────────

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <button type="button" onClick={() => setOpen(v => !v)}
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-surface-2)', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: 12, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
                {open ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
            </button>
            {open && <div style={{ padding: '14px 14px', display: 'grid', gap: 12 }}>{children}</div>}
        </div>
    );
}

// ── Chips input (for string arrays) ──────────────────────────────────────────

function ChipsInput({ label, values, onChange }: { label: string; values: string[]; onChange: (v: string[]) => void }) {
    const [input, setInput] = useState('');
    const add = () => {
        const v = input.trim();
        if (!v || values.includes(v)) return;
        onChange([...values, v]);
        setInput('');
    };
    return (
        <div>
            <label style={labelSt}>{label}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6, marginBottom: 6 }}>
                {values.map((v, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-primary)' }}>
                        {v}
                        <button type="button" onClick={() => onChange(values.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 0, lineHeight: 1 }}><X size={11} /></button>
                    </span>
                ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())} placeholder={`Agregar ${label.toLowerCase()}…`} style={{ ...inputSt, flex: 1 }} />
                <button type="button" onClick={add} style={{ ...btnPrimary, padding: '0 12px', height: 36 }}><Plus size={13} /></button>
            </div>
        </div>
    );
}

// ── Grupos editor ─────────────────────────────────────────────────────────────

function GruposEditor({ grupos, onChange }: { grupos: Grupo[]; onChange: (g: Grupo[]) => void }) {
    const update = (i: number, patch: Partial<Grupo>) =>
        onChange(grupos.map((g, idx) => idx === i ? { ...g, ...patch } : g));
    const remove = (i: number) => onChange(grupos.filter((_, idx) => idx !== i));

    return (
        <div style={{ display: 'grid', gap: 10 }}>
            {grupos.map((g, i) => (
                <div key={g.id} style={{ padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface-2)', display: 'grid', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>Grupo {i + 1}</span>
                        <button type="button" onClick={() => remove(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><X size={14} /></button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div>
                            <label style={labelSt}>Horario</label>
                            <select value={g.horario} onChange={e => update(i, { horario: e.target.value as Grupo['horario'] })} style={{ ...inputSt, marginTop: 4 }}>
                                <option value="mañana">Mañana</option>
                                <option value="tarde">Tarde</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelSt}>Etiqueta horario</label>
                            <input value={g.horarioLabel} onChange={e => update(i, { horarioLabel: e.target.value })} style={{ ...inputSt, marginTop: 4 }} placeholder="7:00 AM - 6:00 PM" />
                        </div>
                        <div>
                            <label style={labelSt}>Inscripción inicio</label>
                            <input type="date" value={g.inscripcionInicio} onChange={e => update(i, { inscripcionInicio: e.target.value })} style={{ ...inputSt, marginTop: 4 }} />
                        </div>
                        <div>
                            <label style={labelSt}>Inscripción fin</label>
                            <input type="date" value={g.inscripcionFin} onChange={e => update(i, { inscripcionFin: e.target.value })} style={{ ...inputSt, marginTop: 4 }} />
                        </div>
                        <div>
                            <label style={labelSt}>Inicio clases</label>
                            <input type="date" value={g.inicioClases} onChange={e => update(i, { inicioClases: e.target.value })} style={{ ...inputSt, marginTop: 4 }} />
                        </div>
                        <div>
                            <label style={labelSt}>Máx. estudiantes</label>
                            <input type="number" min={1} value={g.maxEstudiantes} onChange={e => update(i, { maxEstudiantes: Number(e.target.value) })} style={{ ...inputSt, marginTop: 4 }} />
                        </div>
                        <div>
                            <label style={labelSt}>Estado</label>
                            <select value={g.estado} onChange={e => update(i, { estado: e.target.value as Grupo['estado'] })} style={{ ...inputSt, marginTop: 4 }}>
                                <option value="proximo">Próximo</option>
                                <option value="abierto">Abierto</option>
                                <option value="agotado">Agotado</option>
                                <option value="en_curso">En curso</option>
                                <option value="finalizado">Finalizado</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelSt}>Inscritos actuales</label>
                            <input type="number" min={0} value={g.inscritos} onChange={e => update(i, { inscritos: Number(e.target.value) })} style={{ ...inputSt, marginTop: 4 }} />
                        </div>
                    </div>
                </div>
            ))}
            <button type="button" onClick={() => onChange([...grupos, newGrupo()])} style={{ ...btnSecondary, justifyContent: 'center', padding: '8px 0' }}>
                <Plus size={13} /> Agregar grupo
            </button>
        </div>
    );
}

// ── Módulos editor ────────────────────────────────────────────────────────────

function ModulosEditor({ modulos, onChange }: { modulos: Modulo[]; onChange: (m: Modulo[]) => void }) {
    const update = (i: number, patch: Partial<Modulo>) =>
        onChange(modulos.map((m, idx) => idx === i ? { ...m, ...patch } : m));
    const remove = (i: number) => onChange(modulos.filter((_, idx) => idx !== i));
    const updateTema = (mi: number, ti: number, val: string) => {
        const mod = { ...modulos[mi], temas: modulos[mi].temas.map((t, idx) => idx === ti ? val : t) };
        onChange(modulos.map((m, idx) => idx === mi ? mod : m));
    };
    const addTema = (mi: number) => update(mi, { temas: [...modulos[mi].temas, ''] });
    const removeTema = (mi: number, ti: number) => update(mi, { temas: modulos[mi].temas.filter((_, idx) => idx !== ti) });

    return (
        <div style={{ display: 'grid', gap: 10 }}>
            {modulos.map((m, i) => (
                <div key={i} style={{ padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface-2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>Módulo {i + 1}</span>
                        <button type="button" onClick={() => remove(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><X size={14} /></button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 8 }}>
                        <div>
                            <label style={labelSt}>Nombre módulo</label>
                            <input value={m.nombre} onChange={e => update(i, { nombre: e.target.value })} style={{ ...inputSt, marginTop: 4 }} placeholder="Ej: Fundamentos de RCP" />
                        </div>
                        <div>
                            <label style={labelSt}>Duración</label>
                            <input value={m.duracion} onChange={e => update(i, { duracion: e.target.value })} style={{ ...inputSt, marginTop: 4, width: 90 }} placeholder="2 horas" />
                        </div>
                    </div>
                    <label style={labelSt}>Temas</label>
                    <div style={{ display: 'grid', gap: 5, marginTop: 4 }}>
                        {m.temas.map((t, ti) => (
                            <div key={ti} style={{ display: 'flex', gap: 5 }}>
                                <input value={t} onChange={e => updateTema(i, ti, e.target.value)} style={{ ...inputSt, flex: 1 }} placeholder={`Tema ${ti + 1}…`} />
                                <button type="button" onClick={() => removeTema(i, ti)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0 4px' }}><X size={13} /></button>
                            </div>
                        ))}
                        <button type="button" onClick={() => addTema(i)} style={{ ...btnSecondary, padding: '5px 10px', fontSize: 12, justifyContent: 'center' }}>
                            <Plus size={11} /> Tema
                        </button>
                    </div>
                </div>
            ))}
            <button type="button" onClick={() => onChange([...modulos, newModulo()])} style={{ ...btnSecondary, justifyContent: 'center', padding: '8px 0' }}>
                <Plus size={13} /> Agregar módulo
            </button>
        </div>
    );
}

// ── Course Modal ──────────────────────────────────────────────────────────────

function CourseModal({ curso, onClose, onSaved, existingSlugs = [] }: { curso: JomarCurso | null; onClose: () => void; onSaved: () => void; existingSlugs?: string[] }) {
    const isEdit = !!curso;
    const [form, setForm] = useState<Omit<JomarCurso, 'id' | 'createdAt'>>(
        curso
            ? {
                slug: curso.slug, nombre: curso.nombre, descripcion: curso.descripcion,
                descripcionLarga: curso.descripcionLarga, nivel: curso.nivel, modalidad: curso.modalidad,
                duracion: curso.duracion, sesiones: curso.sesiones, precioCOP: curso.precioCOP,
                precioUSD: curso.precioUSD, objetivos: curso.objetivos ?? [], requisitos: curso.requisitos ?? [],
                incluyeCertificado: curso.incluyeCertificado, normativa: curso.normativa ?? [],
                tags: curso.tags ?? [], icono: curso.icono, paraQuien: curso.paraQuien,
                grupos: curso.grupos ?? [], modulos: curso.modulos ?? [], isPublished: curso.isPublished,
            }
            : { ...EMPTY_CURSO },
    );
    const [saving, setSaving] = useState(false);
    const s = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setForm(prev => ({ ...prev, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }));

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.nombre.trim()) { toast.error('El nombre es requerido'); return; }
        setSaving(true);
        try {
            const finalSlug = form.slug || autoSlug(form.nombre, existingSlugs);
            const payload = { ...form, slug: finalSlug, institutionId: 'JOMAR', updatedAt: serverTimestamp() };
            if (isEdit) {
                await updateDoc(doc(db, 'jomarCourses', curso!.id), payload);
                toast.success('Curso actualizado');
            } else {
                await addDoc(collection(db, 'jomarCourses'), { ...payload, createdAt: serverTimestamp() });
                toast.success('Curso creado');
            }
            onSaved();
            onClose();
        } catch { toast.error('Error al guardar'); }
        finally { setSaving(false); }
    };

    return (
        <>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} onClick={onClose} />
            <div style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                zIndex: 1000, width: '100%', maxWidth: 680, maxHeight: '92vh', overflowY: 'auto',
                background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 20,
                boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
            }}>
                <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-surface-2)', zIndex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{isEdit ? `Editar: ${curso!.nombre}` : 'Nuevo curso Jomar'}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
                </div>

                <form onSubmit={handleSave} style={{ padding: 20, display: 'grid', gap: 14 }}>

                    {/* ── Básico ── */}
                    <Section title="Información básica">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelSt}>Nombre *</label>
                                <input value={form.nombre} onChange={e => {
                                    const val = e.target.value;
                                    setForm(p => ({ ...p, nombre: val, slug: p.slug || autoSlug(val, existingSlugs) }));
                                }} required placeholder="Ej: RCP Básico" style={{ ...inputSt, marginTop: 4 }} />
                            </div>
                            <div>
                                <label style={labelSt}>Slug (URL) <span style={{fontSize:9, color:'var(--text-muted)'}}>(auto)</span></label>
                                <input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="rcp-basico" style={{ ...inputSt, marginTop: 4 }} />
                            </div>
                            <div>
                                <label style={labelSt}>Icono Bootstrap</label>
                                <input value={form.icono} onChange={s('icono')} placeholder="bi-heart-pulse" style={{ ...inputSt, marginTop: 4 }} />
                            </div>
                            <div>
                                <label style={labelSt}>Nivel</label>
                                <select value={form.nivel} onChange={s('nivel')} style={{ ...inputSt, marginTop: 4 }}>
                                    <option value="basico">Básico</option>
                                    <option value="intermedio">Intermedio</option>
                                    <option value="avanzado">Avanzado</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelSt}>Modalidad</label>
                                <select value={form.modalidad} onChange={s('modalidad')} style={{ ...inputSt, marginTop: 4 }}>
                                    <option value="presencial">Presencial</option>
                                    <option value="virtual">Virtual</option>
                                    <option value="hibrida">Híbrida</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelSt}>Duración</label>
                                <input value={form.duracion} onChange={s('duracion')} placeholder="8 horas" style={{ ...inputSt, marginTop: 4 }} />
                            </div>
                            <div>
                                <label style={labelSt}>N° de sesiones</label>
                                <input type="number" min={1} value={form.sesiones} onChange={s('sesiones')} style={{ ...inputSt, marginTop: 4 }} />
                            </div>
                            <div>
                                <label style={labelSt}>Precio COP</label>
                                <input type="number" min={0} value={form.precioCOP} onChange={s('precioCOP')} style={{ ...inputSt, marginTop: 4 }} />
                            </div>
                            <div>
                                <label style={labelSt}>Precio USD</label>
                                <input type="number" min={0} value={form.precioUSD} onChange={s('precioUSD')} style={{ ...inputSt, marginTop: 4 }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button type="button" onClick={() => setForm(p => ({ ...p, incluyeCertificado: !p.incluyeCertificado }))}
                                style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: form.incluyeCertificado ? '#10b981' : 'var(--border)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                                <span style={{ position: 'absolute', top: 3, left: form.incluyeCertificado ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                            </button>
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Incluye certificado</span>
                            <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />
                            <button type="button" onClick={() => setForm(p => ({ ...p, isPublished: !p.isPublished }))}
                                style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: form.isPublished ? '#10b981' : 'var(--border)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                                <span style={{ position: 'absolute', top: 3, left: form.isPublished ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                            </button>
                            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{form.isPublished ? 'Publicado' : 'Oculto'}</span>
                        </div>
                    </Section>

                    {/* ── Descripción ── */}
                    <Section title="Descripción">
                        <div>
                            <label style={labelSt}>Descripción corta</label>
                            <textarea value={form.descripcion} onChange={s('descripcion')} rows={2} placeholder="Una línea descriptiva…" style={{ ...inputSt, marginTop: 4, height: 'auto', padding: '8px 10px', resize: 'vertical' }} />
                        </div>
                        <div>
                            <label style={labelSt}>Descripción larga</label>
                            <textarea value={form.descripcionLarga} onChange={s('descripcionLarga')} rows={4} placeholder="Descripción completa para la página del curso…" style={{ ...inputSt, marginTop: 4, height: 'auto', padding: '8px 10px', resize: 'vertical' }} />
                        </div>
                        <div>
                            <label style={labelSt}>Para quién es</label>
                            <textarea value={form.paraQuien} onChange={s('paraQuien')} rows={2} placeholder="Ej: Profesionales de la salud, brigadistas…" style={{ ...inputSt, marginTop: 4, height: 'auto', padding: '8px 10px', resize: 'vertical' }} />
                        </div>
                    </Section>

                    {/* ── Objetivos / Requisitos / Normativa / Tags ── */}
                    <Section title="Objetivos y requisitos" defaultOpen={false}>
                        <ChipsInput label="Objetivos" values={form.objetivos} onChange={v => setForm(p => ({ ...p, objetivos: v }))} />
                        <ChipsInput label="Requisitos" values={form.requisitos} onChange={v => setForm(p => ({ ...p, requisitos: v }))} />
                        <ChipsInput label="Normativa" values={form.normativa} onChange={v => setForm(p => ({ ...p, normativa: v }))} />
                        <ChipsInput label="Tags" values={form.tags} onChange={v => setForm(p => ({ ...p, tags: v }))} />
                    </Section>

                    {/* ── Módulos ── */}
                    <Section title={`Módulos (${form.modulos.length})`} defaultOpen={false}>
                        <ModulosEditor modulos={form.modulos} onChange={m => setForm(p => ({ ...p, modulos: m }))} />
                    </Section>

                    {/* ── Grupos / Fechas ── */}
                    <Section title={`Grupos de inscripción (${form.grupos.length})`} defaultOpen={false}>
                        <GruposEditor grupos={form.grupos} onChange={g => setForm(p => ({ ...p, grupos: g }))} />
                    </Section>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 6, borderTop: '1px solid var(--border)' }}>
                        <button type="button" onClick={onClose} style={btnSecondary}>Cancelar</button>
                        <button type="submit" disabled={saving} style={btnPrimary}>{saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear curso'}</button>
                    </div>
                </form>
            </div>
        </>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function toJomarCurso(c: (typeof cursosEstaticos)[0]): Omit<JomarCurso, 'id'> {
    const toStr = (d: Date) => d instanceof Date ? d.toISOString().split('T')[0] : String(d);
    return {
        slug: c.slug, nombre: c.nombre, descripcion: c.descripcion,
        descripcionLarga: c.descripcionLarga, nivel: c.nivel, modalidad: c.modalidad,
        duracion: c.duracion, sesiones: c.sesiones, precioCOP: c.precioCOP,
        precioUSD: c.precioUSD, objetivos: c.objetivos, requisitos: c.requisitos,
        incluyeCertificado: c.incluyeCertificado, normativa: c.normativa,
        tags: c.tags, icono: c.icono, paraQuien: c.paraQuien,
        grupos: c.grupos.map(g => ({
            id: g.id, horario: g.horario, horarioLabel: g.horarioLabel,
            inscripcionInicio: toStr(g.inscripcionInicio),
            inscripcionFin: toStr(g.inscripcionFin),
            inicioClases: toStr(g.inicioClases),
            maxEstudiantes: g.maxEstudiantes, inscritos: g.inscritos, estado: g.estado,
        })),
        modulos: c.modulos, isPublished: true,
    };
}

export default function SuperAdminCursosJomarPage() {
    const [courses, setCourses] = useState<JomarCurso[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState<JomarCurso | 'create' | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<JomarCurso | null>(null);

    useEffect(() => {
        const unsub = onSnapshot(
            query(collection(db, 'jomarCourses'), orderBy('createdAt', 'desc')),
            snap => {
                setCourses(snap.docs.map(d => ({ id: d.id, ...EMPTY_CURSO, ...d.data() } as JomarCurso)));
                setLoading(false);
            },
            () => { toast.error('Error al cargar cursos'); setLoading(false); },
        );
        return () => unsub();
    }, []);

    const seedFromStatic = useCallback(async () => {
        setSeeding(true);
        try {
            const batch = writeBatch(db);
            for (const c of cursosEstaticos) {
                const ref = doc(collection(db, 'jomarCourses'));
                batch.set(ref, {
                    ...toJomarCurso(c),
                    institutionId: 'JOMAR',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
            }
            await batch.commit();
            toast.success(`${cursosEstaticos.length} cursos importados correctamente`);
        } catch { toast.error('Error al importar cursos'); }
        finally { setSeeding(false); }
    }, []);

    const togglePublish = async (c: JomarCurso) => {
        try {
            await updateDoc(doc(db, 'jomarCourses', c.id), { isPublished: !c.isPublished, updatedAt: serverTimestamp() });
            toast.success(`Curso ${!c.isPublished ? 'publicado' : 'ocultado'}`);
        } catch { toast.error('Error'); }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        try {
            await deleteDoc(doc(db, 'jomarCourses', confirmDelete.id));
            toast.success('Curso eliminado');
        } catch { toast.error('Error al eliminar'); }
        setConfirmDelete(null);
    };

    const filtered = courses.filter(c =>
        !search || c.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (c.tags ?? []).some(t => t.toLowerCase().includes(search.toLowerCase()))
    );

    const stats = {
        total: courses.length,
        published: courses.filter(c => c.isPublished).length,
        grupos: courses.reduce((sum, c) => sum + (c.grupos?.filter(g => g.estado === 'abierto').length ?? 0), 0),
    };

    return (
        <div style={{ display: 'grid', gap: 24 }}>
            <Header title="Cursos Jomar" />
            <PageHero title="Cursos de Jomar Segurid" subtitle="Cursos propios de la institución SIERCP gestionados por Jomar" parentTitle="Super Admin" parentHref="/super-admin/dashboard" />

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                {[
                    { label: 'Total cursos', value: stats.total, color: '#6366f1', icon: BookMarked },
                    { label: 'Publicados', value: stats.published, color: '#10b981', icon: Eye },
                    { label: 'Grupos abiertos', value: stats.grupos, color: '#0ea5e9', icon: Calendar },
                ].map(s => (
                    <div key={s.label} style={{ padding: '14px 16px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                            <s.icon size={16} color={s.color} />
                        </div>
                        <div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 3 }}>{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o tag…" style={{ ...inputSt, paddingLeft: 36, width: '100%' }} />
                </div>
                {courses.length === 0 && !loading && (
                    <button onClick={seedFromStatic} disabled={seeding} style={{ ...btnSecondary, whiteSpace: 'nowrap' }}>
                        <Download size={14} />{seeding ? 'Importando…' : 'Importar cursos base'}
                    </button>
                )}
                <button onClick={() => setModal('create')} style={btnPrimary}><Plus size={15} /> Nuevo curso</button>
            </div>

            {/* Cards grid */}
            {loading ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Cargando…</div>
            ) : filtered.length === 0 && courses.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 20, display: 'grid', gap: 16 }}>
                    <div style={{ fontSize: 40 }}>📚</div>
                    <div>
                        <p style={{ margin: '0 0 6px', fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>No hay cursos Jomar en Firestore</p>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Importa los {cursosEstaticos.length} cursos base o crea uno nuevo desde cero.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button onClick={seedFromStatic} disabled={seeding} style={{ ...btnPrimary, background: '#059669' }}>
                            <Download size={15} />{seeding ? 'Importando…' : `Importar ${cursosEstaticos.length} cursos base`}
                        </button>
                        <button onClick={() => setModal('create')} style={btnSecondary}><Plus size={15} /> Crear manualmente</button>
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 16 }}>
                    Sin resultados para &ldquo;{search}&rdquo;
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {filtered.map(c => {
                        const grupoAbierto = c.grupos?.find(g => g.estado === 'abierto');
                        return (
                            <div key={c.id} style={{ border: '1px solid var(--border)', borderRadius: 16, background: 'var(--bg-surface)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                {/* Header */}
                                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nombre}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.descripcion || 'Sin descripción'}</div>
                                        </div>
                                        <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 20, background: c.isPublished ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)', color: c.isPublished ? '#10b981' : '#64748b', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                            {c.isPublished ? 'PUBLICADO' : 'OCULTO'}
                                        </span>
                                    </div>
                                </div>

                                {/* Body */}
                                <div style={{ padding: '10px 16px', flex: 1 }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                                            <DollarSign size={12} />{formatCOP(c.precioCOP)}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                                            <Clock size={12} />{c.duracion}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                                            <Layers size={12} />{c.modalidad}
                                        </span>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: LEVEL_META[c.nivel]?.color ?? '#64748b' }}>
                                            {LEVEL_META[c.nivel]?.label}
                                        </span>
                                    </div>

                                    {/* Tags */}
                                    {(c.tags ?? []).length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                                            {c.tags.slice(0, 4).map((t, i) => (
                                                <span key={i} style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{t}</span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Grupo abierto */}
                                    {grupoAbierto ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#10b981', fontWeight: 700 }}>
                                            <Calendar size={11} />
                                            Inscripciones abiertas hasta {grupoAbierto.inscripcionFin}
                                            <span style={{ marginLeft: 4, color: 'var(--text-muted)' }}>({grupoAbierto.inscritos}/{grupoAbierto.maxEstudiantes})</span>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                            {c.grupos?.length ?? 0} grupo{(c.grupos?.length ?? 0) !== 1 ? 's' : ''} registrado{(c.grupos?.length ?? 0) !== 1 ? 's' : ''} ·{' '}
                                            {c.modulos?.length ?? 0} módulo{(c.modulos?.length ?? 0) !== 1 ? 's' : ''}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                    <button onClick={() => togglePublish(c)} style={{ ...btnIcon, color: c.isPublished ? '#f59e0b' : '#10b981' }} title={c.isPublished ? 'Ocultar' : 'Publicar'}>
                                        {c.isPublished ? <EyeOff size={13} /> : <Eye size={13} />}
                                    </button>
                                    <button onClick={() => setModal(c)} style={btnIcon} title="Editar"><Pencil size={13} /></button>
                                    <button onClick={() => setConfirmDelete(c)} style={{ ...btnIcon, color: '#ef4444' }} title="Eliminar"><Trash2 size={13} /></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modals */}
            {(modal === 'create' || (modal && typeof modal !== 'string')) && (
                <CourseModal 
                    curso={modal === 'create' ? null : modal as JomarCurso} 
                    onClose={() => setModal(null)} 
                    onSaved={() => setModal(null)}
                    existingSlugs={courses.map(c => c.slug)} 
                />
            )}

            {confirmDelete && (
                <>
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999 }} onClick={() => setConfirmDelete(null)} />
                    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1000, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 28, maxWidth: 400, width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ margin: '0 0 10px', fontSize: 17, fontWeight: 800 }}>¿Eliminar curso?</h3>
                        <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: 14 }}>
                            Se eliminará <strong>{confirmDelete.nombre}</strong> permanentemente de Firestore.
                        </p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => setConfirmDelete(null)} style={btnSecondary}>Cancelar</button>
                            <button onClick={handleDelete} style={{ ...btnPrimary, background: '#ef4444' }}>Eliminar</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
