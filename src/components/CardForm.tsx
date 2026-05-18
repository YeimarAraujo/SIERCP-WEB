'use client';

/**
 * CardForm — Formulario de tarjeta crédito/débito para Wompi
 *
 * Seguridad:
 *  - Los datos de la tarjeta NUNCA pasan por el servidor de SIERCP.
 *  - Se tokenizan directamente en el cliente llamando a la API de Wompi (PCI SAQ-A).
 *  - Se aplica algoritmo de Luhn para validar el PAN en tiempo real.
 *  - CVC se oculta inmediatamente al escribir.
 */

import React, { useState } from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import { INSTALLMENT_OPTIONS, formatInstallmentLabel } from '@/services/wompi.service';

export interface CardFormData {
    card_holder: string;
    number: string;         // PAN sin formato (solo dígitos)
    exp_month: string;
    exp_year: string;
    cvc: string;
    legal_id: string;
    installments: number;
}

interface CardFormProps {
    totalCOP: number;
    onChange: (data: Partial<CardFormData>, valid: boolean) => void;
}

// Formato visual de la tarjeta: grupos de 4
function formatPAN(value: string): string {
    return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

// Algoritmo de Luhn
function luhn(pan: string): boolean {
    const digits = pan.replace(/\D/g, '');
    if (digits.length < 13) return false;
    let sum = 0;
    let alt = false;
    for (let i = digits.length - 1; i >= 0; i--) {
        let n = parseInt(digits[i], 10);
        if (alt) { n *= 2; if (n > 9) n -= 9; }
        sum += n;
        alt = !alt;
    }
    return sum % 10 === 0;
}

// Detectar marca de la tarjeta por BIN
function detectBrand(pan: string): 'VISA' | 'MASTERCARD' | 'AMEX' | 'DINERS' | null {
    const d = pan.replace(/\D/g, '');
    if (/^4/.test(d)) return 'VISA';
    if (/^5[1-5]|^2[2-7]/.test(d)) return 'MASTERCARD';
    if (/^3[47]/.test(d)) return 'AMEX';
    if (/^3[068]/.test(d)) return 'DINERS';
    return null;
}

const BRAND_ICONS: Record<string, string> = {
    VISA: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg',
    MASTERCARD: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg',
};

export default function CardForm({ totalCOP, onChange }: CardFormProps) {
    const [data, setData] = useState<CardFormData>({
        card_holder: '',
        number: '',
        exp_month: '',
        exp_year: '',
        cvc: '',
        legal_id: '',
        installments: 1,
    });

    const [displayNumber, setDisplayNumber] = useState('');
    const [errors, setErrors] = useState<Partial<Record<keyof CardFormData, string>>>({});

    function validate(d: CardFormData): typeof errors {
        const e: typeof errors = {};
        if (!d.card_holder.trim()) e.card_holder = 'Ingresa el nombre del titular';
        if (!luhn(d.number)) e.number = 'Número de tarjeta inválido';
        if (!d.exp_month || +d.exp_month < 1 || +d.exp_month > 12) e.exp_month = 'Mes inválido';
        if (!d.exp_year || d.exp_year.length !== 2) e.exp_year = 'Año inválido';
        else {
            // Verificar que no esté vencida
            const now = new Date();
            const cardDate = new Date(2000 + +d.exp_year, +d.exp_month - 1, 1);
            if (cardDate < now) e.exp_year = 'Tarjeta vencida';
        }
        if (!d.cvc || !/^\d{3,4}$/.test(d.cvc)) e.cvc = 'CVC inválido';
        if (!d.legal_id.trim()) e.legal_id = 'Ingresa tu número de identificación';
        else if (!/^\d{5,15}$/.test(d.legal_id.trim())) e.legal_id = 'ID inválido (solo dígitos, 5-15)';
        return e;
    }

    function update<K extends keyof CardFormData>(key: K, value: CardFormData[K]) {
        const next = { ...data, [key]: value };
        setData(next);
        const errs = validate(next);
        setErrors(errs);
        onChange(next, Object.keys(errs).length === 0);
    }

    const brand = detectBrand(data.number);

    return (
        <Row className="g-4">
            {/* Titular */}
            <Col md={12}>
                <Form.Label className="small fw-bold mb-2">
                    Titular de la tarjeta <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                    className={`form-control-custom py-3 ${errors.card_holder ? 'is-invalid' : ''}`}
                    placeholder="Como aparece en la tarjeta"
                    value={data.card_holder}
                    onChange={e => update('card_holder', e.target.value.toUpperCase())}
                    autoComplete="cc-name"
                />
                {errors.card_holder && <div className="invalid-feedback">{errors.card_holder}</div>}
            </Col>

            {/* Número de tarjeta */}
            <Col md={12}>
                <Form.Label className="small fw-bold mb-2">
                    Número de tarjeta <span className="text-danger">*</span>
                </Form.Label>
                <div className="position-relative">
                    <Form.Control
                        className={`form-control-custom py-3 pe-5 ${errors.number ? 'is-invalid' : ''}`}
                        placeholder="0000 0000 0000 0000"
                        value={displayNumber}
                        onChange={e => {
                            const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
                            setDisplayNumber(formatPAN(raw));
                            update('number', raw);
                        }}
                        inputMode="numeric"
                        autoComplete="cc-number"
                    />
                    <div className="position-absolute end-0 top-50 translate-middle-y me-3">
                        {brand && BRAND_ICONS[brand] ? (
                            <img src={BRAND_ICONS[brand]} alt={brand} height={20} style={{ opacity: 0.8 }} />
                        ) : (
                            <i className="bi bi-credit-card text-muted fs-5" />
                        )}
                    </div>
                </div>
                {errors.number && <div className="invalid-feedback d-block">{errors.number}</div>}
                {data.number.length >= 6 && !errors.number && (
                    <div className="small text-success mt-1">
                        <i className="bi bi-check-circle me-1" />
                        {brand ?? 'Tarjeta'} válida
                    </div>
                )}
            </Col>

            {/* Expiración */}
            <Col md={4}>
                <Form.Label className="small fw-bold mb-2">Mes <span className="text-danger">*</span></Form.Label>
                <Form.Control
                    className={`form-control-custom py-3 ${errors.exp_month ? 'is-invalid' : ''}`}
                    placeholder="MM"
                    maxLength={2}
                    value={data.exp_month}
                    onChange={e => update('exp_month', e.target.value.replace(/\D/g, '').slice(0, 2))}
                    inputMode="numeric"
                    autoComplete="cc-exp-month"
                />
                {errors.exp_month && <div className="invalid-feedback">{errors.exp_month}</div>}
            </Col>

            <Col md={4}>
                <Form.Label className="small fw-bold mb-2">Año <span className="text-danger">*</span></Form.Label>
                <Form.Control
                    className={`form-control-custom py-3 ${errors.exp_year ? 'is-invalid' : ''}`}
                    placeholder="YY"
                    maxLength={2}
                    value={data.exp_year}
                    onChange={e => update('exp_year', e.target.value.replace(/\D/g, '').slice(0, 2))}
                    inputMode="numeric"
                    autoComplete="cc-exp-year"
                />
                {errors.exp_year && <div className="invalid-feedback">{errors.exp_year}</div>}
            </Col>

            <Col md={4}>
                <Form.Label className="small fw-bold mb-2">CVC <span className="text-danger">*</span></Form.Label>
                <div className="position-relative">
                    <Form.Control
                        className={`form-control-custom py-3 ${errors.cvc ? 'is-invalid' : ''}`}
                        placeholder="•••"
                        type="password"
                        maxLength={4}
                        value={data.cvc}
                        onChange={e => update('cvc', e.target.value.replace(/\D/g, '').slice(0, 4))}
                        inputMode="numeric"
                        autoComplete="cc-csc"
                    />
                </div>
                {errors.cvc && <div className="invalid-feedback d-block">{errors.cvc}</div>}
            </Col>

            {/* Cédula del titular */}
            <Col md={12}>
                <Form.Label className="small fw-bold mb-2">
                    Cédula del titular <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                    className={`form-control-custom py-3 ${errors.legal_id ? 'is-invalid' : ''}`}
                    placeholder="Número de identificación"
                    value={data.legal_id}
                    onChange={e => update('legal_id', e.target.value.replace(/\D/g, ''))}
                    inputMode="numeric"
                />
                {errors.legal_id && <div className="invalid-feedback">{errors.legal_id}</div>}
            </Col>

            {/* Cuotas */}
            <Col md={12}>
                <Form.Label className="small fw-bold mb-2">Número de cuotas</Form.Label>
                <Form.Select
                    className="form-control-custom py-3"
                    value={data.installments}
                    onChange={e => update('installments', +e.target.value)}
                >
                    {INSTALLMENT_OPTIONS.map(n => (
                        <option key={n} value={n}>{formatInstallmentLabel(n, totalCOP)}</option>
                    ))}
                </Form.Select>
                <div className="small text-muted mt-1">
                    <i className="bi bi-info-circle me-1" />
                    Las cuotas pueden generar intereses según tu entidad bancaria.
                </div>
            </Col>
        </Row>
    );
}