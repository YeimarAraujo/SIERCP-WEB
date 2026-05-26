export const IVA_RATE = 0.19;

export const COLOMBIAN_BANKS = [
    'Bancolombia', 'Davivienda', 'Banco de Bogotá', 'BBVA Colombia',
    'Banco Popular', 'Banco de Occidente', 'Daviplata', 'Banco Caja Social',
    'Scotiabank Colpatria', 'Banco Falabella',
] as const;

export function fmt(n: number): string {
    return `$${n.toLocaleString('es-CO')}`;
}

export function validateEmail(e: string): string | null {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return 'Correo electrónico inválido';
    return null;
}

export function validatePhone(p: string): string | null {
    const clean = p.replace(/[\s()\-+]/g, '');
    if (!/^(57)?3\d{9}$/.test(clean)) return 'Teléfono colombiano inválido (ej: 3001234567)';
    return null;
}

export function validateNIT(n: string): string | null {
    const clean = n.replace(/[.\s-]/g, '');
    if (!/^\d{9,10}$/.test(clean)) return 'NIT debe tener 9 o 10 dígitos (sin dígito de verificación)';
    return null;
}

export function validateCedula(c: string): string | null {
    const clean = c.replace(/[\s.]/g, '');
    if (!/^\d{6,12}$/.test(clean)) return 'Cédula inválida (6–12 dígitos)';
    return null;
}
