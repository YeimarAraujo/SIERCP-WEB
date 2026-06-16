'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { sendPush, createBroadcast, type PushPayload } from '@/services/push-sender.service';
import { InstitutionService } from '@/services/institution.service';
import type { Institution } from '@/shared/types/institution';
import { Header } from '@/components/layout/header';
import { PageHero } from '@/components/ui/page-hero';
import {
  Wrench, Tag, BookOpen, Clock, GraduationCap, Radio, ListChecks, Trophy,
  UserPlus, CalendarDays, ShieldAlert, RefreshCw, Megaphone, Sparkles,
  PencilLine, Bell, Send, Users, Building2, Globe, ChevronDown, X,
  CheckCircle2, AlertTriangle, Search, type LucideIcon,
} from 'lucide-react';

// ── Tipos de notificación (alineados con notificationTypeFromString del app) ──
// Valores válidos en Flutter: system, payment, course_update, reminder,
// certificate, live_session, quiz, achievement, enrollment.
type Category = {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  type: string;
  defaultTitle: string;
  defaultBody: string;
  link: string;
  audience: 'all' | 'role' | 'institution';
  /** Muestra el bloque de programación (fechas y horas) — sólo mantenimiento. */
  scheduled?: boolean;
};

const CATEGORIES: Category[] = [
  {
    id: 'maintenance',
    label: 'Aviso de mantenimiento',
    icon: Wrench,
    color: '#F59E0B',
    type: 'system',
    defaultTitle: 'Mantenimiento programado',
    defaultBody:
      'El sistema estará en mantenimiento. Disculpa las molestias.',
    link: '/notifications',
    audience: 'all',
    scheduled: true,
  },
  {
    id: 'promo',
    label: 'Promoción de planes',
    icon: Tag,
    color: '#10B981',
    type: 'payment',
    defaultTitle: '¡Oferta especial en tu plan!',
    defaultBody:
      'Aprovecha un descuento exclusivo al actualizar tu plan SIERCP. Oferta por tiempo limitado.',
    link: '/planes',
    audience: 'all',
  },
  {
    id: 'new_course',
    label: 'Nuevo curso disponible',
    icon: BookOpen,
    color: '#6366F1',
    type: 'course_update',
    defaultTitle: 'Nuevo curso disponible',
    defaultBody: 'Ya puedes inscribirte en nuestro nuevo curso. ¡Cupos limitados!',
    link: '/notifications',
    audience: 'all',
  },
  {
    id: 'course_update',
    label: 'Actualización de curso',
    icon: RefreshCw,
    color: '#0EA5E9',
    type: 'course_update',
    defaultTitle: 'Tu curso se ha actualizado',
    defaultBody: 'Hemos agregado nuevo contenido a tu curso. ¡Échale un vistazo!',
    link: '/notifications',
    audience: 'all',
  },
  {
    id: 'live_session',
    label: 'Sesión en vivo',
    icon: Radio,
    color: '#EF4444',
    type: 'live_session',
    defaultTitle: 'Sesión en vivo por comenzar',
    defaultBody: 'Tu instructor iniciará una sesión en vivo pronto. ¡No te la pierdas!',
    link: '/notifications',
    audience: 'all',
  },
  {
    id: 'quiz',
    label: 'Nuevo quiz / evaluación',
    icon: ListChecks,
    color: '#8B5CF6',
    type: 'quiz',
    defaultTitle: 'Nueva evaluación disponible',
    defaultBody: 'Tienes una nueva evaluación pendiente por realizar en SIERCP.',
    link: '/notifications',
    audience: 'all',
  },
  {
    id: 'achievement',
    label: 'Logro / reconocimiento',
    icon: Trophy,
    color: '#EAB308',
    type: 'achievement',
    defaultTitle: '¡Has desbloqueado un logro!',
    defaultBody: 'Felicidades por tu progreso. Sigue así y alcanza nuevos logros.',
    link: '/notifications',
    audience: 'all',
  },
  {
    id: 'enrollment',
    label: 'Inscripción / matrícula',
    icon: UserPlus,
    color: '#14B8A6',
    type: 'enrollment',
    defaultTitle: 'Inscripción confirmada',
    defaultBody: 'Tu inscripción se ha registrado correctamente. ¡Bienvenido!',
    link: '/notifications',
    audience: 'all',
  },
  {
    id: 'reminder',
    label: 'Recordatorio',
    icon: Clock,
    color: '#F97316',
    type: 'reminder',
    defaultTitle: 'Recordatorio importante',
    defaultBody: 'No olvides completar tu actividad pendiente en SIERCP.',
    link: '/notifications',
    audience: 'all',
  },
  {
    id: 'certificate',
    label: 'Certificados / renovación',
    icon: GraduationCap,
    color: '#0891B2',
    type: 'certificate',
    defaultTitle: 'Tu certificación RCP',
    defaultBody:
      'Tu certificado de RCP vence pronto. Renuévalo para mantener tu acreditación vigente.',
    link: '/notifications',
    audience: 'all',
  },
  {
    id: 'event',
    label: 'Evento / webinar',
    icon: CalendarDays,
    color: '#A855F7',
    type: 'system',
    defaultTitle: 'Te invitamos a nuestro próximo evento',
    defaultBody: 'Participa en nuestro próximo webinar de SIERCP. Cupos limitados.',
    link: '/notifications',
    audience: 'all',
  },
  {
    id: 'security',
    label: 'Aviso de seguridad',
    icon: ShieldAlert,
    color: '#DC2626',
    type: 'system',
    defaultTitle: 'Aviso de seguridad',
    defaultBody: 'Por tu seguridad, revisa la actividad reciente de tu cuenta.',
    link: '/notifications',
    audience: 'all',
  },
  {
    id: 'app_update',
    label: 'Actualización de la app',
    icon: Sparkles,
    color: '#3B82F6',
    type: 'system',
    defaultTitle: 'Nueva versión disponible',
    defaultBody: 'Actualiza la app SIERCP para disfrutar de las últimas mejoras.',
    link: '/notifications',
    audience: 'all',
  },
  {
    id: 'announcement',
    label: 'Anuncio general',
    icon: Megaphone,
    color: '#64748B',
    type: 'system',
    defaultTitle: 'Anuncio de SIERCP',
    defaultBody: 'Tenemos novedades para ti.',
    link: '/notifications',
    audience: 'all',
  },
  {
    id: 'custom',
    label: 'Personalizado (en blanco)',
    icon: PencilLine,
    color: '#94A3B8',
    type: 'system',
    defaultTitle: '',
    defaultBody: '',
    link: '/notifications',
    audience: 'all',
  },
];

