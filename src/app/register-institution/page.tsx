'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import Navbar from '@/components/page/Navbar';
import toast from 'react-hot-toast';

const SECTORS = [
  { value: 'salud', label: 'Salud / Clínicas / Hospitales' },
  { value: 'educacion', label: 'Educación / Universidad / SENA' },
  { value: 'empresa', label: 'Empresa / Industria / Minería' },
  { value: 'gobierno', label: 'Entidad Gubernamental' },
  { value: 'sst', label: 'Centro SST / ARL / Seguridad' },
  { value: 'otro', label: 'Otro' },
];

const PLAN_LABELS: Record<string, string> = {
  pyme: 'PYME — $380.000/mes',
  business: 'Business — $790.000/mes',
  corporate: 'Corporate — $1.580.000/mes',
  enterprise: 'Enterprise — A medida',
};

function RegisterInstitutionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan') ?? 'business';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [institution, setInstitution] = useState({
    name: '',
    nit: '',
    sector: '',
    city: '',
    address: '',
    phone: '',
    website: '',
  });

  const [admin, setAdmin] = useState({
    firstName: '',
    lastName: '',
    identificacion: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirm: '',
  });

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: '12px',
    border: '1px solid var(--clr-border)', background: 'var(--clr-bg)',
    color: 'var(--clr-text)', fontSize: '0.9rem', outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.78rem', fontWeight: 700, color: 'var(--clr-text-head)',
    marginBottom: '5px', display: 'block',
  };

  function validateStep1() {
    if (!institution.name || !institution.nit || !institution.sector || !institution.city || !institution.phone) {
      setError('Por favor completa todos los campos obligatorios de la institución');
      return false;
    }
    setError(null);
    return true;
  }

  function validateStep2() {
    if (!admin.firstName || !admin.lastName || !admin.identificacion || !admin.email || !admin.password) {
      setError('Por favor completa todos los campos de la cuenta administradora');
      return false;
    }
    if (admin.password !== admin.confirm) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    if (admin.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    setError(null);
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep2()) return;
    setLoading(true);
    setError(null);

    try {
      const { useAuthStore } = await import('@/features/auth/store/auth-store');
      await useAuthStore.getState().register({
        email: admin.email,
        password: admin.password,
        firstName: admin.firstName,
        lastName: admin.lastName,
        identificacion: admin.identificacion,
        phoneNumber: admin.phoneNumber || undefined,
        role: 'USUARIO',
      });

      const { useAuthStore: store } = await import('@/features/auth/store/auth-store');
      const uid = store.getState().firebaseUser?.uid;
      if (!uid) throw new Error('No se pudo obtener el usuario creado');

      await setDoc(doc(db, 'institution_applications', uid), {
        adminUid: uid,
        adminEmail: admin.email,
        adminName: `${admin.firstName} ${admin.lastName}`.trim(),
        institutionName: institution.name,
        nit: institution.nit,
        sector: institution.sector,
        city: institution.city,
        address: institution.address || '',
        phone: institution.phone,
        website: institution.website || '',
        plan: planParam,
        status: 'PENDING',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success('Solicitud enviada correctamente');
      setStep(3);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ocurrió un error inesperado';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: 'var(--clr-bg)', minHeight: '100vh' }}>
      <Navbar forceScrolled />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '120px 24px 80px' }}>

        {/* Header */}
        <div className="text-center mb-5">
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'var(--clr-primary-alpha)', color: 'var(--clr-primary)',
            padding: '6px 18px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 800,
            marginBottom: '16px',
          }}>
            <i className="bi bi-building-fill" /> Registro Institucional
          </span>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, color: 'var(--clr-text-head)', letterSpacing: '-1px', marginBottom: '10px' }}>
            Registra tu institución
          </h1>
          <p style={{ color: 'var(--clr-muted)', fontSize: '0.97rem', maxWidth: '480px', margin: '0 auto' }}>
            Completa el formulario y nuestro equipo activará tu cuenta en menos de 24 horas.
          </p>

          {/* Plan badge */}
          {PLAN_LABELS[planParam] && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '16px',
              background: '#1800ad', color: '#fff', padding: '8px 20px', borderRadius: '100px',
              fontSize: '0.82rem', fontWeight: 800,
            }}>
              <i className="bi bi-tag-fill" />
              Plan seleccionado: {PLAN_LABELS[planParam]}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="d-flex align-items-center gap-3 mb-5">
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: s < 3 ? 1 : undefined }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                background: step >= s ? '#1800ad' : 'var(--clr-bg-surface)',
                border: step >= s ? 'none' : '2px solid var(--clr-border)',
                color: step >= s ? '#fff' : 'var(--clr-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 900, transition: 'all 0.3s',
              }}>
                {step > s ? <i className="bi bi-check-lg" /> : s}
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: step >= s ? 'var(--clr-text-head)' : 'var(--clr-muted)', whiteSpace: 'nowrap' }}>
                {s === 1 ? 'Institución' : s === 2 ? 'Cuenta Admin' : 'Confirmación'}
              </span>
              {s < 3 && <div style={{ flex: 1, height: '2px', background: step > s ? '#1800ad' : 'var(--clr-border)', transition: 'background 0.3s' }} />}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="d-flex align-items-center gap-3 mb-4 px-4 py-3" style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '14px', color: '#ef4444', fontSize: '0.88rem',
          }}>
            <i className="bi bi-exclamation-circle-fill" style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* ── STEP 1: Datos de la institución ── */}
          {step === 1 && (
            <div style={{ background: 'var(--clr-bg-surface)', border: '1px solid var(--clr-border)', borderRadius: '24px', padding: '32px' }}>
              <div className="d-flex align-items-center gap-3 mb-4">
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--clr-primary-alpha)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-building-fill" style={{ color: '#1800ad', fontSize: '1rem' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem', color: 'var(--clr-text-head)' }}>Datos de la institución</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--clr-muted)' }}>Información legal y de contacto de tu organización</p>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-12">
                  <label style={labelStyle}>Nombre de la institución / empresa <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text" required value={institution.name}
                    onChange={e => setInstitution(p => ({ ...p, name: e.target.value }))}
                    placeholder="Ej: Clínica San José SAS"
                    style={inputStyle}
                  />
                </div>
                <div className="col-md-6">
                  <label style={labelStyle}>NIT / Identificación fiscal <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text" required value={institution.nit}
                    onChange={e => setInstitution(p => ({ ...p, nit: e.target.value }))}
                    placeholder="900.123.456-7"
                    style={inputStyle}
                  />
                </div>
                <div className="col-md-6">
                  <label style={labelStyle}>Sector <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    required value={institution.sector}
                    onChange={e => setInstitution(p => ({ ...p, sector: e.target.value }))}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="">Selecciona un sector</option>
                    {SECTORS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label style={labelStyle}>Ciudad <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text" required value={institution.city}
                    onChange={e => setInstitution(p => ({ ...p, city: e.target.value }))}
                    placeholder="Ej: Bogotá"
                    style={inputStyle}
                  />
                </div>
                <div className="col-md-6">
                  <label style={labelStyle}>Teléfono de contacto <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="tel" required value={institution.phone}
                    onChange={e => setInstitution(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+57 310 000 0000"
                    style={inputStyle}
                  />
                </div>
                <div className="col-12">
                  <label style={labelStyle}>Dirección <span style={{ color: 'var(--clr-muted)', fontWeight: 400 }}>(opcional)</span></label>
                  <input
                    type="text" value={institution.address}
                    onChange={e => setInstitution(p => ({ ...p, address: e.target.value }))}
                    placeholder="Calle 123 #45-67, Piso 2"
                    style={inputStyle}
                  />
                </div>
                <div className="col-12">
                  <label style={labelStyle}>Sitio web <span style={{ color: 'var(--clr-muted)', fontWeight: 400 }}>(opcional)</span></label>
                  <input
                    type="url" value={institution.website}
                    onChange={e => setInstitution(p => ({ ...p, website: e.target.value }))}
                    placeholder="https://www.miempresa.com"
                    style={inputStyle}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => validateStep1() && setStep(2)}
                style={{
                  width: '100%', marginTop: '24px', padding: '14px', borderRadius: '14px',
                  background: '#1800ad', color: '#fff', fontWeight: 800, fontSize: '0.95rem',
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                Siguiente: Cuenta administradora <i className="bi bi-arrow-right" />
              </button>
            </div>
          )}

          {/* ── STEP 2: Cuenta admin ── */}
          {step === 2 && (
            <div style={{ background: 'var(--clr-bg-surface)', border: '1px solid var(--clr-border)', borderRadius: '24px', padding: '32px' }}>
              <div className="d-flex align-items-center gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{ background: 'var(--clr-bg)', border: '1px solid var(--clr-border)', width: '34px', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                >
                  <i className="bi bi-chevron-left" style={{ color: 'var(--clr-text)', fontSize: '0.8rem' }} />
                </button>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem', color: 'var(--clr-text-head)' }}>Cuenta administradora</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--clr-muted)' }}>El administrador principal de la plataforma</p>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label style={labelStyle}>Nombre(s) <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text" required value={admin.firstName}
                    onChange={e => setAdmin(p => ({ ...p, firstName: e.target.value }))}
                    placeholder="Ej: María"
                    style={inputStyle}
                  />
                </div>
                <div className="col-md-6">
                  <label style={labelStyle}>Apellido(s) <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text" required value={admin.lastName}
                    onChange={e => setAdmin(p => ({ ...p, lastName: e.target.value }))}
                    placeholder="Ej: González"
                    style={inputStyle}
                  />
                </div>
                <div className="col-md-6">
                  <label style={labelStyle}>Documento de identidad <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text" required value={admin.identificacion}
                    onChange={e => setAdmin(p => ({ ...p, identificacion: e.target.value }))}
                    placeholder="Cédula / DNI"
                    style={inputStyle}
                  />
                </div>
                <div className="col-md-6">
                  <label style={labelStyle}>Teléfono / WhatsApp <span style={{ color: 'var(--clr-muted)', fontWeight: 400 }}>(opcional)</span></label>
                  <input
                    type="tel" value={admin.phoneNumber}
                    onChange={e => setAdmin(p => ({ ...p, phoneNumber: e.target.value }))}
                    placeholder="+57 300 000 0000"
                    style={inputStyle}
                  />
                </div>
                <div className="col-12">
                  <label style={labelStyle}>Correo electrónico <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="email" required value={admin.email}
                    onChange={e => setAdmin(p => ({ ...p, email: e.target.value }))}
                    placeholder="admin@miempresa.com"
                    style={inputStyle}
                  />
                </div>
                <div className="col-md-6">
                  <label style={labelStyle}>Contraseña <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="password" required value={admin.password}
                    onChange={e => setAdmin(p => ({ ...p, password: e.target.value }))}
                    placeholder="••••••••"
                    style={inputStyle}
                  />
                </div>
                <div className="col-md-6">
                  <label style={labelStyle}>Confirmar contraseña <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="password" required value={admin.confirm}
                    onChange={e => setAdmin(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="••••••••"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Info box */}
              <div style={{
                marginTop: '20px', padding: '14px 18px', borderRadius: '14px',
                background: 'rgba(24,0,173,0.06)', border: '1px solid rgba(24,0,173,0.12)',
                display: 'flex', gap: '12px', alignItems: 'flex-start',
              }}>
                <i className="bi bi-info-circle-fill" style={{ color: '#1800ad', marginTop: '2px', flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--clr-text)', lineHeight: 1.6 }}>
                  Tu cuenta se creará con acceso de usuario. Nuestro equipo revisará la solicitud y asignará los permisos de administrador en <strong>menos de 24 horas hábiles</strong>.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', marginTop: '24px', padding: '14px', borderRadius: '14px',
                  background: '#1800ad', color: '#fff', fontWeight: 800, fontSize: '0.95rem',
                  border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                {loading
                  ? <><span className="spinner-border spinner-border-sm" /> Enviando solicitud...</>
                  : <><i className="bi bi-send-fill" /> Enviar solicitud de registro</>
                }
              </button>
            </div>
          )}

          {/* ── STEP 3: Éxito ── */}
          {step === 3 && (
            <div style={{
              background: 'var(--clr-bg-surface)', border: '1px solid var(--clr-border)',
              borderRadius: '24px', padding: '48px 32px', textAlign: 'center',
            }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
              }}>
                <i className="bi bi-check-lg" style={{ color: '#fff', fontSize: '2rem' }} />
              </div>
              <h2 style={{ fontWeight: 900, fontSize: '1.6rem', color: 'var(--clr-text-head)', marginBottom: '12px' }}>
                ¡Solicitud enviada!
              </h2>
              <p style={{ color: 'var(--clr-muted)', fontSize: '0.97rem', lineHeight: 1.7, maxWidth: '420px', margin: '0 auto 32px' }}>
                Tu cuenta ha sido creada y tu solicitud de activación institucional está en revisión.
                Recibirás un correo de confirmación en <strong style={{ color: 'var(--clr-text-head)' }}>{admin.email}</strong> en menos de 24 horas hábiles.
              </p>

              <div style={{
                background: 'var(--clr-bg)', border: '1px solid var(--clr-border)',
                borderRadius: '16px', padding: '20px 24px', marginBottom: '28px', textAlign: 'left',
              }}>
                <div className="d-flex flex-column gap-2">
                  {[
                    { icon: 'bi-building-fill', label: 'Institución', value: institution.name },
                    { icon: 'bi-tag-fill', label: 'Plan', value: PLAN_LABELS[planParam] ?? planParam },
                    { icon: 'bi-person-fill', label: 'Administrador', value: `${admin.firstName} ${admin.lastName}` },
                    { icon: 'bi-envelope-fill', label: 'Correo', value: admin.email },
                  ].map(item => (
                    <div key={item.label} className="d-flex align-items-center gap-3">
                      <i className={`bi ${item.icon}`} style={{ color: '#1800ad', width: '16px', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.82rem', color: 'var(--clr-muted)', width: '90px', flexShrink: 0 }}>{item.label}</span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--clr-text-head)' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="d-flex gap-3 justify-content-center flex-wrap">
                <button
                  type="button"
                  onClick={() => router.push('/home')}
                  style={{
                    padding: '12px 28px', borderRadius: '12px', background: '#1800ad', color: '#fff',
                    fontWeight: 800, fontSize: '0.92rem', border: 'none', cursor: 'pointer',
                  }}
                >
                  <i className="bi bi-house-fill me-2" /> Ir al inicio
                </button>
                <Link
                  href="/contacto"
                  style={{
                    padding: '12px 28px', borderRadius: '12px', border: '1px solid var(--clr-border)',
                    background: 'var(--clr-bg)', color: 'var(--clr-text)', fontWeight: 700,
                    fontSize: '0.92rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  <i className="bi bi-headset" /> Contactar soporte
                </Link>
              </div>
            </div>
          )}
        </form>

        <p className="text-center mt-4" style={{ fontSize: '0.88rem', color: 'var(--clr-muted)' }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" style={{ color: '#1800ad', fontWeight: 800 }}>Inicia sesión aquí</Link>
          {' '}·{' '}
          <Link href="/planes" style={{ color: 'var(--clr-muted)' }}>Ver todos los planes</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterInstitutionPage() {
  return (
    <Suspense fallback={<div className="text-center py-5">Cargando...</div>}>
      <RegisterInstitutionContent />
    </Suspense>
  );
}
