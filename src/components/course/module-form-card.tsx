'use client';

import React, { useState } from 'react';
import {
    GripVertical, Trash2, Plus,
    FileText, Video, Link as LinkIcon, HelpCircle,
    BookOpen, ClipboardCheck, Heart, Award, Search, X,
} from 'lucide-react';
import {
    ALL_CLINICAL_SCENARIOS,
    CLINICAL_SCENARIO_LABELS,
    CLINICAL_SCENARIO_DIFFICULTY,
    CLINICAL_SCENARIO_PATIENT_TYPE,
    type ClinicalScenario,
} from '@/shared/constants/clinical_scenarios';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ModuleType = 'teoria' | 'evaluacion_teorica' | 'practica_guiada' | 'certificacion';
export type ContentType = 'pdf' | 'video' | 'external' | 'quiz';

export interface ModuleForm {
    title: string;
    topics: string[];
    duration: string;
    order: number;
    type: ModuleType;
    contentType: ContentType;
    contentUrl: string;
    passingScore: number;
    deadlineDate: string;
    isRequired: boolean;
    scenarios: ClinicalScenario[];
}

export const DEFAULT_MODULE: ModuleForm = {
    title: '',
    topics: [''],
    duration: '',
    order: 1,
    type: 'teoria',
    contentType: 'video',
    contentUrl: '',
    passingScore: 70,
    deadlineDate: '',
    isRequired: true,
    scenarios: [],
};

// ─── Module Type Config ───────────────────────────────────────────────────────

const MODULE_TYPES: { value: ModuleType; icon: React.ComponentType<any>; label: string; description: string; color: string }[] = [
    { value: 'teoria',             icon: BookOpen,       label: 'Teoría',          description: 'PDF, video o documento', color: '#1800AD' },
    { value: 'evaluacion_teorica', icon: ClipboardCheck, label: 'Evaluación',      description: 'Quiz teórico',           color: '#7C3AED' },
    { value: 'practica_guiada',    icon: Heart,          label: 'Práctica Guiada', description: 'Simulación en App',      color: '#DC2626' },
    { value: 'certificacion',      icon: Award,          label: 'Certificación',   description: 'Genera certificado',     color: '#D97706' },
];

// ─── Content Type Config ──────────────────────────────────────────────────────

const CONTENT_TYPES: { value: ContentType; icon: React.ComponentType<any>; label: string; urlLabel: string; placeholder: string }[] = [
    { value: 'video',    icon: Video,     label: 'Video',          urlLabel: 'URL del Video (YouTube/Vimeo)',   placeholder: 'https://youtube.com/watch?v=...' },
    { value: 'pdf',      icon: FileText,  label: 'Documento PDF',  urlLabel: 'URL del PDF',                    placeholder: 'https://drive.google.com/...' },
    { value: 'external', icon: LinkIcon,  label: 'Link Externo',   urlLabel: 'URL Externa',                    placeholder: 'https://...' },
    { value: 'quiz',     icon: HelpCircle,label: 'Quiz',           urlLabel: 'URL del Formulario / Quiz',      placeholder: 'https://forms.google.com/...' },
];

// ─── Scenario Config ──────────────────────────────────────────────────────────

const SCENARIO_EMOJI: Record<ClinicalScenario, string> = {
    paroCardiaco:          '❤️',
    infarto:               '💔',
    pediatricoParo:        '🧒',
    ahogamiento:           '🌊',
    accidenteTransito:     '🚗',
    colapsoEjercicio:      '🏃',
    atragantamiento:       '🤲',
    descargaElectrica:     '⚡',
    sobredosis:            '💊',
    ahogamientoPediatrico: '🧒',
    rvNeonatal:            '👶',
    traumaCraneo:          '🧠',
};

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
    'Básico':      { bg: '#DCFCE7', text: '#166534' },
    'Intermedio':  { bg: '#DBEAFE', text: '#1D4ED8' },
    'Avanzado':    { bg: '#FEF3C7', text: '#92400E' },
    'Experto':     { bg: '#FEE2E2', text: '#991B1B' },
};

const PATIENT_LABEL: Record<string, string> = {
    adult:     '👤 Adulto',
    pediatric: '👧 Pediátrico',
    infant:    '👶 Neonato',
};

