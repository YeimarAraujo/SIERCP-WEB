'use client';

/**
 * PSEForm — Formulario de pago PSE (Pagos Seguros en Línea)
 *
 * Flujo PSE con Wompi:
 *  1. Obtener lista de bancos habilitados desde la API de Wompi
 *  2. Usuario selecciona banco y tipo de persona
 *  3. Al pagar: se crea la transacción → Wompi retorna redirect_url
 *  4. Redirigir al usuario al banco para autenticación
 *  5. Banco retorna a redirect_url con el resultado
 *  6. El webhook de Wompi actualiza el estado en Firestore
 */

import React, { useEffect, useState } from 'react';
import { Form, Row, Col, Spinner, Alert } from 'react-bootstrap';
import {
    getPSEFinancialInstitutions,
    type WompiFinancialInstitution,
    type WompiLegalIdType,
    type WompiPersonType,
} from '@/services/wompi.service';

export interface PSEFormData {
    financial_institution_code: string;
    user_type: WompiPersonType;
    user_legal_id_type: WompiLegalIdType;
    user_legal_id: string;
    customer_email: string;
    payment_description: string;
}

interface PSEFormProps {
    customerEmail: string;
    cursoNombre: string;
    onChange: (data: Partial<PSEFormData>, valid: boolean) => void;
}

const LEGAL_ID_TYPES_NATURAL: { value: WompiLegalIdType; label: string }[] = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'PP', label: 'Pasaporte' },
    { value: 'TI', label: 'Tarjeta de Identidad' },
];

const LEGAL_ID_TYPES_JURIDICA: { value: WompiLegalIdType; label: string }[] = [
    { value: 'NIT', label: 'NIT' },
];

export default function PSEForm({ customerEmail, cursoNombre, onChange }: PSEFormProps) {
    const [banks, setBanks] = useState<WompiFinancialInstitution[]>([]);
    const [loadingBanks, setLoadingBanks] = useState(true);
    const [bankError, setBankError] = useState<string | null>(null);

    const [data, setData] = useState<PSEFormData>({
        financial_institution_code: '',
        user_type: 0,
        user_legal_id_type: 'CC',
        user_legal_id: '',
        customer_email: customerEmail,
        payment_description: `Inscripción - ${cursoNombre}`,
    });

    const [errors, setErrors] = useState<Partial<Record<keyof PSEFormData, string>>>({});

    // Cargar bancos al montar el componente
    useEffect(() => {
        let cancelled = false;
        getPSEFinancialInstitutions()
            .then(list => { if (!cancelled) setBanks(list); })
            .catch(err => { if (!cancelled) setBankError(err.message); })
            .finally(() => { if (!cancelled) setLoadingBanks(false); });
        return () => { cancelled = true; };
    }, []);

    const idTypes = data.user_type === 0 ? LEGAL_ID_TYPES_NATURAL : LEGAL_ID_TYPES_JURIDICA;

    function validate(d: PSEFormData): Partial<Record<keyof PSEFormData, string>> {
        const e: typeof errors = {};
        if (!d.financial_institution_code) e.financial_institution_code = 'Selecciona un banco';
        if (!d.user_legal_id.trim()) e.user_legal_id = 'Ingresa tu número de documento';
        else if (!/^\d{5,15}$/.test(d.user_legal_id.trim())) e.user_legal_id = 'Documento inválido (solo números, 5-15 dígitos)';
        return e;
    }

    function update<K extends keyof PSEFormData>(key: K, value: PSEFormData[K]) {
        const next = { ...data, [key]: value };

        // Si cambia tipo de persona, resetear el tipo de documento
        if (key === 'user_type') {
            next.user_legal_id_type = value === 0 ? 'CC' : 'NIT';
        }

        setData(next);
        const errs = validate(next);
        setErrors(errs);
        onChange(next, Object.keys(errs).length === 0);
    }

    return (
        <div>
            {bankError && (
                <Alert variant="warning" className="mb-4 border-0">
                    <i className="bi bi-exclamation-triangle me-2" />
                    No se pudieron cargar los bancos: {bankError}. Intenta recargar la página.
                </Alert>
            )}

            <Row className="g-4">
                {/* Banco */}
                <Col md={12}>
                    <Form.Label className="small fw-bold mb-2">
                        Banco <span className="text-danger">*</span>
                    </Form.Label>
                    {loadingBanks ? (
                        <div className="d-flex align-items-center gap-2 text-muted py-3">
                            <Spinner animation="border" size="sm" />
                            <span className="small">Cargando bancos habilitados para PSE...</span>
                        </div>
                    ) : (
                        <Form.Select
                            className={`form-control-custom py-3 ${errors.financial_institution_code ? 'is-invalid' : ''}`}
                            value={data.financial_institution_code}
                            onChange={e => update('financial_institution_code', e.target.value)}
                            disabled={bankError !== null}
                        >
                            <option value="">— Selecciona tu banco —</option>
                            {banks.map(b => (
                                <option key={b.financial_institution_code} value={b.financial_institution_code}>
                                    {b.financial_institution_name}
                                </option>
                            ))}
                        </Form.Select>
                    )}
                    {errors.financial_institution_code && (
                        <div className="invalid-feedback d-block">{errors.financial_institution_code}</div>
                    )}
                </Col>

                {/* Tipo de persona */}
                <Col md={6}>
                    <Form.Label className="small fw-bold mb-2">
                        Tipo de Persona <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                        className="form-control-custom py-3"
                        value={data.user_type}
                        onChange={e => update('user_type', +e.target.value as WompiPersonType)}
                    >
                        <option value={0}>Persona Natural</option>
                        <option value={1}>Persona Jurídica</option>
                    </Form.Select>
                </Col>

                {/* Tipo de documento */}
                <Col md={6}>
                    <Form.Label className="small fw-bold mb-2">
                        Tipo de Documento <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                        className="form-control-custom py-3"
                        value={data.user_legal_id_type}
                        onChange={e => update('user_legal_id_type', e.target.value as WompiLegalIdType)}
                    >
                        {idTypes.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </Form.Select>
                </Col>

                {/* Número de documento */}
                <Col md={12}>
                    <Form.Label className="small fw-bold mb-2">
                        Número de Documento <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                        className={`form-control-custom py-3 ${errors.user_legal_id ? 'is-invalid' : ''}`}
                        placeholder={data.user_legal_id_type === 'NIT' ? '900123456-7' : '1234567890'}
                        value={data.user_legal_id}
                        onChange={e => update('user_legal_id', e.target.value.replace(/\D/g, ''))}
                        inputMode="numeric"
                    />
                    {errors.user_legal_id && (
                        <div className="invalid-feedback">{errors.user_legal_id}</div>
                    )}
                </Col>
            </Row>

            {/* Aviso PSE */}
            <div
                className="mt-4 p-3 rounded-3 d-flex gap-3 align-items-start"
                style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}
            >
                <i className="bi bi-info-circle-fill text-primary mt-1" style={{ flexShrink: 0 }} />
                <div className="small text-muted">
                    Al continuar serás redirigido al portal seguro de tu banco para autorizar el pago.
                    Una vez completado, regresarás automáticamente a esta plataforma.
                    El proceso suele tardar entre 30 segundos y 2 minutos.
                </div>
            </div>
        </div>
    );
}