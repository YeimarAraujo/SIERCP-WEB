'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import {
  BookOpen, Plus, Trash2, GripVertical, Save, ArrowLeft,
  Tag, Target, FileText, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ModuleForm {
  title: string;
  topics: string[];
  duration: string;
  order: number;
}

export default function CreateCourseTemplatePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // ─── Form state ──────────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionLong, setDescriptionLong] = useState('');
  const [level, setLevel] = useState<'basico' | 'intermedio' | 'avanzado'>('basico');
  const [modality, setModality] = useState<'presencial' | 'virtual' | 'hibrido'>('presencial');
  const [duration, setDuration] = useState('');
  const [sessions, setSessions] = useState(0);
  const [targetAudience, setTargetAudience] = useState('');
  const [objectives, setObjectives] = useState<string[]>(['']);
  const [requirements, setRequirements] = useState<string[]>(['']);
  const [regulations, setRegulations] = useState<string[]>(['']);
  const [tags, setTags] = useState<string[]>(['']);
  const [includesCertificate, setIncludesCertificate] = useState(true);
  const [icon, setIcon] = useState('shield');
  const [modules, setModules] = useState<ModuleForm[]>([
    { title: '', topics: [''], duration: '', order: 1 },
  ]);

  // ─── Handlers ────────────────────────────────────────────────────────
  const autoSlug = (name: string) => {
    setTitle(name);
    setSlug(
      name
        .toLowerCase()
        .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e').replace(/[íìïî]/g, 'i')
        .replace(/[óòöô]/g, 'o').replace(/[úùüû]/g, 'u').replace(/[ñ]/g, 'n')
        .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
        .trim()
    );
  };

  const addListItem = (list: string[], setter: (v: string[]) => void) => {
    setter([...list, '']);
  };

  const updateListItem = (list: string[], setter: (v: string[]) => void, idx: number, val: string) => {
    const copy = [...list];
    copy[idx] = val;
    setter(copy);
  };

  const removeListItem = (list: string[], setter: (v: string[]) => void, idx: number) => {
    setter(list.filter((_, i) => i !== idx));
  };

  const addModule = () => {
    setModules([...modules, { title: '', topics: [''], duration: '', order: modules.length + 1 }]);
  };

  const updateModule = (idx: number, field: keyof ModuleForm, value: any) => {
    const copy = [...modules];
    (copy[idx] as any)[field] = value;
    setModules(copy);
  };

  const removeModule = (idx: number) => {
    setModules(modules.filter((_, i) => i !== idx).map((m, i) => ({ ...m, order: i + 1 })));
  };

  const handleSubmit = async () => {
    if (!title || !slug || !description || !duration) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    try {
      setSaving(true);
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const idToken = await auth.currentUser?.getIdToken();

      const body = {
        title, slug, description, descriptionLong, level, modality, duration,
        sessions, priceCOP: 0, priceUSD: 0, targetAudience, includesCertificate,
        icon, objectives: objectives.filter(Boolean), requirements: requirements.filter(Boolean),
        regulations: regulations.filter(Boolean), tags: tags.filter(Boolean),
        modules: modules.filter(m => m.title).map(m => ({
          ...m, topics: m.topics.filter(Boolean),
        })),
      };

      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear curso');

      toast.success('Curso creado exitosamente');
      router.push('/admin/platform-courses');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // ─── Styles ──────────────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24,
    padding: 28, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 6,
    display: 'block', letterSpacing: '0.03em',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', height: 44, padding: '0 14px', borderRadius: 12,
    border: '1px solid #E2E8F0', fontSize: 14, outline: 'none',
    background: '#F8FAFC', transition: 'border 0.2s',
  };
  const textareaStyle: React.CSSProperties = {
    ...inputStyle, height: 90, padding: '10px 14px', resize: 'vertical',
  };
  const sectionTitle = (icon: React.ReactNode, text: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, background: '#EEF0FF',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1800AD',
      }}>{icon}</div>
      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>{text}</h3>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
      <Header
        title="Crear Nuevo Curso"
        showBack
        onBack={() => router.push('/admin/platform-courses')}
      />

      <div style={{ flex: 1, padding: '32px', overflowY: 'auto', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <PageHero
          title="Nuevo Curso / Programa"
          subtitle="Configura la plantilla de curso. Luego podrás crear grupos (cohortes) de inscripción."
          parentTitle="Oferta LMS"
          parentHref="/admin/platform-courses"
        />

        {/* ── Información básica ─────────────────────────────────── */}
        <div style={cardStyle}>
          {sectionTitle(<FileText size={18} />, 'Información Básica')}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Nombre del curso *</label>
              <input
                style={inputStyle}
                placeholder="Ej: Vigilancia y Seguridad Privada"
                value={title}
                onChange={(e) => autoSlug(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Slug (URL)</label>
              <input style={{ ...inputStyle, background: '#F1F5F9', color: '#94A3B8' }} value={slug} readOnly />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Descripción corta *</label>
            <textarea
              style={textareaStyle}
              placeholder="Resumen breve para el catálogo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Descripción detallada</label>
            <textarea
              style={{ ...textareaStyle, height: 120 }}
              placeholder="Descripción completa del programa..."
              value={descriptionLong}
              onChange={(e) => setDescriptionLong(e.target.value)}
            />
          </div>
        </div>

        {/* ── Configuración ─────────────────────────────────────── */}
        <div style={cardStyle}>
          {sectionTitle(<Target size={18} />, 'Configuración')}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Nivel</label>
              <select style={inputStyle} value={level} onChange={(e) => setLevel(e.target.value as any)}>
                <option value="basico">Básico</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Modalidad</label>
              <select style={inputStyle} value={modality} onChange={(e) => setModality(e.target.value as any)}>
                <option value="presencial">Presencial</option>
                <option value="virtual">Virtual</option>
                <option value="hibrido">Híbrido</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Icono</label>
              <select style={inputStyle} value={icon} onChange={(e) => setIcon(e.target.value)}>
                <option value="shield">🛡️ Escudo</option>
                <option value="gun">🔫 Arma</option>
                <option value="eye">👁️ Vigilancia</option>
                <option value="graduation">🎓 Certificación</option>
                <option value="radio">📻 Comunicaciones</option>
                <option value="first-aid">🩺 Primeros Auxilios</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <div>
              <label style={labelStyle}>Duración</label>
              <input style={inputStyle} placeholder="Ej: 120 horas" value={duration}
                onChange={(e) => setDuration(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Sesiones</label>
              <input style={inputStyle} type="number" value={sessions}
                onChange={(e) => setSessions(Number(e.target.value))} />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>¿Para quién?</label>
            <input style={inputStyle} placeholder="Personas que deseen obtener..."
              value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} />
          </div>
          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={includesCertificate}
                onChange={(e) => setIncludesCertificate(e.target.checked)} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Incluye certificado</span>
            </label>
          </div>
        </div>

        {/* ── Objetivos / Requisitos / Normativa / Tags ─────────── */}
        <div style={cardStyle}>
          {sectionTitle(<Tag size={18} />, 'Objetivos, Requisitos y Tags')}
          {([
            { label: 'Objetivos', list: objectives, setter: setObjectives, placeholder: 'Ej: Capacitar en técnicas de...' },
            { label: 'Requisitos', list: requirements, setter: setRequirements, placeholder: 'Ej: Ser mayor de 18 años' },
            { label: 'Normativa', list: regulations, setter: setRegulations, placeholder: 'Ej: Resolución 2852 de 2006' },
            { label: 'Tags', list: tags, setter: setTags, placeholder: 'Ej: seguridad, vigilancia' },
          ] as const).map(({ label, list, setter, placeholder }) => (
            <div key={label} style={{ marginBottom: 20 }}>
              <label style={labelStyle}>{label}</label>
              {list.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder={placeholder}
                    value={item}
                    onChange={(e) => updateListItem(list, setter, idx, e.target.value)}
                  />
                  <button
                    onClick={() => removeListItem(list, setter, idx)}
                    style={{
                      width: 36, height: 44, borderRadius: 10, border: '1px solid #FEE2E2',
                      background: '#FEF2F2', color: '#EF4444', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  ><Trash2 size={14} /></button>
                </div>
              ))}
              <button
                onClick={() => addListItem(list, setter)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                  borderRadius: 8, border: '1px dashed #CBD5E1', background: 'transparent',
                  color: '#64748B', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              ><Plus size={12} /> Agregar {label.toLowerCase()}</button>
            </div>
          ))}
        </div>

        {/* ── Módulos ───────────────────────────────────────────── */}
        <div style={cardStyle}>
          {sectionTitle(<Layers size={18} />, 'Plan de Estudios (Módulos)')}
          {modules.map((mod, mIdx) => (
            <div key={mIdx} style={{
              background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 16,
              padding: 20, marginBottom: 12, position: 'relative',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <GripVertical size={16} style={{ color: '#CBD5E1' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8' }}>MÓDULO {mIdx + 1}</span>
                {modules.length > 1 && (
                  <button onClick={() => removeModule(mIdx)} style={{
                    marginLeft: 'auto', border: 'none', background: '#FEF2F2', borderRadius: 8,
                    padding: '4px 8px', cursor: 'pointer', color: '#EF4444', fontSize: 11, fontWeight: 700,
                  }}>Eliminar</button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12 }}>
                <input style={inputStyle} placeholder="Nombre del módulo"
                  value={mod.title} onChange={(e) => updateModule(mIdx, 'title', e.target.value)} />
                <input style={inputStyle} placeholder="Duración (ej: 20h)"
                  value={mod.duration} onChange={(e) => updateModule(mIdx, 'duration', e.target.value)} />
              </div>
              <label style={labelStyle}>Temas</label>
              {mod.topics.map((topic, tIdx) => (
                <div key={tIdx} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder="Tema..."
                    value={topic}
                    onChange={(e) => {
                      const copy = [...modules];
                      copy[mIdx].topics[tIdx] = e.target.value;
                      setModules(copy);
                    }}
                  />
                  <button onClick={() => {
                    const copy = [...modules];
                    copy[mIdx].topics = copy[mIdx].topics.filter((_, i) => i !== tIdx);
                    setModules(copy);
                  }} style={{
                    width: 32, height: 44, borderRadius: 8, border: 'none',
                    background: 'transparent', color: '#CBD5E1', cursor: 'pointer',
                  }}><Trash2 size={12} /></button>
                </div>
              ))}
              <button onClick={() => {
                const copy = [...modules];
                copy[mIdx].topics.push('');
                setModules(copy);
              }} style={{
                marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                borderRadius: 6, border: '1px dashed #CBD5E1', background: 'transparent',
                color: '#94A3B8', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}><Plus size={10} /> Tema</button>
            </div>
          ))}
          <button onClick={addModule} style={{
            width: '100%', padding: '14px', borderRadius: 14, border: '2px dashed #CBD5E1',
            background: 'transparent', color: '#64748B', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}><Plus size={16} /> Agregar Módulo</button>
        </div>

        {/* ── Botones de acción ──────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0 40px' }}>
          <button
            onClick={() => router.push('/admin/platform-courses')}
            style={{
              padding: '14px 24px', borderRadius: 14, background: '#FFFFFF',
              color: '#64748B', border: '1px solid #E2E8F0', fontSize: 14,
              fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            }}
          ><ArrowLeft size={16} /> Cancelar</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              padding: '14px 32px', borderRadius: 14, background: '#1800AD',
              color: '#FFFFFF', border: 'none', fontSize: 14, fontWeight: 800,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 4px 12px rgba(24, 0, 173, 0.25)',
            }}
          >
            <Save size={18} />
            {saving ? 'Guardando...' : 'Crear Curso'}
          </button>
        </div>
      </div>
    </div>
  );
}
