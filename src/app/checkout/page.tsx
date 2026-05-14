'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Container, Row, Col, Form, Spinner, Alert, Card } from 'react-bootstrap';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getCursoBySlug, formatCOP, type Curso } from '@/data/cursos';
import { CourseService } from '@/services/firestore.service';
import Navbar from '@/components/page/Navbar';
import Footer from '@/components/page/Footer';
import toast from 'react-hot-toast';

// Important Imports for Icons and Animations
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'animate.css';
import '../landing.css';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, initialized } = useAuth();
  
  const cursoSlug = searchParams.get('curso');
  const grupoId = searchParams.get('grupo');

  const [curso, setCurso] = useState<Curso | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'PSE' | 'TRANSFER'>('CARD');

  useEffect(() => {
    if (cursoSlug) {
      setCurso(getCursoBySlug(cursoSlug));
    }
  }, [cursoSlug]);

  useEffect(() => {
    if (initialized && !user) {
      router.push(`/formacion/${cursoSlug}`);
    }
  }, [initialized, user, router, cursoSlug]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!user || !curso) throw new Error('Información incompleta');
      await new Promise(resolve => setTimeout(resolve, 3000));
      await CourseService.enroll(curso.slug, {
        studentId: user.uid,
        studentName: `${user.firstName} ${user.lastName}`,
        studentEmail: user.email,
        enrolledAt: new Date(),
        status: 'active',
        grupoId: grupoId || undefined,
        completedModules: 0,
        avgScore: 0,
        sessionCount: 0
      });
      toast.success('¡Pago verificado e inscripción completada!');
      router.push('/student/home');
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago.');
      setLoading(false);
    }
  };

  if (!curso) return <div className="text-center py-5"><Spinner animation="border" /></div>;

  return (
    <div className="page-body">
      <Navbar forceScrolled={true} />
      
      <main style={{ paddingTop: '140px', paddingBottom: '100px', background: 'var(--clr-bg)' }}>
        <Container>
          {/* Stepper with animations */}
          <div className="checkout-stepper mb-5 animate__animated animate__fadeIn">
            <div className="step-dot active"></div>
            <div className="step-line active"></div>
            <div className="step-dot active"></div>
            <div className="step-line active"></div>
            <div className="step-dot active"></div>
          </div>

          <div className="text-center mb-5 animate__animated animate__fadeInDown">
            <h1 style={{ fontWeight: 900, fontSize: '3.2rem', color: 'var(--clr-text-head)', letterSpacing: '-2px' }}>
              Finalizar Inscripción
            </h1>
            <p className="text-muted" style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
              Procesa tu pago de forma segura con encriptación de nivel bancario.
            </p>
          </div>

          <Row className="g-5">
            <Col lg={7}>
              <div className="mb-4 animate__animated animate__fadeInLeft">
                <h5 className="mb-3 fw-bold" style={{ color: 'var(--clr-text-head)' }}>1. Método de pago</h5>
                <div className="checkout-payment-methods">
                  {[
                    { id: 'CARD', icon: 'bi-credit-card-2-front', label: 'Tarjeta' },
                    { id: 'PSE', icon: 'bi-bank', label: 'PSE' },
                    { id: 'TRANSFER', icon: 'bi-arrow-left-right', label: 'Transferencia' }
                  ].map(method => (
                    <div 
                      key={method.id}
                      className={`payment-method-card ${paymentMethod === method.id ? 'active' : ''}`}
                      onClick={() => setPaymentMethod(method.id as any)}
                      style={{ border: paymentMethod === method.id ? '2px solid var(--clr-primary)' : '1px solid var(--clr-border)' }}
                    >
                      <i className={`bi ${method.icon}`} />
                      <span className="method-label">{method.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Card className="summary-card p-5 mb-4 border-0 animate__animated animate__fadeInUp" style={{ background: 'var(--clr-bg-surface)', boxShadow: 'var(--shadow-lg)' }}>
                <h5 className="mb-4 fw-bold" style={{ color: 'var(--clr-text-head)' }}>2. Detalles del Pago</h5>
                
                {paymentMethod === 'CARD' && (
                  <div className="animate__animated animate__fadeIn">
                    <Row className="g-4">
                      <Col md={12}>
                        <Form.Label className="small fw-bold mb-2">Titular de la tarjeta</Form.Label>
                        <Form.Control placeholder="Como aparece en el plástico" className="form-control-custom py-3" />
                      </Col>
                      <Col md={12}>
                        <Form.Label className="small fw-bold mb-2">Número de Tarjeta</Form.Label>
                        <div className="position-relative">
                          <Form.Control placeholder="0000 0000 0000 0000" className="form-control-custom py-3" />
                          <div className="position-absolute end-0 top-50 translate-middle-y me-3 d-flex gap-2 opacity-50">
                            <i className="bi bi-credit-card fs-5" />
                          </div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <Form.Label className="small fw-bold mb-2">Fecha de Expiración</Form.Label>
                        <Form.Control placeholder="MM / YY" className="form-control-custom py-3" />
                      </Col>
                      <Col md={6}>
                        <Form.Label className="small fw-bold mb-2">CVC</Form.Label>
                        <Form.Control placeholder="000" className="form-control-custom py-3" />
                      </Col>
                      <Col md={12}>
                        <Form.Label className="small fw-bold mb-2">Cédula del Titular</Form.Label>
                        <Form.Control placeholder="Número de identificación" className="form-control-custom py-3" />
                      </Col>
                    </Row>
                  </div>
                )}

                {paymentMethod === 'PSE' && (
                  <div className="animate__animated animate__fadeIn">
                    <Row className="g-4">
                      <Col md={12}>
                        <Form.Label className="small fw-bold mb-2">Banco</Form.Label>
                        <Form.Select className="form-control-custom py-3">
                          <option>Selecciona tu banco</option>
                          <option>Bancolombia</option>
                          <option>Davivienda</option>
                          <option>Nequi</option>
                          <option>Daviplata</option>
                          <option>Banco de Bogotá</option>
                        </Form.Select>
                      </Col>
                      <Col md={6}>
                        <Form.Label className="small fw-bold mb-2">Tipo de Persona</Form.Label>
                        <Form.Select className="form-control-custom py-3">
                          <option>Persona Natural</option>
                          <option>Persona Jurídica</option>
                        </Form.Select>
                      </Col>
                      <Col md={6}>
                        <Form.Label className="small fw-bold mb-2">Cédula del Pagador</Form.Label>
                        <Form.Control placeholder="CC / NIT" className="form-control-custom py-3" />
                      </Col>
                      <Col md={12}>
                        <Form.Label className="small fw-bold mb-2">Correo Electrónico registrado en PSE</Form.Label>
                        <Form.Control type="email" placeholder="ejemplo@correo.com" className="form-control-custom py-3" />
                      </Col>
                    </Row>
                  </div>
                )}

                {paymentMethod === 'TRANSFER' && (
                  <div className="animate__animated animate__fadeIn p-4 rounded-4" style={{ background: 'var(--clr-bg-light)', border: '1px solid var(--clr-border)' }}>
                    <div className="d-flex align-items-center gap-3 mb-4 text-primary">
                      <i className="bi bi-info-circle-fill fs-4" />
                      <h6 className="mb-0 fw-bold">Instrucciones de Transferencia</h6>
                    </div>
                    <div className="d-flex flex-column gap-3">
                      <div className="d-flex justify-content-between border-bottom pb-2 border-secondary border-opacity-10">
                        <span className="text-muted">Banco</span>
                        <span className="fw-bold">Bancolombia</span>
                      </div>
                      <div className="d-flex justify-content-between border-bottom pb-2 border-secondary border-opacity-10">
                        <span className="text-muted">Cuenta de Ahorros</span>
                        <span className="fw-bold">459-000000-01</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Titular</span>
                        <span className="fw-bold">SIERCP S.A.S</span>
                      </div>
                      <div className="mt-3 p-3 bg-white rounded border small">
                        <i className="bi bi-whatsapp text-success me-2" />
                        Una vez realizada la transferencia, envía el comprobante a nuestro soporte para activar tu acceso.
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              <div className="trust-badge-container mt-4 animate__animated animate__fadeInUp">
                <i className="bi bi-patch-check-fill text-success fs-3" />
                <div>
                  <h6 className="mb-0 fw-bold">Certificado de Seguridad SSL</h6>
                  <p className="mb-0 small text-muted">Tus datos están protegidos por una capa de sockets seguros.</p>
                </div>
              </div>
            </Col>

            <Col lg={5}>
              <Card className="summary-card p-5 sticky-top border-0 animate__animated animate__fadeInRight" style={{ top: '140px', background: 'var(--clr-bg-surface)', boxShadow: 'var(--shadow-xl)' }}>
                <h5 className="mb-4 fw-bold" style={{ color: 'var(--clr-text-head)' }}>Resumen del Pedido</h5>
                
                <div className="d-flex gap-4 align-items-start mb-5 p-3 rounded-4" style={{ background: 'var(--clr-bg-light)', border: '1px solid var(--clr-border)' }}>
                  <div style={{ width: '80px', height: '80px', background: 'var(--clr-primary)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 8px 16px var(--clr-primary-alpha)' }}>
                    <i className="bi bi-mortarboard-fill text-white fs-2" />
                  </div>
                  <div>
                    <h6 className="mb-2 fw-bold" style={{ fontSize: '1.1rem', color: 'var(--clr-text-head)' }}>{curso.nombre}</h6>
                    <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill x-small">
                      Cupo Reservado
                    </span>
                  </div>
                </div>

                <div className="summary-item mb-3">
                  <span className="text-muted">Valor base</span>
                  <span className="fw-bold" style={{ color: 'var(--clr-text-head)' }}>{formatCOP(curso.precioCOP)}</span>
                </div>
                <div className="summary-item mb-3">
                  <span className="text-muted">Gastos de certificación</span>
                  <span className="text-success fw-bold">Bonificado</span>
                </div>

                <div className="summary-total mt-4 pt-4 border-top border-2 border-dashed border-secondary border-opacity-10">
                  <div className="d-flex justify-content-between align-items-center mb-5">
                    <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--clr-text-head)' }}>Total Neto</span>
                    <span style={{ fontWeight: 900, fontSize: '2.5rem', color: 'var(--clr-primary)', letterSpacing: '-2px' }}>
                      {formatCOP(curso.precioCOP)}
                    </span>
                  </div>

                  {error && <Alert variant="danger" className="py-2 mb-4 animate__animated animate__shakeX border-0 shadow-sm">{error}</Alert>}

                  <button 
                    onClick={handlePayment} 
                    disabled={loading} 
                    className="btn-brand w-100 py-4 shadow-lg" 
                    style={{ justifyContent: 'center', fontSize: '1.25rem', borderRadius: '20px' }}
                  >
                    {loading ? (
                      <><Spinner size="sm" className="me-2" /> Procesando Pago...</>
                    ) : (
                      <><i className="bi bi-shield-lock-fill me-2" /> Pagar con Seguridad</>
                    )}
                  </button>

                  <div className="text-center mt-5">
                    <p className="x-small text-muted mb-3" style={{ fontSize: '0.7rem' }}>Soportamos los principales medios de pago en Colombia</p>
                    <div className="d-flex justify-content-center gap-4 opacity-50 grayscale">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" height="12" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" height="18" />
                      <img src="https://www.pse.com.co/o/pse-theme/images/logos/pse.png" alt="PSE" height="22" />
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Container>
      </main>
      <Footer />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="text-center py-5"><Spinner animation="border" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
