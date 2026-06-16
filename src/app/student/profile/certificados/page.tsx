'use client';

import { useAuth } from '@/shared/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  Award, Upload, CheckCircle, Clock, XCircle,
  FileText, ShieldCheck, Info, ChevronRight, AlertTriangle,
} from 'lucide-react';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, query, where, getDocs, serverTimestamp, orderBy } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import type { UserCertificate, CertVerificationStatus } from '@/shared/types/user';

// ── Types ────────────────────────────────────────────────────────────────────

type CertType = 'PROFESIONAL' | 'SST_LICENCIA' | 'AHA' | 'OTRO';
type CertBenefit = { icon: React.ReactNode; text: string; available: boolean };

const CERT_TYPES: { value: CertType; label: string; issuer: string; description: string }[] = [
  {
    value: 'SST_LICENCIA',
    label: 'Licencia SST (Seguridad y Salud en el Trabajo)',
    issuer: 'Ministerio de Salud y Protección Social',
    description: 'Licencia de ejercicio expedida por el Ministerio de Salud. Habilita el nivel USUARIO_SST con planes de beneficios SST.',
  },
  {
    value: 'PROFESIONAL',
    label: 'Título Profesional',
    issuer: 'Ministerio de Educación Nacional',
    description: 'Diploma o acta de grado de carrera técnica, tecnológica o profesional. Habilita el nivel USUARIO_PROFESIONAL (hasta 10 cursos).',
  },
  {
    value: 'AHA',
    label: 'Certificación AHA (American Heart Association)',
    issuer: 'American Heart Association',
    description: 'Certificado BLS, ACLS o PALS emitido por la AHA. Agrega credencial al perfil como instructor calificado.',
  },
  {
    value: 'OTRO',
    label: 'Otro certificado reconocido',
    issuer: 'Otra entidad certificadora',
    description: 'Cualquier otro certificado de entidades reconocidas por el Ministerio de Salud o Educación de Colombia.',
  },
];

const STATUS_CONFIG: Record<CertVerificationStatus, { label: string; color: string; icon: React.ReactNode }> = {
  NONE:     { label: 'Sin verificar',  color: '#94a3b8', icon: <Clock size={14} /> },
  PENDING:  { label: 'En revisión',    color: '#f59e0b', icon: <Clock size={14} /> },
  APPROVED: { label: 'Aprobado',       color: '#22c55e', icon: <CheckCircle size={14} /> },
  REJECTED: { label: 'Rechazado',      color: '#ef4444', icon: <XCircle size={14} /> },
};

const BENEFITS_BY_CERT: Record<CertType, CertBenefit[]> = {
  SST_LICENCIA: [
    { icon: <Award size={14} />, text: 'Nivel USUARIO_SST (más beneficios)', available: true },
    { icon: <ShieldCheck size={14} />, text: 'Acceso a planes SST exclusivos', available: true },
    { icon: <FileText size={14} />, text: 'Cursos ilimitados con plan SST', available: true },
    { icon: <CheckCircle size={14} />, text: 'Certificación de estudiantes sin pago por unidad', available: true },
  ],
  PROFESIONAL: [
    { icon: <Award size={14} />, text: 'Nivel USUARIO_PROFESIONAL', available: true },
    { icon: <FileText size={14} />, text: 'Hasta 10 cursos creados', available: true },
    { icon: <ShieldCheck size={14} />, text: 'Certificación de estudiantes (pago por unidad)', available: true },
    { icon: <CheckCircle size={14} />, text: 'Perfil profesional verificado', available: true },
  ],
  AHA: [
    { icon: <Award size={14} />, text: 'Credencial AHA visible en perfil', available: true },
    { icon: <ShieldCheck size={14} />, text: 'Insignia de instructor certificado AHA', available: true },
    { icon: <CheckCircle size={14} />, text: 'Prioridad en asignación de cursos', available: true },
    { icon: <FileText size={14} />, text: 'Acceso a contenido AHA exclusivo', available: true },
  ],
  OTRO: [
    { icon: <CheckCircle size={14} />, text: 'Credencial adicional en perfil', available: true },
    { icon: <Award size={14} />, text: 'Insignia de perfil enriquecido', available: true },
    { icon: <FileText size={14} />, text: 'Revisión manual por equipo SIERCP', available: false },
    { icon: <ShieldCheck size={14} />, text: 'Beneficios según nivel aprobado', available: true },
  ],
};

// ── Component ────────────────────────────────────────────────────────────────

