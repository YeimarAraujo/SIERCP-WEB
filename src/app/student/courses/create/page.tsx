'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { useAuth } from '@/hooks/use-auth';
import { CourseService } from '@/services/firestore.service';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import {
  BookOpen, Shield, ArrowLeft, Key, CheckCircle2, Lock,
  QrCode, ArrowRight, Copy,
} from 'lucide-react';

const CERTIFICATIONS = [
  'BLS AHA 2020',
  'ACLS AHA 2020',
  'PALS AHA 2020',
  'Primeros Auxilios',
  'Soporte Vital Básico (SVB)',
  'Certificado de Asistencia',
];

function genCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function StudentCreateCoursePage() {
  const { user, coursesLeft } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ courseId: string; inviteCode: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [certification, setCertification] = useState('BLS AHA 2020');
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});
  const [inviteCode] = useState(genCode);

  const coursesCreated = user?.coursesCreated ?? 0;
  const LIMIT = 3;

  function validate() {
    const e: typeof errors = {};
    if (!title.trim()) e.title = 'El nombre del curso es obligatorio.';
    if (!description.trim()) e.description = 'La descripción es obligatoria.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !user) return;
    if (coursesLeft === 0) {
      toast.error('Has alcanzado el límite de 3 cursos.');
      return;
    }
    setLoading(true);
    try {
      const courseId = await CourseService.create({
        title: title.trim(),
        description: description.trim(),
        institutionId: user.institutionId,
        instructorId: user.uid,
        instructorName: `${user.firstName} ${user.lastName}`.trim(),
        inviteCode,
        certification,
        isActive: true,
        minScore: 85,
        requiredScore: 85,
        moduleCount: 0,
        studentCount: 0,
        completedModules: 0,
        guideIds: [],
        requiredGuideCount: 0,
        scenarioMode: 'completo',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setSuccess({ courseId, inviteCode });
      toast.success('¡Curso creado exitosamente!');
    } catch {
      toast.error('Error al crear el curso. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    if (!success) return;
    navigator.clipboard.writeText(success.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Blocked state ─────────────────────────────────────────────────────────
  if (coursesLeft === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
        <Header title="Crear Curso" />
        <div style={{ flex: 1, padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 28,
            padding: '64px 40px', textAlign: 'center', maxWidth: 480,
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: 20,
              background: 'linear-gradient(135deg, #FFF7ED, #FED7AA)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <Lock size={36} style={{ color: '#EA580C' }} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginBottom: 12 }}>
              Límite alcanzado
            </h2>
            <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.7, marginBottom: 8 }}>
              Has alcanzado el máximo de <strong>3 cursos</strong> para el rol USUARIO.
            </p>
            <p style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.6, marginBottom: 32 }}>
              Para crear más cursos, sube tus credenciales y solicita el rol de Instructor en la sección de certificados.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/student/certificates"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 22px',
                  background: 'linear-gradient(135deg, #1800AD, #2D1FD4)',
                  color: '#fff', borderRadius: 12, fontWeight: 700, textDecoration: 'none', fontSize: 14,
                }}
              >
                Subir credenciales <ArrowRight size={16} />
              </Link>
              <Link
                href="/student/courses"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 22px', background: '#F1F5F9',
                  color: '#475569', borderRadius: 12, fontWeight: 700, textDecoration: 'none', fontSize: 14,
                }}
              >
                <ArrowLeft size={16} /> Mis cursos
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (success) {
    const qrData = `siercp://course?code=${success.inviteCode}`;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
        <Header title="Curso creado" />
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          <div style={{ maxWidth: 560, margin: '0 auto' }}>

            <div style={{
              background: 'linear-gradient(135deg, #1800AD 0%, #2D1FD4 60%, #6d4aff 100%)',
              borderRadius: 24, padding: '32px', textAlign: 'center', marginBottom: 24,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
              <div style={{
                width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', position: 'relative',
              }}>
                <CheckCircle2 size={32} color="#fff" />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>
                ¡Curso creado exitosamente!
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, margin: 0 }}>
                Comparte el código o QR con tus participantes
              </p>
            </div>

            <div style={{
              background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 24,
              padding: '32px', marginBottom: 16, textAlign: 'center',
            }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                  Código de invitación
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, color: '#1800AD', fontFamily: 'monospace', letterSpacing: 6 }}>
                    {success.inviteCode}
                  </span>
                  <button
                    onClick={copyCode}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px',
                      background: copied ? '#ECFDF5' : '#EEF0FF',
                      color: copied ? '#059669' : '#1800AD',
                      borderRadius: 10, fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 13,
                    }}
                  >
                    {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <div style={{
                  padding: 16, background: '#fff', borderRadius: 16,
                  boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #E2E8F0',
                }}>
                  <QRCodeSVG value={qrData} size={180} bgColor="#ffffff" fgColor="#1A1A2E" level="M" />
                </div>
              </div>

              <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>
                Los participantes pueden escanear este QR o ingresar el código en la app SIERCP.
              </p>
            </div>

            <Link
              href="/student/courses"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '16px',
                background: 'linear-gradient(135deg, #1800AD, #2D1FD4)',
                color: '#fff', borderRadius: 14, fontWeight: 700, textDecoration: 'none', fontSize: 15,
              }}
            >
              Ver mis cursos <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
      <Header title="Crear Curso" />

      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>

          {/* Header premium */}
          <div style={{
            background: 'linear-gradient(135deg, #1800AD 0%, #2D1FD4 60%, #6d4aff 100%)',
            borderRadius: 24, padding: '32px 36px', marginBottom: 28,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: -40, right: 80, width: 120, height: 120, background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 100, padding: '4px 12px',
                  fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.85)',
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
                }}>
                  <Shield size={11} /> Portal del Usuario
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.03em' }}>
                  Crear nuevo curso
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                  Completa los datos para generar el código de acceso
                </p>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 16, padding: '14px 18px', textAlign: 'center', backdropFilter: 'blur(10px)', flexShrink: 0,
              }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{coursesCreated}/{LIMIT}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>Cursos</div>
              </div>
            </div>
          </div>

          {/* Back */}
          <Link
            href="/student/courses"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#1800AD', fontSize: 13, fontWeight: 700, textDecoration: 'none', marginBottom: 24 }}
          >
            <ArrowLeft size={14} /> Volver a mis cursos
          </Link>

          {/* Form card */}
          <form onSubmit={handleSubmit}>
            <div style={{ background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 24, padding: 32, marginBottom: 16 }}>

              {/* Title */}
              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                  <BookOpen size={13} style={{ color: '#1800AD' }} />
                  Nombre del curso <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  value={title}
                  onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: undefined })); }}
                  placeholder="Ej: BLS Adulto — Empresa Ejemplo S.A."
                  maxLength={100}
                  style={{
                    width: '100%', padding: '12px 16px',
                    border: `1.5px solid ${errors.title ? '#EF4444' : '#E2E8F0'}`,
                    borderRadius: 12, fontSize: 14, outline: 'none',
                    fontFamily: 'inherit', boxSizing: 'border-box',
                    background: errors.title ? '#FFF5F5' : '#FAFBFF',
                    transition: 'border-color 0.2s',
                  }}
                />
                {errors.title && <p style={{ color: '#EF4444', fontSize: 12, margin: '6px 0 0' }}>{errors.title}</p>}
              </div>

              {/* Description */}
              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                  Descripción <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => { setDescription(e.target.value); setErrors(p => ({ ...p, description: undefined })); }}
                  placeholder="Describe el objetivo y contenido del curso..."
                  rows={4}
                  maxLength={500}
                  style={{
                    width: '100%', padding: '12px 16px',
                    border: `1.5px solid ${errors.description ? '#EF4444' : '#E2E8F0'}`,
                    borderRadius: 12, fontSize: 14, outline: 'none', resize: 'vertical',
                    fontFamily: 'inherit', boxSizing: 'border-box',
                    background: errors.description ? '#FFF5F5' : '#FAFBFF',
                    transition: 'border-color 0.2s',
                  }}
                />
                {errors.description && <p style={{ color: '#EF4444', fontSize: 12, margin: '6px 0 0' }}>{errors.description}</p>}
              </div>

              {/* Certification */}
              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                  Tipo de certificación
                </label>
                <select
                  value={certification}
                  onChange={e => setCertification(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px',
                    border: '1.5px solid #E2E8F0', borderRadius: 12, fontSize: 14,
                    outline: 'none', background: '#FAFBFF', fontFamily: 'inherit',
                    cursor: 'pointer', boxSizing: 'border-box',
                  }}
                >
                  {CERTIFICATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Invite code preview */}
              <div style={{
                background: 'linear-gradient(135deg, #EEF0FF, #F8F9FF)',
                border: '1.5px solid rgba(24,0,173,0.12)',
                borderRadius: 16, padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: 'linear-gradient(135deg, #1800AD, #6d4aff)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 12px rgba(24,0,173,0.25)',
                }}>
                  <Key size={18} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#1800AD', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                    Código de acceso generado automáticamente
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#1800AD', fontFamily: 'monospace', letterSpacing: 6 }}>
                    {inviteCode}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '16px',
                background: loading ? 'rgba(24,0,173,0.5)' : 'linear-gradient(135deg, #1800AD, #2D1FD4)',
                color: '#fff', borderRadius: 14, fontWeight: 800, border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 18, height: 18,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  Creando curso...
                </>
              ) : (
                <>
                  <QrCode size={18} /> Crear curso y generar QR
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