// ─── Scenario Search-Select ───────────────────────────────────────────────────

function ScenarioSearchSelect({
    selected,
    onChange,
}: {
    selected: ClinicalScenario[];
    onChange: (s: ClinicalScenario[]) => void;
}) {
    const [query, setQuery] = useState('');

    const filtered = ALL_CLINICAL_SCENARIOS.filter(id =>
        CLINICAL_SCENARIO_LABELS[id].toLowerCase().includes(query.toLowerCase())
    );

    const toggle = (id: ClinicalScenario) => {
        if (selected.includes(id)) {
            onChange(selected.filter(s => s !== id));
        } else {
            onChange([...selected, id]);
        }
    };

    return (
        <div>
            {/* Selected chips */}
            {selected.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {selected.map(id => (
                        <span key={id} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '4px 10px', borderRadius: 20,
                            background: '#DC262614', border: '1px solid #DC262640',
                            color: '#DC2626', fontSize: 11, fontWeight: 700,
                        }}>
                            {SCENARIO_EMOJI[id]} {CLINICAL_SCENARIO_LABELS[id]}
                            <button
                                type="button"
                                onClick={() => toggle(id)}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: '#DC2626', padding: 0, display: 'flex', alignItems: 'center',
                                }}
                            >
                                <X size={11} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Search input */}
            <div style={{ position: 'relative', marginBottom: 10 }}>
                <Search size={15} style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                }} />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar escenario..."
                    style={{
                        width: '100%', height: 40, padding: '0 12px 0 36px',
                        borderRadius: 10, border: '1px solid var(--border)',
                        fontSize: 13, outline: 'none', background: 'var(--card)',
                        color: 'var(--foreground)',
                    }}
                />
            </div>

            {/* Scenario list */}
            <div style={{
                maxHeight: 260, overflowY: 'auto', display: 'grid', gap: 6,
                borderRadius: 10, border: '1px solid var(--border)',
                padding: 8, background: 'var(--card)',
            }}>
                {filtered.length === 0 && (
                    <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                        No hay resultados
                    </div>
                )}
                {filtered.map(id => {
                    const isSelected = selected.includes(id);
                    const diff = CLINICAL_SCENARIO_DIFFICULTY[id];
                    const diffColor = DIFFICULTY_COLORS[diff];
                    const patient = CLINICAL_SCENARIO_PATIENT_TYPE[id];

                    return (
                        <button
                            key={id}
                            type="button"
                            onClick={() => toggle(id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '10px 12px', borderRadius: 10, border: '2px solid',
                                borderColor: isSelected ? '#DC2626' : 'var(--border)',
                                background: isSelected ? '#DC262608' : 'transparent',
                                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                            }}
                        >
                            {/* Emoji */}
                            <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1 }}>
                                {SCENARIO_EMOJI[id]}
                            </span>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontSize: 13, fontWeight: 700, color: 'var(--foreground)',
                                    marginBottom: 3,
                                }}>
                                    {CLINICAL_SCENARIO_LABELS[id]}
                                </div>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    <span style={{
                                        padding: '2px 7px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                                        background: diffColor.bg, color: diffColor.text,
                                    }}>
                                        {diff}
                                    </span>
                                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
                                        {PATIENT_LABEL[patient]}
                                    </span>
                                </div>
                            </div>

                            {/* Checkmark */}
                            {isSelected && (
                                <div style={{
                                    width: 20, height: 20, borderRadius: '50%',
                                    background: '#DC2626', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>✓</span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {selected.length > 0 && (
                <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                    {selected.length} escenario{selected.length !== 1 ? 's' : ''} asignado{selected.length !== 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    module: ModuleForm;
    index: number;
    showRemove: boolean;
    onChange: (idx: number, updated: ModuleForm) => void;
    onRemove: (idx: number) => void;
    cardBg?: string;
}

// ─── ModuleFormCard ───────────────────────────────────────────────────────────

export function ModuleFormCard({ module: mod, index: mIdx, showRemove, onChange, onRemove, cardBg = 'var(--muted)' }: Props) {
    const inputStyle: React.CSSProperties = {
        width: '100%', height: 44, padding: '0 14px', borderRadius: 12,
        border: '1px solid var(--border)', fontSize: 14, outline: 'none',
        background: 'var(--card)', transition: 'border 0.2s', color: 'var(--foreground)',
    };
    const labelStyle: React.CSSProperties = {
        fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)',
        marginBottom: 6, display: 'block',
    };

    const update = (patch: Partial<ModuleForm>) => onChange(mIdx, { ...mod, ...patch });
    const currentContentType = CONTENT_TYPES.find(c => c.value === mod.contentType) ?? CONTENT_TYPES[0];

    return (
        <div style={{ background: cardBg, border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 12 }}>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <GripVertical size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Módulo {mIdx + 1}
                </span>
                {showRemove && (
                    <button type="button" onClick={() => onRemove(mIdx)} style={{
                        marginLeft: 'auto', border: 'none', background: '#FEF2F2', borderRadius: 8,
                        padding: '4px 10px', cursor: 'pointer', color: '#EF4444', fontSize: 11, fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                    }}>
                        <Trash2 size={12} /> Eliminar
                    </button>
                )}
            </div>

            {/* ── Title + Duration ────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 16 }}>
                <input
                    style={inputStyle}
                    placeholder="Nombre del módulo *"
                    value={mod.title}
                    onChange={(e) => update({ title: e.target.value })}
                />
                <input
                    style={inputStyle}
                    placeholder="Duración (ej: 2h)"
                    value={mod.duration}
                    onChange={(e) => update({ duration: e.target.value })}
                />
            </div>

            {/* ── Module Type Selector ─────────────────────────────────────── */}
            <label style={labelStyle}>Tipo de módulo</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
                {MODULE_TYPES.map(t => {
                    const active = mod.type === t.value;
                    const Icon = t.icon;
                    return (
                        <button key={t.value} type="button" onClick={() => update({ type: t.value })} style={{
                            padding: '12px 8px', borderRadius: 12, border: '2px solid',
                            borderColor: active ? t.color : 'var(--border)',
                            background: active ? `${t.color}14` : 'var(--card)',
                            cursor: 'pointer', transition: 'all 0.15s',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                        }}>
                            <Icon size={20} style={{ color: active ? t.color : 'var(--text-muted)' }} />
                            <div style={{ fontSize: 10, fontWeight: 800, color: active ? t.color : 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.2 }}>
                                {t.label}
                            </div>
                            <div style={{ fontSize: 9, color: active ? t.color : 'var(--text-muted)', textAlign: 'center', lineHeight: 1.2, opacity: 0.8 }}>
                                {t.description}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ── TEORÍA: content type + URL ───────────────────────────────── */}
            {mod.type === 'teoria' && (
                <>
                    <label style={labelStyle}>Tipo de contenido</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
                        {CONTENT_TYPES.map(ct => {
                            const active = mod.contentType === ct.value;
                            const Icon = ct.icon;
                            return (
                                <button key={ct.value} type="button" onClick={() => update({ contentType: ct.value })} style={{
                                    padding: '10px 6px', borderRadius: 10, border: '2px solid',
                                    borderColor: active ? 'var(--brand)' : 'var(--border)',
                                    background: active ? 'var(--accent)' : 'var(--card)',
                                    cursor: 'pointer', transition: 'all 0.15s',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                                }}>
                                    <Icon size={16} style={{ color: active ? 'var(--brand)' : 'var(--text-muted)' }} />
                                    <div style={{ fontSize: 9, fontWeight: 800, color: active ? 'var(--brand)' : 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'center' }}>
                                        {ct.label}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    <label style={labelStyle}>{currentContentType.urlLabel}</label>
                    <input
                        style={{ ...inputStyle, marginBottom: 14 }}
                        placeholder={currentContentType.placeholder}
                        value={mod.contentUrl}
                        onChange={(e) => update({ contentUrl: e.target.value })}
                    />
                </>
            )}

            {/* ── EVALUACIÓN TEÓRICA: quiz URL + passing score ─────────────── */}
            {mod.type === 'evaluacion_teorica' && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div>
                        <label style={labelStyle}>URL del Quiz / Evaluación</label>
                        <input
                            style={inputStyle}
                            placeholder="https://forms.google.com/..."
                            value={mod.contentUrl}
                            onChange={(e) => update({ contentUrl: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Puntaje mínimo (%)</label>
                        <input
                            style={inputStyle}
                            type="number"
                            min="1"
                            max="100"
                            placeholder="70"
                            value={mod.passingScore}
                            onChange={(e) => update({ passingScore: Number(e.target.value) || 70 })}
                        />
                    </div>
                </div>
            )}

            {/* ── PRÁCTICA GUIADA: scenario selector + info ────────────────── */}
            {mod.type === 'practica_guiada' && (
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Escenarios clínicos asignados</label>
                    <ScenarioSearchSelect
                        selected={mod.scenarios}
                        onChange={(scenarios) => update({ scenarios })}
                    />
                    <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                        marginTop: 10, padding: '10px 12px', borderRadius: 10,
                        background: '#DC262608', border: '1px solid #DC262625',
                    }}>
                        <Heart size={13} style={{ color: '#DC2626', marginTop: 1, flexShrink: 0 }} />
                        <p style={{ margin: 0, fontSize: 11, color: '#DC2626', lineHeight: 1.5, fontWeight: 600 }}>
                            Los estudiantes completan la práctica desde la <strong>App SIERCP</strong> con el manikin BLE. El sistema evalúa profundidad, ritmo y calidad en tiempo real.
                        </p>
                    </div>
                </div>
            )}

            {/* ── CERTIFICACIÓN: info ──────────────────────────────────────── */}
            {mod.type === 'certificacion' && (
                <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '12px 14px', borderRadius: 10,
                    background: '#D9770614', border: '1px solid #D9770630', marginBottom: 14,
                }}>
                    <Award size={16} style={{ color: '#D97706', marginTop: 1, flexShrink: 0 }} />
                    <p style={{ margin: 0, fontSize: 12, color: '#D97706', lineHeight: 1.5, fontWeight: 600 }}>
                        El certificado se genera automáticamente al completar todos los módulos requeridos
                        y superar el puntaje mínimo configurado en el curso.
                    </p>
                </div>
            )}

            {/* ── Temas (teoría, evaluación, práctica) ─────────────────────── */}
            {mod.type !== 'certificacion' && (
                <>
                    <label style={labelStyle}>Temas del módulo</label>
                    {mod.topics.map((topic, tIdx) => (
                        <div key={tIdx} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                            <input
                                style={{ ...inputStyle, flex: 1 }}
                                placeholder="Tema..."
                                value={topic}
                                onChange={(e) => {
                                    const topics = [...mod.topics];
                                    topics[tIdx] = e.target.value;
                                    update({ topics });
                                }}
                            />
                            <button type="button" onClick={() => update({ topics: mod.topics.filter((_, i) => i !== tIdx) })} style={{
                                width: 36, height: 44, borderRadius: 10, border: '1px solid var(--border)',
                                background: 'var(--card)', color: 'var(--text-muted)', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                                <Trash2 size={13} />
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={() => update({ topics: [...mod.topics, ''] })} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                        borderRadius: 8, border: '1px dashed var(--border)', background: 'transparent',
                        color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        marginTop: 4, marginBottom: 14,
                    }}>
                        <Plus size={11} /> Agregar tema
                    </button>
                </>
            )}

            {/* ── Footer: fecha límite + obligatorio ───────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label style={{ ...labelStyle, marginBottom: 0, whiteSpace: 'nowrap' }}>Fecha límite:</label>
                    <input
                        type="date"
                        value={mod.deadlineDate}
                        onChange={(e) => update({ deadlineDate: e.target.value })}
                        style={{ ...inputStyle, width: 160, height: 36, padding: '0 10px', fontSize: 13 }}
                    />
                </div>
                <button
                    type="button"
                    onClick={() => update({ isRequired: !mod.isRequired })}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                        borderRadius: 8, border: '1px solid',
                        borderColor: mod.isRequired ? 'var(--brand)' : 'var(--border)',
                        background: mod.isRequired ? 'var(--accent)' : 'transparent',
                        color: mod.isRequired ? 'var(--brand)' : 'var(--text-secondary)',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}
                >
                    {mod.isRequired ? '✓ Obligatorio' : '○ Opcional'}
                </button>
            </div>
        </div>
    );
}