export default function CertificadosPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [existing, setExisting] = useState<UserCertificate[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // Form state
  const [certType, setCertType] = useState<CertType>('PROFESIONAL');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storage = getStorage(app);

  // Load existing certificates
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'user_certificates'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
    );
    getDocs(q)
      .then((snap) => {
        setExisting(snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserCertificate)));
      })
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, [user, db]);

  const selectedTypeMeta = CERT_TYPES.find((t) => t.value === certType)!;
  const benefits = BENEFITS_BY_CERT[certType];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { toast.error('El archivo no debe superar 10 MB'); return; }
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(f.type)) {
      toast.error('Solo se permiten archivos PDF, JPG o PNG');
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file) return;

    const idempotencyKey = uuidv4();

    try {
      setUploading(true);
      setUploadProgress(0);

      // 1) Upload file to Firebase Storage
      const ext = file.name.split('.').pop();
      const path = `user_certificates/${user.uid}/${idempotencyKey}.${ext}`;
      const fileRef = storageRef(storage, path);
      const task = uploadBytesResumable(fileRef, file, {
        customMetadata: { userId: user.uid, idempotencyKey },
      });

      const fileUrl = await new Promise<string>((resolve, reject) => {
        task.on(
          'state_changed',
          (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          reject,
          () => getDownloadURL(task.snapshot.ref).then(resolve).catch(reject),
        );
      });

      // 2) Save metadata to Firestore (idempotencyKey prevents duplicate docs)
      await addDoc(collection(db, 'user_certificates'), {
        idempotencyKey,
        userId: user.uid,
        type: certType,
        issuer: issuer || selectedTypeMeta.issuer,
        certificateNumber,
        issueDate,
        expiryDate: expiryDate || null,
        fileUrl,
        verificationStatus: 'PENDING' as CertVerificationStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success('Certificado enviado. Nuestro equipo lo revisará en 24–48 h.');
      // Reset form
      setCertificateNumber('');
      setIssuer('');
      setIssueDate('');
      setExpiryDate('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploadProgress(0);

      // Refresh list
      const snap = await getDocs(query(
        collection(db, 'user_certificates'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
      ));
      setExisting(snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserCertificate)));
    } catch {
      toast.error('Error al subir el certificado. Intenta nuevamente.');
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc' }}>

      {/* ── Page hero ──────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #05070f 0%, #0f0f2e 100%)',
        padding: '64px 0 48px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }} />
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          <button
            onClick={() => router.back()}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24 }}
          >
            ← Volver al perfil
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(24,0,173,0.3)', border: '1px solid rgba(24,0,173,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={24} color="#818cf8" />
            </div>
            <div>
              <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(1.4rem, 3vw, 2rem)', margin: 0, lineHeight: 1.2 }}>
                Certificados Profesionales
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.88rem', margin: '4px 0 0' }}>
                Sube tus títulos y licencias para obtener más beneficios en SIERCP
              </p>
            </div>
          </div>

          {/* Info banner */}
          <div style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 24 }}>
            <Info size={16} color="#60a5fa" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ color: '#93c5fd', fontSize: '0.82rem', margin: 0, lineHeight: 1.6 }}>
              Los certificados son validados manualmente por el equipo de SIERCP en un plazo de <strong>24–48 horas hábiles</strong>.
              Documentos aceptados por el <strong>Ministerio de Educación Nacional</strong> y el <strong>Ministerio de Salud y Protección Social de Colombia</strong>.
              Formatos admitidos: PDF, JPG o PNG (máx. 10 MB).
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 24 }}>

          {/* ── Upload form ─────────────────────────────────────────────────── */}
          <div>
            <div style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: 16, padding: 28 }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', marginBottom: 24 }}>
                Subir nuevo certificado
              </h2>

              <form onSubmit={handleSubmit}>

                {/* Certificate type */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: 8 }}>
                    Tipo de certificado *
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {CERT_TYPES.map((t) => (
                      <label
                        key={t.value}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer',
                          padding: '12px 14px', borderRadius: 10,
                          border: `2px solid ${certType === t.value ? '#1800ad' : '#e5e7eb'}`,
                          background: certType === t.value ? 'rgba(24,0,173,0.04)' : '#fff',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <input
                          type="radio"
                          name="certType"
                          value={t.value}
                          checked={certType === t.value}
                          onChange={() => { setCertType(t.value); setIssuer(t.issuer); }}
                          style={{ marginTop: 3, accentColor: '#1800ad' }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>{t.label}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{t.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Issuer */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: 6 }}>
                    Entidad expedidora *
                  </label>
                  <input
                    className="field-input"
                    type="text"
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                    placeholder="Ej. Ministerio de Salud y Protección Social"
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>

                {/* Certificate number */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: 6 }}>
                    Número de certificado / matrícula *
                  </label>
                  <input
                    className="field-input"
                    type="text"
                    value={certificateNumber}
                    onChange={(e) => setCertificateNumber(e.target.value)}
                    placeholder="Ej. SP-2023-001234"
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>

                {/* Dates */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: 6 }}>
                      Fecha de expedición *
                    </label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      required
                      max={new Date().toISOString().split('T')[0]}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: '0.9rem', outline: 'none', background: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: 6 }}>
                      Fecha de vencimiento
                    </label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      min={issueDate || undefined}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: '0.9rem', outline: 'none', background: '#fff' }}
                    />
                  </div>
                </div>

                {/* File upload */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: 8 }}>
                    Archivo del certificado * (PDF, JPG o PNG · máx. 10 MB)
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${file ? '#1800ad' : '#d1d5db'}`,
                      borderRadius: 10,
                      padding: '24px 16px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: file ? 'rgba(24,0,173,0.03)' : '#fafafa',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {file ? (
                      <>
                        <CheckCircle size={24} color="#1800ad" style={{ margin: '0 auto 8px', display: 'block' }} />
                        <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1800ad', margin: 0 }}>{file.name}</p>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0' }}>
                          {(file.size / 1024 / 1024).toFixed(2)} MB · Haz clic para cambiar
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload size={24} color="#94a3b8" style={{ margin: '0 auto 8px', display: 'block' }} />
                        <p style={{ fontWeight: 600, fontSize: '0.88rem', color: '#374151', margin: 0 }}>
                          Haz clic para seleccionar el archivo
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 0' }}>PDF, JPG o PNG</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* Upload progress */}
                {uploading && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Subiendo certificado...</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1800ad' }}>{uploadProgress}%</span>
                    </div>
                    <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${uploadProgress}%`, background: '#1800ad', borderRadius: 3, transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={uploading || !file || !certificateNumber || !issueDate || !issuer}
                  style={{
                    width: '100%', padding: '13px', borderRadius: 10,
                    background: '#1800ad', color: '#fff', border: 'none',
                    fontWeight: 800, fontSize: '0.95rem',
                    cursor: uploading ? 'wait' : 'pointer',
                    opacity: (uploading || !file || !certificateNumber || !issueDate || !issuer) ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {uploading ? 'Subiendo...' : <><Upload size={16} /> Enviar para validación</>}
                </button>
              </form>
            </div>
          </div>

          {/* ── Right column: benefits + existing certs ──────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Benefits card */}
            <div style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', marginBottom: 16 }}>
                Beneficios — {CERT_TYPES.find((t) => t.value === certType)?.label.split(' ')[0]}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {benefits.map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: b.available ? 'rgba(34,197,94,0.1)' : 'rgba(148,163,184,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: b.available ? '#16a34a' : '#94a3b8',
                    }}>
                      {b.icon}
                    </div>
                    <span style={{ fontSize: '0.82rem', color: b.available ? '#0f172a' : '#94a3b8', fontWeight: b.available ? 600 : 400 }}>
                      {b.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Existing certificates */}
            <div style={{ background: '#fff', border: '1px solid #eaecf0', borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', marginBottom: 16 }}>
                Mis certificados enviados
              </h3>
              {loadingList ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: '0.85rem' }}>Cargando...</div>
              ) : existing.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <Award size={32} color="#e2e8f0" style={{ margin: '0 auto 8px', display: 'block' }} />
                  <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>Aún no has enviado certificados</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {existing.map((cert) => {
                    const sc = STATUS_CONFIG[cert.verificationStatus];
                    const typeMeta = CERT_TYPES.find((t) => t.value === cert.type);
                    return (
                      <div key={cert.id} style={{
                        padding: '12px 14px', borderRadius: 10,
                        border: '1px solid #f1f5f9', background: '#fafafa',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>
                              {typeMeta?.label ?? cert.type}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                              N.° {cert.certificateNumber}
                            </div>
                          </div>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '3px 8px', borderRadius: 20,
                            background: `${sc.color}18`,
                            color: sc.color, fontSize: '0.68rem', fontWeight: 700,
                            whiteSpace: 'nowrap',
                          }}>
                            {sc.icon}
                            {sc.label}
                          </div>
                        </div>
                        {cert.verificationStatus === 'REJECTED' && cert.rejectionReason && (
                          <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                            <AlertTriangle size={12} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                            <span style={{ fontSize: '0.72rem', color: '#ef4444' }}>{cert.rejectionReason}</span>
                          </div>
                        )}
                        {cert.fileUrl && (
                          <a
                            href={cert.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: '0.72rem', color: '#1800ad', fontWeight: 600, textDecoration: 'none' }}
                          >
                            <FileText size={12} /> Ver documento
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Legal note */}
            <div style={{ background: 'rgba(24,0,173,0.04)', border: '1px solid rgba(24,0,173,0.12)', borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: '0.75rem', color: '#475569', margin: 0, lineHeight: 1.6 }}>
                <strong>Nota legal:</strong> Los documentos son validados conforme a la{' '}
                <strong>Ley 1581 de 2012</strong> (protección de datos) y los registros de títulos del{' '}
                <strong>Ministerio de Educación Nacional</strong> y la{' '}
                <strong>Resolución 4502 de 2012</strong> del Ministerio de Salud.
                SIERCP no comparte ni vende la información de tus documentos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
