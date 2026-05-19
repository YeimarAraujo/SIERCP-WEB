'use client';

import React, { useState, useEffect, Suspense } from "react";
import { Container, Row, Col, Alert, Spinner } from "react-bootstrap";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { CourseService } from "@/services/firestore.service";
import { getCursoBySlug } from "@/data/cursos";
import Navbar from "@/components/page/Navbar";
import Footer from "@/components/page/Footer";
import AuthModal from "@/components/page/AuthModal";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../landing.css';

function EnrollmentContent() {
  const { user, loading: authLoading, initialized } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const cursoSlug = searchParams.get('curso');
  const grupoId = searchParams.get('grupo');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const curso = cursoSlug ? getCursoBySlug(cursoSlug) : null;
  const grupo = curso?.grupos.find(g => g.id === grupoId);

  useEffect(() => {
    if (initialized && !user) {
      setShowAuthModal(true);
    } else if (user) {
      setShowAuthModal(false);
    }
  }, [user, initialized]);

  const handleConfirm = async () => {
    if (!user || !curso) return;
    setLoading(true);
    setError('');

    try {
      await CourseService.enroll(curso.slug, {
        studentId: user.uid,
        studentName: `${user.firstName} ${user.lastName}`,
        studentEmail: user.email,
        enrolledAt: new Date(),
        completedModules: 0,
        avgScore: 0,
        sessionCount: 0,
        status: 'active',
        grupoId: grupoId || undefined
      });
      
      setSuccess(true);
      setTimeout(() => router.push('/student/home'), 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al procesar la inscripción');
      setLoading(false);
    }
  };

  // Si está inicializando pero ya tenemos un usuario persistido (gracias a Zustand persist), 
  // no mostramos la pantalla de carga completa para mejorar la UX.
  const isActuallyLoading = (authLoading || !initialized) && !user;

  if (isActuallyLoading) {
    return (
      <Container className="text-center py-5" style={{ marginTop: "100px" }}>
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Verificando sesión...</p>
      </Container>
    );
  }

  if (!curso) {
    return (
      <Container className="text-center py-5">
        <i className="bi bi-exclamation-triangle" style={{ fontSize: "3rem", color: "var(--clr-muted)" }} />
        <h3 className="mt-3">Programa no encontrado</h3>
        <button onClick={() => router.push('/programas')} className="btn-brand mt-3">Ver catálogo</button>
      </Container>
    );
  }

  return (
    <>
      <AuthModal 
        show={showAuthModal} 
        onHide={() => router.back()} 
        onSuccess={() => setShowAuthModal(false)} 
      />

      <Container style={{ paddingTop: "40px", paddingBottom: "80px", opacity: !user ? 0.3 : 1, transition: "opacity 0.3s ease" }}>
        <Row className="justify-content-center">
          <Col md={10} lg={7}>
            <div className="card-brand" style={{ padding: "40px", boxShadow: "var(--shadow-xl)" }}>
              <div className="text-center mb-5">
                <div style={{ width: "64px", height: "64px", borderRadius: "100px", background: "var(--clr-primary-alpha)", color: "var(--clr-primary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <i className="bi bi-journal-check" style={{ fontSize: "2rem" }} />
                </div>
                <h1 style={{ fontWeight: 900, letterSpacing: "-1px" }}>Finalizar Inscripción</h1>
                <p className="text-muted">Confirma tus datos para vincular tu cuenta al programa.</p>
              </div>

              {success ? (
                <div className="text-center py-4 animate__animated animate__zoomIn">
                  <div style={{ width: "80px", height: "80px", borderRadius: "100px", background: "#ecfdf5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                    <i className="bi bi-check-lg" style={{ fontSize: "3rem" }} />
                  </div>
                  <h4 style={{ fontWeight: 800 }}>¡Inscripción Exitosa!</h4>
                  <p className="text-muted">Has sido inscrito correctamente en <strong>{curso.nombre}</strong>.</p>
                  <div className="mt-4 d-flex align-items-center justify-content-center gap-2">
                    <Spinner animation="grow" size="sm" variant="success" />
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#10b981" }}>Redirigiendo a tu panel de estudio...</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-4" style={{ padding: "24px", background: "var(--clr-bg-light)", borderRadius: "20px", border: "1px solid var(--clr-border)" }}>
                    <h6 className="mb-4" style={{ fontWeight: 800, fontSize: "1.1rem" }}>Resumen de Selección</h6>
                    
                    <div className="d-flex align-items-start gap-3 mb-4">
                      <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "var(--clr-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <i className={`bi ${curso.icono}`} style={{ fontSize: "1.2rem" }} />
                      </div>
                      <div>
                        <h6 style={{ margin: 0, fontWeight: 800 }}>{curso.nombre}</h6>
                        <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>{curso.modalidad} · {curso.duracion}</p>
                      </div>
                    </div>

                    <div style={{ borderTop: "1px dashed var(--clr-border)", paddingTop: "16px" }}>
                      <div className="d-flex justify-content-between mb-2" style={{ fontSize: "0.95rem" }}>
                        <span className="text-muted">Horario seleccionado:</span>
                        <span style={{ fontWeight: 700 }}>{grupo?.horarioLabel || 'Por definir'}</span>
                      </div>
                      <div className="d-flex justify-content-between" style={{ fontSize: "1.1rem" }}>
                        <span style={{ fontWeight: 800 }}>Inversión:</span>
                        <span style={{ fontWeight: 900, color: "var(--clr-primary)" }}>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(curso.precioCOP)}</span>
                      </div>
                    </div>
                  </div>

                  {user && (
                    <div className="mb-5">
                      <h6 className="mb-3" style={{ fontWeight: 800 }}>Vincular con la cuenta:</h6>
                      <div className="d-flex align-items-center gap-3 p-3" style={{ borderRadius: "16px", border: "1px solid var(--clr-border)" }}>
                        <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "var(--clr-bg-surface)", border: "1px solid var(--clr-border)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "var(--clr-primary)" }}>
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                          <h6 style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem" }}>{user.firstName} {user.lastName}</h6>
                          <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>{user.email}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!user && (
                    <div className="mb-5 text-center py-4" style={{ border: "2px dashed var(--clr-border)", borderRadius: "20px" }}>
                      <p className="text-muted mb-0">Debes iniciar sesión para confirmar tu inscripción.</p>
                      <button onClick={() => setShowAuthModal(true)} className="btn-brand mt-3" style={{ background: "transparent", color: "var(--clr-primary)", border: "1px solid var(--clr-primary)" }}>
                        Iniciar Sesión Ahora
                      </button>
                    </div>
                  )}

                  {error && <Alert variant="danger" className="mb-4" style={{ borderRadius: "14px" }}>{error}</Alert>}

                  <div className="d-flex flex-column gap-3">
                    <button 
                      onClick={handleConfirm} 
                      disabled={loading || !user} 
                      className="btn-brand w-100" 
                      style={{ padding: "16px", fontSize: "1.05rem", fontWeight: 800, justifyContent: "center", opacity: !user ? 0.5 : 1 }}
                    >
                      {loading ? <Spinner animation="border" size="sm" /> : <><i className="bi bi-check2-circle me-2" /> Confirmar e Inscribirme</>}
                    </button>
                    <button onClick={() => router.back()} disabled={loading} className="btn-brand" style={{ background: "transparent", color: "var(--clr-muted)", border: "none", fontSize: "0.9rem", fontWeight: 700, justifyContent: "center" }}>
                      Cancelar y volver
                    </button>
                  </div>
                </>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default function InscribirsePage() {
  return (
    <div className="page-body">
      <Navbar forceScrolled />
      <main style={{ minHeight: "100vh", background: "var(--clr-bg)", paddingTop: "100px" }}>
        <Suspense fallback={<Container className="text-center py-5"><Spinner animation="border" variant="primary" /></Container>}>
          <EnrollmentContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
