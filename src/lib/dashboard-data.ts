// Dashboard data constants for SIERCP
// Evaluaciones del equipo — nombres reales, puntajes del ultimo entrenamiento
// TODO: Reemplazar con datos de Firebase Firestore

export interface SIERCPEvaluation {
    id: string;
    studentName: string;
    studentInitials: string;
    date: string;
    score: number;
    status: 'approve' | 'retake' | 'pending';
    courseName: string;
}

export const TEAM_EVALUATIONS: SIERCPEvaluation[] = [
    {
        id: '1',
        studentName: 'Yeimar Araujo',
        studentInitials: 'YA',
        date: '28 abril 2026',
        score: 98,
        status: 'approve',
        courseName: 'Medicina III',
    },
    {
        id: '2',
        studentName: 'Jose Macea',
        studentInitials: 'JM',
        date: '28 abril 2026',
        score: 84,
        status: 'approve',
        courseName: 'Medicina III',
    },
    {
        id: '3',
        studentName: 'Libardo Acosta',
        studentInitials: 'LA',
        date: '27 abril 2026',
        score: 76,
        status: 'retake',
        courseName: 'Medicina III',
    },
    {
        id: '4',
        studentName: 'Kevin Noriega',
        studentInitials: 'KN',
        date: '27 abril 2026',
        score: 91,
        status: 'approve',
        courseName: 'Medicina III',
    },
];

// ──────────────────────────────────────
// PLACEHOLDERS — reemplazar con datos de Firebase Realtime Database / Firestore
// ──────────────────────────────────────

export interface ESP32Device {
    id: string;
    name: string;
    hardware: string;
    serialNumber: string;
    sensors: string[];
    connectionStatus: 'online' | 'offline' | 'pairing';
    batteryLevel: number;
    lastSeen: string;
    compressionAccuracy: number;
    ahaComplianceScore: number;
}

export const ESP32_DEVICE_PLACEHOLDER: ESP32Device = {
    id: 'esp32-001',
    name: 'ESP32-S3 Hub v2',
    hardware: 'ESP32-S3',
    serialNumber: 'S3-2026-0042',
    sensors: ['Sensor de presión', 'Acelerómetro MPU6050'],
    connectionStatus: 'online',
    batteryLevel: 88,
    lastSeen: '2026-04-28T14:30:00Z',
    compressionAccuracy: 85,
    ahaComplianceScore: 92,
};

// Activar sesión falsa — TODO: usar datos reales de Firebase
export const ACTIVE_SESSION_PLACEHOLDER = {
    id: 'RCP-2026-0042',
    status: 'Transmitiendo en tiempo real',
    hardware: 'ESP32-S3 Hub v2',
    location: 'Laboratorio de Simulación - UPC',
};

// Device control status — TODO: usar datos reales
export const DEVICE_STATUS_PLACEHOLDER = {
    name: 'Torso Adulto #04',
    compression: 85,
    bpm: 110,
};

// Chart data — TODO: obtener datos de sesión real
export interface ChartDataPoint {
    time: string;
    bpm: number;
    flagged?: boolean;
}

export const PERFORMANCE_DATA_PLACEHOLDER: ChartDataPoint[] = [
    { time: '0:00', bpm: 90 },
    { time: '0:30', bpm: 102 },
    { time: '1:00', bpm: 112 },
    { time: '1:30', bpm: 108 },
    { time: '2:00', bpm: 95 },
    { time: '2:30', bpm: 78, flagged: true },
    { time: '3:00', bpm: 88 },
];

export const FATIGUE_POINT_PLACEHOLDER = {
    index: 5,
    time: '2:15 min',
    label: 'Punto de Fatiga detectado a los 2:15 min',
};