// Roles disponibles (coinciden con los tópicos role_<rol> de Flutter).
const ROLES = [
  { value: 'USUARIO', label: 'Estudiantes (USUARIO)' },
  { value: 'INSTRUCTOR', label: 'Instructores' },
  { value: 'ADMIN', label: 'Administradores de institución' },
  { value: 'USUARIO_SST', label: 'Usuarios SST' },
  { value: 'USUARIO_PROFESIONAL', label: 'Usuarios profesionales' },
];

// ── SearchableSelect (basado en objetos, temizado, con icono opcional) ────────
type SelectOption = { value: string; label: string; icon?: LucideIcon; color?: string };

// ── Generador de opciones de hora (para mantenimiento) ────────────────────────
function todayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function buildTimeOptions(stepMin = 30): SelectOption[] {
  const out: SelectOption[] = [];
  for (let m = 0; m < 24 * 60; m += stepMin) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    out.push({ value: `${hh}:${mm}`, label: `${hh}:${mm}` });
  }
  return out;
}

function prettyDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

function buildMaintenanceBody(sd: string, st: string, ed: string, et: string): string {
  if (!sd || !st || !et) {
    return 'El sistema estará en mantenimiento programado. Disculpa las molestias.';
  }
  if (!ed || ed === sd) {
    return `El sistema estará en mantenimiento el ${prettyDate(sd)} de ${st} a ${et}. Disculpa las molestias.`;
  }
  return `El sistema estará en mantenimiento desde el ${prettyDate(sd)} a las ${st} hasta el ${prettyDate(ed)} a las ${et}. Disculpa las molestias.`;
}

