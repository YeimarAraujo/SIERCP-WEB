'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Form, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import { useAuth } from '@/hooks/use-auth';
import { CourseService } from '@/services/firestore.service';
import type { Curso, Grupo } from '@/data/cursos';
import toast from 'react-hot-toast';

interface EnrollmentFlowProps {
  show: boolean;
  onHide: () => void;
  curso: Curso;
  grupo?: Grupo;
}

type Step = 'auth' | 'legal' | 'payment' | 'success';

export default function EnrollmentFlow({ show, onHide, curso, grupo }: EnrollmentFlowProps) {
  const { user, initialized } = useAuth();
  const [step, setStep] = useState<Step>('auth');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Data
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer' | 'cash'>('card');

  useEffect(() => {
    if (show && initialized) {
      if (!user) {
        setStep('auth');
      } else {
        setStep('legal');
      }
    }
  }, [show, user, initialized]);

  const handleAuthSuccess = () => {
    setStep('legal');
  };

  const handleLegalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) {
      setError('Debes aceptar los términos y condiciones legales.');
      return;
    }
    setError(null);
    // Redirigir a la página de pago
    const query = new URLSearchParams({
      curso: curso.slug,
      grupo: grupo?.id || ''
    }).toString();
    window.location.href = `/checkout?${query}`;
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!user) throw new Error('Usuario no identificado');
      
      // Simulamos un pequeño retraso para verificar el pago (World-class UX)
      await new Promise(resolve => setTimeout(resolve, 2000));

      await CourseService.enroll(curso.slug, {
        studentId: user.uid,
        studentName: `${user.firstName} ${user.lastName}`,
        studentEmail: user.email,
        enrolledAt: new Date(),
        status: 'active',
        grupoId: grupo?.id,
        completedModules: 0,
        avgScore: 0,
        sessionCount: 0
      });

      setStep('success');
      toast.success('¡Pago verificado e inscripción completada!');
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'auth':
        return (
          <AuthStep 
            onSuccess={handleAuthSuccess} 
            onSwitchToLogin={() => {}} 
          />
        );
      case 'legal':
        return (
          <LegalStep 
            user={user} 
            onSubmit={handleLegalSubmit} 
            acceptTerms={acceptTerms}
            setAcceptTerms={setAcceptTerms}
            error={error}
          />
        );
      case 'payment':
        return (
          <PaymentStep 
            curso={curso}
            onSubmit={handlePaymentSubmit}
            loading={loading}
            error={error}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
          />
        );
      case 'success':
        return <SuccessStep curso={curso} onHide={onHide} />;
    }
  };

  const getProgress = () => {
    switch (step) {
      case 'auth': return 25;
      case 'legal': return 50;
      case 'payment': return 75;
      case 'success': return 100;
      default: return 0;
    }
  };

  return (
    <Modal show={show} onHide={onHide} size={undefined} className="enrollment-modal">
      <Modal.Header closeButton className="pb-0 border-0">
        <div className="w-100 pe-4">
          <ProgressBar now={getProgress()} className="enrollment-progress" />
        </div>
      </Modal.Header>
      <Modal.Body className="p-4 p-md-5 pt-2">
        {renderStep()}
      </Modal.Body>

      <style jsx global>{`
        .enrollment-modal .modal-content {
          border-radius: 28px;
          border: 1px solid var(--clr-border);
          box-shadow: var(--shadow-xl);
          overflow: hidden;
          background: var(--clr-bg-surface) !important;
          color: var(--clr-text);
          margin-top: 100px;
        }
        [data-theme='dark'] .enrollment-modal .modal-content {
          background: #020617 !important; /* Solid slate-950 for dark mode */
          border-color: rgba(255, 255, 255, 0.1);
        }
        .enrollment-modal .modal-header {
          border-bottom: none;
          background: transparent !important;
        }

        .enrollment-modal .btn-close {
          filter: var(--theme-icon-filter, none);
        }
        .enrollment-progress {
          height: 6px;
          background: var(--clr-border);
          border-radius: 10px;
        }
        .enrollment-progress .progress-bar {
          background: var(--clr-primary);
          transition: width 0.4s ease;
        }
        .step-title {
          font-weight: 900;
          letter-spacing: -1px;
          margin-bottom: 8px;
          color: var(--clr-text-head);
        }
        .legal-box {
          height: 180px;
          overflow-y: auto;
          background: var(--clr-bg-light);
          padding: 20px;
          border-radius: 16px;
          font-size: 0.9rem;
          color: var(--clr-text);
          opacity: 0.9;
          border: 1px solid var(--clr-border);
          margin-bottom: 15px;
          line-height: 1.6;
        }
        .legal-box::-webkit-scrollbar {
          width: 6px;
        }
        .legal-box::-webkit-scrollbar-thumb {
          background: var(--clr-primary);
          border-radius: 10px;
        }


        .payment-option {
          border: 2px solid var(--clr-border);
          border-radius: 16px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .payment-option.active {
          border-color: var(--clr-primary);
          background: var(--clr-primary-alpha);
        }
      `}</style>
    </Modal>
  );
}

