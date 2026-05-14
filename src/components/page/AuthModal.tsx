'use client';

import React, { useState } from 'react';
import { Modal, Form, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '@/hooks/use-auth';
import toast from 'react-hot-toast';

interface AuthModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
  initialMode?: 'login' | 'register';
}

export default function AuthModal({ show, onHide, onSuccess, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [identificacion, setIdentificacion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        await login(email, password);
        toast.success('¡Bienvenido de nuevo!');
      } else {
        await register({
          email,
          password,
          firstName,
          lastName,
          identificacion,
          role: 'ESTUDIANTE'
        });
        toast.success('Cuenta creada exitosamente');
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered className="auth-modal">
      <Modal.Body className="p-4 p-md-5">
        <div className="text-center mb-4">
          <h2 style={{ fontWeight: 900, letterSpacing: "-1px" }}>
            {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>
          <p className="text-muted">
            {mode === 'login' ? 'Accede para continuar con tu inscripción' : 'Únete a SIERCP y comienza a estudiar'}
          </p>
        </div>

        {error && <Alert variant="danger" className="py-2" style={{ fontSize: "0.85rem", borderRadius: "12px" }}>{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="row g-2 mb-3">
              <div className="col-6">
                <Form.Group>
                  <Form.Label style={{ fontSize: "0.8rem", fontWeight: 700 }}>Nombre</Form.Label>
                  <Form.Control 
                    type="text" required value={firstName} onChange={e => setFirstName(e.target.value)}
                    className="form-control-custom" placeholder="Ej: Juan" 
                  />
                </Form.Group>
              </div>
              <div className="col-6">
                <Form.Group>
                  <Form.Label style={{ fontSize: "0.8rem", fontWeight: 700 }}>Apellido</Form.Label>
                  <Form.Control 
                    type="text" required value={lastName} onChange={e => setLastName(e.target.value)}
                    className="form-control-custom" placeholder="Ej: Pérez" 
                  />
                </Form.Group>
              </div>
              <div className="col-12">
                <Form.Group>
                  <Form.Label style={{ fontSize: "0.8rem", fontWeight: 700 }}>Identificación</Form.Label>
                  <Form.Control 
                    type="text" required value={identificacion} onChange={e => setIdentificacion(e.target.value)}
                    className="form-control-custom" placeholder="Cédula / DNI" 
                  />
                </Form.Group>
              </div>
            </div>
          )}

          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: "0.8rem", fontWeight: 700 }}>Correo Electrónico</Form.Label>
            <Form.Control 
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="form-control-custom" placeholder="ejemplo@correo.com" 
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label style={{ fontSize: "0.8rem", fontWeight: 700 }}>Contraseña</Form.Label>
            <Form.Control 
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="form-control-custom" placeholder="••••••••" 
            />
          </Form.Group>

          <button type="submit" disabled={loading} className="btn-brand w-100 mb-3" style={{ padding: "14px", justifyContent: "center" }}>
            {loading ? <Spinner animation="border" size="sm" /> : (mode === 'login' ? 'Entrar' : 'Registrarme')}
          </button>

          <div className="text-center">
            <p className="mb-0" style={{ fontSize: "0.9rem", color: "var(--clr-muted)" }}>
              {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
              <button 
                type="button" 
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="ms-2"
                style={{ background: "none", border: "none", color: "var(--clr-primary)", fontWeight: 800, padding: 0 }}
              >
                {mode === 'login' ? 'Regístrate aquí' : 'Inicia sesión'}
              </button>
            </p>
          </div>
        </Form>
      </Modal.Body>

    </Modal>
  );
}