function SearchableSelect({
  value, onChange, options, placeholder = 'Seleccionar…', disabled, leftIcon: LeftIcon,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  leftIcon?: LucideIcon;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);
  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const openDropdown = () => {
    if (disabled) return;
    setOpen(true);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 10);
  };
  const pick = (v: string) => { onChange(v); setOpen(false); setQuery(''); };

  const SelIcon = selected?.icon ?? LeftIcon;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {open ? (
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar…"
            style={{ ...inputStyle, paddingLeft: 36 }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { setOpen(false); setQuery(''); }
              if (e.key === 'Enter' && filtered.length > 0) pick(filtered[0].value);
            }}
          />
        </div>
      ) : (
        <div
          onClick={openDropdown}
          style={{
            ...inputStyle,
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            opacity: disabled ? 0.55 : 1,
          }}
        >
          {SelIcon && <SelIcon size={16} style={{ color: selected?.color ?? 'var(--text-muted)', flexShrink: 0 }} />}
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selected ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {selected ? selected.label : placeholder}
          </span>
          {selected && !disabled && (
            <span onClick={(e) => { e.stopPropagation(); onChange(''); }} style={{ display: 'flex', color: 'var(--text-muted)', padding: 2 }}>
              <X size={13} />
            </span>
          )}
          <ChevronDown size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </div>
      )}

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 300,
          background: 'var(--popover, var(--bg-surface))',
          border: '1px solid var(--brand)', borderRadius: 12,
          boxShadow: '0 12px 28px rgba(0,0,0,0.18)', maxHeight: 260, overflowY: 'auto',
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-muted)' }}>Sin resultados</div>
          ) : filtered.map((o) => {
            const Ico = o.icon;
            const active = o.value === value;
            return (
              <div
                key={o.value}
                onMouseDown={() => pick(o.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', fontSize: 14, cursor: 'pointer',
                  background: active ? 'color-mix(in srgb, var(--brand) 12%, transparent)' : undefined,
                  color: active ? 'var(--brand)' : 'var(--text-primary)',
                  fontWeight: active ? 700 : 500,
                }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLDivElement).style.background = 'var(--muted, rgba(125,125,125,0.08))'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = active ? 'color-mix(in srgb, var(--brand) 12%, transparent)' : ''; }}
              >
                {Ico && <Ico size={16} style={{ color: o.color ?? (active ? 'var(--brand)' : 'var(--text-muted)'), flexShrink: 0 }} />}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Estilos (temizados claro/oscuro mediante variables CSS) ───────────────────
const card: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: 24,
};
const labelStyle: React.CSSProperties = {
  display: 'block', color: 'var(--text-secondary)', fontSize: 12,
  fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em',
};
const inputStyle: React.CSSProperties = {
  width: '100%', minHeight: 44, padding: '11px 14px', borderRadius: 10,
  border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
  color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

export default function NotificationsPage() {
  const [categoryId, setCategoryId] = useState<string>(CATEGORIES[0].id);
  const [title, setTitle] = useState(CATEGORIES[0].defaultTitle);
  const [body, setBody] = useState(CATEGORIES[0].defaultBody);
  const [link, setLink] = useState(CATEGORIES[0].link);
  const [audience, setAudience] = useState<'all' | 'role' | 'institution'>('all');
  const [role, setRole] = useState(ROLES[0].value);
  const [institutionId, setInstitutionId] = useState('');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loadingInst, setLoadingInst] = useState(false);

  // Programación de mantenimiento.
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('02:00');
  const [endTime, setEndTime] = useState('04:00');

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const category = CATEGORIES.find((c) => c.id === categoryId)!;
  const CategoryIcon = category.icon;

  const minDate = useMemo(() => todayISO(), []);
  const timeOptions = useMemo(() => buildTimeOptions(30), []);

  const categoryOptions: SelectOption[] = useMemo(
    () => CATEGORIES.map((c) => ({ value: c.id, label: c.label, icon: c.icon, color: c.color })),
    [],
  );
  const roleOptions: SelectOption[] = useMemo(
    () => ROLES.map((r) => ({ value: r.value, label: r.label, icon: Users })),
    [],
  );
  const institutionOptions: SelectOption[] = useMemo(
    () => institutions.map((i) => ({
      value: i.id,
      label: i.code ? `${i.name} · ${i.code}` : i.name,
      icon: Building2,
    })),
    [institutions],
  );

  // Carga las instituciones para el selector buscable.
  useEffect(() => {
    let alive = true;
    setLoadingInst(true);
    InstitutionService.getAll()
      .then((list) => { if (alive) setInstitutions(list); })
      .catch(() => { /* sin instituciones */ })
      .finally(() => { if (alive) setLoadingInst(false); });
    return () => { alive = false; };
  }, []);

  function onCategoryChange(id: string) {
    if (!id) return;
    const cat = CATEGORIES.find((c) => c.id === id)!;
    setCategoryId(id);
    setLink(cat.link);
    setAudience(cat.audience);
    setResult(null);
    setTitle(cat.defaultTitle);
    setBody(cat.scheduled
      ? buildMaintenanceBody(startDate, startTime, endDate, endTime)
      : cat.defaultBody);
  }

  // Recalcula el cuerpo del mensaje cuando cambia la programación (mantenimiento).
  function updateSchedule(next: Partial<{ sd: string; ed: string; st: string; et: string }>) {
    const sd = next.sd ?? startDate;
    const ed = next.ed ?? endDate;
    const st = next.st ?? startTime;
    const et = next.et ?? endTime;
    if (next.sd !== undefined) setStartDate(next.sd);
    if (next.ed !== undefined) setEndDate(next.ed);
    if (next.st !== undefined) setStartTime(next.st);
    if (next.et !== undefined) setEndTime(next.et);
    if (category.scheduled) setBody(buildMaintenanceBody(sd, st, ed, et));
  }

  async function handleSend() {
    setResult(null);
    if (!title.trim() || !body.trim()) {
      setResult({ ok: false, msg: 'El título y el mensaje son obligatorios.' });
      return;
    }
    if (audience === 'institution' && !institutionId.trim()) {
      setResult({ ok: false, msg: 'Selecciona una institución.' });
      return;
    }

    let topic = 'all';
    if (audience === 'role') topic = `role_${role}`;
    if (audience === 'institution') topic = `inst_${institutionId.trim()}`;

    const data: Record<string, string> = { type: category.type, category: category.id };
    if (category.scheduled && startDate) {
      data.startDate = startDate;
      data.startTime = startTime;
      if (endDate) data.endDate = endDate;
      data.endTime = endTime;
    }

    const payload: PushPayload = {
      topic,
      title: title.trim(),
      body: body.trim(),
      link: link.trim() || '/notifications',
      data,
    };

    setSending(true);
    try {
      // 1) Persistir el anuncio en `broadcasts` → aparece en la CAMPANA in-app
      //    (Flutter) aunque el dispositivo no tenga push. Esto es lo esencial.
      const bc = await createBroadcast({
        audience,
        role: audience === 'role' ? role : undefined,
        institutionId: audience === 'institution' ? institutionId.trim() : undefined,
        title: title.trim(),
        message: body.trim(),
        type: category.type,
        link: link.trim() || '/notifications',
        data,
      });

      // 2) Enviar el push FCM (notificación al instante, incluso app cerrada).
      //    Si no hay dispositivos suscritos, FCM responde ok igualmente.
      const res = await sendPush(payload);

      if (bc.ok && res.ok) {
        setResult({
          ok: true,
          msg: `Notificación publicada en la campana y enviada como push (${res.sent ?? 0} envío(s)).`,
        });
      } else if (bc.ok && !res.ok) {
        // El anuncio quedó visible in-app aunque el push fallara.
        setResult({
          ok: true,
          msg: `Anuncio publicado en la campana. El push no se pudo enviar: ${res.error ?? 'error desconocido'}.`,
        });
      } else {
        setResult({ ok: false, msg: bc.error ?? res.error ?? 'No se pudo enviar.' });
      }
    } catch (e) {
      setResult({ ok: false, msg: (e as Error).message });
    } finally {
      setSending(false);
    }
  }

  const selectedInstitution = institutions.find((i) => i.id === institutionId);
  const audienceLabel =
    audience === 'all'
      ? 'Todos los usuarios'
      : audience === 'role'
        ? ROLES.find((r) => r.value === role)?.label ?? role
        : selectedInstitution
          ? `Institución ${selectedInstitution.name}`
          : 'Institución (sin seleccionar)';

  const audienceTabs = [
    { val: 'all' as const, lbl: 'Todos', icon: Globe },
    { val: 'role' as const, lbl: 'Por rol', icon: Users },
    { val: 'institution' as const, lbl: 'Por institución', icon: Building2 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-page)' }}>
      <Header title="Notificaciones" />

      <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
        <PageHero
          title="Enviar notificación"
          subtitle="Notificaciones a cualquier usuario."
          parentTitle="Super Admin"
          parentHref="/super-admin/dashboard"
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 20, marginTop: 24 }}>
          {/* ── Formulario ─────────────────────────────────────────────── */}
          <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Tipo de notificación */}
            <div>
              <label style={labelStyle}>Tipo de notificación</label>
              <SearchableSelect
                value={categoryId}
                onChange={onCategoryChange}
                options={categoryOptions}
                placeholder="Selecciona un tipo"
                leftIcon={CategoryIcon}
              />
            </div>

            {/* Programación de mantenimiento */}
            {category.scheduled && (
              <div style={{
                border: '1px solid var(--border)', borderRadius: 12, padding: 16,
                background: 'var(--bg-surface-2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color: category.color }}>
                  <Wrench size={15} />
                  <span style={{ fontSize: 13, fontWeight: 800 }}>Programación del mantenimiento</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Fecha de inicio</label>
                    <input
                      type="date"
                      value={startDate}
                      min={minDate}
                      onChange={(e) => updateSchedule({ sd: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Fecha de fin</label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || minDate}
                      onChange={(e) => updateSchedule({ ed: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Hora de inicio</label>
                    <SearchableSelect
                      value={startTime}
                      onChange={(v) => updateSchedule({ st: v })}
                      options={timeOptions}
                      placeholder="HH:MM"
                      leftIcon={Clock}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Hora de fin</label>
                    <SearchableSelect
                      value={endTime}
                      onChange={(v) => updateSchedule({ et: v })}
                      options={timeOptions}
                      placeholder="HH:MM"
                      leftIcon={Clock}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Audiencia */}
            <div>
              <label style={labelStyle}>Enviar a</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {audienceTabs.map(({ val, lbl, icon: Ico }) => {
                  const active = audience === val;
                  return (
                    <button
                      key={val}
                      onClick={() => setAudience(val)}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '10px', borderRadius: 10,
                        border: `1px solid ${active ? 'var(--brand)' : 'var(--border)'}`,
                        background: active ? 'var(--brand)' : 'transparent',
                        color: active ? 'var(--text-on-brand, #fff)' : 'var(--text-secondary)',
                        fontWeight: 700, fontSize: 13, cursor: 'pointer',
                      }}
                    >
                      <Ico size={14} /> {lbl}
                    </button>
                  );
                })}
              </div>

              {audience === 'role' && (
                <SearchableSelect
                  value={role}
                  onChange={(v) => setRole(v || ROLES[0].value)}
                  options={roleOptions}
                  placeholder="Selecciona un rol"
                  leftIcon={Users}
                />
              )}

              {audience === 'institution' && (
                <SearchableSelect
                  value={institutionId}
                  onChange={setInstitutionId}
                  options={institutionOptions}
                  placeholder={loadingInst ? 'Cargando instituciones…' : 'Buscar institución…'}
                  disabled={loadingInst}
                  leftIcon={Building2}
                />
              )}
            </div>

            {/* Título */}
            <div>
              <label style={labelStyle}>Título</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                placeholder="Título de la notificación"
                style={inputStyle}
              />
            </div>

            {/* Mensaje */}
            <div>
              <label style={labelStyle}>Mensaje</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={240}
                rows={4}
                placeholder="Contenido del mensaje"
                style={{ ...inputStyle, resize: 'vertical' }}
              />
              <div style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>
                {body.length}/240
              </div>
            </div>

            {/* Link / destino */}
            <div>
              <label style={labelStyle}>Destino al tocar (ruta interna)</label>
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="/notifications"
                style={inputStyle}
              />
            </div>

            {/* Resultado */}
            {result && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 14px', borderRadius: 10, fontSize: 14,
                background: result.ok ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                border: `1px solid ${result.ok ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
                color: result.ok ? '#10B981' : '#EF4444',
              }}>
                {result.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                {result.msg}
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={sending}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: 14, borderRadius: 12, border: 'none',
                background: sending ? 'var(--muted)' : 'var(--brand)',
                color: 'var(--text-on-brand, #fff)', fontWeight: 800, fontSize: 15,
                cursor: sending ? 'not-allowed' : 'pointer',
              }}
            >
              <Send size={16} /> {sending ? 'Enviando…' : 'Enviar notificación'}
            </button>
          </div>

          {/* ── Vista previa ───────────────────────────────────────────── */}
          <div>
            <label style={labelStyle}>Vista previa</label>
            <div style={card}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `color-mix(in srgb, ${category.color} 14%, transparent)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  color: category.color,
                }}>
                  <CategoryIcon size={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, color: 'var(--text-primary)' }}>
                    {title || 'Título de la notificación'}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13, wordBreak: 'break-word' }}>
                    {body || 'Aquí aparece el mensaje…'}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 8 }}>
                    SIERCP · ahora
                  </div>
                </div>
              </div>
            </div>

            <div style={{ ...card, marginTop: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
              <div style={{ marginBottom: 10, color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Bell size={14} /> Resumen del envío
              </div>
              <SummaryRow icon={CategoryIcon} label="Tipo" value={category.label} color={category.color} />
              <SummaryRow icon={Users} label="Audiencia" value={audienceLabel} />
              <SummaryRow icon={Globe} label="Destino" value={link || '/notifications'} />
              {category.scheduled && startDate && (
                <SummaryRow
                  icon={CalendarDays}
                  label="Programado"
                  value={
                    endDate && endDate !== startDate
                      ? `${prettyDate(startDate)} ${startTime} → ${prettyDate(endDate)} ${endTime}`
                      : `${prettyDate(startDate)} · ${startTime}–${endTime}`
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ icon: Ico, label, value, color }: {
  icon: LucideIcon; label: string; value: string; color?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
      <Ico size={14} style={{ color: color ?? 'var(--text-muted)', flexShrink: 0 }} />
      <span style={{ color: 'var(--text-muted)' }}>{label}:</span>
      <b style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</b>
    </div>
  );
}
