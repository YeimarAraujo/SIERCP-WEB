'use client';

import { Header } from '@/components/layout/header';
import {
  Download, ShieldCheck, ExternalLink, Upload, FileText,
  CheckCircle2, XCircle, Clock, Shield, GraduationCap,
  Heart, ArrowRight, Star, Sparkles, Lock,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { SessionService } from '@/services/firestore.service';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/use-auth';
import type { SessionModel } from '@/models/session';
import { downloadCertificatePdf, formatReportFilename } from '@/shared/lib/export-utils';
import { CertificateService } from '@/features/certificates/services/certificate.service';
import { db, storage } from '@/shared/lib/firebase';
import { collection, addDoc, query, where, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { PageHero } from '@/components/ui/page-hero';

const CERT_TYPES = [
  {
    value: 'SST_LICENCIA',
    label: 'Licencia SST',
    sublabel: 'Activa nivel USUARIO_SST',
    issuer: 'Ministerio de Salud y Protección Social',
    description: 'Licencia vigente de ejercicio en Seguridad y Salud en el Trabajo. Habilita solicitud de Instructor CON licencia SST.',
    color: 'var(--clr-success)',
    dark: 'var(--clr-success)',
    border: 'rgba(5,150,105,0.25)',
    icon: Shield,
  },
  {
    value: 'PROFESIONAL',
    label: 'Título Profesional',
    sublabel: 'Activa nivel USUARIO_PROFESIONAL',
    issuer: 'Ministerio de Educación Nacional',
    description: 'Diploma o acta de grado universitario. Habilita solicitud de Instructor sin licencia SST.',
    color: 'var(--clr-primary)',
    dark: 'var(--clr-primary)',
    border: 'rgba(24,0,173,0.2)',
    icon: GraduationCap,
  },
  {
    value: 'AHA',
    label: 'Certificado AHA',
    sublabel: 'Credencial complementaria',
    issuer: 'American Heart Association',
    description: 'Certificación internacional en estándares AHA 2020/2025. Complementa la solicitud de instructor.',
    color: 'var(--danger-text)',
    dark: 'var(--danger-text)',
    border: 'rgba(220,38,38,0.2)',
    icon: Heart,
  },
  {
    value: 'OTRO',
    label: 'Otro documento',
    sublabel: 'Respaldo adicional',
    issuer: 'Otra entidad',
    description: 'Cualquier credencial, constancia o certificado adicional de soporte para la solicitud.',
    color: '#64748B',
    dark: 'var(--text-muted)',
    border: 'rgba(100,116,135,0.2)',
    icon: FileText,
  },
] as const;

type CertType = typeof CERT_TYPES[number]['value'];

function statusBadge(status: string) {
  switch (status) {
    case 'APPROVED': return { label: 'Aprobado', color: '#059669', bg: '#DCFCE7', border: '#86EFAC', dot: '#22C55E', icon: CheckCircle2 };
    case 'REJECTED': return { label: 'Rechazado', color: '#DC2626', bg: '#FEE2E2', border: '#FCA5A5', dot: '#EF4444', icon: XCircle };
    default: return { label: 'En revisión', color: '#B45309', bg: '#FEF3C7', border: '#FCD34D', dot: '#F59E0B', icon: Clock };
  }
}

// ─── Certificado RCP Card ─────────────────────────────────────────────────────

function CertificateCard({ session, index }: { session: SessionModel; index: number }) {
  const [hovered, setHovered] = useState(false);
  const score = session.metrics?.qualityScore || (session.metrics as any)?.score || 0;
  const isExcellent = score >= 95;
  const scoreColor = score >= 90 ? '#D97706' : '#059669';

  const certId = session.id.slice(-8).toUpperCase();
  const dateStr = session.startedAt.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', overflow: 'hidden',
        background: hovered ? '#FDFCF8' : '#FFFEF9',
        border: `1.5px solid ${hovered ? '#D97706' : '#E8E0CC'}`,
        borderRadius: 20,
        boxShadow: hovered
          ? '0 16px 40px -8px rgba(217,119,6,0.18), 0 4px 12px rgba(0,0,0,0.06)'
          : '0 2px 8px rgba(0,0,0,0.04)',
        transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
        transform: hovered ? 'translateY(-3px)' : 'none',
        animation: `certReveal 0.55s cubic-bezier(0.16,1,0.3,1) ${index * 0.08}s both`,
      }}
    >
      {/* Top accent bar */}
      <div style={{
        height: 3,
        background: 'linear-gradient(90deg, #D97706 0%, #F59E0B 40%, #1800AD 100%)',
      }} />


      <div style={{ padding: '20px 24px 0' }}>

        {/* Issuer line */}
        <div style={{
          fontSize: 10, fontWeight: 800, color: '#94A3B8',
          textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14,
        }}>
          SIERCP · Certificado Oficial de Competencia
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

          {/* Score seal */}
          <div style={{ flexShrink: 0, textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: `conic-gradient(${scoreColor} ${score * 3.6}deg, #F1F5F9 0deg)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 0 4px #fff, 0 0 0 6px ${scoreColor}22`,
              position: 'relative',
            }}>
              <div style={{
                width: 58, height: 58, borderRadius: '50%',
                background: '#fff',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{score}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.05em' }}>%</span>
              </div>
            </div>
            <div style={{
              marginTop: 6,
              fontSize: 9, fontWeight: 800,
              color: scoreColor,
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              {isExcellent ? '★ Excelente' : 'Aprobado'}
            </div>
          </div>

          {/* Certificate details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{
              margin: '0 0 4px',
              fontSize: 17, fontWeight: 900, color: '#0F172A',
              letterSpacing: '-0.02em',
            }}>
              Certificación RCP
            </h4>
            <p style={{
              margin: '0 0 12px',
              fontSize: 13, color: '#475569', fontWeight: 500, lineHeight: 1.4,
            }}>
              {session.scenarioTitle || 'Soporte Vital Básico — Evaluación AHA'}
            </p>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Fecha</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{dateStr}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>ID Certificado</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', fontFamily: 'monospace' }}>#{certId}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{
        margin: '18px 24px 0',
        height: 1,
        background: 'repeating-linear-gradient(90deg, #E2D9C8 0, #E2D9C8 6px, transparent 6px, transparent 12px)',
      }} />

      {/* Actions */}
      <div style={{ padding: '14px 24px 20px', display: 'flex', gap: 10 }}>
        <button
          onClick={async () => {
            await downloadCertificatePdf({
              filename: formatReportFilename(`certificado-${session.id}`, 'pdf'),
              studentName: session.studentName || 'Usuario SIERCP',
              certification: session.scenarioTitle || 'Certificación RCP',
              score,
              issuedAt: session.startedAt,
              sessionId: session.id,
            });
            toast.success('Certificado PDF generado');
          }}
          style={{
            flex: 1, padding: '11px 16px',
            background: 'linear-gradient(135deg, #D97706, #B45309)',
            color: '#fff', borderRadius: 10, fontWeight: 800, border: 'none',
            cursor: 'pointer', fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            boxShadow: '0 4px 12px rgba(217,119,6,0.3)',
          }}
        >
          <Download size={14} /> Descargar PDF
        </button>
        <button
          onClick={async () => {
            const certId = await CertificateService.issue({
              id: session.id,
              studentName: session.studentName || 'Usuario SIERCP',
              certification: session.scenarioTitle || 'Certificación RCP',
              score,
              issuedAt: session.startedAt,
              sessionId: session.id,
            });
            window.open(CertificateService.buildVerificationUrl(certId), '_blank', 'noopener,noreferrer');
          }}
          style={{
            padding: '11px 14px', borderRadius: 10,
            background: 'transparent', color: '#94A3B8',
            fontSize: 13, fontWeight: 700,
            border: '1.5px solid #E2D9C8', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.2s',
          }}
          title="Verificar en línea"
        >
          <ExternalLink size={14} /> Verificar
        </button>
      </div>
    </div>
  );
}

// ─── Tab 1: Certificados RCP 

function RcpCertificatesTab({ user }: { user: { uid: string } | null }) {
  const [certificates, setCertificates] = useState<SessionModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const sessions = await SessionService.getByStudent(user.uid, 100);
        const passing = Array.from(new Map(sessions.map(s => [s.id, s])).values())
          .filter(s => (s.metrics?.qualityScore || (s.metrics as any)?.score || 0) >= 85)
          .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
        setCertificates(passing);
      } catch { /* silenced */ }
      finally { setLoading(false); }
    })();
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            borderRadius: 20, height: 240, background: '#fff',
            border: '1.5px solid #E8E0CC',
            animation: 'skeletonPulse 1.6s ease-in-out infinite',
          }} />
        ))}
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div style={{
        background: 'var(--card)',
        border: '1.5px solid var(--border)', borderRadius: 24,
        padding: '72px 32px', textAlign: 'center', maxWidth: 520, margin: '0 auto',
      }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: 'var(--brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Star size={40} style={{ color: 'var(--text-on-brand)' }} />
          </div>
          <div style={{
            position: 'absolute', top: -4, right: -4,
            width: 24, height: 24, borderRadius: '50%',
            background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Lock size={11} color="var(--brand)" />
          </div>
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--foreground)', marginBottom: 10 }}>
          Aún no hay certificados
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8, margin: 0 }}>
          Para obtener un certificado oficial, completa una sesión de evaluación con un puntaje de calidad
          <strong style={{ color: 'var(--brand)' }}> ≥ 85 %</strong> según los estándares AHA 2025.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Summary bar */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #FFFEF9, #FEF3C7)',
          border: '1.5px solid #E8E0CC', borderRadius: 14,
          padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #D97706, #B45309)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Star size={17} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{certificates.length}</div>
            <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 2 }}>
              {certificates.length === 1 ? 'Certificado' : 'Certificados'}
            </div>
          </div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)',
          border: '1.5px solid #A7F3D0', borderRadius: 14,
          padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #059669, #047857)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldCheck size={17} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#065F46', lineHeight: 1 }}>
              {Math.round(certificates.reduce((s, c) => s + (c.metrics?.qualityScore || (c.metrics as any)?.score || 0), 0) / certificates.length)}%
            </div>
            <div style={{ fontSize: 10, color: '#6EE7B7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 2 }}>
              Promedio
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 }}>
        {certificates.map((cert, i) => <CertificateCard key={cert.id} session={cert} index={i} />)}
      </div>
    </div>
  );
}