// --- Subcomponents ---

function AuthStep({ onSuccess }: { onSuccess: () => void; onSwitchToLogin: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [formData, setFormData] = useState({ email: '', password: '', firstName: '', lastName: '', identificacion: '', phoneNumber: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
      } else {
        await register({ ...formData, phoneNumber: formData.phoneNumber || undefined, role: 'USUARIO' });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate__animated animate__fadeIn">
      <div className="text-center mb-4">
        <h2 className="step-title">{mode === 'register' ? 'Crea tu cuenta' : 'Inicia Sesión'}</h2>
        <p className="text-muted">Primero necesitamos identificarte para tu registro legal.</p>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        {mode === 'register' && (
          <div className="row g-2 mb-2">
            <div className="col-6"><Form.Control placeholder="Nombre" required onChange={e => setFormData({...formData, firstName: e.target.value})} className="form-control-custom" /></div>
            <div className="col-6"><Form.Control placeholder="Apellido" required onChange={e => setFormData({...formData, lastName: e.target.value})} className="form-control-custom" /></div>
            <div className="col-12"><Form.Control placeholder="Identificación (Cédula/DNI)" required onChange={e => setFormData({...formData, identificacion: e.target.value})} className="form-control-custom" /></div>
            <div className="col-12"><Form.Control type="tel" placeholder="Teléfono / WhatsApp (opcional)" onChange={e => setFormData({...formData, phoneNumber: e.target.value})} className="form-control-custom" /></div>
          </div>
        )}
        <Form.Control type="email" placeholder="Email" required className="form-control-custom mb-2" onChange={e => setFormData({...formData, email: e.target.value})} />
        <Form.Control type="password" placeholder="Contraseña" required className="form-control-custom mb-4" onChange={e => setFormData({...formData, password: e.target.value})} />
        
        <button type="submit" disabled={loading} className="btn-brand w-100 mb-3" style={{ justifyContent: 'center' }}>
          {loading ? <Spinner size="sm" /> : (mode === 'register' ? 'Registrarme e Inscribirme' : 'Entrar')}
        </button>
        
        <div className="text-center">
          <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ background: 'none', border: 'none', color: 'var(--clr-primary)', fontWeight: 700, fontSize: '0.9rem' }}>
            {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </Form>
    </div>
  );
}

function LegalStep({ user, onSubmit, acceptTerms, setAcceptTerms, error }: any) {
  return (
    <div className="animate__animated animate__fadeIn">
      <div className="text-center mb-4">
        <h2 className="step-title">Información Legal</h2>
        <p className="text-muted">Verifica tus datos para la certificación oficial.</p>
      </div>

      <div className="mb-4 p-4" style={{ 
        background: 'linear-gradient(135deg, var(--clr-primary-alpha), transparent)', 
        borderRadius: '20px', 
        border: '1px solid var(--clr-primary-alpha)',
        backdropFilter: 'blur(10px)'
      }}>
        <p className="mb-2" style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--clr-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Titular del Certificado</p>
        <h4 style={{ fontWeight: 900, margin: 0, color: 'var(--clr-text-head)' }}>{user?.firstName} {user?.lastName}</h4>
        <div className="d-flex align-items-center gap-2 mt-1 opacity-75">
          <i className="bi bi-person-badge" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>ID: {user?.identificacion || 'No registrado'}</span>
        </div>
      </div>

      <h6>Términos y Condiciones</h6>
      <div className="legal-box">
        <p>1. SIERCP se reserva el derecho de admisión...</p>
        <p>2. El estudiante se compromete a cumplir con el 80% de asistencia...</p>
        <p>3. Los pagos realizados no son reembolsables después de 48 horas...</p>
        <p>4. La información suministrada será tratada bajo la Ley de Protección de Datos...</p>
      </div>

      {error && <Alert variant="danger" className="py-2" style={{ fontSize: '0.85rem' }}>{error}</Alert>}

      <Form onSubmit={onSubmit}>
        <Form.Check 
          type="checkbox" 
          id="terms" 
          label="Acepto los términos legales y el tratamiento de mis datos personales." 
          className="mb-4"
          checked={acceptTerms}
          onChange={e => setAcceptTerms(e.target.checked)}
          style={{ fontSize: '0.85rem', fontWeight: 600 }}
        />
        <button type="submit" className="btn-brand w-100" style={{ justifyContent: 'center' }}>
          Continuar al Pago <i className="bi bi-arrow-right ms-2" />
        </button>
      </Form>
    </div>
  );
}

function PaymentStep({ curso, onSubmit, loading, error, paymentMethod, setPaymentMethod }: any) {
  return (
    <div className="animate__animated animate__fadeIn">
      <div className="text-center mb-4">
        <h2 className="step-title">Pago de Matrícula</h2>
        <p className="text-muted">Selecciona tu método de pago preferido.</p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="p-3" style={{ background: 'var(--clr-bg-light)', borderRadius: '16px', border: '1px solid var(--clr-border)' }}>
            <p className="text-muted mb-1" style={{ fontSize: '0.8rem' }}>Total a pagar</p>
            <h3 style={{ fontWeight: 900, color: 'var(--clr-primary)' }}>
              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(curso.precioCOP)}
            </h3>
          </div>
        </div>
        <div className="col-md-6">
          <div className="p-3" style={{ background: 'var(--clr-bg-light)', borderRadius: '16px', border: '1px solid var(--clr-border)' }}>
            <p className="text-muted mb-1" style={{ fontSize: '0.8rem' }}>Concepto</p>
            <h6 style={{ fontWeight: 800 }}>Inscripción: {curso.nombre}</h6>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className={`payment-option ${paymentMethod === 'card' ? 'active' : ''}`} onClick={() => setPaymentMethod('card')}>
          <i className="bi bi-credit-card" style={{ fontSize: '1.5rem' }} />
          <div style={{ flex: 1 }}><h6 className="mb-0" style={{ fontWeight: 700 }}>Tarjeta de Crédito / Débito</h6><p className="mb-0 text-muted" style={{ fontSize: '0.75rem' }}>Pago instantáneo vía Wompi/PSE</p></div>
          <i className={`bi bi-${paymentMethod === 'card' ? 'check-circle-fill' : 'circle'}`} style={{ color: paymentMethod === 'card' ? 'var(--clr-primary)' : 'var(--clr-border)' }} />
        </div>
        <div className={`payment-option ${paymentMethod === 'transfer' ? 'active' : ''}`} onClick={() => setPaymentMethod('transfer')}>
          <i className="bi bi-bank" style={{ fontSize: '1.5rem' }} />
          <div style={{ flex: 1 }}><h6 className="mb-0" style={{ fontWeight: 700 }}>Transferencia Bancaria</h6><p className="mb-0 text-muted" style={{ fontSize: '0.75rem' }}>Bancolombia, Nequi, Daviplata</p></div>
          <i className={`bi bi-${paymentMethod === 'transfer' ? 'check-circle-fill' : 'circle'}`} style={{ color: paymentMethod === 'transfer' ? 'var(--clr-primary)' : 'var(--clr-border)' }} />
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <button onClick={onSubmit} disabled={loading} className="btn-brand w-100" style={{ padding: '16px', justifyContent: 'center' }}>
        {loading ? <Spinner size="sm" /> : <><i className="bi bi-lock-fill me-2" /> Pagar con Seguridad</>}
      </button>
    </div>
  );
}

function SuccessStep({ curso, onHide }: any) {
  return (
    <div className="text-center py-4 animate__animated animate__zoomIn">
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
        <i className="bi bi-check-lg" style={{ fontSize: '3rem' }} />
      </div>
      <h2 className="step-title">¡Inscripción Exitosa!</h2>
      <p className="text-muted">Bienvenido a <strong>{curso.nombre}</strong>. Hemos enviado los detalles de acceso a tu correo electrónico.</p>
      <div className="mt-4 pt-4 border-top">
        <button onClick={onHide} className="btn-brand w-100" style={{ justifyContent: 'center' }}>Comenzar a Estudiar</button>
      </div>
    </div>
  );
}
