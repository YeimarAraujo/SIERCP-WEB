import { Timestamp } from 'firebase/firestore';

export type PurchaseOrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
export type PurchaseOrderItemType = 'COURSE' | 'PLAN' | 'DEVICE' | 'MANIKIN' | 'OTHER';
export type PaymentMethodType = 'CARD' | 'PSE' | 'TRANSFER' | 'BIZUM' | 'FREE' | 'OFFLINE';

export interface PurchaseOrderItem {
    id?: string;
    type: PurchaseOrderItemType;
    itemId: string;
    itemName: string;
    itemDescription?: string;
    priceCents: number;
    quantity: number;
    metadata?: Record<string, unknown>;
}

export interface PurchaseOrder {
    id: string;
    orderNumber: string;
    userId: string;
    userEmail: string;
    userName: string;
    institutionId: string;
    institutionName?: string;
    items: PurchaseOrderItem[];
    subtotalCents: number;
    taxCents: number;
    discountCents: number;
    totalCents: number;
    currency: 'COP';
    status: PurchaseOrderStatus;
    paymentMethod?: PaymentMethodType;
    paymentReference?: string;
    notes?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date | Timestamp;
    updatedAt: Date | Timestamp;
    completedAt?: Date | Timestamp | null;
}

export function getPurchaseOrderLabel(status: PurchaseOrderStatus): string {
    const labels: Record<PurchaseOrderStatus, string> = {
        PENDING: 'Pendiente',
        COMPLETED: 'Completada',
        CANCELLED: 'Cancelada',
        REFUNDED: 'Reembolsada',
    };
    return labels[status] ?? status;
}

export function getPurchaseOrderColor(status: PurchaseOrderStatus): string {
    const colors: Record<PurchaseOrderStatus, string> = {
        PENDING: '#F59E0B',
        COMPLETED: '#10B981',
        CANCELLED: '#6B7280',
        REFUNDED: '#EF4444',
    };
    return colors[status] ?? '#6B7280';
}

export function formatPriceCOP(cents: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(cents);
}