// Tab 2: Validación Profesional

function ProfessionalValidationTab({ user }: { user: { uid: string; displayName?: string | null } | null }) {
  const [selectedType, setSelectedType] = useState<CertType>('PROFESIONAL');
  const [issuer, setIssuer] = useState<string>(CERT_TYPES[1].issuer);
  const [certNumber, setCertNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [myCerts, setMyCerts] = useState<any[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(true);
  const [step, setStep] = useState<1 | 2>(1);

  const selectedMeta = CERT_TYPES.find(t => t.value === selectedType)!;

  const loadCerts = async () => {
    if (!user || !db) return;
    setLoadingCerts(true);
    try {
      const q = query(collection(db, 'user_certificates'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setMyCerts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch { /* silenced */ }
    finally { setLoadingCerts(false); }
  };

  useEffect(() => { loadCerts(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTypeChange = (val: CertType) => {
    setSelectedType(val);
    setIssuer(CERT_TYPES.find(t => t.value === val)!.issuer);
  };

  const handleFileDrop = (f: File) => {
    if (f.size > 10 * 1024 * 1024) { toast.error('El archivo no debe superar 10 MB'); return; }
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(f.type)) { toast.error('Solo PDF, JPG o PNG'); return; }
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !storage) { toast.error('Error de configuración'); return; }
    if (!file) { toast.error('Selecciona un archivo'); return; }
    if (!certNumber.trim() || !issueDate) { toast.error('Completa todos los campos requeridos'); return; }

    setUploading(true);
    setProgress(0);
    try {
      const ext = file.name.split('.').pop() ?? 'pdf';
      const key = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const path = `user_certificates/${user.uid}/${key}.${ext}`;
      const task = uploadBytesResumable(storageRef(storage, path), file, { customMetadata: { userId: user.uid } });

      await new Promise<void>((res, rej) => task.on('state_changed', s => setProgress(s.bytesTransferred / s.totalBytes), rej, res));
      const downloadUrl = await getDownloadURL(task.snapshot.ref);

      await addDoc(collection(db, 'user_certificates'), {
        userId: user.uid, type: selectedType, issuer: issuer.trim(),
        certNumber: certNumber.trim(), issueDate, fileUrl: downloadUrl,
        filePath: path, status: 'PENDING', createdAt: serverTimestamp(),
      });

      toast.success('¡Credencial enviada! La revisaremos en breve.');
      setFile(null); setCertNumber(''); setIssueDate(''); setStep(1);
      await loadCerts();
    } catch {
      toast.error('Error al subir el archivo. Inténtalo de nuevo.');
    } finally {
      setUploading(false); setProgress(0);
    }
  };

  const inputBase: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14,
    outline: 'none', background: '#FAFBFF', fontFamily: 'inherit',
    boxSizing: 'border-box', transition: 'border-color 0.2s',
    color: '#0F172A',
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 28, alignItems: 'start' }}>

      {/* ── IZQUIERDA: Ruta + Formulario ── */}
      <div>

        {/* Ruta visual hacia instructor */}
        <div style={{
          background: 'var(--card)',
          borderRadius: 20, padding: '24px 28px', marginBottom: 20,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(139, 138, 138, 0.04)' }} />
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
            Ruta hacia Instructor
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, position: 'relative', zIndex: 1 }}>
            {[
              { label: 'USUARIO', sub: 'Ahora', done: true },
              { label: 'USUARIO_SST', sub: 'Con Lic. SST', done: false },
              { label: 'INSTRUCTOR', sub: 'Meta', done: false },
            ].map((node, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', margin: '0 auto 6px',
                    background: node.done ? 'var(--brand)' : 'var(--card)',
                    border: `2px solid ${node.done ? 'var(--brand)' : 'var(--text-muted)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {node.done
                      ? <CheckCircle2 size={16} color="rgba(255,255,255,0.9)" />
                      : <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-muted)' }} />
                    }
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>{node.label}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-primary)', marginTop: 2 }}>{node.sub}</div>
                </div>
                {i < 2 && (
                  <div style={{ flex: 1, height: 1, background: 'var(--border)', margin: '0 8px', marginBottom: 24 }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{
          background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 20,
          overflow: 'hidden',
        }}>

          {/* Step indicators */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {([
              { n: 1, label: 'Tipo de credencial' },
              { n: 2, label: 'Datos y archivo' },
            ] as const).map(s => (
              <button
                key={s.n}
                type="button"
                onClick={() => setStep(s.n)}
                style={{
                  flex: 1, padding: '14px 16px', border: 'none', cursor: 'pointer',
                  background: step === s.n ? 'var(--brand-light)' : 'var(--card)',
                  borderBottom: `2px solid ${step === s.n ? '#1800AD' : 'transparent'}`,
                  display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: step === s.n ? '#1800AD' : step > s.n ? '#1800AD' : 'var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800,
                  color: step >= s.n ? '#fff' : 'var(--text-muted)',
                }}>
                  {step > s.n ? <CheckCircle2 size={13} /> : s.n}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: step === s.n ? '#1800AD' : 'var(--text-muted)' }}>
                  {s.label}
                </span>
              </button>
            ))}
          </div>

          <div style={{ padding: 24 }}>

            {/* Step 1: Tipo */}
            {step === 1 && (
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
                  Selecciona qué tipo de credencial vas a subir. Cada tipo activa un nivel de acceso diferente.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                  {CERT_TYPES.map(t => {
                    const Icon = t.icon;
                    const active = selectedType === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => handleTypeChange(t.value)}
                        style={{
                          padding: '16px 14px', borderRadius: 14, cursor: 'pointer',
                          border: `2px solid ${active ? t.color : 'var(--border)'}`,
                          textAlign: 'left', transition: 'all 0.18s ease',
                          transform: active ? 'scale(1.01)' : 'scale(1)',
                        }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, marginBottom: 10,
                          background: active ? t.color : 'var(--border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'background 0.18s',
                        }}>
                          <Icon size={17} color={active ? 'var(--text-on-brand)' : 'var(--text-muted)'} />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: active ? t.dark : 'var(--text-muted)', marginBottom: 3 }}>
                          {t.label}
                        </div>
                        <div style={{ fontSize: 10, color: active ? t.color : 'var(--text-muted)', fontWeight: 700 }}>
                          {t.sublabel}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {/* Description of selected */}
                <div style={{
                  border: `1.5px solid ${selectedMeta.border}`,
                  borderRadius: 12, padding: '12px 16px',
                  marginBottom: 20,
                }}>
                  <div style={{ fontSize: 12, color: selectedMeta.dark, lineHeight: 1.7 }}>
                    {selectedMeta.description}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  style={{
                    width: '100%', padding: '13px',
                    background: selectedMeta.color,
                    color: '#fff', borderRadius: 12, fontWeight: 800,
                    border: 'none', cursor: 'pointer', fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                >
                  Continuar con {selectedMeta.label} <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* Step 2: Datos + Archivo */}
            {step === 2 && (
              <div>
                {/* Selected type pill */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, border: `1.5px solid ${selectedMeta.border}`,
                  borderRadius: 100, padding: '5px 12px 5px 8px', marginBottom: 20,
                }}>
                  {(() => { const Icon = selectedMeta.icon; return <Icon size={13} style={{ color: selectedMeta.color }} />; })()}
                  <span style={{ fontSize: 12, fontWeight: 800, color: selectedMeta.dark }}>{selectedMeta.label}</span>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{ fontSize: 10, color: selectedMeta.color, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, padding: 0 }}
                  >
                    Cambiar
                  </button>
                </div>

                {/* Entidad */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Entidad expedidora *
                  </label>
                  <input value={issuer} onChange={e => setIssuer(e.target.value)} required style={{ ...inputBase, color: 'var(--text-muted)', border: '1px solid var(--border)' }} placeholder={selectedMeta.issuer} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      N° Certificado *
                    </label>
                    <input value={certNumber} onChange={e => setCertNumber(e.target.value)} required style={{ ...inputBase, color: 'var(--text-muted)', border: '1px solid var(--border)' }} placeholder="12345-2024" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Fecha expedición *
                    </label>
                    <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} required style={{ ...inputBase, color: 'var(--text-muted)', border: '1px solid var(--border)' }} />
                  </div>
                </div>

                {/* Drop zone */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Documento *
                  </label>
                  <label
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileDrop(f); }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 8, padding: '28px 20px',
                      border: `2px dashed ${file ? selectedMeta.color : dragging ? '#1800AD' : 'var(--border)'}`,
                      borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s',
                      textAlign: 'center',
                    }}
                  >
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileDrop(f); }} style={{ display: 'none' }} />
                    {file ? (
                      <>
                        <div style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: selectedMeta.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <FileText size={20} color="#fff" />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: selectedMeta.dark }}>{file.name}</div>
                        <div style={{ fontSize: 11, color: selectedMeta.color }}>
                          {(file.size / 1024 / 1024).toFixed(2)} MB · Haz clic para cambiar
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: 'var(--card)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Upload size={20} color="#fff" />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
                          Arrastra aquí o haz clic para seleccionar
                        </div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>PDF, JPG, PNG — máximo 10 MB</div>
                      </>
                    )}
                  </label>
                </div>

                {/* Progress */}
                {uploading && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Subiendo documento...</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#1800AD' }}>{Math.round(progress * 100)}%</span>
                    </div>
                    <div style={{ height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${Math.round(progress * 100)}%`,
                        background: `linear-gradient(90deg, ${selectedMeta.color}, ${selectedMeta.dark})`,
                        transition: 'width 0.25s ease', borderRadius: 3,
                      }} />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={uploading}
                  style={{
                    width: '100%', padding: '13px',
                    background: uploading
                      ? 'rgba(24,0,173,0.4)'
                      : selectedMeta.color,
                    color: '#fff', borderRadius: 12, fontWeight: 800,
                    border: 'none', cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: uploading ? 'none' : `0 6px 16px ${selectedMeta.border}`,
                    marginBottom: 12,
                  }}
                >
                  {uploading
                    ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Enviando...</>
                    : <><Sparkles size={15} /> Enviar para validación</>
                  }
                </button>

                <p style={{ fontSize: 10, color: '#94A3B8', lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
                  Tus documentos se tratan según la <strong>Ley 1581 de 2012 (Habeas Data)</strong>. Solo serán usados para validar tu perfil en SIERCP.
                </p>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Historial de credenciales*/}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-main)', margin: '0 0 2px' }}>
              Credenciales enviadas
            </h3>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Historial de validación profesional</div>
          </div>
          {myCerts.length > 0 && (
            <div style={{
              background: 'var(--card)', borderRadius: 20, padding: '4px 12px',
              fontSize: 12, fontWeight: 800, color: '#1800AD',
            }}>
              {myCerts.length}
            </div>
          )}
        </div>

        {loadingCerts ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 76, borderRadius: 14, background: '#E2E8F0', animation: 'skeletonPulse 1.6s ease-in-out infinite' }} />
            ))}
          </div>
        ) : myCerts.length === 0 ? (
          <div style={{
            background: 'var(--card)', border: '1.5px dashed var(--border)', borderRadius: 18,
            padding: '48px 24px', textAlign: 'center',
          }}>
            <FileText size={36} style={{ color: 'var(--border)', margin: '0 auto 14px', display: 'block' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, margin: 0 }}>
              Aún no has enviado credenciales
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '6px 0 0' }}>
              Completa el formulario para comenzar tu validación
            </p>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            {/* Timeline line */}
            <div style={{
              position: 'absolute', left: 20, top: 20, bottom: 20, width: 2,
              background: 'linear-gradient(180deg, #1800AD22 0%, #1800AD08 100%)',
              zIndex: 0,
            }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {myCerts.map((cert: any, i: number) => {
                const cfg = statusBadge(cert.status);
                const typeInfo = CERT_TYPES.find(t => t.value === cert.type);
                const Icon = typeInfo?.icon ?? FileText;
                const StatusIcon = cfg.icon;

                return (
                  <div key={cert.id} style={{ position: 'relative', paddingLeft: 50, animation: `certReveal 0.4s ease ${i * 0.06}s both` }}>
                    {/* Timeline dot */}
                    <div style={{
                      position: 'absolute', left: 12, top: 18,
                      width: 18, height: 18, borderRadius: '50%', zIndex: 1,
                      background: cfg.dot,
                      boxShadow: `0 0 0 3px #fff, 0 0 0 5px ${cfg.dot}44`,
                    }} />

                    <div style={{
                      background: '#fff', border: `1.5px solid ${cert.status === 'APPROVED' ? '#A7F3D0' : cert.status === 'REJECTED' ? '#FCA5A5' : '#E2E8F0'}`,
                      borderRadius: 14, padding: '14px 16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon size={17} style={{ color: typeInfo?.color ?? '#64748B' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                              {typeInfo?.label ?? cert.type}
                            </div>
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              padding: '3px 10px', borderRadius: 20,
                              background: cfg.bg, color: cfg.color,
                              border: `1px solid ${cfg.border}`,
                              fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                            }}>
                              <StatusIcon size={11} /> {cfg.label}
                            </div>
                          </div>
                          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>
                            {cert.issuer}
                          </div>
                          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#CBD5E1' }}>
                              N° {cert.certNumber}
                            </span>
                            <span style={{ fontSize: 10, color: '#CBD5E1' }}>·</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#CBD5E1' }}>
                              {cert.issueDate}
                            </span>
                          </div>
                          {cert.status === 'REJECTED' && cert.rejectionReason && (
                            <div style={{
                              marginTop: 8, padding: '8px 10px', borderRadius: 8,
                              background: '#FEF2F2', border: '1px solid #FCA5A5',
                              fontSize: 11, color: '#991B1B', lineHeight: 1.5,
                            }}>
                              <strong>Motivo:</strong> {cert.rejectionReason}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}


export default function StudentCertificatesPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'rcp' | 'profesional'>('rcp');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--muted)' }}>
      <Header title="Certificaciones" />



      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>

        <PageHero
          title="Certificaciones"
          subtitle="Liderazgo académico basado en desempeño clínico real"
          parentTitle="Inicio"
          parentHref="/student/home"
        />

        {/* Tabs integradas en el header */}
        <div style={{ display: 'flex', gap: 0 }}>
          {[
            { key: 'rcp', label: 'Certificados RCP', icon: ShieldCheck },
            { key: 'profesional', label: 'Validación Profesional', icon: GraduationCap },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              style={{
                padding: '12px 24px', border: 'none', cursor: 'pointer',
                background: 'transparent',
                borderBottom: `3px solid ${tab === key ? 'var(--clr-primary)' : 'transparent'}`,
                color: tab === key ? 'var(--clr-primary)' : 'var(--text-secondary)',
                fontWeight: tab === key ? 800 : 600,
                fontSize: 14,
                display: 'flex', alignItems: 'center', gap: 7,
                transition: 'all 0.2s',
              }}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div style={{ padding: '32px 40px' }}>
          {tab === 'rcp'
            ? <RcpCertificatesTab user={user} />
            : <ProfessionalValidationTab user={user} />
          }
        </div>
      </div>

      <style jsx>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes certReveal {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
